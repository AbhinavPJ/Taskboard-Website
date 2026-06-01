import {Router} from 'express';
import {Authenticate} from '../../core/middleware/auth';
import {
  createBoard,
  fetchBoards,
  fetchBoardById,
  patchBoard,
  deleteBoard,
  addColumnToBoard,
  fetchWorkflow,
  patchWorkflow,
} from './boards.controller';
const router = Router();

//The below endpoint allows us to create a board in a project.
router.post('/', Authenticate, createBoard);

//The below endpoint allows us to fetch all boards for a project.
router.get('/', Authenticate, fetchBoards);

//The below endpoint allows us to fetch a board by id
router.get('/:id', Authenticate, fetchBoardById);

//The below endpoint allows us to patch a board
router.patch('/:id', Authenticate, patchBoard);

// The below endpoint allows us to delete a board.
router.delete('/:id', Authenticate, deleteBoard);

//The below endpoint allows us to add a column to a board.
router.post('/:boardId/columns', Authenticate, addColumnToBoard);

//The below endpoint allows us to fetch workflow for a board.
router.get('/:boardId/workflows', Authenticate, fetchWorkflow);

//The below endpoint allows us to patch a workflow in a board.
router.patch('/:boardId/workflows', Authenticate, patchWorkflow);
export const boardRouter = router;
