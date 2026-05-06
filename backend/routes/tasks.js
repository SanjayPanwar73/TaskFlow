const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getTasks,
  getDashboardStats,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();
const TASK_STATUSES = ['Pending', 'In Progress', 'Completed'];

const validateOptionalMongoId = (fieldName) =>
  body(fieldName)
    .optional()
    .custom((value) => value === '' || value === null || /^[0-9a-fA-F]{24}$/.test(value))
    .withMessage(`${fieldName} must be a valid id.`);

const validateOptionalDate = () =>
  body('dueDate')
    .optional()
    .custom((value) => value === '' || value === null || !Number.isNaN(Date.parse(value)))
    .withMessage('dueDate must be a valid date.');

const baseTaskValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 160 })
    .withMessage('Title must be between 2 and 160 characters.'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 3000 })
    .withMessage('Description cannot exceed 3000 characters.'),
  validateOptionalMongoId('projectId'),
  validateOptionalMongoId('assignedTo'),
  body('status')
    .optional()
    .isIn(TASK_STATUSES)
    .withMessage('Status must be Pending, In Progress, or Completed.'),
  validateOptionalDate(),
];

const createTaskValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Task title is required.')
    .isLength({ min: 2, max: 160 })
    .withMessage('Title must be between 2 and 160 characters.'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 3000 })
    .withMessage('Description cannot exceed 3000 characters.'),
  body('projectId').isMongoId().withMessage('A valid projectId is required.'),
  validateOptionalMongoId('assignedTo'),
  body('status')
    .optional()
    .isIn(TASK_STATUSES)
    .withMessage('Status must be Pending, In Progress, or Completed.'),
  validateOptionalDate(),
];

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
    query('projectId').optional().isMongoId().withMessage('Invalid project id.'),
    query('assignedTo').optional().isMongoId().withMessage('Invalid assignedTo id.'),
    query('status')
      .optional()
      .isIn(TASK_STATUSES)
      .withMessage('Status must be Pending, In Progress, or Completed.'),
  ],
  validateRequest,
  getTasks
);
router.get('/:id', param('id').isMongoId().withMessage('Invalid task id.'), validateRequest, getTaskById);
router.post(
  '/',
  roleCheck('Admin'),
  createTaskValidation,
  validateRequest,
  createTask
);
router.put(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid task id.'), ...baseTaskValidation],
  validateRequest,
  updateTask
);
router.delete(
  '/:id',
  roleCheck('Admin'),
  param('id').isMongoId().withMessage('Invalid task id.'),
  validateRequest,
  deleteTask
);

module.exports = router;
