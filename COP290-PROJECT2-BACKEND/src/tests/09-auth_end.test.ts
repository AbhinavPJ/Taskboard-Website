import {vitest, describe, it, expect} from 'vitest';
import {PORT} from '../core/config/constants';
import {state} from './state';
describe('Update avatar', () => {
  it('should update the avatar of the current user', async () => {
    const avatar = 'https://www.w3schools.com/w3images/avatar6.png';
    const res = await fetch(`http://localhost:${PORT}/api/user/avatar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: state.cookie,
      },
      body: JSON.stringify({
        avatar,
      }),
    });
    const data = await res.json();
    expect(data).toHaveProperty('avatar');
    expect(data.avatar).toBe(avatar);
  });
});
describe('User logout', () => {
  it('should logout the current user', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/auth/logout`, {
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
