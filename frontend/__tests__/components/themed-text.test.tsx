import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemedText } from '@/components/themed-text';

describe('ThemedText', () => {
  it.each(['default', 'title', 'defaultSemiBold', 'subtitle', 'link'] as const)(
    'renders %s variant',
    (type) => {
      const { getByText } = render(<ThemedText type={type}>Hello</ThemedText>);
      expect(getByText('Hello')).toBeTruthy();
    }
  );
});
