const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');  // Assuming your User model is in a separate file
const router = express.Router();

// Middleware to authenticate the user based on JWT
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access Denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid Token' });
    req.user = user;
    next();
  });
};

// Helper to calculate average rating
const calculateAverageRating = (ratings) => {
  if (!ratings?.length) return 0;
  return ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;
};

// Helper to get recent activity
const getRecentActivity = (projects) => {
  return projects.flatMap(project => 
    project.tasks?.map(task => ({
      date: task.updatedAt.toISOString().split('T')[0],
      description: `Updated task "${task.title}" in ${project.title}`
    })) || []
  ).slice(-5).reverse(); // Last 5 activities
};

// Registration route
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// User data route (protected)
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// backend/routes/auth.js (modified)
router.get('/user-stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find user with populated projects and tasks
    const user = await User.findById(userId)
      .populate({
        path: 'projects',
        populate: { path: 'tasks' }
      });

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Initialize counters
    let completedTasks = 0;
    let totalTasks = 0;
    let onTimeTasks = 0;

    // Calculate task metrics
    user.projects.forEach(project => {
      if (project.tasks && project.tasks.length > 0) {
        project.tasks.forEach(task => {
          totalTasks++;
          if (task.status === 'completed') {
            completedTasks++;
            if (task.completedOn && task.deadline && task.completedOn <= task.deadline) {
              onTimeTasks++;
            }
          }
        });
      }
    });

    // Calculate on-time rate
    const onTimeRate = completedTasks > 0 
      ? Math.round((onTimeTasks / completedTasks) * 100)
      : 0;

    // Calculate skill distribution
    const skillCounts = {};
    user.projects.forEach(project => {
      if (project.tasks && project.tasks.length > 0) {
        project.tasks.forEach(task => {
          if (task.skills && task.skills.length > 0) {
            task.skills.forEach(skill => {
              skillCounts[skill] = (skillCounts[skill] || 0) + 1;
            });
          }
        });
      }
    });

    // Send response
    res.json({
      completedTasks,
      totalTasks,
      onTimeRate,
      skillDistribution: skillCounts,
      averageRating: calculateAverageRating(user.ratings),
      recentActivity: getRecentActivity(user.projects),
      streakDays: user.streakDays
    });

  } catch (error) {
    console.error('Error in /user-stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
module.exports = router;
