import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import Navbar from './Navbar';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { FaUsers, FaListAlt, FaStar, FaInfoCircle, FaHeart } from 'react-icons/fa';

Chart.register(...registerables);

const ProjectDetails = () => {
  const { id } = useParams(); // Get project ID from URL
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTask, setNewTask] = useState({
    title: '',
    role: '',
    skills: [],
    deadline: ''
  });
  const [currentUser, setCurrentUser] = useState(null); // Store current user details
  const [isCollaboratorOrCreator, setIsCollaboratorOrCreator] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);

  const token = localStorage.getItem('authToken');

  // Fetch project details
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/projects/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProject(response.data);
        setLoading(false);
      } catch (error) {
        setError(
          error.response?.data?.message ||
            'An error occurred while fetching the project.'
        );
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, token]);

  // Fetch current user data and check collaborator/creator status
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get('http://localhost:5000/auth/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUser(response.data.user);

        if (project) {
          const { createdBy, tasks = [] } = project;
          const isCreator = createdBy && createdBy.toString() === response.data.user._id;
          // Check if the current user is a collaborator on any task.
          const isCollaborator = tasks.some((task) => {
            const collaborators = task.collaborators || [];
            return collaborators.some(
              (collaborator) =>
                collaborator &&
                collaborator.toString() === response.data.user._id
            );
          });
          setIsCollaboratorOrCreator(isCreator || isCollaborator);
          setIsCreator(isCreator);
          setIsCollaborator(isCollaborator);
        }
      } catch (error) {
        console.error(error);
        setError('Failed to fetch user details.');
      }
    };

    if (project) {
      fetchCurrentUser();
    }
  }, [id, project, token]);

  const handleTaskChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prevTask) => ({
      ...prevTask,
      [name]:
        name === 'skills'
          ? value.split(',').map((skill) => skill.trim())
          : value,
    }));
  };

  const handleAddTask = async () => {
    try {
      const response = await axios.post(
        `http://localhost:5000/projects/${id}/tasks`,
        {
          ...newTask,
          codeFiles: [] // For now, keep codeFiles empty
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProject((prevProject) => ({
        ...prevProject,
        tasks: [...prevProject.tasks, response.data.task],
      }));
      setNewTask({ title: '', role: '', skills: '', deadline: '' });
    } catch (error) {
      console.error(error);
      setError(
        error.response?.data?.message || 'Failed to add new task'
      );
    }
  };

  const handleApplyForTask = async (taskId) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/projects/${taskId}/apply`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message);
      setProject((prevProject) => ({
        ...prevProject,
        tasks: prevProject.tasks.map((task) =>
          task.taskId === taskId
            ? { ...task, applicants: [...task.applicants, token] }
            : task
        ),
      }));
    } catch (error) {
      console.error(error);
      setError(
        error.response?.data?.message || 'Failed to apply for the task'
      );
    }
  };

  // Handle "Like" button click
  const handleLike = async () => {
    try {
      const response = await axios.post(
        `http://localhost:5000/projects/${id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProject(response.data.project);
    } catch (error) {
      console.error('Error liking project:', error.response?.data || error.message);
      alert(
        error.response?.data?.message || 'Error liking project'
      );
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  // Determine if the current user has already liked this project.
  const alreadyLiked =
    currentUser &&
    (project.likes || []).some(
      (like) => like && like.toString() === currentUser._id
    );

  // Prepare data for the Bar chart.
  const userSkills = project?.skills || [];
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
      <Navbar />
      <div className="p-6 max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-xl">
        {/* Project Title and Like Section */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold mb-4 text-white">{project.title}</h1>
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleLike}
              disabled={alreadyLiked}
              className="flex items-center justify-center focus:outline-none"
            >
              {/* Using FaHeart with cool hover and animation effects */}
              <FaHeart
                size={28}
                className={`transition transform hover:scale-110 ${
                  alreadyLiked
                    ? 'text-blue-500'
                    : 'text-gray-300'
                }`}
              />
            </button>
            <span className="text-white text-sm">
              Likes: {project.likes ? project.likes.length : 0}
            </span>
          </div>
        </div>
        <p className="text-gray-300 mb-4">
          <span className="font-medium">Description:</span> {project.description}
        </p>
        <p className="text-gray-300 mb-4">
          <span className="font-medium">Budget:</span> ₹ {project.budget}
        </p>
        <p className="text-gray-300 mb-4">
          <span className="font-medium">Deadline:</span>{' '}
          {new Date(project.deadline).toLocaleDateString()}
        </p>
        <h2 className="text-2xl font-bold mb-4 text-white">Tasks</h2>
        {project.tasks && project.tasks.length === 0 ? (
          <p className="text-gray-400">No tasks assigned to this project.</p>
        ) : (
          <div className="flex flex-col space-y-4">
            {project.tasks &&
              project.tasks.map((task, index) => {
                // Check if the current user is a collaborator for this task.
                const isTaskCollaborator = (task.collaborators || []).some(
                  (collab) =>
                    collab && collab.toString() === currentUser?._id
                );
                return (
                  <div
                    key={index}
                    className="border p-4 rounded-xl bg-gray-700 transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  >
                    {/* Two-Column Layout for Task Card */}
                    <div className="flex justify-between items-start">
                      {/* Left Column: Task Details */}
                      <div className="flex-1">
                        <p className="text-white">
                          <span className="font-medium">Task Title:</span> {task.title}
                        </p>
                        <p className="text-gray-300">
                          <span className="font-medium">Role:</span> {task.role}
                        </p>
                        <p className="text-gray-300">
                          <span className="font-medium">Skills:</span>{' '}
                          {Array.isArray(task.skills)
                            ? task.skills.join(', ')
                            : task.skills}
                        </p>
                        <p className="text-gray-300">
                          <span className="font-medium">Deadline:</span>{' '}
                          {new Date(task.deadline).toLocaleDateString()}
                        </p>
                        <p className="text-gray-300">
                          <span className="font-medium">Status:</span> {task.status}
                        </p>
                        {(isCreator || isTaskCollaborator) && (
                          <Link
                            to={`/collab/${task.taskId}`}
                            className="flex items-center text-blue-500 transform transition-all duration-300 hover:scale-100 hover:text-white space-x-2 mt-2"
                            title="Collaboration Workspace"
                          >
                            <FaUsers size={36} />
                            <span className="text-sm">Collaborate</span>
                          </Link>
                        )}
                      </div>
                      {/* Right Column: Vertical Icons */}
                      {(isCreator || isTaskCollaborator) && (
                        <div className="flex flex-col items-center space-y-2 ml-4">
                          {isCreator && (
                            <Link
                              to={`/applicants/${task.taskId}`}
                              className="text-blue-500 transform transition-all duration-300 hover:scale-110 hover:text-white"
                              title="View Applicants"
                            >
                              <FaListAlt size={24} />
                            </Link>
                          )}
                          {(isCreator || isTaskCollaborator) && (
                            <Link
                              to={`/rate/${task.taskId}`}
                              className="text-blue-500 transform transition-all duration-300 hover:scale-110 hover:text-white"
                              title="Rate Collaborators"
                            >
                              <FaStar size={24} />
                            </Link>
                          )}
                          {(isCreator || isTaskCollaborator) && (
                            <Link
                              to={`/status/${task.taskId}`}
                              className="text-blue-500 transform transition-all duration-300 hover:scale-110 hover:text-white"
                              title="Status"
                            >
                              <FaInfoCircle size={24} />
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                    {/* If the current user is neither creator nor collaborator, show the Apply button */}
                    {!isCreator && !isTaskCollaborator && (
                      <div className="mt-4">
                        <button
                          onClick={() => handleApplyForTask(task.taskId)}
                          className="bg-green-500 text-white px-4 py-2 rounded transform transition-all duration-300 hover:scale-105"
                        >
                          Apply for Task
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {isCreator && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4 text-white">Add New Task</h3>
            <div className="space-y-2">
              <input
                type="text"
                name="title"
                value={newTask.title}
                onChange={handleTaskChange}
                placeholder="Task Title"
                className="w-full px-3 py-2 border rounded bg-gray-600 text-white"
              />
              <input
                type="text"
                name="role"
                value={newTask.role}
                onChange={handleTaskChange}
                placeholder="Role"
                className="w-full px-3 py-2 border rounded bg-gray-600 text-white"
              />
              <input
                type="text"
                name="skills"
                value={newTask.skills}
                onChange={handleTaskChange}
                placeholder="Skills (comma-separated)"
                className="w-full px-3 py-2 border rounded bg-gray-600 text-white"
              />
              <input
                type="date"
                name="deadline"
                value={newTask.deadline}
                onChange={handleTaskChange}
                className="w-full px-3 py-2 border rounded bg-gray-600 text-white"
              />
              <button
                onClick={handleAddTask}
                className="bg-blue-500 text-white px-4 py-2 rounded transform transition-all duration-300 hover:scale-105"
              >
                Add Task
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;
