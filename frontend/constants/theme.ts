
export const Colors = {
  light: {
    primary: '#D32F2F', // Safe Blood Red
    secondary: '#F44336', // Bright Red
    accent: '#B71C1C', // Dark Blood Red
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#212121',
    textSecondary: '#757575',
    border: '#E0E0E0',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#D32F2F',
    white: '#FFFFFF',
    dark: '#121212',
  },
  dark: {
    primary: '#EF5350',
    secondary: '#FF1744',
    accent: '#D32F2F',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    border: '#333333',
    success: '#81C784',
    warning: '#FFD54F',
    error: '#EF5350',
    white: '#FFFFFF',
    dark: '#000000',
  }
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: 'normal' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: 'normal' as const,
  },
};
