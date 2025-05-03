import express from "express"
import http from "http"
import { Server } from "socket.io"
import { MongoClient } from "mongodb"
import cors from "cors"
import dotenv from "dotenv"

dotenv.config();

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

// Middleware
app.use(cors())
app.use(express.json())

// MongoDB connection

const MONGODB_URI = process.env.MONGODB_URI
console.log(MONGODB_URI)
const MONGODB_DB = process.env.MONGODB_DB
console.log(MONGODB_DB)

let db

async function connectToMongo() {
  try {
    const client = new MongoClient(MONGODB_URI, {
      tls: true,
      tlsAllowInvalidCertificates: false,
      retryWrites: true,
      w: 'majority'
    });
    
    await client.connect();
    console.log("Connected to MongoDB");
    db = client.db(MONGODB_DB);

    // Create indexes
    await db.collection("messages").createIndex({ room: 1, timestamp: 1 });
    await db.collection("users").createIndex({ username: 1 }, { unique: true });
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}


// Socket.IO
const onlineUsers = new Map()
const userSockets = new Map()

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId
  const username = socket.handshake.query.username

  console.log(`User connected: ${username} (${userId})`)

  // Add user to online users
  onlineUsers.set(userId, { userId, username, socketId: socket.id })
  userSockets.set(socket.id, userId)

  // Join general room by default
  socket.join("general")

  // Broadcast online users
  io.emit("onlineUsers", Array.from(onlineUsers.values()))

  // Handle join room
  socket.on("joinRoom", async (room) => {
    // Leave all rooms first
    const rooms = Array.from(socket.rooms).filter((r) => r !== socket.id)
    rooms.forEach((r) => socket.leave(r))

    // Join new room
    socket.join(room)
    console.log(`${username} joined room: ${room}`)

    // Notify room change
    socket.emit("roomChanged", room)
  })

  // Handle messages
  socket.on("sendMessage", async (message) => {
    console.log(`Message in ${message.room}: ${message.text}`)

    // Save message to database
    try {
      await db.collection("messages").insertOne(message)
    } catch (error) {
      console.error("Error saving message:", error)
    }

    // Broadcast message to room
    io.to(message.room).emit("message", message)
  })

  // Handle private messages
  socket.on("sendPrivateMessage", async (message) => {
    console.log(`Private message from ${message.fromUsername} to ${message.to}: ${message.text}`)

    // Save private message to database
    try {
      await db.collection("privateMessages").insertOne(message)
    } catch (error) {
      console.error("Error saving private message:", error)
    }

    // Get recipient socket
    const recipientSocketId = onlineUsers.get(message.to)?.socketId

    // Send to recipient if online
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("message", message)
    }

    // Send back to sender
    socket.emit("message", message)
  })

  // Handle typing indicator
  socket.on("typing", (data) => {
    if (data.chatId) {
      if (data.chatId.match(/^[0-9a-fA-F]{24}$/)) {
        // It's a private chat (user ID)
        const recipientSocketId = onlineUsers.get(data.chatId)?.socketId
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("userTyping", data)
        }
      } else {
        // It's a room
        socket.to(data.chatId).emit("userTyping", data)
      }
    }
  })

  // Handle disconnect
  socket.on("disconnect", () => {
    const userId = userSockets.get(socket.id)

    if (userId) {
      console.log(`User disconnected: ${onlineUsers.get(userId)?.username} (${userId})`)
      onlineUsers.delete(userId)
      userSockets.delete(socket.id)

      // Broadcast updated online users
      io.emit("onlineUsers", Array.from(onlineUsers.values()))
    }
  })
})

// Start server
const PORT = process.env.PORT
console.log(PORT)

connectToMongo().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
})

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() })
})

// Handle errors
process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error)
})

console.log("Server initialized and waiting for MongoDB connection...")
