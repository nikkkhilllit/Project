import React from 'react';

const Navbar = () => {

    const handleLogout = () => {
        // Remove token from localStorage
        localStorage.removeItem('authToken');
      
        // Redirect to login page
        window.location.href = '/login'; // Or use React Router's <Navigate />
      };

  return (
    <nav className="bg-blue-500 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-2xl">FreelanceHub</div>
        <ul className="flex space-x-6">
          <li><a href="/" className="hover:text-gray-200">Home</a></li>
          <li><a href="/login" className="hover:text-gray-200">Login</a></li>
          <li><a href="/register" className="hover:text-gray-200">Register</a></li>
        </ul>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
