const donors = require('../../controllers/donors');
const User = require('../../models/User');
const BloodRequest = require('../../models/BloodRequest');
const { mockRes, mockNext } = require('../helpers');

jest.mock('../../models/User');
jest.mock('../../models/BloodRequest');

describe('donors controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getDonors', () => {
    it('returns paginated donors', async () => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ name: 'Donor' }]),
      };
      User.find.mockReturnValue(chain);
      User.countDocuments.mockResolvedValue(1);

      const res = mockRes();
      await donors.getDonors({ query: { page: '1', limit: '10', bloodGroup: 'A+' } }, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json.mock.calls[0][0].totalCount).toBe(1);
    });

    it('applies geo filter when coordinates valid', async () => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };
      User.find.mockReturnValue(chain);
      User.countDocuments.mockResolvedValue(0);

      const res = mockRes();
      await donors.getDonors(
        { query: { latitude: '28.6', longitude: '77.2', radius: '5', select: 'name,secret', sort: 'name,-secret' } },
        res,
        mockNext()
      );

      expect(User.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getDonor', () => {
    it('returns 404 when not found', async () => {
      User.findById.mockResolvedValue(null);
      const res = mockRes();
      await donors.getDonor({ params: { id: '507f1f77bcf86cd799439011' } }, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns donor data', async () => {
      User.findById.mockResolvedValue({ role: 'donor', name: 'D' });
      const res = mockRes();
      await donors.getDonor({ params: { id: '507f1f77bcf86cd799439011' } }, res, mockNext());
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('error propagation', () => {
    it('forwards getDonors errors', async () => {
      User.find.mockImplementation(() => {
        throw new Error('fail');
      });
      const next = mockNext();
      await donors.getDonors({ query: {} }, mockRes(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getDonorStats', () => {
    it('returns aggregate stats', async () => {
      User.countDocuments.mockResolvedValue(5);
      BloodRequest.countDocuments.mockResolvedValue(2);
      User.aggregate.mockResolvedValue([{ _id: 'O+', count: 3 }]);

      const res = mockRes();
      await donors.getDonorStats({}, res, mockNext());

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json.mock.calls[0][0].totalDonors).toBe(5);
    });
  });
});
