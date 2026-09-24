export interface FieldValidationResult {
  valid: boolean;
  message?: string;
}

export function validateEmail(email: string): FieldValidationResult {
  if (!email.trim()) {
    return { valid: false, message: 'Email address is required' };
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    return { valid: false, message: 'Please enter a valid email' };
  }
  return { valid: true };
}

export function validateRequired(value: string, label: string): FieldValidationResult {
  if (!value.trim()) {
    return { valid: false, message: `${label} is required` };
  }
  return { valid: true };
}

export function validateLoginForm(email: string, password: string) {
  const emailResult = validateEmail(email);
  const passwordResult = validateRequired(password, 'Password');
  return {
    emailError: emailResult.valid ? '' : emailResult.message ?? '',
    passwordError: passwordResult.valid ? '' : passwordResult.message ?? '',
    isValid: emailResult.valid && passwordResult.valid,
  };
}
