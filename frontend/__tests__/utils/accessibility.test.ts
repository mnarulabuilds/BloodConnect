import { a11yButton, a11yTextField } from '@/utils/accessibility';

describe('accessibility helpers', () => {
  it('builds button props', () => {
    expect(a11yButton('Login', 'Sign in')).toMatchObject({
      accessibilityRole: 'button',
      accessibilityLabel: 'Login',
      accessibilityHint: 'Sign in',
    });
  });

  it('builds text field props', () => {
    expect(a11yTextField('Email', 'Required').accessibilityLabel).toBe('Email');
    expect(a11yTextField('Email').accessibilityHint).toBeUndefined();
    expect(a11yButton('Submit').accessibilityHint).toBeUndefined();
  });
});
