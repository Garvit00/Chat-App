import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { compare } from "bcryptjs"

export async function POST(request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ message: "Username and password are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const user = await db.collection("users").findOne({ username })

    if (!user) {
      return NextResponse.json({ message: "Invalid username or password" }, { status: 401 })
    }

    const isPasswordValid = await compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ message: "Invalid username or password" }, { status: 401 })
    }

    const userData = {
      _id: user._id.toString(),
      username: user.username,
      createdAt: user.createdAt,
    }

    return NextResponse.json({ message: "Login successful", user: userData }, { status: 200 })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
