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
  const [newSkill, setNewSkill] = useState('');
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

    if (!newSkill.trim()) {
      setSkillError('Skill cannot be empty.');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Call the backend endpoint to add a new skill
      const response = await axios.post(
        'http://localhost:5000/auth/add-skill',
        { skill: newSkill.trim() },
        { headers }
      );

      // Update userData with the new skills array from the response
      setUserData((prev) => ({ ...prev, skills: response.data.user.skills }));
      setNewSkill('');
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

  // Compute a skill distribution from the user's skills array.
  const userSkills = userData?.skills || [];
  const computedSkillDistribution = userSkills.reduce((acc, skill) => {
    acc[skill] = (acc[skill] || 0) + 1;
    return acc;
  }, {});

  // Prepare data for the Radar/Bar chart based on the computed skill distribution.
  const skillData = {
    labels: Object.keys(computedSkillDistribution),
    datasets: [
      {
        label: 'Your Skills',
        data: Object.values(computedSkillDistribution),
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
            {/* Use the collaborator on-time rate from our new route */}
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
        <div className="bg-gray-800 p-4 rounded-lg mb-8" style={{ height: '400px', width: '100%' }}>
          <h3 className="text-xl font-semibold mb-4">Skill Distribution</h3>
          {userSkills.length === 0 ? (
            <div>
              <p className="mb-4">No skills available. Please add your skills:</p>
              <form onSubmit={handleAddSkill} className="flex flex-col gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Enter a skill"
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
              <Bar
                data={skillData}
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  scales: {
                    x: {
                      ticks: { color: 'white' },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    },
                    y: {
                      ticks: { color: 'white' },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    },
                  },
                }}
              />
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
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Enter a new skill"
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
