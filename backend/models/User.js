const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // Update skills to be an array of objects with a name and a percentage
  skills: [{
    name: { type: String, required: true },
    percentage: { type: Number, required: true, min: 0, max: 100 }
  }],
  ratings: [ 
    {
      ratedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      score:   { type: Number, min: 1, max: 5 },
      feedback: String,
    },
  ],
  completedTasks: { type: Number, default: 0 },
  overdueTasks:   { type: Number, default: 0 },
  streakDays:     { type: Number, default: 0 }, 
  lastTaskDate:   { type: Date }, 
  projects:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  likedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }]
});

const User = mongoose.model('User', userSchema);
module.exports = User;
