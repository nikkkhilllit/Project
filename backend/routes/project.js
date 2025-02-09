const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const authenticateToken = require('../middleware/authenticateToken'); // Assuming you have the middleware
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User'); // Adjust the path if necessary
const mongoose = require('mongoose');


// Create a new project
router.post('/create', authenticateToken, async (req, res) => {
  const { title, description, tasks, budget, deadline } = req.body;

  try {
    const newProject = new Project({
      title,
      description,
      tasks,
      budget,
      deadline,
      createdBy: req.user.id,
    });

    await newProject.save();
    res.status(201).json({ message: 'Project created successfully', project: newProject });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new task to an existing project
// Add a new task to an existing project
router.post('/:id/tasks', authenticateToken, async (req, res) => {
  const { id } = req.params; // Use 'id' to get the project ID
  const { title, role, skills, deadline, status } = req.body; // Fields as per taskSchema

  try {
    const project = await Project.findById(id); // Use 'id' from the route params
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Create a new task
    const newTask = {
      taskId: uuidv4(),
      title,
      role,
      skills,
      deadline,
      status,
      codeFiles: [],  // No code files when task is created
    };

    // Push the new task into the project's tasks array
    project.tasks.push(newTask);

    // Save the project with the new task
    await project.save();

    res.status(201).json({ message: 'Task added successfully', task: newTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/popular', async (req, res) => {
  try {
    const projects = await Project.aggregate([
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ["$likes", []] } }
        }
      },
      { $sort: { likesCount: -1 } }
    ]);
    res.status(200).json({ projects });
  } catch (error) {
    console.error('Error fetching popular projects:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.get('/myprojects', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // `req.user` should be populated by auth middleware
    const userProjects = await Project.find({ createdBy: userId }); // Use `createdBy` as per schema

    res.status(200).json({ success: true, projects: userProjects });
  } catch (error) {
    console.error('Error fetching user projects:', error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});
  
// Get a project by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
      const project = await Project.findById(req.params.id);
  
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
  
      res.status(200).json(project);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  router.get('/:id/collabo', authenticateToken, async (req, res) => {
    try {
      const project = await Project.findById(req.params.id)
        .populate('createdBy')
        .populate('tasks.collaborators'); // Populate collaborators for each task
  
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
  
      res.status(200).json(project);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  router.get('/:taskId', async (req, res) => {
    const { taskId } = req.params;
  
    try {
      const project = await Project.findOne({ 'tasks.taskId': taskId });
      if (!project) return res.status(404).json({ error: 'Task not found' });
  
      const task = project.tasks.find(task => task.taskId === taskId);
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  router.get('/collaborators/:taskId', async (req, res) => {
    const { taskId } = req.params;
  
    try {
      // Find the project that contains the task with the given taskId
      const project = await Project.findOne({ 'tasks.taskId': taskId }).populate('tasks.collaborators');
      
      if (!project) {
        return res.status(404).json({ error: 'Task not found' });
      }
  
      // Find the task from the project using taskId
      const task = project.tasks.find(task => task.taskId === taskId);
      
      // Send the collaborators associated with the task
      res.json(task.collaborators);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  
  router.post('/:taskId/codefiles', authenticateToken, async (req, res) => {
    const { taskId } = req.params;
    const { fileName } = req.body;
  
    try {
      const project = await Project.findOne({ 'tasks.taskId': taskId });
      if (!project) return res.status(404).json({ message: 'Task not found' });
  
      const task = project.tasks.find((task) => task.taskId === taskId);
      if (!task) return res.status(404).json({ message: 'Task not found' });
  
      const newFile = {
        fileId: uuidv4(),
        fileName,
        content: '',
      };
      task.codeFiles.push(newFile);
  
      await project.save();
      res.status(201).json({ message: 'Code file added successfully', file: newFile });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  router.get('/:taskId/codefiles', authenticateToken, async (req, res) => {
    const { taskId } = req.params;
  
    try {
      const project = await Project.findOne({ 'tasks.taskId': taskId });
      if (!project) return res.status(404).json({ message: 'Task not found' });
  
      const task = project.tasks.find((task) => task.taskId === taskId);
      res.status(200).json(task.codeFiles);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  router.put('/:taskId/codefiles/:fileId', authenticateToken, async (req, res) => {
    const { taskId, fileId } = req.params;
    const { content } = req.body;
  
    try {
      // Find the project containing the task
      const project = await Project.findOne({ 'tasks.taskId': taskId });
      if (!project) return res.status(404).json({ message: 'Task not found' });
  
      // Find the task inside the project
      const task = project.tasks.find((task) => task.taskId === taskId);
      if (!task) return res.status(404).json({ message: 'Task not found' });
  
      // Find the specific file inside the task
      const file = task.codeFiles.find((file) => file.fileId === fileId);
      if (!file) return res.status(404).json({ message: 'File not found' });
  
      // Update the file content
      file.content = content;
  
      // Save the updated project with the updated file content
      await project.save();
  
      res.status(200).json({ message: 'File updated successfully', file });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  router.delete('/:taskId/codefiles/:fileId', authenticateToken, async (req, res) => {
    const { taskId, fileId } = req.params;
  
    try {
      // Find the project containing the task
      const project = await Project.findOne({ 'tasks.taskId': taskId });
      if (!project) {
        return res.status(404).json({ message: 'Task not found' });
      }
  
      // Find the task within the project
      const task = project.tasks.find((task) => task.taskId === taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
  
      // Find the index of the file to delete
      const fileIndex = task.codeFiles.findIndex((file) => file.fileId === fileId);
      if (fileIndex === -1) {
        return res.status(404).json({ message: 'File not found' });
      }
  
      // Remove the file from the codeFiles array
      const removedFile = task.codeFiles.splice(fileIndex, 1);
  
      // Save the updated project
      await project.save();
  
      // Respond with a success message and details of the deleted file (optional)
      res.status(200).json({
        message: 'File deleted successfully',
        deletedFile: removedFile[0], // Returns the deleted file
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  
  router.put('/:taskId/codefiles/:fileId/rename', authenticateToken, async (req, res) => {
    const { taskId, fileId } = req.params;
    const { newName } = req.body;
  
    try {
      // Find the project containing the task
      const project = await Project.findOne({ 'tasks.taskId': taskId });
      if (!project) return res.status(404).json({ message: 'Task not found' });
  
      // Find the task within the project
      const task = project.tasks.find((task) => task.taskId === taskId);
      if (!task) return res.status(404).json({ message: 'Task not found' });
  
      // Find the file to update
      const file = task.codeFiles.find((file) => file.fileId === fileId);
      if (!file) return res.status(404).json({ message: 'File not found' });
  
      // Update the file name
      file.fileName = newName; // Ensure you use 'fileName'
  
      // Save the updated project
      await project.save();
  
      // Respond with the updated file
      res.status(200).json({
        message: 'File name updated successfully',
        file: {
          fileId: file.fileId,
          fileName: file.fileName, // Updated field name
          content: file.content,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  router.post('/:taskId/apply', authenticateToken, async (req, res) => {
    const { taskId } = req.params;
    const userId = req.user.id;  // Get the user from the authentication middleware
  
    try {
      // Find the task by taskId
      const project = await Project.findOne({ 'tasks.taskId': taskId });
      if (!project) return res.status(404).json({ message: 'Project not found' });
  
      const task = project.tasks.find((task) => task.taskId === taskId);
      if (!task) return res.status(404).json({ message: 'Task not found' });
  
      // Check if the user has already applied
      if (task.applicants.includes(userId)) {
        return res.status(400).json({ message: 'You have already applied for this task' });
      }
  
      // Add user to applicants
      task.applicants.push(userId);
  
      // Save the updated project
      await project.save();
  
      res.status(200).json({ message: 'Applied for the task successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  router.get('/:taskId/applicants', authenticateToken, async (req, res) => {
    const { taskId } = req.params;
  
    try {
      // Find the task by taskId
      const project = await Project.findOne({ 'tasks.taskId': taskId }).populate('tasks.applicants');
      if (!project) return res.status(404).json({ message: 'Project not found' });
  
      const task = project.tasks.find((task) => task.taskId === taskId);
      if (!task) return res.status(404).json({ message: 'Task not found' });
  
      res.status(200).json({ applicants: task.applicants });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  router.post('/:taskId/collaborators/:userId', authenticateToken, async (req, res) => {
    const { taskId, userId } = req.params;
  
    try {
      // Find the project containing the task
      const project = await Project.findOne({ 'tasks.taskId': taskId });
      if (!project) return res.status(404).json({ message: 'Project not found' });
  
      const task = project.tasks.find((task) => task.taskId === taskId);
      if (!task) return res.status(404).json({ message: 'Task not found' });
  
      // Check if the user is an applicant
      if (!task.applicants.includes(userId)) {
        return res.status(400).json({ message: 'User must apply first' });
      }
  
      // Remove the user from applicants and add to collaborators
      task.applicants = task.applicants.filter((applicant) => applicant.toString() !== userId);
      task.collaborators.push(userId);
  
      // Save the updated project
      await project.save();
  
      res.status(200).json({ message: 'User added as collaborator' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  router.get('/get/:id', authenticateToken, async (req, res) => {
    try {
      const project = await Project.findById(req.params.id).populate('createdBy');
  
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
  
      res.status(200).json(project); // The project object will now have `createdBy` populated
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  router.get('/projects/:id/tasks/:taskId', authenticateToken, async (req, res) => {
    try {
      // Use req.params.id for project ID instead of req.params.projectId
      const project = await Project.findOne({ _id: req.params.id }).populate('tasks.collaborators createdBy');
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
  
      const task = project.tasks.find((task) => task.taskId === req.params.taskId);
  
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
  
      const userId = req.user.id; // Assuming JWT contains user info
  
      const isCreator = task.createdBy._id.toString() === userId;
      const isCollaborator = task.collaborators.some((collaborator) => collaborator._id.toString() === userId);
  
      res.status(200).json({
        task,
        isCreator,
        isCollaborator,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
router.get('/task/:taskId', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findOne({ 'tasks.taskId': req.params.taskId })
      .populate('createdBy', '_id') // Only get the _id of creator
      .populate('tasks.collaborators', '_id'); // Only get _id of collaborators

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
  
router.post('/rate', authenticateToken, async (req, res) => {
  try {
    const { taskId, collaboratorId, rating } = req.body;

    // Update the collaborator's ratings
    await User.findByIdAndUpdate(collaboratorId, {
      $push: {
        ratings: {
          ratedBy: req.user._id,
          score: rating,
        },
      },
    });

    res.json({ message: 'Rating submitted!' });
  } catch (error) {
    res.status(500).json({ error: 'Rating failed' });
  }
});

// backend/routes/projects.js
// backend/routes/projects.js
router.get('/:taskId/collaborators', authenticateToken, async (req, res) => {
  const { taskId } = req.params;

  try {
    // Find the project containing the task
    const project = await Project.findOne({ 'tasks.taskId': taskId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Find the task within the project
    const task = project.tasks.find((t) => t.taskId === taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Fetch collaborator details
    const collaborators = await User.find({
      _id: { $in: task.collaborators },
    }).select('-password'); // Exclude sensitive data

    res.status(200).json({ collaborators });
  } catch (error) {
    console.error('Error fetching collaborators:', error); // Log the full error
    res.status(500).json({ 
      message: 'Server error',
      error: error.message, // Include error details in the response
    });
  }
});

// backend/routes/projects.js
router.post('/:taskId/complete', authenticateToken, async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user.id; // Get the user ID from the token

  try {
    // Find the project containing the task
    const project = await Project.findOne({ 'tasks.taskId': taskId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Find the task within the project
    const task = project.tasks.find((t) => t.taskId === taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if the user is a collaborator
    if (!task.collaborators.includes(userId)) {
      return res.status(403).json({ message: 'You are not a collaborator for this task' });
    }

    // Flag to determine if this is a new completion update
    let isNewCompletion = false;

    // Update the collaborator's completion status
    const collaboratorCompletion = task.collaboratorCompletion.find(
      (entry) => entry.userId.toString() === userId
    );

    if (collaboratorCompletion) {
      // Only update if the task wasn’t already marked complete for this user
      if (!collaboratorCompletion.completed) {
        collaboratorCompletion.completed = true;
        collaboratorCompletion.completedOn = new Date();
        isNewCompletion = true;
      }
    } else {
      // First time completion for this collaborator
      task.collaboratorCompletion.push({
        userId,
        completed: true,
        completedOn: new Date(),
      });
      isNewCompletion = true;
    }

    // Check if all collaborators have completed their part
    const allCollaboratorsCompleted = task.collaborators.every((collaboratorId) => {
      return task.collaboratorCompletion.some(
        (entry) => entry.userId.toString() === collaboratorId.toString() && entry.completed
      );
    });

    // If all collaborators have completed, mark the task as completed
    if (allCollaboratorsCompleted) {
      task.status = 'completed';
      task.completedOn = new Date();
    }

    // Save the updated project
    await project.save();

    // If this is the first time the user is marking this task complete,
    // update the collaborator's user schema to increment completedTasks.
    if (isNewCompletion) {
      await User.findByIdAndUpdate(userId, { $inc: { completedTasks: 1 } });
    }

    res.status(200).json({ message: 'Task completion status updated', task });
  } catch (error) {
    console.error('Error updating task completion:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// backend/routes/projects.js
router.get('/taskcomplete/:taskId', authenticateToken, async (req, res) => {
  const { taskId } = req.params;

  try {
    // Find the project containing the task
    const project = await Project.findOne({ 'tasks.taskId': taskId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Find the task within the project
    const task = project.tasks.find((t) => t.taskId === taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json(task);
  } catch (error) {
    console.error('Error fetching task details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:taskId/collaborators/:userId', authenticateToken, async (req, res) => {
  const { taskId, userId } = req.params;

  try {
    const project = await Project.findOne({ 'tasks.taskId': taskId });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const task = project.tasks.find((t) => t.taskId === taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Validate userId and add to collaborators
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const userIdObj = new mongoose.Types.ObjectId(userId);
    task.collaborators.push(userIdObj); // Add as ObjectId
    await project.save();

    res.status(200).json({ message: 'Collaborator added' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// backend/routes/projects.js
router.get('/gettask/:taskId', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findOne({ 'tasks.taskId': req.params.taskId })
      .populate('createdBy', '_id username')
      .populate('tasks.collaborators', '_id username')
      .populate('tasks.collaboratorCompletion.userId', '_id username');

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const task = project.tasks.find(t => t.taskId === req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Transform the task object for better frontend consumption
    const transformedTask = {
      ...task.toObject(),
      createdBy: project.createdBy,
      collaborators: task.collaborators.map(c => ({
        _id: c._id,
        username: c.username
      })),
      collaboratorCompletion: task.collaboratorCompletion.map(comp => ({
        completed: comp.completed,
        userId: {
          _id: comp.userId._id,
          username: comp.userId.username
        }
      }))
    };

    res.json(transformedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// backend/routes/projects.js
router.post('/:taskId/final-complete', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findOne({ 'tasks.taskId': req.params.taskId });
    const task = project.tasks.find(t => t.taskId === req.params.taskId);
    
    if (project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the creator can finalize the task' });
    }

    task.status = 'completed';
    task.completedOn = new Date();
    await project.save();

    res.json({ message: 'Task marked as completed', task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    // Use req.user.id or fall back to req.user._id
    const userIdRaw = req.user.id || req.user._id;
    console.log("Using user ID:", userIdRaw);
    if (!userIdRaw) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Ensure the userId is valid; if it’s a valid ObjectId string, Mongoose will cast it
    if (!mongoose.Types.ObjectId.isValid(userIdRaw)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    // Use the 'new' keyword when creating an ObjectId instance
    const userId = new mongoose.Types.ObjectId(userIdRaw);

    // Validate the project ID
    const projectId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }

    // Retrieve the project by its ID
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Retrieve the user document
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user has already liked this project by checking the user's likedProjects array.
    // Convert each liked project ID to a string for reliable comparison.
    if (user.likedProjects && user.likedProjects.some(p => p.toString() === projectId)) {
      return res.status(400).json({ message: 'You have already liked this project' });
    }

    // Update the project: add the user's ID to the likes array using $addToSet.
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $addToSet: { likes: userId } },
      { new: true }
    );

    // Update the user: add the project ID to likedProjects using $addToSet.
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { likedProjects: projectId } }
    );

    res.status(200).json({ message: 'Project liked successfully', project: updatedProject });
  } catch (error) {
    console.error('Error liking project:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/search', authenticateToken, async (req, res) => {
  try {
    const { query } = req.body; // Expecting a JSON body like { "query": "hello" }
    if (!query) {
      return res.status(400).json({ message: 'Query parameter is required in the body.' });
    }

    // Create a case-insensitive regular expression.
    const regex = new RegExp(query, 'i');

    // Search for projects where the project title, any task title, or any task skill matches the regex.
    const projects = await Project.find({
      $or: [
        { title: regex },
        { 'tasks.title': regex },
        { 'tasks.skills': regex }
      ]
    });

    res.status(200).json({ projects });
  } catch (error) {
    console.error('Error searching projects:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
