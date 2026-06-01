export type TaskType = 'STORY' | 'TASK' | 'BUG';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Comment {
  id: string;
  content: string;
  userId: string;
  parentId?: string | null;
  userName?: string;
  createdAt: string;
  updatedAt?: string;
  replies?: Comment[];
}

export interface AuditEntry {
  id: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  userName?: string;
  createdAt: string;
}

export interface ChildTask {
  id: string;
  title: string;
  type: TaskType;
  priority: Priority;
  status: string;
}

export interface TaskDetail {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: Priority;
  status: string;
  columnId: string;
  assigneeId?: string;
  assigneeName?: string;
  reporterId?: string;
  reporterName?: string;
  dueDate?: string;
  parentId?: string;
  parentTitle?: string;
  children?: ChildTask[];
  comments?: Comment[];
  auditLogs?: AuditEntry[];
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  projectId?: string;
}

export interface Member {
  id: string;
  userId: string;
  role: string;
  user?: {
    name: string;
    email: string;
  };
}

export const typeLabels: Record<TaskType, string> = {
  STORY: 'Story',
  TASK: 'Task',
  BUG: 'Bug',
};

export type EditorTarget = 'new' | 'edit' | 'reply';
