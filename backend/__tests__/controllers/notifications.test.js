const notifications = require('../../controllers/notifications');
const PushToken = require('../../models/PushToken');
const { mockRes, mockNext } = require('../helpers');

jest.mock('../../models/PushToken');

const userId = '507f1f77bcf86cd799439011';

describe('notifications controller', () => {
  beforeEach(() => jest.clearAllMocks());

  it('registerToken validates input', async () => {
    const res = mockRes();
    await notifications.registerToken({ user: { id: userId }, body: { token: '' } }, res, mockNext());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('registerToken rejects invalid platform', async () => {
    const res = mockRes();
    await notifications.registerToken(
      { user: { id: userId }, body: { token: 'abc', platform: 'windows' } },
      res,
      mockNext()
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('registerToken upserts token', async () => {
    PushToken.findOneAndUpdate.mockResolvedValue({});
    const res = mockRes();
    await notifications.registerToken(
      { user: { id: userId }, body: { token: 'abc', platform: 'ios' } },
      res,
      mockNext()
    );
    expect(PushToken.findOneAndUpdate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('unregisterToken requires token', async () => {
    const res = mockRes();
    await notifications.unregisterToken({ user: { id: userId }, body: {} }, res, mockNext());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('forwards register errors', async () => {
    const err = new Error('db');
    PushToken.findOneAndUpdate.mockRejectedValue(err);
    const next = mockNext();
    await notifications.registerToken(
      { user: { id: userId }, body: { token: 'abc', platform: 'web' } },
      mockRes(),
      next
    );
    expect(next).toHaveBeenCalledWith(err);
  });

  it('unregisterToken deletes token', async () => {
    PushToken.findOneAndDelete.mockResolvedValue({});
    const res = mockRes();
    await notifications.unregisterToken({ user: { id: userId }, body: { token: 'abc' } }, res, mockNext());
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
