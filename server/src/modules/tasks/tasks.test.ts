import 'mocha';
import { expect } from 'chai';
import { agent as request } from 'supertest';
import { getRepository, Repository } from 'typeorm';

import { dbCreateConnection } from 'orm/dbCreateConnection';
import { Task } from 'orm/entities/tasks/Task';
import { Role } from 'orm/entities/users/types';
import { User } from 'orm/entities/users/User';

import { app } from '../../';

const PASSWORD = 'pass1';

const makeUser = (username: string, email: string, role: Role) => {
  const user = new User();
  user.username = username;
  user.name = username;
  user.email = email;
  user.password = PASSWORD;
  user.hashPassword();
  user.role = role;
  return user;
};

describe('Tasks /v1/tasks', () => {
  let userRepository: Repository<User>;
  let taskRepository: Repository<Task>;

  const owner = makeUser('TaskOwner', 'task.owner@test.com', 'STANDARD');
  const stranger = makeUser('TaskStranger', 'task.stranger@test.com', 'STANDARD');
  const admin = makeUser('TaskAdmin', 'task.admin@test.com', 'ADMINISTRATOR');
  const tokens: Record<string, string> = {};

  const login = async (email: string) => {
    const res = await request(app).post('/v1/auth/login').send({ email, password: PASSWORD });
    return res.body.data as string;
  };
  const createTask = (token: string, body: object) =>
    request(app).post('/v1/tasks').set('Authorization', token).send(body);

  before(async () => {
    await dbCreateConnection();
    userRepository = getRepository(User);
    taskRepository = getRepository(Task);
    await userRepository.save([owner, stranger, admin]);
    tokens.owner = await login(owner.email);
    tokens.stranger = await login(stranger.email);
    tokens.admin = await login(admin.email);
  });

  afterEach(async () => {
    await taskRepository.delete({ ownerId: owner.id });
    await taskRepository.delete({ ownerId: stranger.id });
  });

  after(async () => {
    // tasks.owner_id has ON DELETE CASCADE
    await userRepository.delete([owner.id, stranger.id, admin.id]);
  });

  describe('POST /', () => {
    it('should require a JWT', async () => {
      const res = await request(app).post('/v1/tasks').send({ title: 'No token' });
      expect(res.status).to.equal(400);
      expect(res.body.errorMessage).to.equal('Authorization header not provided');
    });

    it('should create a task for the current user and ignore server-owned fields', async () => {
      const res = await createTask(tokens.owner, {
        title: '  Write the report  ',
        priority: 'HIGH',
        dueDate: '2026-10-20',
        ownerId: stranger.id,
        completedAt: '2020-01-01T00:00:00Z',
        id: 999999,
      });
      expect(res.status).to.equal(201);
      expect(res.headers.location).to.equal(`/v1/tasks/${res.body.data.id}`);
      expect(res.body.data).to.include({
        title: 'Write the report',
        status: 'TODO',
        priority: 'HIGH',
        dueDate: '2026-10-20',
        completedAt: null,
        description: null,
      });
      expect(res.body.data.id).to.not.equal(999999);
      expect(res.body.data.owner).to.eql({ id: owner.id, name: owner.name, email: owner.email });
    });

    it('should report validation errors', async () => {
      const res = await createTask(tokens.owner, {
        title: ' ',
        status: 'WIP',
        priority: 'URGENT',
        dueDate: '2026-02-30',
      });
      expect(res.status).to.equal(400);
      expect(res.body.errorType).to.equal('Validation');
      expect(res.body.errorsValidation.map((e: object) => Object.keys(e)[0])).to.eql([
        'title',
        'status',
        'priority',
        'dueDate',
      ]);
    });

    it('should reject a title longer than 120 characters', async () => {
      const res = await createTask(tokens.owner, { title: 'x'.repeat(121) });
      expect(res.status).to.equal(400);
      expect(res.body.errorsValidation).to.eql([{ title: 'Title must be at most 120 characters' }]);
    });
  });

  describe('GET /', () => {
    beforeEach(async () => {
      await createTask(tokens.owner, { title: 'Owner: todo task' });
      await createTask(tokens.owner, { title: 'Owner: 100% done', status: 'DONE' });
      await createTask(tokens.stranger, { title: 'Stranger task' });
    });

    it('should list only own tasks for a standard user', async () => {
      const res = await request(app).get('/v1/tasks').set('Authorization', tokens.owner);
      expect(res.status).to.equal(200);
      expect(res.body.data.map((t: Task) => t.title)).to.have.members(['Owner: todo task', 'Owner: 100% done']);
    });

    it('should list tasks of all users for an administrator', async () => {
      const res = await request(app).get('/v1/tasks').set('Authorization', tokens.admin);
      const titles = res.body.data.map((t: Task) => t.title);
      expect(titles).to.include.members(['Owner: todo task', 'Owner: 100% done', 'Stranger task']);
    });

    it('should filter by status and search by title', async () => {
      let res = await request(app).get('/v1/tasks?status=DONE').set('Authorization', tokens.owner);
      expect(res.body.data.map((t: Task) => t.title)).to.eql(['Owner: 100% done']);

      res = await request(app).get('/v1/tasks?search=TODO').set('Authorization', tokens.owner);
      expect(res.body.data.map((t: Task) => t.title)).to.eql(['Owner: todo task']);

      // '%' is a LIKE wildcard; it must be matched literally
      res = await request(app).get('/v1/tasks?search=%25').set('Authorization', tokens.owner);
      expect(res.body.data.map((t: Task) => t.title)).to.eql(['Owner: 100% done']);
    });

    it('should reject an unknown status filter', async () => {
      const res = await request(app).get('/v1/tasks?status=LATER').set('Authorization', tokens.owner);
      expect(res.status).to.equal(400);
      expect(res.body.errorsValidation).to.eql([{ status: 'Status must be one of: TODO, IN_PROGRESS, DONE' }]);
    });
  });

  describe('GET /:id', () => {
    it('should return own task and hide somebody else`s task as 404', async () => {
      const created = await createTask(tokens.owner, { title: 'Private task' });
      const id = created.body.data.id;

      let res = await request(app).get(`/v1/tasks/${id}`).set('Authorization', tokens.owner);
      expect(res.status).to.equal(200);
      expect(res.body.data.title).to.equal('Private task');

      res = await request(app).get(`/v1/tasks/${id}`).set('Authorization', tokens.stranger);
      expect(res.status).to.equal(404);

      res = await request(app).get(`/v1/tasks/${id}`).set('Authorization', tokens.admin);
      expect(res.status).to.equal(200);
    });
  });

  describe('PATCH /:id', () => {
    it('should update fields partially and manage completedAt', async () => {
      const created = await createTask(tokens.owner, { title: 'Patch me', description: 'old' });
      const id = created.body.data.id;

      let res = await request(app)
        .patch(`/v1/tasks/${id}`)
        .set('Authorization', tokens.owner)
        .send({ status: 'DONE', description: '' });
      expect(res.status).to.equal(200);
      expect(res.body.data.title).to.equal('Patch me');
      expect(res.body.data.status).to.equal('DONE');
      expect(res.body.data.description).to.equal(null);
      expect(res.body.data.completedAt).to.be.a('string');

      res = await request(app).patch(`/v1/tasks/${id}`).set('Authorization', tokens.owner).send({ status: 'TODO' });
      expect(res.body.data.completedAt).to.equal(null);
    });

    it('should reject an empty update and a foreign task', async () => {
      const created = await createTask(tokens.owner, { title: 'Guarded' });
      const id = created.body.data.id;

      let res = await request(app).patch(`/v1/tasks/${id}`).set('Authorization', tokens.owner).send({ ownerId: 1 });
      expect(res.status).to.equal(400);
      expect(res.body.errorsValidation).to.eql([{ body: 'Nothing to update' }]);

      res = await request(app).patch(`/v1/tasks/${id}`).set('Authorization', tokens.stranger).send({ title: 'Hacked' });
      expect(res.status).to.equal(404);
      const task = await taskRepository.findOne(id);
      expect(task?.title).to.equal('Guarded');
    });
  });

  describe('DELETE /:id', () => {
    it('should delete own task only', async () => {
      const created = await createTask(tokens.owner, { title: 'Delete me' });
      const id = created.body.data.id;

      let res = await request(app).delete(`/v1/tasks/${id}`).set('Authorization', tokens.stranger);
      expect(res.status).to.equal(404);

      res = await request(app).delete(`/v1/tasks/${id}`).set('Authorization', tokens.owner);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.eql({ id });

      res = await request(app).get(`/v1/tasks/${id}`).set('Authorization', tokens.owner);
      expect(res.status).to.equal(404);
    });
  });
});
