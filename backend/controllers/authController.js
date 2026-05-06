const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { COOKIE_NAME, getAuthCookieOptions } = require('../utils/cookies');

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

const serializeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const clearAuthCookie = (req, res) => {
  const cookieOptions = getAuthCookieOptions(req);
  delete cookieOptions.maxAge;
  res.clearCookie(COOKIE_NAME, cookieOptions);
};

const signup = async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'Member',
    });

    const token = generateToken(user._id);
    res.cookie(COOKIE_NAME, token, getAuthCookieOptions(req));

    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);
    res.cookie(COOKIE_NAME, token, getAuthCookieOptions(req));

    return res.json({
      message: 'Login successful.',
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

const logout = async (req, res) => {
  clearAuthCookie(req, res);
  return res.json({ message: 'Logged out successfully.' });
};

const getMe = async (req, res) => res.json({ user: serializeUser(req.user) });

module.exports = {
  signup,
  login,
  logout,
  getMe,
};
