import type {Notification} from './notifications.types';
//convert time to a nice format,eg. just now,5m ago,2h ago,or date if older than 24h
export const formattedTime = (n: Notification) => {
  const d = new Date(n.time);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
};
