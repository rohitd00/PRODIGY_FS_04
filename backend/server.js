const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const db = require('./database');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // For development purposes; restrict in production
    methods: ['GET', 'POST']
  }
});

// Authentication Routes
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Basic check for existing user
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) return res.status(400).json({ error: 'Username already exists' });

    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, username });
    });
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });
    
    res.json({ id: row.id, username: row.username });
  });
});

// Rooms Routes
app.get('/api/rooms', (req, res) => {
  db.all('SELECT * FROM rooms', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create a room
app.post('/api/rooms', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Room name is required' });
  
  db.run('INSERT INTO rooms (name, type) VALUES (?, ?)', [name, 'group'], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    const newRoom = { id: this.lastID, name, type: 'group' };
    io.emit('room_created', newRoom);
    res.status(201).json(newRoom);
  });
});

// Get messages for a room
app.get('/api/rooms/:id/messages', (req, res) => {
  const roomId = req.params.id;
  const sql = `
    SELECT m.id, m.content, m.created_at, u.username, u.id as user_id
    FROM messages m 
    JOIN users u ON m.user_id = u.id 
    WHERE m.room_id = ? 
    ORDER BY m.created_at ASC
  `;
  db.all(sql, [roomId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Socket.IO Logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log(`Socket ${socket.id} left room ${roomId}`);
  });

  socket.on('send_message', (data) => {
    const { room_id, user_id, content, username } = data;
    
    // Save message to DB
    db.run(
      'INSERT INTO messages (room_id, user_id, content) VALUES (?, ?, ?)',
      [room_id, user_id, content],
      function(err) {
        if (err) {
          console.error('Error saving message:', err.message);
          return;
        }
        
        const newMessage = {
          id: this.lastID,
          room_id,
          user_id,
          content,
          username,
          created_at: new Date().toISOString()
        };

        // Broadcast to everyone in the room including sender
        io.to(room_id).emit('receive_message', newMessage);
      }
    );
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
