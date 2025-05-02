"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"  // This is correct

export default function LoginForm({ setUser }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  // REMOVE THIS LINE - This is causing the error:
  // const { toast } = Toaster()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) {
      toast.error("Error", {  // Change to this format
        description: "Please fill in all fields"
      })
      return
    }
    setLoading(true)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || "Login failed")
      }
      // Save user to localStorage
      localStorage.setItem("chatUser", JSON.stringify(data.user))
      // Update user state
      setUser(data.user)
      toast.success("Success", {  // Change to this format
        description: "You have successfully logged in"
      })
    } catch (error) {
      toast.error("Error", {  // Change to this format
        description: error.message || "Failed to login"
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="mr-2">Logging in</span>
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
              </span>
            ) : (
              "Login"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
