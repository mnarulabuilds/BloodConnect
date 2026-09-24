module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx)'],
  collectCoverageFrom: [
    'utils/validation.ts',
    'utils/apiBase.ts',
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
    'components/ui/EmptyState.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 81,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)',
  ],
};
