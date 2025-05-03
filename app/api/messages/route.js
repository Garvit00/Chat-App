import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const room = searchParams.get("room")

    if (!room) {
      return NextResponse.json({ message: "Room parameter is required" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Get messages for the room
    const messages = await db.collection("messages").find({ room }).sort({ timestamp: 1 }).limit(100).toArray()

    return NextResponse.json(
      { messages: messages.map((msg) => ({ ...msg, _id: msg._id.toString() })) },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const message = await request.json()

    // Validate input
    if (!message.text || !message.from || !message.room) {
      return NextResponse.json({ message: "Message text, sender, and room are required" }, { status: 400 })
    }

    // Connect to database
    const { db } = await connectToDatabase()

    // Add timestamp if not provided
    if (!message.timestamp) {
      message.timestamp = new Date().toISOString()
    }

    // Save message
    const result = await db.collection("messages").insertOne(message)

    return NextResponse.json(
      {
        message: "Message saved successfully",
        messageId: result.insertedId.toString(),
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error saving message:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
