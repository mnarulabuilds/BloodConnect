const users = require('../../controllers/users');
const User = require('../../models/User');
const { mockRes, mockNext } = require('../helpers');

jest.mock('../../models/User');

const userId = '507f1f77bcf86cd799439011';

describe('users controller', () => {
  beforeEach(() => jest.clearAllMocks());

  it('updates allowed profile fields', async () => {
    const updated = {
      _id: userId,
      name: 'New',
      email: 'a@b.com',
      role: 'donor',
      phone: '1234567890',
      location: 'Delhi',
    };
    User.findByIdAndUpdate.mockResolvedValue(updated);

    const res = mockRes();
    await users.updateProfile(
      {
        user: { id: userId },
        body: { name: 'New', latitude: 28.6, longitude: 77.2, ignored: 'x' },
      },
      res,
      mockNext()
    );

    expect(User.findByIdAndUpdate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data.name).toBe('New');
  });

  it('forwards update errors', async () => {
    const err = new Error('update fail');
    User.findByIdAndUpdate.mockRejectedValue(err);
    const next = mockNext();
    await users.updateProfile({ user: { id: userId }, body: { name: 'X' } }, mockRes(), next);
    expect(next).toHaveBeenCalledWith(err);
  });

  it('returns 404 when user missing', async () => {
    User.findByIdAndUpdate.mockResolvedValue(null);
    const res = mockRes();
    await users.updateProfile({ user: { id: userId }, body: { name: 'X' } }, res, mockNext());
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
