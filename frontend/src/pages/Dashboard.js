import { useState, useEffect } from 'react';
import axios from 'axios';
import { Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Bar, Radar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  useEffect(() => {
    const getUserData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/auth/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserData(response.data.user);
        
        // Fetch stats after user data is loaded
        const statsResponse = await axios.get('http://localhost:5000/auth/user-stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(statsResponse.data);
        
      } catch (error) {
        setError('Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      getUserData();
    } else {
      setLoading(false);
    }
  }, [token]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (error) {
    return <p>{error}</p>;
  }

  // Skill Radar Chart Data
  const skillData = {
    labels: stats?.skillDistribution ? Object.keys(stats.skillDistribution) : [],
    datasets: [
      {
        label: 'Skills',
        data: stats?.skillDistribution ? Object.values(stats.skillDistribution) : [],
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: '#6366f1',
      },
    ],
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="max-w-6xl mx-auto mt-10 p-6">
        <h2 className="text-3xl font-semibold text-center mb-6">Dashboard</h2>

        {/* User Info Section */}
        {userData && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
            <h3 className="text-xl font-semibold mb-4">User Info</h3>
            <p className="text-gray-400 mb-2">Email: <span className="text-blue-500">{userData.email}</span></p>
            <p className="text-gray-400">User ID: <span className="text-blue-500">{userData._id}</span></p>
          </div>
        )}

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-gray-400">Task Completion</h3>
            <p className="text-2xl">{stats?.completedTasks || 0}/{stats?.totalTasks || 0}</p>
            <p className="text-green-500">{stats?.onTimeRate || 0}% On Time</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-gray-400">Average Rating</h3>
            <p className="text-2xl">{stats?.averageRating?.toFixed(1) || 'N/A'}/5</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-gray-400">Active Streak</h3>
            <p className="text-2xl">{userData?.streakDays || 0} Days 🔥</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="bg-gray-800 p-4 rounded-lg mb-8">
          <h3 className="text-xl font-semibold mb-4">Skill Distribution</h3>
          <Radar 
            data={skillData} 
            options={{ 
              maintainAspectRatio: false,
              scales: {
                r: {
                  grid: { color: 'rgba(255, 255, 255, 0.1)' },
                  pointLabels: { color: 'white' },
                  ticks: { display: false, color: 'white' }
                }
              }
            }}
            height={400}
          />
        </div>

        {/* Recent Activity Section */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
          <table className="w-full">
            <tbody>
              {stats?.recentActivity?.length > 0 ? (
                stats.recentActivity.map((activity, index) => (
                  <tr key={index} className="border-b border-gray-700">
                    <td className="py-2 text-gray-400">{activity.date}</td>
                    <td className="py-2">{activity.description}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="py-2 text-center text-gray-400">
                    No recent activity
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;