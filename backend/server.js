const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/project');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();

// Enable CORS
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// This will allow all origins by default
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log(err));

// Use the auth routes
app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);

// Create HTTP server and integrate with Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // Your frontend URL
    methods: ['GET', 'POST'],
  },
});

// Real-time communication: Code collaboration
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join-room', (taskId) => {
    socket.join(taskId);
    console.log(`User ${socket.id} joined room: ${taskId}`);
  });

  socket.on('leave-room', (taskId) => {
    socket.leave(taskId);
    console.log(`User ${socket.id} left room: ${taskId}`);
  });
  // Code collaboration
  socket.on('code-change', ({ room, code }) => {
    socket.to(room).emit('code-update', code); // Send the code to others in the room
  });

  // Chat communication
  socket.on('send-message', ({ room, message, username }) => {
    const fullMessage = `${username}: ${message}`;
    socket.to(room).emit('receive-message', fullMessage); // Broadcast to others
    console.log(`Message in room ${room}: ${fullMessage}`);
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  // Add these handlers inside the io.on('connection') callback
socket.on('file-created', (fileData) => {
  socket.to(fileData.room).emit('file-created', fileData.file);
});

socket.on('file-renamed', ({ room, fileId, newName }) => {
  socket.to(room).emit('file-renamed', { fileId, newName });
});

socket.on('file-deleted', ({ room, fileId }) => {
  socket.to(room).emit('file-deleted', fileId);
});

socket.on('console-output', ({ room, output }) => {
  socket.to(room).emit('console-output', output);
});
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
