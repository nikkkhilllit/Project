import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Initialize useNavigate

  // Handle form submission
  // Login.js
const handleLogin = async (e) => {
    e.preventDefault(); // Prevent the page from refreshing on form submit
    try {
      const response = await axios.post('http://localhost:5000/auth/login', { email, password });
      console.log(response.data); // You can store the JWT in localStorage or state
      localStorage.setItem('authToken', response.data.token); // Storing JWT under 'authToken'
      alert('Login successful!');
      
      // Redirect to protected route after successful login (e.g., Dashboard)
      navigate('/dashboard');  // You can replace '/dashboard' with the actual protected route
    } catch (error) {
      console.error('Login failed:', error.response?.data?.message || error.message);
      setError(error.response?.data?.message || 'Something went wrong');
    }
  };
  

  return (
    <div className="max-w-sm mx-auto mt-10">
      <h2 className="text-2xl font-semibold text-center mb-4">Login</h2>
      {error && <div className="text-red-500 text-center mb-4">{error}</div>}
      <form onSubmit={handleLogin} className="bg-white shadow-md rounded p-6">
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
        <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded">Login</button>
      </form>
    </div>
  );
};

export default Login;
