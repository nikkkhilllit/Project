import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const token = localStorage.getItem('authToken');

  const handleLogout = () => {
    // Remove token from localStorage and redirect to login
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  };

  return (
    <nav className="bg-blue-900 text-white p-4">
      <div className="container mx-auto flex items-center">
        {token ? (
          // Logged In: Three columns – logo at left, nav links centered, logout at right
          <>
            {/* Left Column: Logo */}
            <div className="flex-1">
              <Link to="/">
                        <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                          DevSpace
                        </h1>
                      </Link>
            </div>
            {/* Center Column: Navigation Links */}
            <div className="flex-1 flex justify-center">
              <ul className="flex space-x-6">
                <li>
                  <Link to="/" className="hover:text-gray-200">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="hover:text-gray-200">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/browse" className="hover:text-gray-200">
                    Browse
                  </Link>
                </li>
                <li>
                  <Link to="/myprojects" className="hover:text-gray-200">
                    Projects
                  </Link>
                </li>
                <li>
                  <Link to="/create-project" className="hover:text-gray-200">
                    Create
                  </Link>
                </li>
              </ul>
            </div>
            {/* Right Column: Logout Button */}
            <div className="flex-1 flex justify-end">
              <button onClick={handleLogout} className="hover:text-gray-200">
                Logout
              </button>
            </div>
          </>
        ) : (
          // Logged Out: Empty left column, logo at center, and Login/Register at right
          <>
            {/* Left Column: Empty */}
            <div className="flex-1"></div>
            {/* Center Column: Logo */}
            <div className="flex-1 flex justify-center">
              <Link to="/">
                        <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                          DevSpace
                        </h1>
                      </Link>
            </div>
            {/* Right Column: Login and Register */}
            <div className="flex-1 flex justify-end">
              <ul className="flex space-x-8">
                <li>
                  <Link to="/login" className="hover:text-gray-200">
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-gray-200">
                    Register
                  </Link>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
