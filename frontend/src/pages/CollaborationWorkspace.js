import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // For extracting the task ID
import { io } from 'socket.io-client';
import CodeMirror from '@uiw/react-codemirror'; // Corrected import
import { oneDark } from '@codemirror/theme-one-dark'; // Theme import
import { javascript } from '@codemirror/lang-javascript'; // Language import
import axios from 'axios';

// Create a single socket connection outside the component
const socket = io('http://localhost:5000'); // Replace with your backend URL

const CollaborationWorkspace = () => {
  const { taskId } = useParams(); // Extract the task ID from the URL
  console.log('taskId from URL:', taskId);
  const [code, setCode] = useState('// Start coding here...');
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState(''); // Store the username

  useEffect(() => {
    // Fetch user data from the backend
    const fetchUser = async () => {
      const token = localStorage.getItem('authToken'); // Get the token from localStorage
      if (!token) return;

      try {
        const response = await axios.get('http://localhost:5000/auth/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsername(response.data.user.username); // Set the username
      } catch (error) {
        console.log('Error fetching user data:', error);
      }
    };

    fetchUser();

    if (!taskId) return; // Ensure the task ID is available

    // Join a specific room based on the task ID
    socket.emit('join-room', taskId);

    // Listen for code updates
    socket.on('code-update', (data) => {
      setCode(data);
    });

    // Listen for chat messages
    socket.on('receive-message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Cleanup on component unmount
    return () => {
      socket.emit('leave-room', taskId); // Leave the room
      socket.off('code-update');
      socket.off('receive-message');
    };
  }, [taskId]);

  // Handle code changes
  const handleCodeChange = (value) => {
    setCode(value);
    socket.emit('code-change', { room: taskId, code: value }); // Include the room ID
  };

  // Handle chat messages
  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit('send-message', { room: taskId, message, username });
    setMessages((prevMessages) => [...prevMessages, `${username}: ${message}`]);
    setMessage('');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Real-Time Collaboration for Task: {taskId}</h1>
      <div className="grid grid-cols-3 gap-4">
        {/* Code Editor */}
        <div className="col-span-2">
          <CodeMirror
            value={code}
            extensions={[javascript()]} // Updated syntax
            theme={oneDark} // Apply the oneDark theme
            onChange={handleCodeChange} // Use updated onChange event
          />
        </div>
        {/* Chat Section */}
        <div className="border p-4 rounded">
          <h2 className="text-xl font-bold mb-2">Chat</h2>
          <div className="h-64 overflow-y-scroll border p-2 rounded mb-4">
            {messages.map((msg, index) => (
              <p key={index}>{msg}</p>
            ))}
          </div>
          <input
            type="text"
            className="w-full border p-2 rounded mb-2"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
          />
          <button
            className="w-full bg-blue-500 text-white py-2 rounded"
            onClick={sendMessage}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollaborationWorkspace;