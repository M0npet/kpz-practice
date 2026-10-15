import 'mocha';
import { expect } from 'chai';
import { agent as request } from 'supertest';

import { app } from '../';

describe('errorHandler', () => {
  it('should answer malformed JSON with 400 and a JSON error body', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "admin@admin.com", oops}');
    expect(res.status).to.equal(400);
    expect(res.type).to.equal('application/json');
    expect(res.body.errorType).to.equal('General');
    expect(res.body.errorMessage).to.equal('Invalid JSON in request body');
  });

  it('should not leak the stack trace outside of the dev environment', async () => {
    const nodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const res = await request(app).post('/v1/auth/login').set('Content-Type', 'application/json').send('{oops');
      expect(res.status).to.equal(400);
      expect(res.body).to.not.have.property('stack');
    } finally {
      process.env.NODE_ENV = nodeEnv;
    }
  });
});
