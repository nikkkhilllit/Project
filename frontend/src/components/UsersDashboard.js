import { useState, useEffect } from 'react';
import axios from 'axios';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Navbar from './Navbar';
import { Radar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { FaEnvelope } from 'react-icons/fa'; // Import mail icon

Chart.register(...registerables);

const UsersDashboard = () => {
  // Get the user id from the URL parameter.
  const { id } = useParams();
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState(null); // e.g., averageRating
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

        // Fetch data for the user whose dashboard is being viewed using the id param.
        const statsResponse = await axios.get(`http://localhost:5000/auth/user-stats/${id}`, { headers });
        setStats(statsResponse.data);

        const userResponse = await axios.get(`http://localhost:5000/auth/user/${id}`, { headers });
        setUserData(userResponse.data.user);

        const completedResponse = await axios.get(`http://localhost:5000/auth/completed-task-count/${id}`, { headers });
        setCompletedTaskCount(completedResponse.data.completedTasksCount);

        const collabResponse = await axios.get(`http://localhost:5000/auth/collaborator-task-count/${id}`, { headers });
        setCollaboratorTaskCount(collabResponse.data.collaboratorTaskCount);

        const collabOnTimeResponse = await axios.get(`http://localhost:5000/auth/collaborator-on-time-rate/${id}`, { headers });
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
  }, [token, id]);

  // Function to add a new skill.
  const handleAddSkill = async (e) => {
    e.preventDefault();

    if (!newSkillName.trim() || !newSkillPercentage.trim()) {
      setSkillError('Both skill name and proficiency percentage are required.');
      return;
    }

    const percentage = Number(newSkillPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      setSkillError('Please enter a valid percentage (0 to 100).');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Assuming the endpoint allows adding a skill for any user by ID.
      // You might need to adjust the endpoint if only self-editing is allowed.
      const response = await axios.post(
        `http://localhost:5000/auth/add-skill/${id}`,
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

  // If the user has no skills, default to an empty array.
  const userSkills = userData?.skills || [];

  // Prepare data for the Bar chart.
  const skillData = {
    labels: userSkills.map((skill) => skill.name),
    datasets: [
      {
        label: 'Skill Proficiency (%)',
        data: userSkills.map((skill) => skill.percentage),
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: '#6366f1',
        borderWidth: 1,
      },
    ],
  };

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
      {/* Custom CSS for horizontal scroll */}
      <style>{`
        .my-horiz-scroll {
          overflow-x: auto;
          overflow-y: hidden;
          height: 400px; 
          scrollbar-gutter: stable;
          background-color: #252527;
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
        <h2 className="text-3xl font-semibold text-center mb-6">Profile</h2>

        {/* User Info Section */}
        {userData && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
            <h3 className="text-xl font-semibold mb-4">User Info</h3>
            <div className="flex justify-between items-center mb-2">
              <p className="text-gray-400">
                User Name: <span className="text-blue-500">{userData.username}</span>
              </p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-gray-400">
                Email: <span className="text-blue-500">{userData.email}</span>
              </p>
              {/* Mail box icon on the right. Clicking it opens the default mail client */}
              <a href={`mailto:${userData.email}`} className="text-blue-500 hover:text-blue-400">
                <FaEnvelope size={24} />
              </a>
            </div>
          </div>
        )}

        {/* Statistics Grid */}
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
              <p className="mb-4">No skills available.</p>
            </div>
          ) : (
            <>
              <div className="my-horiz-scroll" style={{ width: '100%' }}>
                <div style={{ minWidth: `${Math.max(userSkills.length, 6) * 200}px`, height: '100%' }}>
                  <Bar data={skillData} options={skillChartOptions} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersDashboard;
