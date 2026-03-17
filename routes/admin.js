const express = require('express');
const db = require('../database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/users', verifyToken, requireAdmin, (req, res) => {
  db.getAllUsers((err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ users });
  });
});

router.get('/stats', verifyToken, requireAdmin, (req, res) => {
  db.getAllUsers((err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({
      totalUsers: users.length,
      adminCount: users.filter(u => u.role === 'admin').length,
      regularUsers: users.filter(u => u.role === 'user').length
    });
  });
});

router.delete('/user/:id', verifyToken, requireAdmin, (req, res) => {
  const userId = parseInt(req.params.id);

  if (userId === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }

  db.db.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete user' });
    }

    res.json({ message: 'User deleted successfully' });
  });
});

module.exports = router;