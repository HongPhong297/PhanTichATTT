const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/check-email', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  db.getUserByEmail(email, (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (user) {
      return res.json({ exists: true, message: 'Email already registered' });
    } else {
      return res.json({ exists: false, message: 'Email available' });
    }
  });
});

router.post('/register', (req, res) => {
  res.status(403).json({ error: 'Registration is disabled. Please contact administrator.' });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.getUserByEmail(email, (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, username: user.username, role: user.role }
    });
  });
});

router.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  db.getUserByEmail(email, (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.json({ message: 'If email exists, reset link will be sent' });
    }

    const timestamp = Date.now();
    const token = Buffer.from(`${email}:${timestamp}`).toString('base64');
    const expiresAt = new Date(Date.now() + 3600000).toISOString();

    db.createPasswordReset(email, token, expiresAt, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to create reset token' });
      }

      res.json({ 
        message: 'Reset token generated',
        reset_token: token,
        note: 'In production, this would be sent via email'
      });
    });
  });
});

router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  db.getPasswordReset(token, (err, resetRecord) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!resetRecord) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const expiresAt = new Date(resetRecord.expires_at);
    if (expiresAt < new Date()) {
      return res.status(400).json({ error: 'Token has expired' });
    }

    db.getUserByEmail(resetRecord.email, (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const hash = bcrypt.hashSync(newPassword, 10);
      db.updateUser(user.id, { password: hash }, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to update password' });
        }

        db.markPasswordResetUsed(token, () => {});
        res.json({ message: 'Password reset successful' });
      });
    });
  });
});

module.exports = router;