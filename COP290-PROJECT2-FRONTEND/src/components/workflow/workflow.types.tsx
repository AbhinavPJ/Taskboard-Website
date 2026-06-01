export interface Column {
  id: string;
  name: string;
  scope?: 'STORY' | 'TASKBUG';
}

export interface BlockedPair {
  sourceColumnId: string;
  targetColumnId: string;
}

export interface Props {
  boardId: string;
  onClose?: () => void;
}
