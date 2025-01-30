import { useState } from 'react';
import axios from 'axios';

const Rating = ({ taskId, collaboratorId, collaboratorUsername }) => {
  const [rating, setRating] = useState(0);

  const submitRating = async () => {
    try {
      await axios.post(
        'http://localhost:5000/projects/rate',
        {
          taskId,
          collaboratorId,
          rating,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }
      );
      alert('Rating submitted!');
    } catch (error) {
      console.error('Rating failed:', error);
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg mt-4">
      <h3 className="text-gray-400 mb-2">Rate {collaboratorUsername}</h3>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-500'}`}
          >
            ★
          </button>
        ))}
      </div>
      <button
        onClick={submitRating}
        className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
      >
        Submit
      </button>
    </div>
  );
};

export default Rating;