import { validateEmail, validateLoginForm, validateRequired } from '@/utils/validation';

describe('validation utils', () => {
  it('validates email presence and format', () => {
    expect(validateEmail('').valid).toBe(false);
    expect(validateEmail('bad').valid).toBe(false);
    expect(validateEmail('user@example.com').valid).toBe(true);
  });

  it('validates required fields', () => {
    expect(validateRequired('  ', 'Password').message).toContain('Password');
    expect(validateRequired('secret', 'Password').valid).toBe(true);
  });

  it('validates login form aggregate', () => {
    const invalid = validateLoginForm('', '');
    expect(invalid.isValid).toBe(false);
    expect(invalid.emailError).toBeTruthy();
    expect(invalid.passwordError).toBeTruthy();

    const valid = validateLoginForm('user@example.com', 'Password1');
    expect(valid.isValid).toBe(true);

    const emailOnlyInvalid = validateLoginForm('not-an-email', 'Password1');
    expect(emailOnlyInvalid.isValid).toBe(false);
    expect(emailOnlyInvalid.passwordError).toBe('');
  });
});
