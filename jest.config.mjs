export default {
  transform: {},
  moduleFileExtensions: ['js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'json', 'node'],
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.(js|mjs)',
    '**/?(*.)+(spec|test).(js|mjs)'
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.m?js$': '$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(fsevents|node-fetch)/)'
  ],
};