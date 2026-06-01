import {useState, useEffect} from 'react';
import {apiFetch} from '../../lib/api';
import styles from './notifications.module.css';
import {formattedTime} from './notifications.utils';
import type {Notification} from './notifications.types';
const NotificationPage = () => {
  //add state variable
  const [notifications, setNotifications] = useState<Notification[]>([]);
  //note that below is not static, it changes because react re-renders the component when state changes,
  // so we get the updated value of unread notifications count on each render.
  const unread = notifications.filter((n) => !n.read).length;
  const fetchNotifs = async () => {
    try {
      const data = await apiFetch('/notifications');
      setNotifications(data);
    } catch {}
  };
  //run only once when component mounts,then every 2 seconds to fetch new notifications.
  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 2000);
    return () => clearInterval(interval);
  }, []);
  const markOne = async (id: string) => {
    //we optimistically mark the notification as read in the UI, then send the request to server.
    //by doing so, we dont have to wait for server response to update the UI, making it feel faster.
    //if id matches, override read property to true,else keep it as is.
    const updated = notifications.map((n) =>
      n.id === id ? {...n, read: true} : n,
    );
    setNotifications(updated);
    try {
      await apiFetch(`/notifications/${id}/read`, {method: 'PATCH'});
    } catch {}
  };
  const markAll = async () => {
    //same here
    const updated = notifications.map((n) => ({...n, read: true}));
    setNotifications(updated);
    try {
      await apiFetch('/notifications/read-all', {method: 'PATCH'});
    } catch {}
  };
  //function for handling click on notification item
  /*
  JSX code:
  at the top,we have notifications
  to the right of that, if there are unread notifications,
   we show a badge with the count and a button to mark all as read.
  below that we have the list of notifications.
  no notifications-> show empty state
  show dot for unread notifications
  then the message itself, finally the time on the right.
  */
  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <h2>Notifications</h2>
          {unread > 0 && <span className={styles.badge}>{unread} new</span>}
        </div>
        {unread > 0 && (
          <button onClick={markAll} className={styles.markAll}>
            Mark all as read
          </button>
        )}
      </div>
      <div className={styles.list}>
        {notifications.length === 0 && (
          <div className={styles.empty}>No notifications</div>
        )}
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`${styles.item} ${n.read ? '' : styles.unread}`}
            onClick={() => !n.read && markOne(n.id)}
            style={{cursor: n.read ? 'default' : 'pointer'}}
          >
            <div className={styles.dot}>{!n.read && <span />}</div>
            <div className={styles.body}>
              <p>{n.msg}</p>
            </div>
            <time className={styles.time}>{formattedTime(n)}</time>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationPage;
