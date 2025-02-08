import { useState, useEffect } from 'react';
import axios from 'axios';
import { Navigate, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Radar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { Bar } from 'react-chartjs-2';

Chart.register(...registerables);

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState(null); // Data from /auth/user-stats (e.g., averageRating)
  const [completedTaskCount, setCompletedTaskCount] = useState(0);
  const [collaboratorTaskCount, setCollaboratorTaskCount] = useState(0);
  const [collaboratorOnTimeRate, setCollaboratorOnTimeRate] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // For adding a new skill, we capture both the name and percentage.
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillPercentage, setNewSkillPercentage] = useState('');
  const [skillError, setSkillError] = useState('');
  const [showSkillForm, setShowSkillForm] = useState(false);
  
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // Get stats (e.g., averageRating) from /auth/user-stats
        const statsResponse = await axios.get('http://localhost:5000/auth/user-stats', { headers });
        setStats(statsResponse.data);

        // Get user details from /auth/user
        const userResponse = await axios.get('http://localhost:5000/auth/user', { headers });
        setUserData(userResponse.data.user);

        // Get completed task count from /auth/completed-task-count
        const completedResponse = await axios.get('http://localhost:5000/auth/completed-task-count', { headers });
        setCompletedTaskCount(completedResponse.data.completedTasksCount);

        // Get collaborator task count from /auth/collaborator-task-count
        const collabResponse = await axios.get('http://localhost:5000/auth/collaborator-task-count', { headers });
        setCollaboratorTaskCount(collabResponse.data.collaboratorTaskCount);

        // Get on-time rate for tasks where the user is a collaborator
        const collabOnTimeResponse = await axios.get('http://localhost:5000/auth/collaborator-on-time-rate', { headers });
        setCollaboratorOnTimeRate(collabOnTimeResponse.data.onTimeRate);

        console.log('Stats response:', statsResponse.data);
        console.log('User response:', userResponse.data);
        console.log('Completed task count:', completedResponse.data);
        console.log('Collaborator task count:', collabResponse.data);
        console.log('Collaborator on time rate:', collabOnTimeResponse.data);
      } catch (error) {
        console.error('Error details:', error.response?.data || error.message);
        setError('Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [token]);

  // Function to add a new skill
  const handleAddSkill = async (e) => {
    e.preventDefault();

    // Both fields are required.
    if (!newSkillName.trim() || !newSkillPercentage.trim()) {
      setSkillError('Both skill name and proficiency percentage are required.');
      return;
    }

    // Validate that the percentage is a number between 0 and 100.
    const percentage = Number(newSkillPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      setSkillError('Please enter a valid percentage (0 to 100).');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Call the backend endpoint to add a new skill.
      // The backend should be updated to accept a skill object: { name, percentage }
      const response = await axios.post(
        'http://localhost:5000/auth/add-skill',
        { skill: { name: newSkillName.trim(), percentage } },
        { headers }
      );

      // Update userData with the new skills array from the response.
      setUserData((prev) => ({ ...prev, skills: response.data.user.skills }));
      setNewSkillName('');
      setNewSkillPercentage('');
      setSkillError('');
      setShowSkillForm(false);
    } catch (error) {
      console.error('Error adding skill:', error.response?.data || error.message);
      setSkillError('Error adding skill. Please try again.');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!token) return <Navigate to="/login" />;
  if (error) return <p>{error}</p>;

  // With the new schema, userData.skills is an array of objects { name, percentage }
  const userSkills = userData?.skills || [];

  // Prepare data for the Bar chart based on the provided percentage for each skill.
  const skillData = {
    labels: userSkills.map(skill => skill.name),
    datasets: [
      {
        label: 'Skill Proficiency (%)',
        data: userSkills.map(skill => skill.percentage),
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: '#6366f1',
        borderWidth: 1,
      },
    ],
  };

  // Chart options remain the same.
  const skillChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value) => `${value}%`,
          color: 'white',
        },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
      },
      x: {
        ticks: { color: 'white' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
      },
    },
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      {/* Custom CSS in this file */}
      <style>{`
        .my-horiz-scroll {
          overflow-x: auto;
          overflow-y: hidden;
          height: 400px; 
          scrollbar-gutter: stable;
          background-color: #252527; /* Track background so it's visible */
        }
        .my-horiz-scroll::-webkit-scrollbar {
          height: 10px;
        }
        .my-horiz-scroll::-webkit-scrollbar-track {
          background: #2d2d2d;
          border-radius: 5px;
        }
        .my-horiz-scroll::-webkit-scrollbar-thumb {
          background: #4a90e2;
          border-radius: 5px;
          border: 2px solid #2d2d2d;
        }
        .my-horiz-scroll::-webkit-scrollbar-thumb:hover {
          background: #357ABD;
        }
        .my-horiz-scroll {
          scrollbar-width: thin;
          scrollbar-color: #4a90e2 #2d2d2d;
        }
      `}</style>
      <Navbar />
      <div className="max-w-6xl mx-auto mt-10 p-6">
        <h2 className="text-3xl font-semibold text-center mb-6">Dashboard</h2>

        {/* User Info Section */}
        {userData && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
            <h3 className="text-xl font-semibold mb-4">User Info</h3>
            <p className="text-gray-400 mb-2">
              Email: <span className="text-blue-500">{userData.email}</span>
            </p>
            <p className="text-gray-400">
              User ID: <span className="text-blue-500">{userData._id}</span>
            </p>
          </div>
        )}

        {/* Statistics Grid (Task Completion, Average Rating, Active Streak) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-gray-400">Task Completion</h3>
            <p className="text-2xl">
              {completedTaskCount}/{collaboratorTaskCount || 0}
            </p>
            <p className="text-green-500">{collaboratorOnTimeRate}% On Time</p>
            {collaboratorTaskCount === 0 && <p className="text-sm text-gray-400">No tasks found.</p>}
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

        {/* Skill Distribution Section */}
        <div className="bg-gray-800 p-4 rounded-lg mb-8" style={{ width: '100%' }}>
          <h3 className="text-xl font-semibold mb-4">Skill Distribution</h3>
          {userSkills.length === 0 ? (
            <div>
              <p className="mb-4">No skills available. Please add your skills:</p>
              <form onSubmit={handleAddSkill} className="flex flex-col gap-2">
                <input
                  type="text"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="Enter skill name"
                  className="p-2 rounded text-black"
                />
                <input
                  type="number"
                  value={newSkillPercentage}
                  onChange={(e) => setNewSkillPercentage(e.target.value)}
                  placeholder="Enter proficiency (%)"
                  className="p-2 rounded text-black"
                />
                {skillError && <p className="text-red-500">{skillError}</p>}
                <button type="submit" className="bg-blue-500 p-2 rounded">
                  Add Skill
                </button>
              </form>
            </div>
          ) : (
            <>
              <div
                className="my-horiz-scroll"
                style={{ width: '100%' }}
              >
                <div style={{ minWidth: `${Math.max(userSkills.length, 6) * 200}px`, height: '100%' }}>
                  <Bar data={skillData} options={skillChartOptions} />
                </div>
              </div>
              <button
                onClick={() => setShowSkillForm(!showSkillForm)}
                className="bg-blue-500 p-2 rounded mt-4"
              >
                {showSkillForm ? 'Cancel' : 'Add More Skills'}
              </button>
              {showSkillForm && (
                <div>
                  <form onSubmit={handleAddSkill} className="flex flex-col gap-2 mt-4">
                    <input
                      type="text"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      placeholder="Enter skill name"
                      className="p-2 rounded text-black"
                    />
                    <input
                      type="number"
                      value={newSkillPercentage}
                      onChange={(e) => setNewSkillPercentage(e.target.value)}
                      placeholder="Enter proficiency (%)"
                      className="p-2 rounded text-black"
                    />
                    {skillError && <p className="text-red-500">{skillError}</p>}
                    <button type="submit" className="bg-blue-500 p-2 rounded">
                      Submit Skill
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>

        {/* Logout Button */}
        <div className="text-center mt-6">
          <button onClick={handleLogout} className="bg-red-600 px-4 py-2 rounded-lg">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
