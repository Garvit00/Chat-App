
"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"  // Import toast directly from sonner

export default function RegisterForm({ setUser }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  // Remove this line - it's causing the error:
  // const { toast } = Toaster()
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password || !confirmPassword) {
      toast.error("Error", {  // Use this format
        description: "Please fill in all fields"
      })
      return
    }
    if (password !== confirmPassword) {
      toast.error("Error", {  // Use this format
        description: "Passwords do not match"
      })
      return
    }
    setLoading(true)
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || "Registration failed")
      }
      // Save user to localStorage
      localStorage.setItem("chatUser", JSON.stringify(data.user))
      // Update user state
      setUser(data.user)
      toast.success("Success", {  // Use this format
        description: "You have successfully registered"
      })
    } catch (error) {
      toast.error("Error", {  // Use this format
        description: error.message || "Failed to register"
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
              placeholder="Choose a username"
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
              placeholder="Choose a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="mr-2">Registering</span>
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
              </span>
            ) : (
              "Register"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
