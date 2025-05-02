"use client"

import { useState, useEffect, useRef } from "react"
import { io } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Toaster } from "@/components/ui/sonner"
import { MessageSquare, Users, Send } from "lucide-react"
import ChatMessage from "@/components/chat-message"
import OnlineUsers from "@/components/online-users"

export default function ChatInterface({ user }) {
  const [socket, setSocket] = useState(null)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])
  const [currentRoom, setCurrentRoom] = useState("general")
  const [rooms, setRooms] = useState(["general", "random", "tech"])
  const [privateChats, setPrivateChats] = useState({})
  const [activeChat, setActiveChat] = useState({ type: "room", id: "general" })
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState({})
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const { toast } = Toaster()

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001", {
      query: {
        userId: user._id,
        username: user.username,
      },
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [user])

  useEffect(() => {
    if (!socket) return

    // Load chat history
    const fetchChatHistory = async () => {
      try {
        const response = await fetch(`/api/messages?room=${currentRoom}`)
        const data = await response.json()

        if (response.ok) {
          setMessages(data.messages)
        }
      } catch (error) {
        console.error("Failed to fetch chat history", error)
      } finally {
        setLoading(false)
      }
    }

    fetchChatHistory()

    // Handle incoming messages
    socket.on("message", (newMessage) => {
      if (
        (activeChat.type === "room" && newMessage.room === activeChat.id) ||
        (activeChat.type === "private" &&
          ((newMessage.from === user._id && newMessage.to === activeChat.id) ||
            (newMessage.to === user._id && newMessage.from === activeChat.id)))
      ) {
        setMessages((prevMessages) => [...prevMessages, newMessage])
      }

      // Handle private messages
      if (newMessage.to === user._id) {
        const senderId = newMessage.from
        const senderName = newMessage.fromUsername

        setPrivateChats((prev) => {
          const existingChat = prev[senderId] || { userId: senderId, username: senderName, messages: [] }
          return {
            ...prev,
            [senderId]: {
              ...existingChat,
              messages: [...existingChat.messages, newMessage],
              unread: activeChat.id !== senderId,
            },
          }
        })

        if (activeChat.id !== senderId) {
          toast({
            title: "New message",
            description: `${senderName}: ${newMessage.text.substring(0, 30)}${newMessage.text.length > 30 ? "..." : ""}`,
          })
        }
      }
    })

    // Handle online users update
    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users.filter((u) => u.userId !== user._id))
    })

    // Handle typing indicators
    socket.on("userTyping", ({ userId, username, isTyping, chatId }) => {
      if (
        (activeChat.type === "room" && chatId === activeChat.id) ||
        (activeChat.type === "private" && userId === activeChat.id)
      ) {
        setTypingUsers((prev) => ({
          ...prev,
          [userId]: isTyping ? username : null,
        }))
      }
    })

    // Handle room change
    socket.on("roomChanged", (room) => {
      if (room === activeChat.id) {
        fetchChatHistory()
      }
    })

    return () => {
      socket.off("message")
      socket.off("onlineUsers")
      socket.off("userTyping")
      socket.off("roomChanged")
    }
  }, [socket, activeChat, currentRoom, user._id, user.username, toast])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle sending messages
  const sendMessage = () => {
    if (!message.trim() || !socket) return

    const messageData = {
      text: message,
      from: user._id,
      fromUsername: user.username,
      timestamp: new Date().toISOString(),
    }

    if (activeChat.type === "room") {
      messageData.room = activeChat.id
      socket.emit("sendMessage", messageData)
    } else {
      messageData.to = activeChat.id
      socket.emit("sendPrivateMessage", messageData)

      // Update local private chat
      setPrivateChats((prev) => {
        const existingChat = prev[activeChat.id] || {
          userId: activeChat.id,
          username: onlineUsers.find((u) => u.userId === activeChat.id)?.username || "User",
          messages: [],
        }

        return {
          ...prev,
          [activeChat.id]: {
            ...existingChat,
            messages: [...existingChat.messages, messageData],
            unread: false,
          },
        }
      })
    }

    // Clear typing indicator
    socket.emit("typing", {
      userId: user._id,
      username: user.username,
      isTyping: false,
      chatId: activeChat.type === "room" ? activeChat.id : activeChat.id,
    })

    setMessage("")
    clearTimeout(typingTimeoutRef.current)
  }

  // Handle typing indicator
  const handleTyping = (e) => {
    setMessage(e.target.value)

    if (!socket) return

    // Send typing indicator
    socket.emit("typing", {
      userId: user._id,
      username: user.username,
      isTyping: true,
      chatId: activeChat.type === "room" ? activeChat.id : activeChat.id,
    })

    // Clear previous timeout
    clearTimeout(typingTimeoutRef.current)

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", {
        userId: user._id,
        username: user.username,
        isTyping: false,
        chatId: activeChat.type === "room" ? activeChat.id : activeChat.id,
      })
    }, 2000)
  }

  // Handle room change
  const changeRoom = (room) => {
    setActiveChat({ type: "room", id: room })
    setCurrentRoom(room)
    setLoading(true)

    if (socket) {
      socket.emit("joinRoom", room)
    }
  }

  // Handle private chat
  const startPrivateChat = (userId, username) => {
    setActiveChat({ type: "private", id: userId })

    // Initialize private chat if it doesn't exist
    if (!privateChats[userId]) {
      setPrivateChats((prev) => ({
        ...prev,
        [userId]: {
          userId,
          username,
          messages: [],
          unread: false,
        },
      }))
    } else {
      // Mark as read
      setPrivateChats((prev) => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          unread: false,
        },
      }))
    }
  }

  // Get active messages based on current chat
  const getActiveMessages = () => {
    if (activeChat.type === "room") {
      return messages
    } else {
      return privateChats[activeChat.id]?.messages || []
    }
  }

  // Get typing indicator text
  const getTypingIndicator = () => {
    const typingUsernames = Object.values(typingUsers).filter(Boolean)

    if (typingUsernames.length === 0) return null
    if (typingUsernames.length === 1) return `${typingUsernames[0]} is typing...`
    if (typingUsernames.length === 2) return `${typingUsernames[0]} and ${typingUsernames[1]} are typing...`
    return "Several people are typing..."
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[calc(100vh-120px)]">
      {/* Sidebar */}
      <div className="md:col-span-1 bg-white rounded-lg shadow overflow-hidden">
        <Tabs defaultValue="rooms" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rooms" className="flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              Rooms
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Users ({onlineUsers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="p-0">
            <ScrollArea className="h-[calc(100vh-220px)]">
              <div className="p-4 space-y-2">
                {rooms.map((room) => (
                  <Button
                    key={room}
                    variant={activeChat.type === "room" && activeChat.id === room ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => changeRoom(room)}
                  >
                    # {room}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="users" className="p-0">
            <OnlineUsers
              users={onlineUsers}
              onStartChat={startPrivateChat}
              activeChat={activeChat}
              privateChats={privateChats}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat Area */}
      <div className="md:col-span-3 flex flex-col bg-white rounded-lg shadow overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center">
            {activeChat.type === "room" ? (
              <h2 className="text-lg font-medium">#{activeChat.id}</h2>
            ) : (
              <h2 className="text-lg font-medium">
                {privateChats[activeChat.id]?.username ||
                  onlineUsers.find((u) => u.userId === activeChat.id)?.username ||
                  "User"}
              </h2>
            )}
          </div>

          {activeChat.type === "room" && (
            <Badge variant="outline" className="ml-2">
              {onlineUsers.length + 1} online
            </Badge>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          ) : getActiveMessages().length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
              <p>No messages yet</p>
              <p className="text-sm">Be the first to send a message!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {getActiveMessages().map((msg, index) => (
                <ChatMessage key={index} message={msg} isOwnMessage={msg.from === user._id} currentUser={user} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Typing Indicator */}
        {getTypingIndicator() && <div className="px-4 py-1 text-sm text-gray-500 italic">{getTypingIndicator()}</div>}

        {/* Message Input */}
        <div className="p-4 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage()
            }}
            className="flex space-x-2"
          >
            <Input
              value={message}
              onChange={handleTyping}
              placeholder={`Message ${activeChat.type === "room" ? `#${activeChat.id}` : privateChats[activeChat.id]?.username || "User"}`}
              className="flex-1"
            />
            <Button type="submit" disabled={!message.trim()}>
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
