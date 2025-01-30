import React, { useState } from 'react';
import axios from 'axios';

const TaskDetails = ({ task }) => {
  const [isCompleted, setIsCompleted] = useState(false);

  const handleCompleteTask = async () => {
    try {
      await axios.post(
        `http://localhost:5000/projects/${task.taskId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      setIsCompleted(true);
      alert('Your part of the task has been marked as completed!');
    } catch (error) {
      console.error('Error marking task as completed:', error);
    }
  };

  return (
    <div>
      <h2>{task.title}</h2>
      <p>Status: {task.status}</p>
      {task.status === 'pending' && (
        <button onClick={handleCompleteTask} disabled={isCompleted}>
          {isCompleted ? 'Completed' : 'Mark as Completed'}
        </button>
      )}
    </div>
  );
};

export default TaskDetails;