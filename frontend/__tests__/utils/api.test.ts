import { setSessionExpiredHandler, authService } from '@/utils/api';

describe('api client', () => {
  it('exports auth endpoints', () => {
    expect(typeof authService.login).toBe('function');
    expect(typeof authService.refresh).toBe('function');
  });

  it('registers and clears session expired handler', () => {
    const handler = jest.fn();
    setSessionExpiredHandler(handler);
    setSessionExpiredHandler(null);
    expect(handler).not.toHaveBeenCalled();
  });
});
