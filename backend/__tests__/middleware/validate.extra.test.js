const request = require('supertest');
const express = require('express');
const {
  createRequestRules,
  updateRequestRules,
  forgotPasswordRules,
  updateProfileRules,
  startChatRules,
  sendMessageRules,
} = require('../../middleware/validate');

function mount(rules) {
  const app = express();
  app.use(express.json());
  app.post('/test', rules, (req, res) => res.json({ success: true }));
  app.put('/test/:id', rules, (req, res) => res.json({ success: true }));
  return app;
}

describe('additional validation rules', () => {
  it('rejects invalid blood request payload', async () => {
    const app = mount(createRequestRules);
    const res = await request(app).post('/test').send({ bloodGroup: 'Z+' });
    expect(res.status).toBe(400);
  });

  it('accepts valid blood request payload', async () => {
    const app = mount(createRequestRules);
    const res = await request(app).post('/test').send({
      bloodGroup: 'O+',
      location: 'Delhi',
      contact: '9876543210',
    });
    expect(res.status).toBe(200);
  });

  it('rejects invalid request id on update', async () => {
    const app = mount(updateRequestRules);
    const res = await request(app).put('/test/not-an-id').send({ status: 'open' });
    expect(res.status).toBe(400);
  });

  it('validates forgot password email', async () => {
    const app = mount(forgotPasswordRules);
    const res = await request(app).post('/test').send({ email: 'bad' });
    expect(res.status).toBe(400);
  });

  it('validates profile update blood group', async () => {
    const app = mount(updateProfileRules);
    const res = await request(app).post('/test').send({ bloodGroup: 'INVALID' });
    expect(res.status).toBe(400);
  });

  it('validates start chat recipient id', async () => {
    const app = mount(startChatRules);
    const res = await request(app).post('/test').send({ recipientId: 'bad' });
    expect(res.status).toBe(400);
  });

  it('validates send message text length', async () => {
    const app = mount(sendMessageRules);
    const res = await request(app)
      .put('/test/507f1f77bcf86cd799439011')
      .send({ text: '' });
    expect(res.status).toBe(400);
  });
});
