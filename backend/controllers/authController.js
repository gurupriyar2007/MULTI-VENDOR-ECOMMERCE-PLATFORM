const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { createToken } = require('../utils/jwt');

async function register(req, res) {
  try {
    const { name, email, password, role = 'customer' } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    if (!['customer', 'vendor'].includes(role)) return res.status(400).json({ success: false, message: 'Invalid role' });

    const [exists] = await pool.query('SELECT id FROM users WHERE email=?', [email]);
    if (exists.length) return res.status(409).json({ success: false, message: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users(name,email,password_hash,role,vendor_status) VALUES(?,?,?,?,?)',
      [name, email, hash, role, role === 'vendor' ? 'pending' : 'approved']
    );
    res.status(201).json({ success: true, message: 'Registration successful', userId: result.insertId });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE email=?', [email]);
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const user = rows[0];
    if (user.role === 'vendor' && user.vendor_status !== 'approved') {
      return res.status(403).json({ success: false, message: `Vendor account is ${user.vendor_status}` });
    }
    const token = createToken(user);
    res.json({ success: true, token, user: { id:user.id, name:user.name, email:user.email, role:user.role } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

module.exports = { register, login };
