import { Router, Request, Response } from 'express';
import { getUsers, getUserById, createUser, deleteUser } from '../data/users';

const router = Router();

router.get('/users', (req: Request, res: Response) => {
  const pageStr = Array.isArray(req.query.page) ? req.query.page[0] : req.query.page;
  const limitStr = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
  const page = parseInt(pageStr as string) || 1;
  const limit = parseInt(limitStr as string) || 10;

  const { data, total } = getUsers(page, limit);

  res.json({ data, total, page, limit });
});

router.get('/users/:id', (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  const user = getUserById(id);

  if (!user) {
    res.status(404).json({ error: 'User not found', status: 404 });
    return;
  }

  res.json(user);
});

router.post('/users', (req: Request, res: Response) => {
  const { name, email, role } = req.body;

  if (!name || !email || !role) {
    res.status(400).json({ error: 'name, email, and role are required', status: 400 });
    return;
  }

  const validRoles = ['admin', 'user', 'viewer'];
  if (!validRoles.includes(role)) {
    res.status(400).json({ error: `role must be one of: ${validRoles.join(', ')}`, status: 400 });
    return;
  }

  const user = createUser(name, email, role);
  res.status(201).json(user);
});

router.delete('/users/:id', (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  const deleted = deleteUser(id);

  if (!deleted) {
    res.status(404).json({ error: 'User not found', status: 404 });
    return;
  }

  res.status(204).send();
});

export default router;
