const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  addMember,
  removeMember,
  deleteProject,
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.use(protect);

const listValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
];

const projectValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Project name is required.')
    .isLength({ min: 2, max: 120 })
    .withMessage('Project name must be between 2 and 120 characters.'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters.'),
  body('memberIds').optional().isArray().withMessage('memberIds must be an array.'),
  body('memberIds.*').optional().isMongoId().withMessage('Each member id must be a valid id.'),
];

router.get('/', listValidation, validateRequest, getProjects);
router.get('/:id', param('id').isMongoId().withMessage('Invalid project id.'), validateRequest, getProjectById);
router.post('/', roleCheck('Admin'), projectValidation, validateRequest, createProject);
router.put(
  '/:id',
  roleCheck('Admin'),
  [param('id').isMongoId().withMessage('Invalid project id.'), ...projectValidation],
  validateRequest,
  updateProject
);
router.post(
  '/:id/members',
  roleCheck('Admin'),
  [
    param('id').isMongoId().withMessage('Invalid project id.'),
    body('userId').isMongoId().withMessage('A valid userId is required.'),
  ],
  validateRequest,
  addMember
);
router.delete(
  '/:id/members/:userId',
  roleCheck('Admin'),
  [
    param('id').isMongoId().withMessage('Invalid project id.'),
    param('userId').isMongoId().withMessage('Invalid user id.'),
  ],
  validateRequest,
  removeMember
);
router.delete(
  '/:id',
  roleCheck('Admin'),
  param('id').isMongoId().withMessage('Invalid project id.'),
  validateRequest,
  deleteProject
);

module.exports = router;
