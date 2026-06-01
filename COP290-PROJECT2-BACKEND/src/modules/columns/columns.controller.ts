import * as ColumnService from './columns.service';
import { handleError } from '../../core/middleware/errorhandler';

//Given a column id, patch column's name, position or wip limit.
export const patchColumn = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Column id is required' });
    const { name, position, limit, columnType } = req.body;
    if (
      name === undefined &&
      position === undefined &&
      limit === undefined &&
      columnType === undefined
    )
      return res.status(400).json({ error: 'No fields to update' });
    const valid = ['TODO', 'INPROGRESS', 'REVIEW', 'DONE'];
    if (
      columnType !== undefined &&
      !valid.includes(String(columnType).toUpperCase())
    )
      return res.status(400).json({ error: 'Invalid column type' });
    const result = await ColumnService.patchColumn(
      id,
      req.userId,
      name,
      position,
      limit,
      columnType,
    );
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

//Given a column id, delete the column.
export const deleteColumn = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Column id is required' });
    const result = await ColumnService.deleteColumn(id, req.userId);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

//Given a column id and issue details, create an issue in the column.
export const createIssueInColumn = async (req, res) => {
  try {
    const { columnId } = req.params;
    if (!columnId)
      return res.status(400).json({ error: 'Column id is required' });
    const {
      title,
      description,
      type,
      priority,
      assigneeId,
      parentId,
      dueDate,
    } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    if (!type) return res.status(400).json({ error: 'Type is required' });
    if (!priority)
      return res.status(400).json({ error: 'Priority is required' });
    const issue = await ColumnService.createIssueInColumn(
      columnId,
      req.userId,
      title,
      description,
      type,
      priority,
      assigneeId,
      parentId,
      dueDate,
    );
    res.status(201).json(issue);
  } catch (error) {
    handleError(res, error);
  }
};
