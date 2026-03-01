const request = require('supertest');
const express = require('express');
const { registerRules, loginRules } = require('../middleware/validate');

function createTestApp() {
  const app = express();
  app.use(express.json());

  app.post('/register', registerRules, (req, res) => {
    res.json({ success: true });
  });

  app.post('/login', loginRules, (req, res) => {
    res.json({ success: true });
  });

  return app;
}

describe('Auth Validation', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('POST /register', () => {
    it('should reject registration with missing fields', async () => {
      const res = await request(app).post('/register').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });

    it('should reject registration with invalid email', async () => {
      const res = await request(app).post('/register').send({
        name: 'Test User',
        email: 'not-an-email',
        password: 'Password1',
        phone: '1234567890',
        location: 'Delhi',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('email');
    });

    it('should reject registration with weak password', async () => {
      const res = await request(app).post('/register').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'weak',
        phone: '1234567890',
        location: 'Delhi',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Password');
    });

    it('should pass validation with valid data', async () => {
      const res = await request(app).post('/register').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'StrongPass1',
        phone: '1234567890',
        location: 'Delhi',
        bloodGroup: 'A+',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /login', () => {
    it('should reject login with missing credentials', async () => {
      const res = await request(app).post('/login').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should pass validation with valid credentials', async () => {
      const res = await request(app).post('/login').send({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
