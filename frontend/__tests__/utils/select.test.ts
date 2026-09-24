import { filterSelectOptions } from '@/utils/select';

describe('filterSelectOptions', () => {
  const options = [
    { value: '1', label: 'AIIMS New Delhi', sublabel: 'New Delhi' },
    { value: '2', label: 'Apollo Hospital', sublabel: 'Chennai' },
  ];

  it('returns all options for empty query', () => {
    expect(filterSelectOptions(options, '')).toHaveLength(2);
    expect(filterSelectOptions(options, '   ')).toHaveLength(2);
  });

  it('filters by label or sublabel', () => {
    expect(filterSelectOptions(options, 'chennai')).toHaveLength(1);
    expect(filterSelectOptions(options, 'aiims')).toHaveLength(1);
  });

  it('matches labels when sublabel is absent', () => {
    const simple = [{ value: 'x', label: 'Only Label' }];
    expect(filterSelectOptions(simple, 'only')).toHaveLength(1);
  });
});
