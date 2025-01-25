import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const ProjectDetails = () => {
  const { id } = useParams(); // Get project ID from URL
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      const token = localStorage.getItem('authToken'); // Get token from localStorage
      console.log('JWT Token:', token); // Debugging purpose

      try {
        const response = await axios.get(`http://localhost:5000/projects/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProject(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching project:', error.response?.data || error.message);
        setError(error.response?.data?.message || 'An error occurred while fetching the project.');
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

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
              <p>
                <span className="font-medium">Skills:</span> {task.skills.join(', ')}
              </p>
              <p>
                <span className="font-medium">Deadline:</span>{' '}
                {new Date(task.deadline).toLocaleDateString()}
              </p>
              <p>
                <span className="font-medium">Status:</span> {task.status}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
