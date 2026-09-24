const jwt = require('jsonwebtoken');
const { protect, authorize } = require('../../middleware/auth');
const User = require('../../models/User');
const env = require('../../config/env');
const { mockRes, mockNext } = require('../helpers');

jest.mock('../../models/User');

describe('auth middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('protect', () => {
    it('returns 401 when no token is provided', async () => {
      const req = { headers: {} };
      const res = mockRes();
      const next = mockNext();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not authorized to access this route',
      });
    });

    it('returns 401 when user no longer exists', async () => {
      const token = jwt.sign({ id: '507f1f77bcf86cd799439011' }, env.JWT_SECRET);
      User.findById.mockResolvedValue(null);

      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockRes();
      const next = mockNext();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('attaches user and calls next for valid token', async () => {
      const user = { id: '507f1f77bcf86cd799439011', role: 'donor' };
      const token = jwt.sign({ id: user.id }, env.JWT_SECRET);
      User.findById.mockResolvedValue(user);

      const req = { headers: { authorization: `Bearer ${token}` } };
      const res = mockRes();
      const next = mockNext();

      await protect(req, res, next);

      expect(req.user).toBe(user);
      expect(next).toHaveBeenCalled();
    });

    it('returns 401 for invalid token', async () => {
      const req = { headers: { authorization: 'Bearer invalid' } };
      const res = mockRes();
      const next = mockNext();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('authorize', () => {
    it('returns 403 when role is not allowed', () => {
      const middleware = authorize('admin');
      const req = { user: { role: 'donor' } };
      const res = mockRes();
      const next = mockNext();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('calls next when role is allowed', () => {
      const middleware = authorize('donor', 'admin');
      const req = { user: { role: 'donor' } };
      const res = mockRes();
      const next = mockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
