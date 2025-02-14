import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import { Link } from 'react-router-dom';

const MyProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      const token = localStorage.getItem('authToken'); // Get token from localStorage

      try {
        const response = await axios.get('http://localhost:5000/projects/myprojects', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProjects(response.data.projects);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching projects:', error.response?.data || error.message);
        setError(error.response?.data?.message || 'An error occurred while fetching projects.');
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white">
  <Navbar />
  <div className="p-6 max-w-6xl mx-auto">
    <h1 className="text-4xl font-bold text-center mb-8 text-white">My Projects</h1>
    
    {projects.length === 0 ? (
      <p className="text-xl text-center text-gray-400">No projects found<Link to='/create-project' className='text-xl text-center pl-2 text-blue-600'>Create it.</Link></p>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project) => (
          <div 
            key={project._id} 
            className="bg-gray-800 p-6 rounded-xl shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:bg-gray-700"
          >
            <h2 className="text-2xl font-semibold text-white mb-3">{project.title}</h2>
            <p className="text-gray-300 mb-2">
              <span className="font-medium text-gray-400">Description:</span> {project.description}
            </p>
            <p className="text-gray-300 mb-2">
              <span className="font-medium text-gray-400">Budget:</span> ${project.budget}
            </p>
            <p className="text-gray-300 mb-2">
              <span className="font-medium text-gray-400">Deadline:</span> {new Date(project.deadline).toLocaleDateString()}
            </p>
            <a
              href={`/projects/${project._id}`}
              className="text-blue-500 hover:text-white font-medium mt-4 inline-block"
            >
              View Details
            </a>
          </div>
        ))}
      </div>
    )}
  </div>
</div>



  );
};

export default MyProjects;
