import {describe, it, expect} from 'vitest';
import {PORT} from '../core/config/constants';
import {state} from './state';

describe('notifications', () => {
  it('should get notifications for the current user', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/notifications`, {
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
describe('mark all notifications as read', () => {
  it('should mark all notifications as read', async () => {
    const res = await fetch(
      `http://localhost:${PORT}/api/notifications/read-all`,
      {
        method: 'PATCH',
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
describe('mark notification as read', () => {
  it('should mark a notification as read', async () => {
    const res = await fetch(`http://localhost:${PORT}/api/notifications`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: state.cookie,
      },
    });
    const notifications = await res.json();
    if (notifications.length === 0) return;
    const notificationId = notifications[0].id;
    const res2 = await fetch(
      `http://localhost:${PORT}/api/notifications/${notificationId}/read`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: state.cookie,
        },
      },
    );
    const data = await res2.json();
    expect(data.ok).toBe(true);
  });
});
