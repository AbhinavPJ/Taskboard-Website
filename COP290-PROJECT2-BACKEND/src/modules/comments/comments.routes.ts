import {Router} from 'express';
import {Authenticate} from '../../core/middleware/auth';
import {patchComment, deleteComment} from './comments.controller';

const router = Router();

//The below endpoint allows us to patch a comment.
router.patch('/:id', Authenticate, patchComment);

// The below endpoint allows us to delete a comment.
router.delete('/:id', Authenticate, deleteComment);

export const commentRouter = router;
