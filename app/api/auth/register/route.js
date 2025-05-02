import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { hash } from "bcryptjs"

export async function POST(request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ message: "Username and password are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const existingUser = await db.collection("users").findOne({ username })
    if (existingUser) {
      return NextResponse.json({ message: "Username already exists" }, { status: 409 })
    }

    const hashedPassword = await hash(password, 10) //hashing password

    const result = await db.collection("users").insertOne({
      username,
      password: hashedPassword,
      createdAt: new Date(),
    })

    const user = {
      _id: result.insertedId.toString(),
      username,
      createdAt: new Date(),
    }

    return NextResponse.json({ message: "User registered successfully", user }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
