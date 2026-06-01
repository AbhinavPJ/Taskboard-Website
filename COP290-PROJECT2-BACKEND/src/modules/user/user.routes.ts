import {Router} from 'express';
import {Authenticate} from '../../core/middleware/auth';
import {
  getMe,
  patchMe,
  postAvatar,
  getAllUsers,
  toggleUserRole,
} from './user.controller';
const router = Router();

router.get('/me', Authenticate, getMe);

router.patch('/me', Authenticate, patchMe);

router.post('/avatar', Authenticate, postAvatar);

router.get('/all', Authenticate, getAllUsers);

router.patch('/:id/role', Authenticate, toggleUserRole);

export const userRouter = router;
