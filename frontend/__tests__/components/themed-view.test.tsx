import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemedView } from '@/components/themed-view';

describe('ThemedView', () => {
  it('renders with themed background', () => {
    const { getByTestId } = render(<ThemedView testID="view" />);
    expect(getByTestId('view')).toBeTruthy();
  });
});
