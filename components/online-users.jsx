"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function OnlineUsers({ users, onStartChat, activeChat, privateChats }) {
  return (
    <ScrollArea className="h-[calc(100vh-220px)]">
      <div className="p-4 space-y-2">
        {users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No users online</p>
          </div>
        ) : (
          users.map((user) => (
            <Button
              key={user.userId}
              variant={activeChat.type === "private" && activeChat.id === user.userId ? "default" : "outline"}
              className="w-full justify-between text-gray-900 hover:text-blue-400"
              onClick={() => onStartChat(user.userId, user.username)}
            >
              <span className="flex items-center">
                <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                {user.username}
              </span>

              <div className="flex items-center">
                {privateChats[user.userId]?.unread && (
                  <Badge variant="destructive" className="mr-2">
                    New
                  </Badge>
                )}
                <MessageSquare className="w-4 h-4" />
              </div>
            </Button>
          ))
        )}
      </div>
    </ScrollArea>
  )
}
