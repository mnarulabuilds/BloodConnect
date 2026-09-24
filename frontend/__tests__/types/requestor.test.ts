import { getRequestorId } from '@/types';

describe('getRequestorId', () => {
  it('extracts id from string or object requestor', () => {
    expect(getRequestorId('abc')).toBe('abc');
    expect(getRequestorId({ _id: 'req-1', name: 'Hospital' })).toBe('req-1');
    expect(getRequestorId({ name: 'No id' })).toBe('');
  });
});
