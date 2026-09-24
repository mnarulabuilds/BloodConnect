process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_for_unit_tests_only_32chars';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/bloodconnect_test';
process.env.CORS_ORIGIN = '*';

jest.mock('../config/logger', () => {
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    fatal: jest.fn(),
    child: jest.fn(),
  };
  logger.child.mockReturnValue(logger);
  return logger;
});
