import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
    console.log("JWT Token:", token); // Log token
  
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
      console.error('Error creating project:', error.response?.data || error.message);  // Log error details
      alert('Error creating project');
    }
  };
  

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Create a New Project</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Project Title</label>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Description</label>
          <textarea
            className="w-full px-3 py-2 border rounded"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          ></textarea>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Budget</label>
          <input
            type="number"
            className="w-full px-3 py-2 border rounded"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Deadline</label>
          <input
            type="date"
            className="w-full px-3 py-2 border rounded"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-bold mb-2">Tasks</h2>
          {tasks.map((task, index) => (
            <div key={index} className="mb-4 border p-3 rounded">
              <label className="block text-gray-700 font-medium mb-2">Task Title</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={task.title}
                onChange={(e) => handleTaskChange(index, 'title', e.target.value)}
                required
              />
              <label className="block text-gray-700 font-medium mb-2 mt-2">Role</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={task.role}
                onChange={(e) => handleTaskChange(index, 'role', e.target.value)}
                required
              />
              <label className="block text-gray-700 font-medium mb-2 mt-2">Skills (comma-separated)</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={task.skills}
                onChange={(e) => handleTaskChange(index, 'skills', e.target.value)}
              />
              <label className="block text-gray-700 font-medium mb-2 mt-2">Deadline</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded"
                value={task.deadline}
                onChange={(e) => handleTaskChange(index, 'deadline', e.target.value)}
                required
              />
              <button
                type="button"
                className="text-red-500 mt-2"
                onClick={() => removeTask(index)}
              >
                Remove Task
              </button>
            </div>
          ))}
          <button
            type="button"
            className="bg-blue-500 text-white px-3 py-2 rounded"
            onClick={addTask}
          >
            Add Task
          </button>
        </div>

        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Create Project
        </button>
      </form>
    </div>
  );
};

export default ProjectCreate;
