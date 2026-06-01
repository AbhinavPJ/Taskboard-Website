import styles from './kanbanboard.module.css';
// defining how our data looks so typescript doesn't yell at us later
export type TaskType = 'STORY' | 'TASK' | 'BUG';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ColumnType = 'TODO' | 'INPROGRESS' | 'REVIEW' | 'DONE';
export type ColumnScope = 'STORY' | 'TASKBUG';

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  position: number;
  priority: Priority;
  assigneeId?: string;
  assigneeName?: string;
  reporterId?: string;
  reporterName?: string;
  dueDate?: string;
  parentId?: string;
  columnId: string;
  createdAt?: string;
}

export interface Col {
  id: string;
  name: string;
  columnType: ColumnType;
  scope: ColumnScope;
  isImmutable: boolean;
  position: number;
  limit?: number; // this is our WIP limit!
  tasks: Task[];
  colour?: string;
}

export interface Board {
  id: string;
  name: string;
  projectId: string;
  resolvedColumnType?: ColumnType;
  closedColumnType?: ColumnType;
  columns: Col[];
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

// color palette for our column headers so they look pretty
export const colColors = [
  '#4e7bff',
  '#f5a623',
  '#a78bfa',
  '#00c48c',
  '#e84393',
  '#fd79a8',
];

// css helpers mapping to our module classes
export const typeClass: Record<TaskType, string> = {
  STORY: styles.typeStory,
  TASK: styles.typeTask,
  BUG: styles.typeBug,
};
export const typeLabel: Record<TaskType, string> = {
  STORY: 'S',
  TASK: 'T',
  BUG: 'B',
};
export const priorityType: Record<Priority, string> = {
  LOW: styles.lowPriority,
  MEDIUM: styles.mediumPriority,
  HIGH: styles.highPriority,
  CRITICAL: styles.criticalPriority,
};
export const priorityLabel: Record<Priority, string> = {
  LOW: 'LOW',
  MEDIUM: 'MED',
  HIGH: 'HIGH',
  CRITICAL: 'CRIT',
};

// we use this to sort tasks so critical ones float to the top
export const priorityOrder: Record<Priority, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
};
