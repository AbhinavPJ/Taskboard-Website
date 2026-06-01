import * as IssueService from './issues.service';
import * as MoveService from './issues.move';
import * as PatchService from './issues.patch';
import { handleError } from '../../core/middleware/errorhandler';

//Given issue id, fetch issue details.
export const fetchIssueById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Issue id is required' });
    const result = await IssueService.fetchIssueById(id);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

//Given issue id and updated details, patch the issue.
export const patchIssue = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Issue id is required' });
    const { title, description, type, priority, assigneeId, dueDate } =
      req.body;
    const result = await PatchService.patchIssue(id, req.userId, {
      title,
      description,
      type,
      priority,
      assigneeId,
      dueDate,
    });
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

//Given an issue id and column details, move the issue to the specified column.
export const moveIssue = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Issue id is required' });
    const { columnId, position } = req.body;
    if (!columnId)
      return res.status(400).json({ error: 'columnId is required' });
    const result = await MoveService.moveIssue(id, req.userId, columnId);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

//Given an issue id, delete the issue.
export const deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Issue id is required' });
    const result = await IssueService.deleteIssue(id, req.userId);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

//Given an issue id and comment content, create a comment on the issue.
export const createCommentOnIssue = async (req, res) => {
  try {
    const { issueId } = req.params;
    if (!issueId)
      return res.status(400).json({ error: 'Issue id is required' });
    const { content, parentId } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });
    const result = await IssueService.createCommentOnIssue(
      issueId,
      req.userId,
      content,
      parentId,
    );
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
};

//Given an issue id, fetch the most recent activity logs for that issue.
export const fetchIssueActivity = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Issue id is required' });
    const result = await IssueService.fetchIssueActivity(id, req.userId);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};
