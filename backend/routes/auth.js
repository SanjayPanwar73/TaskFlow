const express = require('express');
const { body } = require('express-validator');
const { signup, login, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { createAuthRateLimiter } = require('../middleware/security');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();
const authRateLimiter = createAuthRateLimiter({ max: 10 });

const signupValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required.')
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be between 2 and 80 characters.'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required.')
    .normalizeEmail(),
  body('password')
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 0,
    })
    .withMessage('Password must be at least 8 characters and include upper, lower, and number.'),
  body('role')
    .optional()
    .isIn(['Admin', 'Member'])
    .withMessage('Role must be Admin or Member.'),
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required.')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
  body('role')
    .optional()
    .isIn(['Admin', 'Member'])
    .withMessage('Role must be Admin or Member.'),
];

router.post('/signup', authRateLimiter, signupValidation, validateRequest, signup);
router.post('/login', authRateLimiter, loginValidation, validateRequest, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);

module.exports = router;
