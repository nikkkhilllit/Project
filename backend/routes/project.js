const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const authenticateToken = require('../middleware/authenticateToken'); // Assuming you have the middleware

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


  

module.exports = router;
