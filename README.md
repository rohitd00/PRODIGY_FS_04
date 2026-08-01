# Real-Time Chat App

This is a real-time chat application built for Task 4 of the Prodigy InfoTech internship. It allows users to create accounts, log in, join different chat rooms, and send messages instantly. 

## Features
- **User Accounts:** Sign up and log in.
- **Real-Time Messaging:** Instant chat powered by Socket.IO.
- **Rooms:** Join the general chat or create your own custom rooms.
- **Message History:** See past messages when you enter a room.
- **Clean UI:** A simple, minimal design without any heavy CSS frameworks.

## Tech Stack
- **Frontend:** React, React Router, Vite, vanilla CSS
- **Backend:** Node.js, Express, Socket.IO
- **Database:** SQLite (local file database)

## How to run it locally

You'll need two terminal tabs open to run this project.

### 1. Backend setup
1. Open a terminal and `cd` into the `backend` folder.
2. Run `npm install` to get the dependencies.
3. Start the server with `node server.js` (it runs on port 3000).
   
*Note: The SQLite database file (`chat.db`) will be created automatically when the server starts.*

### 2. Frontend setup
1. Open a new terminal tab and `cd` into the `frontend` folder.
2. Run `npm install` to install React and other dependencies.
3. Start the dev server with `npm run dev`.
4. Open the localhost link (usually `http://localhost:5173`) in your browser.

To test the real-time features, just open the app in two different browsers (or one normal window and one incognito window), create two different accounts, and chat between them!
