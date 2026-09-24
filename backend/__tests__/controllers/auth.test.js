const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const auth = require('../../controllers/auth');
const User = require('../../models/User');
const sendEmail = require('../../utils/sendEmail');
const env = require('../../config/env');
const { mockRes, mockNext } = require('../helpers');

jest.mock('../../models/User');
jest.mock('../../utils/sendEmail');

const userId = '507f1f77bcf86cd799439011';

describe('auth controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('requires blood group for donors', async () => {
      const req = { body: { name: 'A', email: 'a@b.com', password: 'Pass1234', phone: '1234567890', location: 'X' } };
      const res = mockRes();
      await auth.register(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects duplicate email', async () => {
      User.findOne.mockResolvedValue({ email: 'a@b.com' });
      const req = {
        body: {
          name: 'A',
          email: 'a@b.com',
          password: 'Pass1234',
          phone: '1234567890',
          location: 'X',
          bloodGroup: 'A+',
        },
      };
      const res = mockRes();
      await auth.register(req, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('creates user and returns tokens', async () => {
      User.findOne.mockResolvedValue(null);
      const created = {
        _id: userId,
        name: 'A',
        email: 'a@b.com',
        role: 'donor',
        bloodGroup: 'A+',
        phone: '1234567890',
        location: 'X',
      };
      User.create.mockResolvedValue(created);
      User.findByIdAndUpdate.mockResolvedValue(created);

      const req = {
        body: {
          name: 'A',
          email: 'a@b.com',
          password: 'Pass1234',
          phone: '1234567890',
          location: 'X',
          bloodGroup: 'A+',
          latitude: 28.6,
          longitude: 77.2,
        },
      };
      const res = mockRes();
      await auth.register(req, res, mockNext());

      expect(User.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json.mock.calls[0][0].accessToken).toBeDefined();
    });
  });

  describe('login', () => {
    it('returns 401 for unknown user', async () => {
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
      const res = mockRes();
      await auth.login({ body: { email: 'a@b.com', password: 'x' } }, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 for wrong password', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({ matchPassword: jest.fn().mockResolvedValue(false) }),
      });
      const res = mockRes();
      await auth.login({ body: { email: 'a@b.com', password: 'x' } }, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns tokens for valid credentials', async () => {
      const user = {
        _id: userId,
        name: 'A',
        email: 'a@b.com',
        role: 'donor',
        matchPassword: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
      User.findByIdAndUpdate.mockResolvedValue(user);

      const res = mockRes();
      await auth.login({ body: { email: 'a@b.com', password: 'Pass1234' } }, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('forgotPassword', () => {
    it('requires email', async () => {
      const res = mockRes();
      await auth.forgotPassword({ body: {} }, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns generic success when user missing', async () => {
      User.findOne.mockResolvedValue(null);
      const res = mockRes();
      await auth.forgotPassword({ body: { email: 'a@b.com' } }, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('sends email when user exists', async () => {
      const user = {
        email: 'a@b.com',
        getResetPasswordToken: jest.fn().mockReturnValue('raw-token'),
        save: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValue(user);
      sendEmail.mockResolvedValue(true);

      const res = mockRes();
      await auth.forgotPassword({ body: { email: 'a@b.com' } }, res, mockNext());
      expect(sendEmail).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('resetPassword', () => {
    it('rejects invalid token', async () => {
      User.findOne.mockResolvedValue(null);
      const res = mockRes();
      await auth.resetPassword({ params: { resettoken: 'abc' }, body: { password: 'Newpass1' } }, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('resets password for valid token', async () => {
      const user = { save: jest.fn().mockResolvedValue(true) };
      User.findOne.mockResolvedValue(user);
      const res = mockRes();
      await auth.resetPassword({ params: { resettoken: 'abc' }, body: { password: 'Newpass1' } }, res, mockNext());
      expect(user.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('refreshToken', () => {
    it('requires refresh token body', async () => {
      const res = mockRes();
      await auth.refreshToken({ body: {} }, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects invalid refresh token', async () => {
      const res = mockRes();
      await auth.refreshToken({ body: { refreshToken: 'bad' } }, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('issues new tokens for valid refresh token', async () => {
      const refreshToken = jwt.sign({ id: userId, type: 'refresh' }, env.JWT_SECRET);
      const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const user = { _id: userId, name: 'A', email: 'a@b.com', role: 'donor', refreshToken: hash };
      User.findById.mockResolvedValue(user);
      User.findByIdAndUpdate.mockResolvedValue(user);

      const res = mockRes();
      await auth.refreshToken({ body: { refreshToken } }, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('error propagation', () => {
    it('passes register errors to next', async () => {
      const err = new Error('db down');
      User.findOne.mockRejectedValue(err);
      const next = mockNext();
      await auth.register(
        {
          body: {
            name: 'A',
            email: 'a@b.com',
            password: 'Pass1234',
            phone: '1234567890',
            location: 'X',
            bloodGroup: 'A+',
          },
        },
        mockRes(),
        next
      );
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('logoutUser', () => {
    it('clears refresh token', async () => {
      User.findByIdAndUpdate.mockResolvedValue({});
      const res = mockRes();
      await auth.logoutUser({ user: { id: userId } }, res, mockNext());
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(userId, { refreshToken: undefined });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
