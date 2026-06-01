export interface Member {
  id: string;
  userId: string;
  user?: {
    name: string;
    email: string;
  };
  role: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  colour: string;
  tasks: number;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
  members?: Member[];
}
