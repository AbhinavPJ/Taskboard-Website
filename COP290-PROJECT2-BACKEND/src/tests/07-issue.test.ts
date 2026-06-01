import { describe, it, expect } from 'vitest';
import { PORT } from '../core/config/constants';
import { state } from './state';
describe('get issue given id', () => {
  it('Get an issue by id', async () => {
    const res5 = await fetch(
      `http://localhost:${PORT}/api/issues/${state.issueId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
      },
    );
    const data = await res5.json();
    expect(data).toHaveProperty('id');
    expect(data.title).toBe('Test Issue');
    expect(data.columnId).toBe(state.columnId);
  });
});

describe('update issue', () => {
  it('should update an issue by id', async () => {
    const res5 = await fetch(
      `http://localhost:${PORT}/api/issues/${state.issueId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
        body: JSON.stringify({
          title: 'Updated Test Issue',
          description: 'This is an updated test issue',
          type: 'BUG',
          priority: 'MEDIUM',
        }),
      },
    );
    const data = await res5.json();
    expect(data).toHaveProperty('id');
    expect(data.title).toBe('Updated Test Issue');
    expect(data.type).toBe('BUG');
    expect(data.priority).toBe('MEDIUM');
  });
});

describe('configure board status mapping', () => {
  it('should configure resolved and closed status at board level', async () => {
    const res = await fetch(
      `http://localhost:${PORT}/api/boards/${state.boardId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
        body: JSON.stringify({
          resolvedColumnType: 'REVIEW',
          closedColumnType: 'DONE',
        }),
      },
    );
    const data = await res.json();
    expect(data.resolvedColumnType).toBe('REVIEW');
    expect(data.closedColumnType).toBe('DONE');
  });
});

describe('move issue', () => {
  it('should set resolvedAt when moved into resolved type', async () => {
    const res = await fetch(
      `http://localhost:${PORT}/api/issues/${state.issueId}/move`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
        body: JSON.stringify({
          columnId: state.resolvedColumnId,
        }),
      },
    );
    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data.resolvedAt === null).toBe(false);
    expect(data.closedAt).toBeNull();
  });

  it('should set closedAt and clear resolvedAt if moved to closed type only', async () => {
    const res = await fetch(
      `http://localhost:${PORT}/api/issues/${state.issueId}/move`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
        body: JSON.stringify({
          columnId: state.closedColumnId,
        }),
      },
    );
    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data.closedAt === null).toBe(false);
    expect(data.resolvedAt).toBeNull();
  });

  it('should clear both timestamps when moved out of configured columns', async () => {
    const res = await fetch(
      `http://localhost:${PORT}/api/issues/${state.issueId}/move`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
        body: JSON.stringify({
          columnId: state.columnId,
        }),
      },
    );
    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data.title).toBe('Updated Test Issue');
    expect(data.resolvedAt).toBeNull();
    expect(data.closedAt).toBeNull();
  });
});

describe('delete issue', () => {
  it('should delete an issue by id', async () => {
    const res5 = await fetch(
      `http://localhost:${PORT}/api/issues/${state.issueId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
      },
    );
    const data = await res5.json();
    expect(data.ok).toBe(true);
  });
});
