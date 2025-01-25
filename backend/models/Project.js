const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  role: { type: String, required: true },
  skills: [String],
  deadline: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
});

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  tasks: [taskSchema],
  budget: { type: Number, required: true },
  deadline: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Project', projectSchema);
