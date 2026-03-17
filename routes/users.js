const express = require('express');
const db = require('../database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/me', verifyToken, (req, res) => {
  db.getUserById(req.user.id, (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  });
});

router.get('/:id', verifyToken, (req, res) => {
  const userId = parseInt(req.params.id);

  db.getUserById(userId, (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  });
});

router.put('/profile', verifyToken, (req, res) => {
  const allowedFields = ['username', 'email'];
  const updateData = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  db.updateUser(req.user.id, updateData, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    res.json({ message: 'Profile updated successfully' });
  });
});

router.put('/update', verifyToken, (req, res) => {
  const updateData = {};

  for (const [key, value] of Object.entries(req.body)) {
    if (key !== 'id' && key !== 'password') {
      updateData[key] = value;
    }
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  db.updateUser(req.user.id, updateData, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update user' });
    }

    res.json({ message: 'User updated successfully', updatedFields: updateData });
  });
});

module.exports = router;