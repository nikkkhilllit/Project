// src/components/Register.js
import React, { useState } from 'react';
import axios from 'axios';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Handle registration
  const handleRegister = async (e) => {
    e.preventDefault(); // Prevent default form behavior
    try {
      const response = await axios.post('http://localhost:5000/auth/register', { email, password });
      alert(response.data.message);
    } catch (error) {
      console.error('Registration failed:', error.response?.data?.message || error.message);
      setError(error.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-10">
      <h2 className="text-2xl font-semibold text-center mb-4">Register</h2>
      {error && <div className="text-red-500 text-center mb-4">{error}</div>}
      <form onSubmit={handleRegister} className="bg-white shadow-md rounded p-6">
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block text-gray-700">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded">Register</button>
      </form>
    </div>
  );
};

export default Register;
