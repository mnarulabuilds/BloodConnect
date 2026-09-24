module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx)'],
  collectCoverageFrom: [
    'utils/validation.ts',
    'utils/select.ts',
    'utils/accessibility.ts',
    'utils/storage.ts',
    'context/AuthContext.tsx',
    'context/ToastContext.tsx',
    'context/ChatContext.tsx',
    'hooks/use-theme-color.ts',
    'constants/data.ts',
    'components/themed-text.tsx',
    'components/themed-view.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)',
  ],
};
