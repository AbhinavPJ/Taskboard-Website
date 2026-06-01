import {describe, it, expect} from 'vitest';
import {PORT} from '../core/config/constants';
import {state} from './state';

describe('create board', () => {
  it('should create a new board', async () => {
    const res2 = await fetch(`http://localhost:${PORT}/api/boards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: state.cookie,
      },
      body: JSON.stringify({
        name: 'Test Board',
        projectId: state.projectId,
        description: 'This is a test board',
      }),
    });
    const data = await res2.json();
    state.boardId = data.id;
    expect(data).toHaveProperty('id');
    expect(data.name).toBe('Test Board');
    expect(data.projectId).toBe(state.projectId);
    expect(data.description).toBe('This is a test board');
  });
});
describe('Get board by id', () => {
  it('should get a board by id', async () => {
    const res3 = await fetch(
      `http://localhost:${PORT}/api/boards/${state.boardId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
      },
    );
    const data = await res3.json();
    expect(data).toHaveProperty('id');
    expect(data.name).toBe('Test Board');
    expect(data.projectId).toBe(state.projectId);
    expect(data.description).toBe('This is a test board');
  });
});
describe('create issue in column', () => {
  it('should create a new issue in a column', async () => {
    const res3 = await fetch(
      `http://localhost:${PORT}/api/boards/${state.boardId}/columns`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
        body: JSON.stringify({
          name: 'Test Column',
          columnType: 'TODO',
          position: 0,
        }),
      },
    );
    const column = await res3.json();
    state.columnId = column.id;
    const res4 = await fetch(
      `http://localhost:${PORT}/api/columns/${column.id}/issues`,
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
    const data = await res4.json();
    state.issueId = data.id;
    expect(data).toHaveProperty('id');
    expect(data.title).toBe('Test Issue');
    expect(data.columnId).toBe(column.id);
    expect(data.description).toBe('This is a test issue');
    expect(data.priority).toBe('HIGH');
  });
});
