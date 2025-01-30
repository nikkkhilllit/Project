import { useState, useEffect } from 'react';
import axios from 'axios';
import { Navigate } from 'react-router-dom'; // Import Navigate for redirection
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const token = localStorage.getItem('authToken'); // Get the token from localStorage

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');  // Redirect to login page
  };

  // Conditional rendering moved to the return statement to avoid hooks being conditionally called
  useEffect(() => {
    const getUserData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/auth/user', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserData(response.data.user); // Store the user data from the server response
      } catch (error) {
        setError('Error fetching user data');
      } finally {
        setLoading(false); // Set loading to false after the request is complete
      }
    };

    // Proceed only if the token exists
    if (token) {
      getUserData(); // Fetch user data
    } else {
      setLoading(false); // Set loading to false if no token is found
    }
  }, [token]); // Dependency on token

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!token) {
    return <Navigate to="/login" />; // Redirect to login if no token exists
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto mt-10 p-6">
        <h2 className="text-3xl font-semibold text-center mb-6">Dashboard</h2>
  
        {userData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* User Info Section */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">User Info</h3>
              <p className="text-gray-400 mb-2">Email: <span className="text-blue-500">{userData.email}</span></p>
              <p className="text-gray-400 mb-4">User ID: <span className="text-blue-500">{userData._id}</span></p>
            </div>
  
            {/* Projects Section */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-md flex flex-col">
              <h3 className="text-xl font-semibold mb-4">Project Details</h3>
              <Link 
                to={`/myprojects`} 
                className="text-blue-500 underline hover:text-blue-700 transition duration-200"
              >
                View My Projects
              </Link>

              <Link 
                to={`/create-project`} 
                className="text-blue-500 underline hover:text-blue-700 transition duration-200"
              >
                Create a New Project
              </Link>
            </div>
  
            {/* Action Section */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Actions</h3>
              <button 
                onClick={handleLogout} 
                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded transition duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400">
            <p>No user data available.</p>
          </div>
        )}
      </div>
    </div>
  );
  
  
};

export default Dashboard;
