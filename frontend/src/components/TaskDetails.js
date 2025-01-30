import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const TaskDetails = () => {
  const { taskId } = useParams();
  const [task, setTask] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const compareIds = (id1, id2) => id1?.toString() === id2?.toString();

  // Fetch task details and user data
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('authToken');
      try {
        // Fetch task data
        const taskResponse = await axios.get(`http://localhost:5000/projects/gettask/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Fetch current user data
        const userResponse = await axios.get('http://localhost:5000/auth/user', {
          headers: { Authorization: `Bearer ${token}` },
        });

        setTask(taskResponse.data);
        setCurrentUser(userResponse.data.user);
        setLoading(false);
      } catch (error) {
        setError(error.response?.data?.message || 'An error occurred');
        setLoading(false);
      }
    };

    fetchData();
  }, [taskId]);

  const handleCollaboratorComplete = async () => {
    try {
      // POST request (correct)
      await axios.post(
        `http://localhost:5000/projects/${taskId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
  
      // GET request (FIX THIS)
      const response = await axios.get(
        `http://localhost:5000/projects/gettask/${taskId}`, // Add full backend URL
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      
      setTask(response.data);
    } catch (error) {
      console.error('Error marking task:', error);
    }
  };

  const handleFinalCompletion = async () => {
    try {
      await axios.post(
        `http://localhost:5000/projects/${taskId}/final-complete`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      // Refresh task data after update
      const response = await axios.get(`http://localhost:5000/projects/gettask/${taskId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      setTask(response.data);
    } catch (error) {
      console.error('Error marking task as completed:', error);
      alert(error.response?.data?.message || 'Error updating task status');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!task) return <div>Task not found</div>;

  // Check if current user is creator
  const isCreator = compareIds(currentUser?._id, task.createdBy._id);
  const isCollaborator = task.collaborators.some(collab => 
    compareIds(collab._id, currentUser?._id)
  );


  // Check if all collaborators have completed
  const allCollaboratorsCompleted = task.collaborators.every(collab => 
    task.collaboratorCompletion.some(
      comp => compareIds(comp.userId._id, collab._id) && comp.completed
    )
  );

  return (
    <div className="bg-gray-900 min-h-screen text-white p-6">
      <h2 className="text-2xl font-bold mb-4">{task.title}</h2>
      <p className="text-gray-400 mb-2">
        Status: {task.status === 'completed' ? (
          <span className="text-green-500">Completed</span>
        ) : (
          <span>In Progress</span>
        )}
      </p>
      <p className="text-gray-400 mb-4">Deadline: {new Date(task.deadline).toLocaleDateString()}</p>

      {isCreator && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Collaborator Progress</h3>
          <div className="space-y-2">
          {task.collaborators.map((collaborator) => {
  const completion = task.collaboratorCompletion.find(
    comp => compareIds(comp.userId._id, collaborator._id)
  );
              
              return (
                <div key={collaborator._id} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                  <span>{collaborator.username}</span>
                  <span className={completion?.completed ? 'text-green-500' : 'text-red-500'}>
                    {completion?.completed ? 'Completed' : 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
          
          {task.status === 'completed' ? (
            <div className="mt-4 text-green-500">
              Task successfully completed!
            </div>
          ) : allCollaboratorsCompleted ? (
            <div className="mt-4">
              <p className="text-green-500">All collaborators have completed their work!</p>
              <button 
                className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                onClick={handleFinalCompletion}
              >
                Mark Task as Completed
              </button>
            </div>
          ) : (
            <div className="mt-4 text-yellow-500">
              Waiting for all collaborators to complete their parts
            </div>
          )}
        </div>
      )}

      {isCollaborator && !isCreator && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Your Completion Status</h3>
          <button
            onClick={handleCollaboratorComplete}
            disabled={task.collaboratorCompletion.some(
              comp => compareIds(comp.userId._id, currentUser._id)
            )}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:bg-gray-600"
          >
            {task.collaboratorCompletion.some(
              comp => compareIds(comp.userId, currentUser._id)
            ) ? 'Marked as Completed' : 'Mark My Part as Completed'}
          </button>
        </div>
      )}

      {/* ... existing unauthorized message ... */}
    </div>
  );
};

export default TaskDetails;