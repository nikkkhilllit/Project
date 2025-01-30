import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import Rating from './Rating';

const RatingPage = () => {
  const { taskId } = useParams();
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCollaborators = async () => {
      const token = localStorage.getItem('authToken');
      try {
        const response = await axios.get(`http://localhost:5000/projects/${taskId}/collaborators`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCollaborators(response.data.collaborators);
        setLoading(false);
      } catch (error) {
        setError(error.response?.data?.message || 'An error occurred while fetching collaborators.');
        setLoading(false);
      }
    };

    fetchCollaborators();
  }, [taskId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white p-6">
      <h1 className="text-3xl font-bold mb-4">Rate Collaborators</h1>
      {collaborators.map((collaborator) => (
        <div key={collaborator._id} className="mb-4 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold">{collaborator.username}</h2>
          <Rating
            taskId={taskId}
            collaboratorId={collaborator._id}
            collaboratorUsername={collaborator.username}
          />
        </div>
      ))}
    </div>
  );
};

export default RatingPage;