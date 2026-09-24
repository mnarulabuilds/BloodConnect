const { AppError, errorHandler } = require('../../middleware/errorHandler');
const { mockRes, mockNext } = require('../helpers');

describe('errorHandler', () => {
  it('handles operational AppError', () => {
    const err = new AppError('Bad input', 400, 'BAD_INPUT');
    const req = { originalUrl: '/test', method: 'GET' };
    const res = mockRes();

    errorHandler(err, req, res, mockNext());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Bad input',
      code: 'BAD_INPUT',
    });
  });

  it('maps mongoose ValidationError', () => {
    const err = {
      name: 'ValidationError',
      errors: { email: { message: 'Invalid email' } },
    };
    const res = mockRes();

    errorHandler(err, {}, res, mockNext());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].code).toBe('VALIDATION_ERROR');
  });

  it('maps duplicate key error', () => {
    const err = { code: 11000, keyValue: { email: 'a@b.com' } };
    const res = mockRes();

    errorHandler(err, {}, res, mockNext());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].code).toBe('DUPLICATE_KEY');
  });

  it('maps CastError', () => {
    const err = { name: 'CastError', path: 'id', value: 'bad' };
    const res = mockRes();

    errorHandler(err, {}, res, mockNext());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 500 for unknown errors', () => {
    const res = mockRes();
    errorHandler(new Error('unexpected'), {}, res, mockNext());
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('maps JWT errors', () => {
    const res = mockRes();
    errorHandler({ name: 'JsonWebTokenError' }, {}, res, mockNext());
    expect(res.status).toHaveBeenCalledWith(401);

    const res2 = mockRes();
    errorHandler({ name: 'TokenExpiredError' }, {}, res2, mockNext());
    expect(res2.status).toHaveBeenCalledWith(401);
  });
});
