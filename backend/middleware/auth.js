const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { COOKIE_NAME, parseCookies } = require('../utils/cookies');

const getTokenFromRequest = (req) => {
  const cookies = parseCookies(req.headers.cookie);

  if (cookies[COOKIE_NAME]) {
    return cookies[COOKIE_NAME];
  }

  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }

  return null;
};

const protect = async (req, res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ message: 'Not authorized.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('name email role createdAt updatedAt');

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Session is invalid or expired.' });
  }
};

module.exports = {
  protect,
};
