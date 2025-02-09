import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const ProjectCreate = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [tasks, setTasks] = useState([{ title: '', role: '', skills: '', deadline: '' }]);
  const navigate = useNavigate();

  const handleTaskChange = (index, field, value) => {
    const updatedTasks = [...tasks];
    updatedTasks[index][field] = value;
    setTasks(updatedTasks);
  };

  const addTask = () => {
    setTasks([...tasks, { title: '', role: '', skills: '', deadline: '' }]);
  };

  const removeTask = (index) => {
    const updatedTasks = tasks.filter((_, i) => i !== index);
    setTasks(updatedTasks);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('authToken'); // Get token from localStorage
    console.log("JWT Token:", token);
  
    const formattedTasks = tasks.map(task => ({
      ...task,
      skills: task.skills.split(',').map(skill => skill.trim())
    }));

    try {
      const response = await axios.post(
        'http://localhost:5000/projects/create',
        { title, description, budget, deadline, tasks: formattedTasks },
        { headers: { Authorization: `Bearer ${token}` } }  // Send token in header
      );
      alert('Project created successfully!');
      navigate(`/projects/${response.data.project._id}`);
      console.log('Navigating to project with ID:', response.data.project._id);
      console.log(response.data);
    } catch (error) {
      console.error('Error creating project:', error.response?.data || error.message);
      alert('Error creating project');
    }
  };

  return (
    <div className="w-screen min-h-screen bg-gray-800">
      <Navbar />
      <div className="w-full p-6">
        <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-semibold text-white mb-6 text-center">
            Create a New Project
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6 px-4 md:px-20">
            {/* Project Title */}
            <div className="mb-4">
              <label className="block text-gray-300 font-medium mb-2">Project Title</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Enter the project title"
              />
            </div>
            
            {/* Description */}
            <div className="mb-4">
              <label className="block text-gray-300 font-medium mb-2">Description</label>
              <textarea
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Enter the project description"
              ></textarea>
            </div>
      
            {/* Budget */}
            <div className="mb-4">
              <label className="block text-gray-300 font-medium mb-2">Budget</label>
              <input
                type="number"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                required
                placeholder="Enter the project budget"
              />
            </div>
      
            {/* Deadline */}
            <div className="mb-4">
              <label className="block text-gray-300 font-medium mb-2">Deadline</label>
              <input
                type="date"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </div>
      
            {/* Tasks Section */}
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white mb-4">Tasks</h2>
              {tasks.map((task, index) => (
                <div key={index} className="p-4 mb-4 bg-gray-700 border border-gray-600 rounded-lg">
                  <label className="block text-gray-300 font-medium mb-2">Task Title</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={task.title}
                    onChange={(e) => handleTaskChange(index, 'title', e.target.value)}
                    required
                    placeholder="Enter task title"
                  />
      
                  <label className="block text-gray-300 font-medium mb-2 mt-4">Role</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={task.role}
                    onChange={(e) => handleTaskChange(index, 'role', e.target.value)}
                    required
                    placeholder="Enter task role"
                  />
      
                  <label className="block text-gray-300 font-medium mb-2 mt-4">Skills (comma-separated)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={task.skills}
                    onChange={(e) => handleTaskChange(index, 'skills', e.target.value)}
                    placeholder="Enter task skills"
                  />
      
                  <label className="block text-gray-300 font-medium mb-2 mt-4">Deadline</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={task.deadline}
                    onChange={(e) => handleTaskChange(index, 'deadline', e.target.value)}
                    required
                  />
      
                  <button
                    type="button"
                    className="text-red-500 mt-4 hover:text-red-700 transition duration-200"
                    onClick={() => removeTask(index)}
                  >
                    Remove Task
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
                onClick={addTask}
              >
                Add Task
              </button>
            </div>
      
            <button
              type="submit"
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-200"
            >
              Create Project
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectCreate;
