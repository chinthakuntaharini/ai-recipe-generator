// Global test setup
import { jest } from '@jest/globals';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Set up environment variables for tests
process.env.NODE_ENV = 'test';
process.env.COGNITO_REGION = 'us-east-1';
process.env.USER_POOL_ID = 'us-east-1_N0KMxM07E';
process.env.USER_POOL_CLIENT_ID = 'test-client-id';