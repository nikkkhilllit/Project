// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  skills: [String], // Add skills tracking
  ratings: [ // Track ratings from collaborators
    {
      ratedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      score: { type: Number, min: 1, max: 5 },
      feedback: String,
    },
  ],
  completedTasks: { type: Number, default: 0 },
  overdueTasks: { type: Number, default: 0 },
  streakDays: { type: Number, default: 0 }, // For gamification
  lastTaskDate: { type: Date }, // Track streaks
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }]
});

const User = mongoose.model('User', userSchema);
module.exports = User;
