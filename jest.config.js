module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-navigation|expo(nent)?|@expo(nent)?/.*)',
  ],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/app/$1',
    '^@context/(.*)$': '<rootDir>/context/$1',
    '^@components/(.*)$': '<rootDir>/app/components/$1',
    '^@hooks/(.*)$': '<rootDir>/app/hooks/$1',
    '^@lib/(.*)$': '<rootDir>/app/lib/$1',
  },
};
