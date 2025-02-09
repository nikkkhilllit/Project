import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Initialize useNavigate

  // Handle form submission
  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent the page from refreshing on form submit
    try {
      const response = await axios.post('http://localhost:5000/auth/login', { email, password });
      console.log(response.data); // You can store the JWT in localStorage or state
      localStorage.setItem('authToken', response.data.token); // Storing JWT under 'authToken'
      alert('Login successful!');
      
      // Redirect to protected route after successful login (e.g., Dashboard)
      navigate('/dashboard');  // Replace '/dashboard' with your actual protected route if needed
    } catch (error) {
      console.error('Login failed:', error.response?.data?.message || error.message);
      setError(error.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-900">
      <div className="w-full max-w-md bg-gray-800 shadow-lg rounded-lg p-8">
        <h2 className="text-3xl font-bold text-center text-white mb-6">Login</h2>
        
        {error && <div className="text-red-400 text-center mb-4">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full p-3 border border-gray-600 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
  
          <div>
            <label htmlFor="password" className="block text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full p-3 border border-gray-600 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
  
          <button 
            type="submit" 
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition duration-200"
          >
            Login
          </button>
        </form>

        <div className="text-center mt-6">
          <span className="text-gray-300 text-sm">
            Don't have an account?
          </span>
          <Link 
            to="/register" 
            className="ml-2 text-blue-500 text-sm hover:underline"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
