const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./lab.db');

function initDatabase() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0
    )`);

    seedData();
  });
}

function seedData() {
  // Admin: strong random password (NOT in wordlist)
  const passwordHash = bcrypt.hashSync('K8x#mP2@nL9qR4!vY', 10);
  // User: weak password (for brute force practice)
  const userPasswordHash = bcrypt.hashSync('user123', 10);

  const stmt = db.prepare(`INSERT OR IGNORE INTO users (email, username, password, role) VALUES (?, ?, ?, ?)`);
  
  stmt.run('admin@lab.com', 'admin', passwordHash, 'admin', (err) => {
    if (err && err.message !== 'SQLITE CONSTRAINT: UNIQUE constraint failed: users.email') {
      console.log('Admin user may already exist');
    }
  });

  stmt.run('user@lab.com', 'testuser', userPasswordHash, 'user', (err) => {
    if (err && err.message !== 'SQLITE CONSTRAINT: UNIQUE constraint failed: users.email') {
      console.log('Test user may already exist');
    }
  });

  stmt.finalize();
}

function getUserByEmail(email, callback) {
  db.get('SELECT * FROM users WHERE email = ?', [email], callback);
}

function getUserById(id, callback) {
  db.get('SELECT id, email, username, role, created_at FROM users WHERE id = ?', [id], callback);
}

function createUser(email, username, password, role = 'user', callback) {
  const hash = bcrypt.hashSync(password, 10);
  db.run('INSERT INTO users (email, username, password, role) VALUES (?, ?, ?, ?)', 
    [email, username, hash, role], callback);
}

function updateUser(id, data, callback) {
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = Object.values(data);
  values.push(id);
  db.run(`UPDATE users SET ${fields} WHERE id = ?`, values, callback);
}

function getAllUsers(callback) {
  db.all('SELECT id, email, username, role, created_at FROM users', [], callback);
}

function createPasswordReset(email, token, expiresAt, callback) {
  db.run('INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)', 
    [email, token, expiresAt], callback);
}

function getPasswordReset(token, callback) {
  db.get('SELECT * FROM password_resets WHERE token = ? AND used = 0', [token], callback);
}

function markPasswordResetUsed(token, callback) {
  db.run('UPDATE password_resets SET used = 1 WHERE token = ?', [token], callback);
}

function getUserByUsername(username, callback) {
  db.get('SELECT * FROM users WHERE username = ?', [username], callback);
}

module.exports = {
  db,
  initDatabase,
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  getAllUsers,
  createPasswordReset,
  getPasswordReset,
  markPasswordResetUsed,
  getUserByUsername
};