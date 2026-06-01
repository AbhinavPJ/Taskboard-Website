import {expect, describe, it} from 'vitest';
import {PORT} from '../core/config/constants';
import {state} from './state';
let cookie: string;
describe('User registration', () => {
  it('should register a new user', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      }),
    });
    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data.name).toBe('Test User');
    expect(data.username).toBe('testuser');
    expect(data.email).toBe('test@example.com');
  });
});
describe('User login', () => {
  it('should login an existing user', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });
    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data.name).toBe('Test User');
    expect(data.username).toBe('testuser');
    expect(data.email).toBe('test@example.com');
    const setCookieHeader = res.headers.get('set-cookie') || '';
    const cookies = setCookieHeader
      .split(', ')
      .map((cookie) => {
        return cookie.split(';')[0];
      })
      .join('; ');
    state.cookie = cookies;
  });
});
describe('Get current user', () => {
  it('should get the current logged in user', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/user/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: state.cookie,
      },
    });
    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data.name).toBe('Test User');
    expect(data.username).toBe('testuser');
    expect(data.email).toBe('test@example.com');
  });
});
describe('Refresh token', () => {
  it('should refresh the access token', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: state.cookie,
      },
    });
    const data = await res.json();
    expect(data.ok).toBe(true);
  });
});

describe('update user profile', () => {
  it('should update the profile of the current user', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/user/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: state.cookie,
      },
      body: JSON.stringify({
        name: 'Updated User',
        email: 'updated@example.com',
      }),
    });
    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data.name).toBe('Updated User');
    expect(data.email).toBe('updated@example.com');
  });
});
