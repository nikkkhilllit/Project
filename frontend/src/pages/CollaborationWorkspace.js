import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import axios from 'axios';
import { Edit, Trash } from 'lucide-react'; // Icons for update and delete actions
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const socket = io('http://localhost:5000');

const CollaborationWorkspace = () => {
  const { taskId } = useParams();
  const [code, setCode] = useState('// Start coding here...');
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');
  const [codeFiles, setCodeFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [language, setLanguage] = useState(javascript); // Default to JavaScript
  const [output, setOutput] = useState(''); // Output terminal
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [fileExtension, setFileExtension] = useState('js');

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      try {
        const response = await axios.get('http://localhost:5000/auth/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsername(response.data.user.username);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUser();

    if (!taskId) return;

    const fetchCodeFiles = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/projects/${taskId}/codefiles`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        });
        setCodeFiles(response.data);
        if (response.data.length > 0) {
          setSelectedFile(response.data[0].fileId);
          setCode(response.data[0].content);
          updateLanguage(response.data[0].fileName);
        }
      } catch (error) {
        console.error('Error fetching code files:', error);
      }
    };

    fetchCodeFiles();

    socket.emit('join-room', taskId);
    socket.on('code-update', (data) => {
      setCode(data);
    });

    socket.on('receive-message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.emit('leave-room', taskId);
      socket.off('code-update');
      socket.off('receive-message');
    };
  }, [taskId]);

  const updateLanguage = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  setFileExtension(extension);
  
  switch (extension) {
    case 'js':
      setLanguage(javascript);
      break;
    case 'py':
      setLanguage(python);
      break;
    case 'java':
      setLanguage(java);
      break;
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'hpp':
      setLanguage(cpp);
      break;
    default:
      setLanguage(javascript);
      break;
  }
};

  const handleCodeChange = (value) => {
    setCode(value);
    if (selectedFile) {
      socket.emit('code-change', { room: taskId, code: value, fileId: selectedFile });
    }
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit('send-message', { room: taskId, message, username });
    setMessages((prevMessages) => [...prevMessages, `${username}: ${message}`]);
    setMessage('');
  };

  const createCodeFile = async () => {
    const fileName = prompt('Enter file name with extension:');
    if (!fileName || !fileName.includes('.')) {
      alert('File must have an extension (e.g., .java, .cpp)');
      return;
    }
  
    try {
      const response = await axios.post(
        `http://localhost:5000/projects/${taskId}/codefiles`,
        { fileName },
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      
      const newFile = response.data.file;
      setCodeFiles((prevFiles) => [...prevFiles, newFile]);
      setSelectedFile(newFile.fileId);
      setCode(newFile.content);
      updateLanguage(newFile.fileName);
      
      // Broadcast to other users
      socket.emit('file-created', { room: taskId, file: newFile });
    } catch (error) {
      console.error('Error creating new file:', error);
      alert('Failed to create file. Check console for details.');
    }
  };

  const handleFileSelect = (fileId) => {
    const file = codeFiles.find((f) => f.fileId === fileId);
    if (file) {
      setSelectedFile(fileId);
      setCode(file.content);
      updateLanguage(file.fileName);
    }
  };

  const saveCode = async () => {
    if (!selectedFile) return;

    try {
      await axios.put(
        `http://localhost:5000/projects/${taskId}/codefiles/${selectedFile}`,
        { content: code },
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      alert('Code saved successfully!');
      const streakResponse = await axios.post(
        `http://localhost:5000/auth/update-streak`,
        {}, // No body is required unless you wish to send extra data.
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      console.log('Updated streak:', streakResponse.data.streakDays);
      // Optionally update local UI state if you wish to display the new streak.
    } catch (error) {
      console.error('Error saving code:', error);
      alert('Failed to save code. Check console for details.');
    }
  };

  const renameFile = async (fileId) => {
    const newName = prompt('Enter new file name:');
    if (!newName) return;
  
    try {
      const response = await axios.put(
        `http://localhost:5000/projects/${taskId}/codefiles/${fileId}/rename`,
        { newName },
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
  
      const updatedFile = response.data.file;
      setCodeFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.fileId === fileId ? updatedFile : file
        )
      );
  
      if (selectedFile === fileId) {
        updateLanguage(updatedFile.fileName);
      }
  
      // Broadcast to other users
      socket.emit('file-renamed', { 
        room: taskId, 
        fileId,
        newName: updatedFile.fileName 
      });
    } catch (error) {
      console.error('Error renaming file:', error);
      alert('Failed to rename file. Check console for details.');
    }
  };
  
  const deleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
  
    try {
      await axios.delete(
        `http://localhost:5000/projects/${taskId}/codefiles/${fileId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
  
      setCodeFiles((prevFiles) => prevFiles.filter((file) => file.fileId !== fileId));
      if (selectedFile === fileId) {
        setSelectedFile(null);
        setCode('// Start coding here...');
      }
  
      // Broadcast to other users
      socket.emit('file-deleted', { room: taskId, fileId });
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file. Check console for details.');
    }
  };

  const runCode = async () => {
    if (!code.trim()) return;
  
    try {
      const response = await axios.post(
        'https://judge0-ce.p.rapidapi.com/submissions',
        {
          language_id: getLanguageId(),
          source_code: code,
          stdin: '',
          cpu_time_limit: 5,
        },
        {
          headers: {
            'X-RapidAPI-Key': '54343cf2e2msh807ae0fd6da5384p10795bjsnc2ad1d1f0de9',
            'Content-Type': 'application/json',
          },
        }
      );
  
      const { token } = response.data;
      const result = await getExecutionResult(token);
  
      // Extract output details
      const { stdout, stderr, status, compile_output } = result;
  
      let outputMessage;
      if (status.description === 'Accepted') {
        outputMessage = `Output: ${stdout || "No output"}`;
      } else {
        outputMessage = `Error: ${stderr || compile_output || "Unknown error"}`;
      }
  
      // Update local state and broadcast
      setOutput(outputMessage);
      socket.emit('console-output', {
        room: taskId,
        output: outputMessage,
      });
    } catch (error) {
      console.error('Error running code:', error);
      setOutput('Failed to execute code. Check console for details.');
    }
  };
  

  const getLanguageId = () => {
    switch (fileExtension) {
      case 'js': return 63;  // Node.js
      case 'py': return 71;  // Python
      case 'java': return 62; // Java
      case 'cpp': return 53;  // C++ (GCC 9.4.0)
      case 'c': return 50;    // C (GCC 9.4.0)
      default: return 63;     // Default to JavaScript
    }
  };

  const getExecutionResult = async (token) => {
    try {
      const response = await axios.get(
        `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
        { headers: { 'X-RapidAPI-Key': '54343cf2e2msh807ae0fd6da5384p10795bjsnc2ad1d1f0de9' } }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching execution result:', error);
      throw error;
    }
  };
  
  // CollaborationWorkspace.js
useEffect(() => {
  const verifyAuthorization = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      // Get current user
      const userResponse = await axios.get('http://localhost:5000/auth/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userId = userResponse.data.user._id;

      // Get project containing the task
      const projectResponse = await axios.get(
        `http://localhost:5000/projects/task/${taskId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const project = projectResponse.data;
      
      // Check if user is project creator
      const isCreator = project.createdBy._id.toString() === userId;
      
      // Find the specific task
      const task = project.tasks.find(t => t.taskId === taskId);
      if (!task) {
        setIsAuthorized(false);
        setLoadingAuth(false);
        return;
      }

      // Check if user is task collaborator
      const isCollaborator = task.collaborators.some(c => 
        c._id.toString() === userId
      );

      setIsAuthorized(isCreator || isCollaborator);
    } catch (error) {
      console.error('Authorization check failed:', error);
    } finally {
      setLoadingAuth(false);
    }
  };

  verifyAuthorization();
}, [taskId]);

useEffect(() => {
  // Add these inside the existing useEffect
  socket.on('file-created', (file) => {
    setCodeFiles((prevFiles) => [...prevFiles, file]);
  });

  // Update the file-renamed listener
socket.on('file-renamed', ({ fileId, newName }) => {
  setCodeFiles((prevFiles) =>
    prevFiles.map((file) => {
      if (file.fileId === fileId) {
        if (selectedFile === fileId) {
          updateLanguage(newName);
        }
        return { ...file, fileName: newName };
      }
      return file;
    })
  );
});

  socket.on('file-deleted', (fileId) => {
    setCodeFiles((prevFiles) => prevFiles.filter((file) => file.fileId !== fileId));
    if (selectedFile === fileId) {
      setSelectedFile(null);
      setCode('// Start coding here...');
    }
  });

  socket.on('console-output', (output) => {
    setOutput(output);
  });

  // Don't forget to clean up these listeners
  return () => {
    socket.off('file-created');
    socket.off('file-renamed');
    socket.off('file-deleted');
    socket.off('console-output');
  };
}, [taskId, selectedFile]);

  if (loadingAuth) {
    return <div>Loading authorization...</div>;
  }

  if (!isAuthorized) {
    return (
      <div className="p-6 text-center text-red-500">
        <h2>Access Denied</h2>
        <p>You must be a collaborator or project owner to access this workspace.</p>
        <Link to="/" className="text-blue-500">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      {/* Navbar */}
      <Navbar />
  
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Files */}
        <div className="w-64 bg-gray-800 p-4 flex flex-col">
          <h2 className="text-lg font-bold mb-2">Files</h2>
          <ul className="space-y-2 flex-grow overflow-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {codeFiles.map((file) => (
              <li key={file.fileId} className="flex justify-between items-center">
                <span
                  className="cursor-pointer text-blue-400"
                  onClick={() => handleFileSelect(file.fileId)}
                >
                  {file.fileName}
                </span>
                <div className="flex space-x-2">
                  <button onClick={() => renameFile(file.fileId)} className="text-yellow-400">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => deleteFile(file.fileId)} className="text-red-400">
                    <Trash size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button className="mt-4 bg-blue-500 text-white py-2 px-4 rounded" onClick={createCodeFile}>
            New File
          </button>
          <button className="mt-2 bg-green-500 text-white py-2 px-4 rounded" onClick={saveCode}>
            Save Code
          </button>
        </div>
  
        {/* Main Editor & Console Section */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Code Editor */}
          <div className="flex-1 p-4 overflow-auto bg-[#282c34] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            <CodeMirror
              value={code}
              extensions={[language]}
              theme={oneDark}
              onChange={handleCodeChange}
              className="h-full w-full"
            />
          </div>
  
          {/* Console */}
          <div className="h-40 bg-gray-800 p-4 overflow-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            <h3 className="font-bold">Output</h3>
            <pre className="text-sm">{output}</pre>
          </div>
  
          {/* Run Button */}
          <div className="p-2 bg-gray-800 text-right">
            <button onClick={runCode} className="bg-green-500 text-white py-2 px-4 rounded">
              Run Code
            </button>
          </div>
        </div>
  
        {/* Right Sidebar - Chat */}
        <div className="w-80 bg-gray-800 p-4 flex flex-col">
          <h2 className="text-lg font-bold">Chat</h2>
          <div className="flex-grow space-y-2 mb-4 overflow-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {messages.map((msg, index) => (
              <div key={index} className="text-sm text-gray-300">{msg}</div>
            ))}
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              className="border p-2 w-full bg-gray-700 text-white"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button onClick={sendMessage} className="bg-blue-500 text-white py-2 px-4 rounded">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
};

export default CollaborationWorkspace;
