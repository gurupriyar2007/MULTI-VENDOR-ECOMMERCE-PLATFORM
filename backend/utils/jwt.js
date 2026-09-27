const jwt = require('jsonwebtoken');

function createToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'change_this_secret',
    { expiresIn: '1d' }
  );
}

module.exports = { createToken };
