const mongoose = require('mongoose');
const requests = require('../../controllers/requests');
const BloodRequest = require('../../models/BloodRequest');
const User = require('../../models/User');
const { notifyMatchingDonors } = require('../../utils/pushNotifications');
const { mockRes, mockNext } = require('../helpers');

jest.mock('../../models/BloodRequest');
jest.mock('../../models/User');
jest.mock('../../utils/pushNotifications', () => ({
  notifyMatchingDonors: jest.fn().mockResolvedValue(undefined),
}));

const requestId = '507f1f77bcf86cd799439011';
const userId = '507f1f77bcf86cd799439012';

const createSession = () => ({
  startTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  endSession: jest.fn(),
});

describe('requests controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(mongoose, 'startSession').mockResolvedValue(createSession());
  });

  afterEach(() => {
    mongoose.startSession.mockRestore();
  });

  describe('getRequests', () => {
    it('lists requests with pagination', async () => {
      const chain = { sort: jest.fn().mockReturnThis(), skip: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), populate: jest.fn().mockResolvedValue([]) };
      BloodRequest.find.mockReturnValue(chain);
      BloodRequest.countDocuments.mockResolvedValue(0);

      const res = mockRes();
      await requests.getRequests({ query: { bloodGroup: 'A+', status: 'open' } }, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('createRequest', () => {
    it('creates request and triggers notifications', async () => {
      const created = { _id: requestId, bloodGroup: 'A+' };
      BloodRequest.create.mockResolvedValue(created);

      const res = mockRes();
      await requests.createRequest(
        {
          body: { patientName: 'P', bloodGroup: 'A+', hospital: 'H', location: 'L', units: 1, urgency: 'Normal', contact: '9999999999' },
          user: { id: userId },
        },
        res,
        mockNext()
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(notifyMatchingDonors).toHaveBeenCalled();
    });
  });

  describe('updateRequest', () => {
    it('returns 404 when missing', async () => {
      BloodRequest.findById.mockReturnValue({ session: jest.fn().mockResolvedValue(null) });

      const res = mockRes();
      await requests.updateRequest({ params: { id: requestId }, body: {}, user: { id: userId, role: 'donor' } }, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 403 when unauthorized', async () => {
      BloodRequest.findById.mockReturnValue({
        session: jest.fn().mockResolvedValue({ requestor: { toString: () => 'other' } }),
      });

      const res = mockRes();
      await requests.updateRequest({ params: { id: requestId }, body: {}, user: { id: userId, role: 'donor' } }, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('updates request and donor cooldown on completion', async () => {
      const existing = { requestor: { toString: () => userId } };
      BloodRequest.findById.mockReturnValue({ session: jest.fn().mockResolvedValue(existing) });
      User.findByIdAndUpdate.mockResolvedValue({});
      BloodRequest.findByIdAndUpdate.mockReturnValue({
        session: jest.fn().mockResolvedValue({ ...existing, status: 'completed' }),
      });

      const res = mockRes();
      await requests.updateRequest(
        {
          params: { id: requestId },
          body: { status: 'completed', donor: '507f1f77bcf86cd799439013' },
          user: { id: userId, role: 'donor' },
        },
        res,
        mockNext()
      );

      expect(User.findByIdAndUpdate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('error propagation', () => {
    it('forwards createRequest errors', async () => {
      const err = new Error('create failed');
      BloodRequest.create.mockRejectedValue(err);
      const next = mockNext();
      await requests.createRequest(
        {
          body: { bloodGroup: 'A+', location: 'L', contact: '9999999999' },
          user: { id: userId },
        },
        mockRes(),
        next
      );
      expect(next).toHaveBeenCalledWith(err);
    });

    it('aborts transaction when update fails', async () => {
      const session = createSession();
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(session);
      BloodRequest.findById.mockReturnValue({
        session: jest.fn().mockRejectedValue(new Error('tx fail')),
      });
      const next = mockNext();
      await requests.updateRequest({ params: { id: requestId }, body: {}, user: { id: userId, role: 'donor' } }, mockRes(), next);
      expect(session.abortTransaction).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('deleteRequest', () => {
    it('returns 404 when missing', async () => {
      BloodRequest.findById.mockResolvedValue(null);
      const res = mockRes();
      await requests.deleteRequest({ params: { id: requestId }, user: { id: userId } }, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 403 when delete unauthorized', async () => {
      BloodRequest.findById.mockResolvedValue({
        requestor: { toString: () => 'other' },
      });
      const res = mockRes();
      await requests.deleteRequest({ params: { id: requestId }, user: { id: userId, role: 'donor' } }, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('deletes when authorized', async () => {
      BloodRequest.findById.mockResolvedValue({
        requestor: { toString: () => userId },
        deleteOne: jest.fn().mockResolvedValue(true),
      });
      const res = mockRes();
      await requests.deleteRequest({ params: { id: requestId }, user: { id: userId } }, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
