const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');  
const mongoose = require('mongoose');
const router = express.Router();

// Middleware to authenticate the user based on JWT
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access Denied' });

  // Set maxAge to '7d' to allow tokens that are at most 7 days old.
  jwt.verify(token, process.env.JWT_SECRET, { maxAge: '7d' }, (err, user) => {
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
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate a token with the user's ID included.
    const token = jwt.sign(
      { id: user._id.toString(), username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Token valid for 7 days
    );

    res.status(200).json({ token });
  } catch (error) {
    console.error('Login error:', error);
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

router.post('/add-skill', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { skill } = req.body;

  // Validate that skill is an object with a name and a valid percentage
  if (
    !skill ||
    typeof skill !== 'object' ||
    !skill.name ||
    typeof skill.name !== 'string' ||
    skill.name.trim() === '' ||
    skill.percentage === undefined ||
    typeof skill.percentage !== 'number' ||
    skill.percentage < 0 ||
    skill.percentage > 100
  ) {
    return res.status(400).json({ message: 'A valid skill is required.' });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { skills: { name: skill.name.trim(), percentage: skill.percentage } } },
      { new: true }
    ).select('-password');

    res.status(200).json({ message: 'Skill added successfully', user: updatedUser });
  } catch (error) {
    console.error('Error adding skill:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/completed-task-count', authenticateToken, async (req, res) => {
  try {
    // Find the user by id (provided by the auth middleware)
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Return the completedTasks count
    res.status(200).json({ completedTasksCount: user.completedTasks });
  } catch (error) {
    console.error('Error fetching completed task count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/collaborator-task-count', authenticateToken, async (req, res) => {
  try {
    // Convert the user id from string to ObjectId using 'new'
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Use aggregation to unwind the tasks array and filter tasks where the user is a collaborator
    const result = await Project.aggregate([
      { $unwind: "$tasks" },
      { $match: { "tasks.collaborators": userId } },
      { $count: "taskCount" }
    ]);

    // If no tasks found, result will be an empty array.
    const count = result.length > 0 ? result[0].taskCount : 0;

    res.status(200).json({ collaboratorTaskCount: count });
  } catch (error) {
    console.error("Error fetching collaborator task count:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get('/collaborator-on-time-rate', authenticateToken, async (req, res) => {
  try {
    // Find all projects that have at least one task where the user is a collaborator.
    // (This assumes that any project where the user is involved as a collaborator
    // is stored in the projects collection. If not, adjust the query accordingly.)
    const projects = await Project.find({ "tasks.collaborators": req.user.id }).lean();

    let totalCollaboratorTasks = 0;
    let totalOnTime = 0;

    // Iterate over each project and each task.
    projects.forEach(project => {
      if (project.tasks && project.tasks.length > 0) {
        project.tasks.forEach(task => {
          // Check if the current user is a collaborator in this task.
          // Convert collaborator IDs to strings for comparison.
          if (task.collaborators && task.collaborators.map(id => id.toString()).includes(req.user.id)) {
            totalCollaboratorTasks++;
            // If the task is completed and has both a completedOn date and a deadline,
            // and the task was completed on or before its deadline, count it as on time.
            if (
              task.status === 'completed' &&
              task.completedOn &&
              task.deadline &&
              new Date(task.completedOn) <= new Date(task.deadline)
            ) {
              totalOnTime++;
            }
          }
        });
      }
    });

    // Calculate the on-time rate percentage.
    const onTimeRate = totalCollaboratorTasks > 0 ? Math.round((totalOnTime / totalCollaboratorTasks) * 100) : 0;

    res.status(200).json({ onTimeRate });
  } catch (error) {
    console.error("Error calculating collaborator on time rate:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post('/update-streak', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // --- Data Cleanup: Ensure all ratings have a score of at least 1 ---
    if (Array.isArray(user.ratings)) {
      user.ratings = user.ratings.map(rating => {
        if (rating.score < 1) {
          rating.score = 1;
        }
        return rating;
      });
    }
    
    // Consider the current date as the event date and normalize the time.
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    let lastDate = user.lastTaskDate ? new Date(user.lastTaskDate) : null;
    if (lastDate) {
      lastDate.setHours(0, 0, 0, 0);
    }
    
    if (!lastDate) {
      // No previous streak exists, so initialize streak to 1.
      user.streakDays = 1;
    } else {
      // Calculate the difference in days between the current date and the last task date.
      const diffInDays = (currentDate - lastDate) / (1000 * 60 * 60 * 24);
      
      if (diffInDays === 0) {
        // Same day event – we don't change the streak.
      } else if (diffInDays === 1) {
        // Consecutive day event: increment the streak.
        user.streakDays += 1;
      } else if (diffInDays > 1) {
        // More than one day has passed: reset the streak.
        user.streakDays = 1;
      }
    }
    
    // Update the lastTaskDate to the current date.
    user.lastTaskDate = currentDate;
    
    await user.save();
    
    res.status(200).json({ streakDays: user.streakDays });
  } catch (error) {
    console.error('Error updating streak:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /users - Fetch users sorted by weighted rating
router.get('/users', authenticateToken, async (req, res) => {
  try {
    // 1. Compute the global average rating (C) only from users that actually have ratings.
    const globalAvgResult = await User.aggregate([
      { $match: { ratings: { $exists: true, $ne: [] } } },
      { $unwind: "$ratings" },
      { $group: { _id: null, avgRating: { $avg: "$ratings.score" } } }
    ]);
    const C = globalAvgResult[0]?.avgRating || 0;
    const m = 5; // Threshold: minimum number of ratings for full confidence.

    // 2. For each user, compute:
    //    - v: the number of ratings (using $ifNull to treat missing ratings as an empty array)
    //    - R: the average rating (if there are ratings, else 0)
    //    - weightedRating: if v==0, then 0; otherwise, calculate the Bayesian weighted rating.
    const usersSorted = await User.aggregate([
      {
        $addFields: {
          v: { $size: { $ifNull: ["$ratings", []] } },
          R: {
            $cond: {
              if: { $gt: [{ $size: { $ifNull: ["$ratings", []] } }, 0] },
              then: { $avg: "$ratings.score" },
              else: 0
            }
          }
        }
      },
      {
        $addFields: {
          weightedRating: {
            $cond: {
              if: { $eq: ["$v", 0] },
              then: 0,
              else: {
                $add: [
                  { $multiply: [{ $divide: ["$v", { $add: ["$v", m] }] }, "$R"] },
                  { $multiply: [{ $divide: [m, { $add: ["$v", m] }] }, C] }
                ]
              }
            }
          }
        }
      },
      { $sort: { weightedRating: -1 } }
    ]);

    res.status(200).json(usersSorted);
  } catch (error) {
    res.status(500).json({
      message: 'Server Error: Unable to fetch users by ratings',
      error: error.message
    });
  }
});

// GET /auth/user/:id - Fetch public details for an arbitrary user.
router.get('/user/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ user });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /auth/user-stats/:id - Get statistics for an arbitrary user.
router.get('/user-stats/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;

    // Populate the user's projects and tasks.
    const user = await User.findById(userId)
      .populate({
        path: 'projects',
        populate: { path: 'tasks' }
      });

    if (!user) return res.status(404).json({ message: 'User not found' });

    let completedTasks = 0;
    let totalTasks = 0;
    let onTimeTasks = 0;

    // Iterate through projects/tasks to calculate metrics.
    user.projects.forEach(project => {
      if (project.tasks && project.tasks.length > 0) {
        project.tasks.forEach(task => {
          totalTasks++;
          if (task.status === 'completed') {
            completedTasks++;
            if (task.completedOn && task.deadline && new Date(task.completedOn) <= new Date(task.deadline)) {
              onTimeTasks++;
            }
          }
        });
      }
    });

    const onTimeRate = completedTasks > 0 ? Math.round((onTimeTasks / completedTasks) * 100) : 0;

    // Calculate average rating.
    let averageRating = 0;
    if (user.ratings && user.ratings.length > 0) {
      const sum = user.ratings.reduce((acc, rating) => acc + rating.score, 0);
      averageRating = sum / user.ratings.length;
    }

    // Calculate a basic skill distribution across tasks.
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

    res.json({
      completedTasks,
      totalTasks,
      onTimeRate,
      skillDistribution: skillCounts,
      averageRating,
      streakDays: user.streakDays
      // Optionally include recent activity or other stats.
    });
  } catch (error) {
    console.error('Error in /user-stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /auth/completed-task-count/:id - Return the completed tasks count for the user.
router.get('/completed-task-count/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ completedTasksCount: user.completedTasks });
  } catch (error) {
    console.error('Error fetching completed task count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /auth/collaborator-task-count/:id - Count tasks where the user is a collaborator.
router.get('/collaborator-task-count/:id', authenticateToken, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.id);
    const result = await Project.aggregate([
      { $unwind: "$tasks" },
      { $match: { "tasks.collaborators": userId } },
      { $count: "taskCount" }
    ]);
    const count = result.length > 0 ? result[0].taskCount : 0;
    res.status(200).json({ collaboratorTaskCount: count });
  } catch (error) {
    console.error("Error fetching collaborator task count:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /auth/collaborator-on-time-rate/:id - Calculate on-time rate for collaborator tasks.
router.get('/collaborator-on-time-rate/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const projects = await Project.find({ "tasks.collaborators": userId }).lean();

    let totalCollaboratorTasks = 0;
    let totalOnTime = 0;

    projects.forEach(project => {
      if (project.tasks && project.tasks.length > 0) {
        project.tasks.forEach(task => {
          if (task.collaborators && task.collaborators.map(id => id.toString()).includes(userId)) {
            totalCollaboratorTasks++;
            if (
              task.status === 'completed' &&
              task.completedOn &&
              task.deadline &&
              new Date(task.completedOn) <= new Date(task.deadline)
            ) {
              totalOnTime++;
            }
          }
        });
      }
    });

    const onTimeRate = totalCollaboratorTasks > 0 ? Math.round((totalOnTime / totalCollaboratorTasks) * 100) : 0;
    res.status(200).json({ onTimeRate });
  } catch (error) {
    console.error("Error calculating collaborator on time rate:", error);
    res.status(500).json({ message: "Server error" });
  }
});


router.post('/search-users', authenticateToken, async (req, res) => {
  try {
    const { query } = req.body; // Expecting a JSON body like { "query": "john" }
    if (!query) {
      return res.status(400).json({ message: 'Query parameter is required in the body.' });
    }

    // Create a case-insensitive regular expression.
    const regex = new RegExp(query, 'i');

    // Search for users where either the username or email matches the regex.
    const users = await User.find({
      $or: [
        { username: regex },
        { email: regex }
      ]
    });

    res.status(200).json({ users });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
