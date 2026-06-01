import {describe, it, expect} from 'vitest';
import {PORT} from '../core/config/constants';
import {state} from './state';
describe('dashboard stats', () => {
  it('should get dashboard stats', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/dashboard/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: state.cookie,
      },
    });
    const data = await res.json();
    expect(data).toHaveProperty('totalProjects');
    expect(data).toHaveProperty('assignedTasks');
    expect(data).toHaveProperty('activeTasks');
    expect(data).toHaveProperty('completedTasks');
  });
});
describe('recent projects', () => {
  it('should get recent projects', async () => {
    const res = await fetch(
      `http://localhost:${PORT}/api/dashboard/recent-projects`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
      },
    );
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
describe('recent activity', () => {
  it('should get recent activity', async () => {
    const res = await fetch(
      `http://localhost:${PORT}/api/dashboard/recent-activity`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
      },
    );
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
