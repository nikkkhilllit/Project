import { useState, useEffect } from 'react';
import axios from 'axios';
import { Navigate } from 'react-router-dom'; // Import Navigate for redirection
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { Link } from 'react-router-dom';

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
    <div>
      <h2>Dashboard</h2>
      {userData ? (
        <div className='flex flex-col'>
          <p>Email: {userData.email}</p> {/* Assuming user data has 'email' */}
          <p>User ID: {userData._id}</p> {/* Assuming user data has '_id' */}
          <Link to={`/myprojects`} className="text-blue-500 underline">
  My Projects
</Link>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <p>No user data available.</p>
      )}
    </div>
  );
};

export default Dashboard;
