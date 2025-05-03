# Real-Time Chat Application

A full-stack real-time chat application built with React, Node.js, Express, Socket.IO, and MongoDB.

## Features

- **User Authentication**: Register and login functionality
- **Real-Time Messaging**: Instant message delivery using Socket.IO
- **Online Users List**: See who's currently online
- **Chat Rooms**: Join different topic-based rooms
- **Private Messaging**: Direct messaging between users
- **Typing Indicators**: See when someone is typing
- **Message History**: Persistent chat history stored in MongoDB
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- React (Next.js App Router)
- TailwindCSS for styling
- Socket.IO client for real-time communication
- shadcn/ui components

### Backend
- Node.js with Express
- Socket.IO for WebSocket communication
- MongoDB for data persistence
- bcryptjs for password hashing

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
   \`\`\`
   git clone https://github.com/yourusername/real-time-chat.git
   cd real-time-chat
   \`\`\`

2. Install dependencies
   \`\`\`
   npm install
   \`\`\`

3. Create a `.env` file in the root directory with the following variables:
   \`\`\`
   MONGODB_URI=your_mongodb_connection_string
   MONGODB_DB=chat-app
   NEXT_PUBLIC_API_URL=http://localhost:3001
   \`\`\`

4. Start the development server
   \`\`\`
   # Start the backend server
   npm run server
   
   # In a separate terminal, start the frontend
   npm run dev
   \`\`\`

5. Open your browser and navigate to `http://localhost:3000`

## Deployment

This application can be deployed using services like Vercel for the frontend and Heroku for the backend. Make sure to set the appropriate environment variables in your deployment platform.

## Future Improvements

- Add message reactions
- Implement file sharing
- Add read receipts
- Implement user profiles with avatars
- Add message search functionality
- Implement end-to-end encryption

