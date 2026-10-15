import { Request, Response } from 'express';

import { asyncHandler } from 'utils/asyncHandler';

import { CreateTaskDto, parseListQuery, toTaskResponse, UpdateTaskDto } from './task.dto';
import { TaskService } from './task.service';

/**
 * Presentation layer: translates HTTP into service calls and back. Thin on purpose —
 * no business rules here. Methods are arrow properties so `this` survives being passed
 * to the router.
 */
export class TaskController {
  constructor(private readonly service: TaskService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = parseListQuery(req.query);
    const tasks = await this.service.list(req.jwtPayload, query);
    res.customSuccess(200, 'List of tasks.', tasks.map(toTaskResponse));
  });

  show = asyncHandler(async (req: Request, res: Response) => {
    const task = await this.service.get(req.jwtPayload, Number(req.params.id));
    res.customSuccess(200, 'Task found.', toTaskResponse(task));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const task = await this.service.create(req.jwtPayload, req.body as CreateTaskDto);
    res.location(`${req.baseUrl}/${task.id}`);
    res.customSuccess(201, 'Task successfully created.', toTaskResponse(task));
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const task = await this.service.update(req.jwtPayload, Number(req.params.id), req.body as UpdateTaskDto);
    res.customSuccess(200, 'Task successfully updated.', toTaskResponse(task));
  });

  destroy = asyncHandler(async (req: Request, res: Response) => {
    const deleted = await this.service.remove(req.jwtPayload, Number(req.params.id));
    res.customSuccess(200, 'Task successfully deleted.', deleted);
  });
}
