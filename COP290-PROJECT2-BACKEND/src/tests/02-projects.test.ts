import {describe, it, expect} from 'vitest';
import {PORT} from '../core/config/constants';
import {state} from './state';
describe('create project', () => {
  it('should create a new project', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: state.cookie,
      },
      body: JSON.stringify({
        name: 'Test Project',
        description: 'This is a test project',
        colour: '#ff0000',
      }),
    });
    const data = await res.json();
    state.projectId = data.id;
    expect(data).toHaveProperty('id');
    expect(data.name).toBe('Test Project');
    expect(data.description).toBe('This is a test project');
    expect(data.colour).toBe('#ff0000');
  });
});
describe('List all projects', () => {
  it('should list all projects of the current user', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/projects`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: state.cookie,
      },
    });
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
describe('Get project by id', () => {
  it('should get a project by id', async () => {
    const res2 = await fetch(
      `http://localhost:${PORT}/api/projects/${state.projectId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
      },
    );
    const data = await res2.json();
    expect(data).toHaveProperty('id');
    expect(data.name).toBe('Test Project');
    expect(data.description).toBe('This is a test project');
    expect(data.colour).toBe('#ff0000');
  });
});

describe('update project', () => {
  it('should update a project', async () => {
    const res2 = await fetch(
      `http://localhost:${PORT}/api/projects/${state.projectId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
        body: JSON.stringify({
          name: 'Updated Test Project',
          description: 'This is an updated test project',
          colour: '#00ffff',
        }),
      },
    );
    const data = await res2.json();
    expect(data).toHaveProperty('id');
    expect(data.name).toBe('Updated Test Project');
    expect(data.description).toBe('This is an updated test project');
    expect(data.colour).toBe('#00ffff');
  });
});

describe('archive project', () => {
  //send isArchived: true in the request body to archive the project. for unarchiving, send isArchived: false.
  it('should archive a project', async () => {
    const res2 = await fetch(
      `http://localhost:${PORT}/api/projects/${state.projectId}/archive`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
        body: JSON.stringify({
          isArchived: true,
        }),
      },
    );
    const data = await res2.json();
    expect(data.ok).toBe(true);
  });
});

describe('get project members', () => {
  it('should get all members of a project', async () => {
    const res2 = await fetch(
      `http://localhost:${PORT}/api/projects/${state.projectId}/members`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
      },
    );
    const data = await res2.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

describe('add project member', () => {
  it('should add a member to a project', async () => {
    const res0 = await fetch(`http://localhost:${PORT}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User 2',
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'password123',
      }),
    });
    const newUser = await res0.json();
    const res2 = await fetch(
      `http://localhost:${PORT}/api/projects/${state.projectId}/members`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
        body: JSON.stringify({
          email: newUser.email,
          role: 'MEMBER',
        }),
      },
    );
    const data = await res2.json();
    expect(data).toHaveProperty('userId');
    expect(data).toHaveProperty('projectId');
    expect(data).toHaveProperty('role');
    expect(data.userId).toBe(newUser.id);
    expect(data.projectId).toBe(state.projectId);
    expect(data.role).toBe('MEMBER');
  });
});

describe('update member role', () => {
  it("should update a member's role in a project", async () => {
    const res2 = await fetch(
      `http://localhost:${PORT}/api/projects/${state.projectId}/members`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
      },
    );
    const members = await res2.json();
    const userId = members[1].userId;
    const memberId = members[1].id;
    const res3 = await fetch(
      `http://localhost:${PORT}/api/projects/${state.projectId}/members/${userId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
        body: JSON.stringify({
          role: 'VIEWER',
        }),
      },
    );
    const data = await res3.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('userId');
    expect(data).toHaveProperty('projectId');
    expect(data).toHaveProperty('role');
    expect(data.userId).toBe(userId);
    expect(data.projectId).toBe(state.projectId);
    expect(data.role).toBe('VIEWER');
  });
});

describe('remove project member', () => {
  it('should remove a member from a project', async () => {
    const res2 = await fetch(
      `http://localhost:${PORT}/api/projects/${state.projectId}/members`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
      },
    );
    const members = await res2.json();
    const userId = members[1].userId;
    const memberId = members[1].id;
    const res3 = await fetch(
      `http://localhost:${PORT}/api/projects/${state.projectId}/members/${userId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
      },
    );
    const data = await res3.json();
    expect(data.ok).toBe(true);
  });
});
