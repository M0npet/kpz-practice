import { Router } from 'express';

import tasks from 'modules/tasks/task.routes';

import auth from './auth';
import users from './users';

const router = Router();

router.use('/auth', auth);
router.use('/users', users);
router.use('/tasks', tasks);

export default router;
