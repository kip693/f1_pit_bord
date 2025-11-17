import { describe, it, expect } from 'vitest';
import type { ApiError } from '../types';

describe('API Client', () => {
  describe('ApiError type', () => {
    it('should define ApiError correctly', () => {
      const error: ApiError = {
        message: 'Test error',
        status: 404,
        endpoint: '/test',
        timestamp: new Date().toISOString(),
      };

      expect(error.message).toBe('Test error');
      expect(error.status).toBe(404);
      expect(error.endpoint).toBe('/test');
      expect(error.timestamp).toBeDefined();
    });
  });

  describe('client module', () => {
    it('should export get and post functions', async () => {
      const { get, post } = await import('../client');

      expect(typeof get).toBe('function');
      expect(typeof post).toBe('function');
    });
  });
});
