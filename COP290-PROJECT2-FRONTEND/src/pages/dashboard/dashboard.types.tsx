export interface Stats {
  totalProjects: number;
  activeTasks: number;
  completedTasks: number;
  assignedTasks: number;
}
export interface Project {
  id: string;
  name: string;
  description: string;
  colour: string;
  tasks: number;
}
export interface Activity {
  id: string;
  ini: string;
  what: string;
  tag: string;
  ago: string;
  read: boolean;
}
