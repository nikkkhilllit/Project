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
    const extension = fileName.split('.').pop().toLowerCase(); // Extract the extension
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
        setLanguage(cpp);
        break;
      default:
        setLanguage(javascript); // Default to JavaScript if no match
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
    const fileName = prompt('Enter file name:');
    if (!fileName) return;

    try {
      const response = await axios.post(
        `http://localhost:5000/projects/${taskId}/codefiles`,
        { fileName },
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      setCodeFiles((prevFiles) => [...prevFiles, response.data.file]);
      setSelectedFile(response.data.file.fileId);
      setCode(response.data.file.content);
      updateLanguage(response.data.file.fileName);
    } catch (error) {
      console.error('Error creating new file:', error);
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
    } catch (error) {
      console.error('Error saving code:', error);
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
      setCodeFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.fileId === fileId ? { ...file, fileName: response.data.file.fileName } : file
        )
      );
      updateLanguage(response.data.file.fileName);
    } catch (error) {
      console.error('Error renaming file:', error);
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
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const runCode = async () => {
    if (!code.trim()) return;

    try {
      // Send the code to Judge0 API for execution
      const response = await axios.post(
        'https://judge0-ce.p.rapidapi.com/submissions',
        {
          language_id: getLanguageId(), // Get language ID dynamically
          source_code: code,
          stdin: '', // Optional: Provide input for the code if necessary
        },
        {
          headers: {
            'X-RapidAPI-Key': '54343cf2e2msh807ae0fd6da5384p10795bjsnc2ad1d1f0de9', // Replace with your API key
            'Content-Type': 'application/json',
          },
        }
      );

      // Extract the submission ID to poll for the result
      const { token } = response.data;
      getExecutionResult(token);
    } catch (error) {
      console.error('Error running code:', error);
    }
  };

  const getLanguageId = () => {
    switch (language) {
      case javascript:
        return 63; // JavaScript ID for Judge0
      case python:
        return 71; // Python ID for Judge0
      case java:
        return 62; // Java ID for Judge0
      case cpp:
        return 50; // C++ ID for Judge0
      default:
        return 63; // Default to JavaScript if no match
    }
  };

  const getExecutionResult = async (token) => {
    try {
      // Poll the API for the result
      const response = await axios.get(
        `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
        {
          headers: {
            'X-RapidAPI-Key': '54343cf2e2msh807ae0fd6da5384p10795bjsnc2ad1d1f0de9', // Replace with your API key
          },
        }
      );

      const { stdout, stderr, status } = response.data;

      // Handle the output or error
      if (status && status.description === 'Accepted') {
        setOutput(`Output: ${stdout}`);
      } else {
        setOutput(`Error: ${stderr}`);
      }
    } catch (error) {
      console.error('Error fetching execution result:', error);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded shadow overflow-auto">
      <h1 className="text-2xl font-bold mb-4">Real-Time Collaboration</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <CodeMirror
            value={code}
            extensions={[language]} // Directly use the language extension
            theme={oneDark}
            onChange={handleCodeChange}
          />
        </div>
        <div className="border p-4 rounded">
          <h2 className="text-xl font-bold mb-2">Files</h2>
          <ul className="space-y-2">
            {codeFiles.map((file) => (
              <li key={file.fileId} className="flex justify-between items-center">
                <span
                  className="cursor-pointer text-blue-600"
                  onClick={() => handleFileSelect(file.fileId)}
                >
                  {file.fileName}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => renameFile(file.fileId)}
                    className="text-yellow-500"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => deleteFile(file.fileId)}
                    className="text-red-500"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button
            className="mt-4 bg-blue-500 text-white py-2 px-4 rounded"
            onClick={createCodeFile}
          >
            Create New Editor
          </button>
          <button
            className="mt-4 bg-green-500 text-white py-2 px-4 rounded"
            onClick={saveCode}
          >
            Save Code
          </button>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-bold">Chat</h2>
        <div className="space-y-2 mb-4">
          {messages.map((msg, index) => (
            <div key={index} className="text-sm text-gray-700">
              {msg}
            </div>
          ))}
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            className="border p-2 w-full"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 text-white py-2 px-4 rounded"
          >
            Send
          </button>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={runCode}
          className="bg-green-500 text-white py-2 px-4 rounded"
        >
          Run Code
        </button>
        <div className="mt-4 bg-gray-800 text-white p-4 rounded overflow-auto">
          <h3 className="font-bold">Output</h3>
          <pre>{output}</pre>
        </div>
      </div>
    </div>
  );
};

export default CollaborationWorkspace;
