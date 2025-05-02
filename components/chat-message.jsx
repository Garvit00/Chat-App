import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"

export default function ChatMessage({ message, isOwnMessage, currentUser }) {
  const formattedTime = message.timestamp
    ? formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })
    : "just now"

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div className={`flex ${isOwnMessage ? "flex-row-reverse" : "flex-row"} max-w-[80%] gap-2`}>
        {!isOwnMessage && (
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
              {getInitials(message.fromUsername || "User")}
            </AvatarFallback>
          </Avatar>
        )}

        <div className={`space-y-1 ${isOwnMessage ? "items-end" : "items-start"}`}>
          {!isOwnMessage && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{message.fromUsername}</span>
            </div>
          )}

          <div className="flex flex-col">
            <Card className={`${isOwnMessage ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"} shadow-sm`}>
              <CardContent className="p-3">
                <p className="whitespace-pre-wrap break-words">{message.text}</p>
              </CardContent>
            </Card>
            <span className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? "text-right" : "text-left"}`}>
              {formattedTime}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
