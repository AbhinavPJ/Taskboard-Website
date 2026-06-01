import {Router} from 'express';
import {Authenticate} from '../../core/middleware/auth';
import {
  fetchIssueById,
  fetchIssueActivity,
  patchIssue,
  moveIssue,
  deleteIssue,
  createCommentOnIssue,
} from './issues.controller';
export {deriveStoryStatus} from './issues.service';

const router = Router();

//The below endpoint allows us to fetch an issue by id.
router.get('/:id', Authenticate, fetchIssueById);

//The below endpoint allows us to fetch recent issue activity.
router.get('/:id/activity', Authenticate, fetchIssueActivity);

//The below endpoint allows us to patch an issue.
router.patch('/:id', Authenticate, patchIssue);

//The below endpoint allows us to move an issue to a different column.
router.patch('/:id/move', Authenticate, moveIssue);

//The below endpoint allows us to delete an issue.
router.delete('/:id', Authenticate, deleteIssue);

//The below endpoint allows us to create a comment.
router.post('/:issueId/comments', Authenticate, createCommentOnIssue);

export const issueRouter = router;
