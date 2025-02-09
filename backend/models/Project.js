const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const taskSchema = new mongoose.Schema({
  taskId: { type: String, required: true, unique: true, default: uuidv4 },
  title: { type: String, required: true },
  role: { type: String, required: true },
  skills: [String],
  deadline: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  codeFiles: [
    {
      fileId: { type: String, required: true, default: uuidv4 },
      fileName: { type: String, required: true },
      content: { type: String, default: '' },
    },
  ],
  applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  collaboratorCompletion: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      completed: { type: Boolean, default: false },
      completedOn: { type: Date },
    },
  ],
  completedOn: { type: Date },
});

// Project Schema with "likes" field added
const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  tasks: [taskSchema],
  budget: { type: Number, required: true },
  deadline: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  // New field: an array of User ObjectIds that liked the project
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

const Project = mongoose.model('Project', projectSchema);
module.exports = Project; 
