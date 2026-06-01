import { handleError } from '../../core/middleware/errorhandler';
import * as CommentService from './comments.service';

//Given a comment id and updated content, patch the comment.
export const patchComment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Comment id is required' });
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });
    const result = await CommentService.patchComment(id, req.userId, content);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};

//Given a comment id, delete the comment.
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Comment id is required' });
    const result = await CommentService.deleteComment(id, req.userId);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
};
