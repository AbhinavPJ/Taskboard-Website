import { describe, it, expect } from 'vitest';
import { PORT } from '../core/config/constants';
import { state } from './state';

let testColumnId: string;

describe('create column', () => {
  it('should create a new column in a board', async () => {
    const resResolved = await fetch(
      `http://localhost:${PORT}/api/boards/${state.boardId}/columns`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
        body: JSON.stringify({
          name: 'QA Ready',
          columnType: 'REVIEW',
          position: 12500,
        }),
      },
    );
    const resolvedColumn = await resResolved.json();
    state.resolvedColumnId = resolvedColumn.id;
    const resClosed = await fetch(
      `http://localhost:${PORT}/api/boards/${state.boardId}/columns`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
        body: JSON.stringify({
          name: 'Released',
          columnType: 'DONE',
          position: 13500,
        }),
      },
    );
    const closedColumn = await resClosed.json();
    state.closedColumnId = closedColumn.id;
    const res3 = await fetch(
      `http://localhost:${PORT}/api/boards/${state.boardId}/columns`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
        body: JSON.stringify({
          name: 'Test Column-2',
          columnType: 'TODO',
          position: 1,
        }),
      },
    );
    const data = await res3.json();
    testColumnId = data.id;
    expect(state).toHaveProperty('resolvedColumnId');
    expect(state).toHaveProperty('closedColumnId');
    expect(data).toHaveProperty('id');
    expect(data.name).toBe('Test Column-2');
    expect(data.boardId).toBe(state.boardId);
    expect(data.position).toBe(1);
  });
});
describe('update column', () => {
  it('should update a column in a board', async () => {
    const res4 = await fetch(
      `http://localhost:${PORT}/api/columns/${testColumnId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
        body: JSON.stringify({
          name: 'Updated Test Column-2',
          position: 2,
        }),
      },
    );
    const data = await res4.json();
    expect(data).toHaveProperty('id');
    expect(data.name).toBe('Updated Test Column-2');
    expect(data.boardId).toBe(state.boardId);
    expect(data.position).toBe(2);
  });
});

describe('delete column', () => {
  it('should delete a column in a board', async () => {
    const res4 = await fetch(
      `http://localhost:${PORT}/api/columns/${testColumnId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
      },
    );
    const data = await res4.json();
    expect(data.ok).toBe(true);
  });
});
