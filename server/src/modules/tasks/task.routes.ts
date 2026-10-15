import { Router } from 'express';

import { checkJwt } from 'middleware/checkJwt';

import { TaskController } from './task.controller';
import { validateTaskBody } from './task.dto';
import { TaskRepository } from './task.repository';
import { TaskService } from './task.service';

// Composition root of the module: dependencies are created here once and injected
// through constructors (Controller -> Service -> Repository).
const controller = new TaskController(new TaskService(new TaskRepository()));

const router = Router();

// Router-level middleware: every /v1/tasks endpoint requires a valid JWT.
router.use(checkJwt);

router.get('/', controller.list);
router.post('/', validateTaskBody('create'), controller.create);
router.get('/:id([0-9]+)', controller.show);
router.patch('/:id([0-9]+)', validateTaskBody('update'), controller.update);
router.delete('/:id([0-9]+)', controller.destroy);

export default router;
