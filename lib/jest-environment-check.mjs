/**
 * Checks if the current environment is a Jest test environment.
 * @returns {boolean} True if running in a Jest test environment, false otherwise.
 */
export function isJestTestEnvironment() {
  return process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
}