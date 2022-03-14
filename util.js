const jwt = require('jsonwebtoken');

const createToken = user => {
  // Sign the JWT
  if (!user.role) {
    throw new Error('No user role specified');
  }
  return jwt.sign(
    {
      sub: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '2h' }
  );
};

const verifyPassword = (
  passwordAttempt,
  dbPassword
) => {
  return passwordAttempt === dbPassword
};

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'There was a problem authorizing the request'
    });
  }
  if (req.user.role !== 'admin') {
    return res
      .status(401)
      .json({ message: 'Insufficient role' });
  }
  next();
};

module.exports = {
  createToken,
  verifyPassword,
  requireAdmin
};
