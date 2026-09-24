import { AccessibilityRole } from 'react-native';

export function a11yButton(label: string, hint?: string) {
  return {
    accessible: true,
    accessibilityRole: 'button' as AccessibilityRole,
    accessibilityLabel: label,
    ...(hint ? { accessibilityHint: hint } : {}),
  };
}

export function a11yTextField(label: string, error?: string) {
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityHint: error || undefined,
  };
}
