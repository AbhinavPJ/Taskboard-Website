import { vitest, describe, it, expect } from 'vitest';
import { PORT } from '../core/config/constants';
import { state } from './state';
describe('add comment to issue', () => {
  it('should add a comment to an issue', async () => {
    const res4 = await fetch(
      `http://localhost:${PORT}/api/columns/${state.columnId}/issues`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
        body: JSON.stringify({
          title: 'Test Issue',
          description: 'This is a test issue',
          type: 'TASK',
          priority: 'HIGH',
        }),
      },
    );
    const issue = await res4.json();
    state.issueId = issue.id;
    const res6 = await fetch(
      `http://localhost:${PORT}/api/issues/${state.issueId}/comments`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
        body: JSON.stringify({
          content: 'This is a test comment',
        }),
      },
    );
    const comment = await res6.json();
    expect(comment).toHaveProperty('id');
    state.commentId = comment.id;
    expect(comment.content).toBe('This is a test comment');
    expect(comment.issueId).toBe(state.issueId);
  });

  it('should add a reply comment with parentId', async () => {
    const res = await fetch(
      `http://localhost:${PORT}/api/issues/${state.issueId}/comments`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
        body: JSON.stringify({
          content: 'This is a reply comment',
          parentId: state.commentId,
        }),
      },
    );
    const reply = await res.json();
    state.replyCommentId = reply.id;
    expect(reply).toHaveProperty('id');
    expect(reply.parentId).toBe(state.commentId);
  });

  it('should fetch issue comments as a nested thread', async () => {
    const res = await fetch(
      `http://localhost:${PORT}/api/issues/${state.issueId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
      },
    );
    const issue = await res.json();
    const rootComment = issue.comments.find((c) => c.id === state.commentId);
    expect(issue.comments.some((c) => c.id === state.commentId)).toBe(true);
    expect(Array.isArray(rootComment.replies)).toBe(true);
    const replyComment = rootComment.replies.find(
      (c) => c.id === state.replyCommentId,
    );
    expect(rootComment.replies.some((c) => c.id === state.replyCommentId)).toBe(
      true,
    );
    expect(replyComment.parentId).toBe(state.commentId);
  });
});
describe('update comment of an issue', () => {
  it('should update a comment of an issue', async () => {
    const res = await fetch(
      `http://localhost:${PORT}/api/comments/${state.commentId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
        body: JSON.stringify({
          content: 'This is an updated test comment',
        }),
      },
    );
    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data.content).toBe('This is an updated test comment');
  });
});

describe('delete comment of an issue', () => {
  it('should delete a comment of an issue', async () => {
    const resReply = await fetch(
      `http://localhost:${PORT}/api/comments/${state.replyCommentId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
      },
    );
    const replyData = await resReply.json();
    expect(replyData.ok).toBe(true);

    const res = await fetch(
      `http://localhost:${PORT}/api/comments/${state.commentId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
      },
    );
    const data = await res.json();
    expect(data.ok).toBe(true);
  });
});
