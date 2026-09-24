import { BLOOD_GROUPS, KNOWN_HOSPITALS, KNOWN_LOCATIONS } from '@/constants/data';

describe('constants/data', () => {
  it('exports blood groups', () => {
    expect(BLOOD_GROUPS).toContain('O+');
    expect(BLOOD_GROUPS).toHaveLength(8);
  });

  it('exports hospital and location datasets', () => {
    expect(KNOWN_HOSPITALS.length).toBeGreaterThan(10);
    expect(KNOWN_LOCATIONS).toContain('New Delhi');
  });
});
