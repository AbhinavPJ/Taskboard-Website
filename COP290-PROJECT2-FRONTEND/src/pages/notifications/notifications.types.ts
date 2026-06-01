export interface Notification {
  id: string;
  msg: string;
  read: boolean;
  projId?: string;
  taskId?: string;
  time: string;
}
