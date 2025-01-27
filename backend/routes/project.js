const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const authenticateToken = require('../middleware/authenticateToken'); // Assuming you have the middleware
const { v4: uuidv4 } = require('uuid');

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
  
  
  
module.exports = router;
