// src/components/Register.js
import React, { useState } from 'react';
import axios from 'axios';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/auth/register', { username, email, password });
      alert(response.data.message);
    } catch (error) {
      console.error('Registration failed:', error.response?.data?.message || error.message);
      setError(error.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-900">
      <div className="w-96 bg-gray-800 shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-center text-white mb-4">Register</h2>
  
        {error && <div className="text-red-400 text-center mb-4">{error}</div>}
  
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-gray-300">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border border-gray-600 bg-gray-700 text-white rounded focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
  
          <div>
            <label htmlFor="email" className="block text-gray-300">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-600 bg-gray-700 text-white rounded focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
  
          <div>
            <label htmlFor="password" className="block text-gray-300">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-600 bg-gray-700 text-white rounded focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
  
          <button 
            type="submit" 
            className="w-full p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition duration-200"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
  
};

export default Register;
