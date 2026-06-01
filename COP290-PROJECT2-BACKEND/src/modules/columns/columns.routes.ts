import {Router} from 'express';
import {Authenticate} from '../../core/middleware/auth';
import {
  patchColumn,
  deleteColumn,
  createIssueInColumn,
} from './columns.controller';
const router = Router();

//The below endpoint allows us to patch a column.
router.patch('/:id', Authenticate, patchColumn);

// The below endpoint allows us to delete a column.
router.delete('/:id', Authenticate, deleteColumn);

//The below endpoint allows us to create an issue in a column.
router.post('/:columnId/issues', Authenticate, createIssueInColumn);

export const columnRouter = router;
