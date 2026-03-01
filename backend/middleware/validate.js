const { body, param, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg);
    return res.status(400).json({ success: false, error: messages.join(', '), code: 'VALIDATION_ERROR' });
  }
  next();
};

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const registerRules = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  body('phone').matches(/^\+?[0-9]{10,15}$/).withMessage('Phone must be 10-15 digits'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('bloodGroup').optional({ values: 'falsy' }).isIn(BLOOD_GROUPS).withMessage('Invalid blood group'),
  body('role').optional({ values: 'falsy' }).isIn(['donor', 'hospital']).withMessage('Invalid role'),
  body('latitude').optional({ values: 'null' }).isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').optional({ values: 'null' }).isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  handleValidationErrors,
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

const resetPasswordRules = [
  param('resettoken').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  handleValidationErrors,
];

const forgotPasswordRules = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  handleValidationErrors,
];

const createRequestRules = [
  body('bloodGroup').isIn(BLOOD_GROUPS).withMessage('Invalid blood group'),
  body('hospital').optional().trim().isLength({ max: 200 }).withMessage('Hospital name too long'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('units').optional().isInt({ min: 1, max: 50 }).withMessage('Units must be between 1 and 50'),
  body('urgency').optional().isIn(['Normal', 'Urgent', 'Critical']).withMessage('Invalid urgency level'),
  body('contact').matches(/^\+?[0-9]{10,15}$/).withMessage('Contact must be 10-15 digits'),
  body('patientName').optional().trim().isLength({ max: 100 }).withMessage('Patient name too long'),
  handleValidationErrors,
];

const updateRequestRules = [
  param('id').isMongoId().withMessage('Invalid request ID'),
  body('status').optional().isIn(['open', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('units').optional().isInt({ min: 1, max: 50 }).withMessage('Units must be between 1 and 50'),
  body('urgency').optional().isIn(['Normal', 'Urgent', 'Critical']).withMessage('Invalid urgency'),
  body('donor').optional().isMongoId().withMessage('Invalid donor ID'),
  handleValidationErrors,
];

const deleteRequestRules = [
  param('id').isMongoId().withMessage('Invalid request ID'),
  handleValidationErrors,
];

const updateProfileRules = [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Invalid email'),
  body('phone').optional().matches(/^\+?[0-9]{10,15}$/).withMessage('Phone must be 10-15 digits'),
  body('bloodGroup').optional({ values: 'falsy' }).isIn(BLOOD_GROUPS).withMessage('Invalid blood group'),
  body('role').optional({ values: 'falsy' }).isIn(['donor', 'hospital']).withMessage('Invalid role'),
  body('latitude').optional({ values: 'null' }).isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').optional({ values: 'null' }).isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  handleValidationErrors,
];

const startChatRules = [
  body('recipientId').isMongoId().withMessage('Invalid recipient ID'),
  body('bloodRequestId').optional().isMongoId().withMessage('Invalid blood request ID'),
  handleValidationErrors,
];

const sendMessageRules = [
  param('id').isMongoId().withMessage('Invalid chat ID'),
  body('text').trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be 1-2000 characters'),
  handleValidationErrors,
];

const getMessagesRules = [
  param('id').isMongoId().withMessage('Invalid chat ID'),
  handleValidationErrors,
];

const getChatByIdRules = [
  param('id').isMongoId().withMessage('Invalid chat ID'),
  handleValidationErrors,
];

module.exports = {
  registerRules,
  loginRules,
  resetPasswordRules,
  forgotPasswordRules,
  createRequestRules,
  updateRequestRules,
  deleteRequestRules,
  updateProfileRules,
  startChatRules,
  sendMessageRules,
  getMessagesRules,
  getChatByIdRules,
};
