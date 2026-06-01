import { handleError } from '../../core/middleware/errorhandler';
import { prisma } from '../../core/database/db';
import * as BoardService from './boards.service';

//given projectId,fetch all boards for that project.
export const fetchBoards = async (req, res) => {
  try {
    const projectId = req.query.projectId;
    if (!projectId)
      return res
        .status(400)
        .json({ error: 'projectId query parameter is required' });
    const boards = await BoardService.fetchBoardsForProject(
      projectId,
      req.userId,
    );
    res.json(boards);
  } catch (error) {
    handleError(res, error);
  }
};

//Given a projetId and board details, create a board.
export const createBoard = async (req, res) => {
  try {
    const {
      name,
      projectId,
      description,
      resolvedColumnType,
      closedColumnType,
    } = req.body;
    if (!name) return res.status(400).json({ error: 'Board name is required' });
    if (!projectId)
      return res.status(400).json({ error: 'Project ID is required' });
    const valid = ['TODO', 'INPROGRESS', 'REVIEW', 'DONE'];
    if (
      resolvedColumnType !== undefined &&
      !valid.includes(String(resolvedColumnType).toUpperCase())
    )
      return res.status(400).json({ error: 'Invalid resolved column type' });
    if (
      closedColumnType !== undefined &&
      !valid.includes(String(closedColumnType).toUpperCase())
    )
      return res.status(400).json({ error: 'Invalid closed column type' });
    const createdBoard = await BoardService.createBoard(
      projectId,
      req.userId,
      name,
      description,
      resolvedColumnType,
      closedColumnType,
    );
    res.status(201).json(createdBoard);
  } catch (error) {
    handleError(res, error);
  }
};

//given a boardId, fetch board details along with columns and issues.
export const fetchBoardById = async (req, res) => {
  try {
    const board = await BoardService.fetchBoardById(req.params.id, req.userId);
    return res.status(200).json(board);
  } catch (error) {
    handleError(res, error);
  }
};

//given a boardId and updated details, update the board.
export const patchBoard = async (req, res) => {
  try {
    const boardId = req.params.id;
    const userId = req.userId;
    const { name, description, resolvedColumnType, closedColumnType } =
      req.body;
    if (!boardId)
      return res.status(400).json({ error: 'Board ID is required' });
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const valid = ['TODO', 'INPROGRESS', 'REVIEW', 'DONE'];
    if (
      resolvedColumnType !== undefined &&
      !valid.includes(String(resolvedColumnType).toUpperCase())
    )
      return res.status(400).json({ error: 'Invalid resolved column type' });
    if (
      closedColumnType !== undefined &&
      !valid.includes(String(closedColumnType).toUpperCase())
    )
      return res.status(400).json({ error: 'Invalid closed column type' });
    const updatedBoard = await BoardService.patchBoard(
      boardId,
      userId,
      name,
      description,
      resolvedColumnType,
      closedColumnType,
    );
    res.json(updatedBoard);
  } catch (error) {
    handleError(res, error);
  }
};

//given a boardId, delete the board.
export const deleteBoard = async (req, res) => {
  try {
    const boardId = req.params.id;
    await BoardService.deleteBoard(boardId, req.userId);
    res.json({ ok: true });
  } catch (error) {
    handleError(res, error);
  }
};

//given a boardId, add a column to the board.
export const addColumnToBoard = async (req, res) => {
  try {
    const boardId = req.params.boardId;
    const { name, columnType, limit } = req.body;
    if (!name)
      return res.status(400).json({ error: 'Column name is required' });
    if (!columnType)
      return res.status(400).json({ error: 'Column type is required' });
    const valid = ['TODO', 'INPROGRESS', 'REVIEW', 'DONE'];
    if (!valid.includes(String(columnType).toUpperCase()))
      return res.status(400).json({ error: 'Invalid column type' });
    if (
      limit !== undefined &&
      (!Number.isInteger(Number(limit)) || Number(limit) < 0)
    )
      return res
        .status(400)
        .json({ error: 'WIP limit must be a non-negative integer' });
    const board = await BoardService.addColumnToBoard(
      boardId,
      req.userId,
      name,
      columnType,
      req.body.position,
      limit !== undefined ? Number(limit) : undefined,
    );
    res.status(201).json(board);
  } catch (error) {
    handleError(res, error);
  }
};

//We send a pair of source and target column ids, if the pair exists in workflow, it means transition is not allowed.
export const fetchWorkflow = async (req, res) => {
  try {
    const boardId = req.params.boardId;
    const workflow = await BoardService.fetchWorkflow(boardId, req.userId);
    res.json(workflow);
  } catch (error) {
    handleError(res, error);
  }
};

//We accept a pair of columnIds (source and target), occurence of (source,target) means that transition is not allowed.
export const patchWorkflow = async (req, res) => {
  try {
    const boardId = req.params.boardId;
    const { workflow } = req.body;
    if (!workflow)
      return res.status(400).json({ error: 'Workflow data is required' });
    const updatedWorkflow = await BoardService.patchWorkflow(
      boardId,
      req.userId,
      workflow,
    );
    res.json(updatedWorkflow);
  } catch (error) {
    handleError(res, error);
  }
};
