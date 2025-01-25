import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Projects</h1>
      {projects.length === 0 ? (
        <p>No projects found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project._id} className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-bold mb-2">{project.title}</h2>
              <p className="text-gray-700 mb-2">
                <span className="font-medium">Description:</span> {project.description}
              </p>
              <p className="text-gray-700 mb-2">
                <span className="font-medium">Budget:</span> ${project.budget}
              </p>
              <p className="text-gray-700 mb-2">
                <span className="font-medium">Deadline:</span>{' '}
                {new Date(project.deadline).toLocaleDateString()}
              </p>
              <a
                href={`/projects/${project._id}`}
                className="text-blue-600 hover:underline font-medium"
              >
                View Details
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProjects;
