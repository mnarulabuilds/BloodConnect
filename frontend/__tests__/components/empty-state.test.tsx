import React from 'react';
import { render } from '@testing-library/react-native';
import { EmptyState } from '@/components/ui/EmptyState';
import { useColorScheme } from '@/hooks/use-color-scheme';

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: jest.fn(),
}));

describe('EmptyState', () => {
  it('renders title and message', () => {
    (useColorScheme as jest.Mock).mockReturnValue('light');
    const { getByText } = render(
      <EmptyState title="Nothing here" message="Check back later." />
    );
    expect(getByText('Nothing here')).toBeTruthy();
    expect(getByText('Check back later.')).toBeTruthy();
  });

  it('supports dark color scheme', () => {
    (useColorScheme as jest.Mock).mockReturnValue('dark');
    const { getByText } = render(
      <EmptyState title="Dark mode" message="Readable copy in dark theme." />
    );
    expect(getByText('Dark mode')).toBeTruthy();
  });
});
