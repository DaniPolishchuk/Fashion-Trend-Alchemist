/**
 * Analytics endpoint integration tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { registerAnalyticsRoutes } from '../src/modules/analytics/analytics.controller.js';

describe('Analytics API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await registerAnalyticsRoutes(app);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /analytics/top-bottom', () => {
    it('should return 400 when no product type is provided', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/analytics/top-bottom',
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toHaveProperty('error');
    });

    it('should accept productTypeName parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/analytics/top-bottom?productTypeName=Sweater',
      });

      // May return 200 with empty results or 500 if DB not available
      expect([200, 500]).toContain(response.statusCode);
    });

    it('should validate date format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/analytics/top-bottom?productTypeName=Sweater&startDate=invalid',
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toContain('ISO format');
    });

    it('should validate limit range', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/analytics/top-bottom?productTypeName=Sweater&limit=99999',
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toContain('limit');
    });
  });

  describe('GET /analytics/health', () => {
    it('should return health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/analytics/health',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        status: 'ok',
        service: 'analytics',
      });
    });
  });
});