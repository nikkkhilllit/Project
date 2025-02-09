import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('authToken'); // Get token from localStorage
      try {
        // Adjust the URL if needed.
        const response = await axios.get('http://localhost:5000/auth/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'An error occurred while fetching users.');
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Helper function to render stars based on the average rating.
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    const stars = [];

    // Render full (yellow) stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={`full-${i}`} className="text-yellow-500">
          &#9733;
        </span>
      );
    }
    // Render empty (gray) stars
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-gray-500">
          &#9733;
        </span>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Top Freelancers</h1>
        {users.length === 0 ? (
          <p className="text-xl text-center text-gray-400">No users found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {users.map((user) => {
              // Calculate average rating if ratings are available.
              const averageRating =
                user.ratings && user.ratings.length > 0
                  ? user.ratings.reduce((sum, rating) => sum + rating.score, 0) / user.ratings.length
                  : 0;

              // Calculate task statistics using the user fields.
              const completedTasks = user.completedTasks || 0;
              const overdueTasks = user.overdueTasks || 0;
              const totalTasks = completedTasks + overdueTasks;
              // If there are no tasks, we show 0 instead of "N/A"
              const onTimeRate =
                totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(0) : "0";
              const activeStreak = user.streakDays || 0;

              return (
                <div
                  key={user._id}
                  className="bg-gray-800 p-6 rounded-xl shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:bg-gray-700"
                >
                  <h2 className="text-2xl font-semibold mb-3">{user.username}</h2>
                  <p className="text-gray-300 mb-2">
                    <span className="font-medium text-gray-400">Email:</span> {user.email}
                  </p>
                  
                  {/* Display task stats, rating, and active streak */}
                  <div className="mt-2">
                    <p className="text-gray-300 mb-1">
                      <span className="font-medium text-gray-400">Task Completion:</span> {completedTasks}/{totalTasks}
                    </p>
                    <p className="text-gray-300 mb-1">
                      <span className="font-medium text-gray-400">On Time Rate:</span> {onTimeRate}% On Time
                    </p>
                    <div className="mt-2">
                      {user.ratings && user.ratings.length > 0 ? (
                        <>
                          <span className="font-medium text-gray-400">Ratings: </span>
                          {renderStars(averageRating)}
                          <span className="text-gray-300 ml-2">({user.ratings.length})</span>
                        </>
                      ) : (
                        <>
                          <span className="font-medium text-gray-400">Ratings: </span>
                          {renderStars(averageRating)}
                        </>
                      )}
                    </div>
                    <p className="text-gray-300">
                      <span className="font-medium text-gray-400">Active Streak:</span> {activeStreak} Days 🔥
                    </p>
                  </div>
                  {/* New: Dashboard Button */}
                  <div className="mt-4">
                    <Link
                      to={`/usersdashboard/${user._id}`}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-all duration-300"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllUsers;
