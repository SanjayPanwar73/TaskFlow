const express = require('express');
const { query } = require('express-validator');
const { listUsers, getProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.use(protect);

router.get(
  '/',
  roleCheck('Admin'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
  ],
  validateRequest,
  listUsers
);
router.get('/profile', getProfile);

module.exports = router;
