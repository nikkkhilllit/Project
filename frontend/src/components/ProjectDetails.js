import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

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
  const [currentUser, setCurrentUser] = useState(null); // State to store current user
  const [isCollaboratorOrCreator, setIsCollaboratorOrCreator] = useState(false);

  // Fetch project details
  useEffect(() => {
    const fetchProject = async () => {
      const token = localStorage.getItem('authToken'); // Get token from localStorage

      try {
        const response = await axios.get(`http://localhost:5000/projects/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProject(response.data);
        setLoading(false);
      } catch (error) {
        setError(error.response?.data?.message || 'An error occurred while fetching the project.');
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem('authToken'); // Get token from localStorage
    
      try {
        const response = await axios.get('http://localhost:5000/auth/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUser(response.data.user);
    
        // Check if project exists and has collaborators
        if (project) {
          console.log("Project Data:", project);  // Debugging line to check project data
          const { createdBy, collaborators } = project;
    
          // Log collaborators to verify data
          console.log("Collaborators:", collaborators);  // Debugging line for collaborators array
    
          // Check if the current user is the creator or a collaborator
          setIsCollaboratorOrCreator(
            createdBy?.toString() === response.data.user._id || // Creator check
            (Array.isArray(collaborators) && collaborators.some(collaborator => collaborator.toString() === response.data.user._id)) // Collaborator check
          );
        }
      } catch (error) {
        console.error(error);
        setError('Failed to fetch user details.');
      }
    };
    

    if (project) {
      fetchCurrentUser();
    }
  }, [id, project]);

  const handleTaskChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prevTask) => ({
      ...prevTask,
      [name]: name === 'skills' ? value.split(',').map(skill => skill.trim()) : value,
    }));
  };

  const handleAddTask = async () => {
    const token = localStorage.getItem('authToken'); // Get token from localStorage
  
    try {
      const response = await axios.post(
        `http://localhost:5000/projects/${id}/tasks`,
        {
          ...newTask,
          codeFiles: [] // Keep it empty for now
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProject((prevProject) => ({
        ...prevProject,
        tasks: [...prevProject.tasks, response.data.task],
      }));
      setNewTask({ title: '', role: '', skills: '', deadline: '' });
    } catch (error) {
      console.error(error); // Log the error for debugging
      setError(error.response?.data?.message || 'Failed to add new task');
    }
  };

  const handleApplyForTask = async (taskId) => {
    const token = localStorage.getItem('authToken'); // Get token from localStorage

    try {
      const response = await axios.post(
        `http://localhost:5000/projects/${taskId}/apply`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message); // Show success message
      setProject((prevProject) => ({
        ...prevProject,
        tasks: prevProject.tasks.map((task) =>
          task.taskId === taskId
            ? { ...task, applicants: [...task.applicants, token] }
            : task
        ),
      }));
    } catch (error) {
      console.error(error); // Log the error for debugging
      setError(error.response?.data?.message || 'Failed to apply for the task');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded shadow">
      <h1 className="text-3xl font-bold mb-4">{project.title}</h1>
      <p className="text-gray-700 mb-4">
        <span className="font-medium">Description:</span> {project.description}
      </p>
      <p className="text-gray-700 mb-4">
        <span className="font-medium">Budget:</span> ${project.budget}
      </p>
      <p className="text-gray-700 mb-4">
        <span className="font-medium">Deadline:</span>{' '}
        {new Date(project.deadline).toLocaleDateString()}
      </p>
      <h2 className="text-2xl font-bold mb-4">Tasks</h2>
      {project.tasks.length === 0 ? (
        <p>No tasks assigned to this project.</p>
      ) : (
        <div className="space-y-4">
  {project.tasks.map((task, index) => (
    <div key={index} className="border p-3 rounded">
      <p>
        <span className="font-medium">Task Title:</span> {task.title}
      </p>
      <p>
        <span className="font-medium">Role:</span> {task.role}
      </p>
      <p><span className="font-medium">Skills:</span> {Array.isArray(task.skills) ? task.skills.join(', ') : task.skills}</p>

      <p>
        <span className="font-medium">Deadline:</span>{' '}
        {new Date(task.deadline).toLocaleDateString()}
      </p>
      <p>
        <span className="font-medium">Status:</span> {task.status}
      </p>

      {/* Apply Button */}
      <div className="flex items-center">
        {/* Conditionally render Apply button if user is not a collaborator or creator */}
        {!isCollaboratorOrCreator && (
          <button
            // onClick={() => handleApplyForTask(task.taskId)}
            className="bg-green-500 text-white px-4 py-2 rounded mt-2"
          >
            <Link to={`/collab/${task.taskId}`}>
            Join Task
            </Link>
          </button>
        )}
        
        {/* Show "Hi" message if the user is a collaborator or creator */}
        {isCollaboratorOrCreator && (
          <Link to={`/collab/${task.taskId}`} className="text-blue-500 underline">
            Go to Collaboration Workspace
          </Link>
        )}
      </div>
    </div>
  ))}
</div>

      )}
{isCollaboratorOrCreator && (
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-4">Add New Task</h3>
        <div className="space-y-2">
          <input
            type="text"
            name="title"
            value={newTask.title}
            onChange={handleTaskChange}
            placeholder="Task Title"
            className="w-full px-3 py-2 border rounded"
          />
          <input
            type="text"
            name="role"
            value={newTask.role}
            onChange={handleTaskChange}
            placeholder="Role"
            className="w-full px-3 py-2 border rounded"
          />
          <input
            type="text"
            name="skills"
            value={newTask.skills}
            onChange={handleTaskChange}
            placeholder="Skills (comma-separated)"
            className="w-full px-3 py-2 border rounded"
          />
          <input
            type="date"
            name="deadline"
            value={newTask.deadline}
            onChange={handleTaskChange}
            className="w-full px-3 py-2 border rounded"
          />
          <button
            onClick={handleAddTask}
            className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
          >

            Add Task
          </button>
        </div>
      </div>
      )}
    </div>
  );
};

export default ProjectDetails;
