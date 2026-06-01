import styles from './kanbanboard.module.css';
import {useState} from 'react';
import type {
  ColumnType,
  Member,
  Priority,
  Task,
  TaskType,
} from './kanbanboard.types';
import {
  typeClass,
  typeLabel,
  priorityType,
  priorityLabel,
} from './kanbanboard.types';
import WorkflowTransitionManager from '../../components/workflow/workflow';
// modal for making a new task. We just make a form
export const CreateTaskModal = ({
  onClose,
  onSubmit,
  members,
  allStories,
}: {
  onClose: () => void;
  onSubmit: (form: any) => void;
  members: Member[];
  allStories: Task[];
}) => {
  // it is convenient to keep entire form data in one state object.
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'TASK' as TaskType,
    pri: 'MEDIUM' as Priority,
    assignee: '',
    dueDate: '',
    parentId: '',
  });
  // helper function to update form-data
  const updateForm = (key: string, value: string) =>
    setForm((prev) => ({...prev, [key]: value}));
  /*
  JSX code:
  at the top, new task header
  below that we have two form entries, one for
  title,one for description.
  below that we have two drop downs, one for type and one for priority.
  below that two more drop downs, one for assignee and one for due date.
  below that, if the task isn't a story, we can assign a parent story
  Finally, we have cancel and create buttons at the bottom.
  */
  return (
    <div className={styles.overlay} onClick={onClose}>
      <form
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(form);
        }}
      >
        <h3>New Task</h3>
        <div className={styles.gp}>
          <label>Title</label>
          <input
            type="text"
            placeholder="What needs to be done?"
            value={form.title}
            onChange={(e) => updateForm('title', e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className={styles.gp}>
          <label>Description</label>
          <textarea
            className={styles.textarea}
            placeholder="Describe the task in a few more words"
            value={form.description}
            onChange={(e) => updateForm('description', e.target.value)}
            rows={3}
          />
        </div>
        <div className={styles.row}>
          <div className={styles.gp}>
            <label>Type</label>
            <select
              className={styles.select}
              value={form.type}
              onChange={(e) => updateForm('type', e.target.value)}
            >
              <option value="TASK">Task</option>
              <option value="STORY">Story</option>
              <option value="BUG">Bug</option>
            </select>
          </div>
          <div className={styles.gp}>
            <label>Priority</label>
            <select
              className={styles.select}
              value={form.pri}
              onChange={(e) => updateForm('pri', e.target.value)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.gp}>
            <label>Assignee</label>
            <select
              className={styles.select}
              value={form.assignee}
              onChange={(e) => updateForm('assignee', e.target.value)}
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user?.name || m.user?.email || m.userId}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.gp}>
            <label>Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => updateForm('dueDate', e.target.value)}
            />
          </div>
        </div>
        {form.type !== 'STORY' && allStories.length > 0 && (
          <div className={styles.gp}>
            <label>Parent Story (optional)</label>
            <select
              value={form.parentId}
              onChange={(e) => updateForm('parentId', e.target.value)}
            >
              <option value="">None</option>
              {allStories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className={styles.modalActions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.createBtn}>
            Create
          </button>
        </div>
      </form>
    </div>
  );
};

// modal for adding a new column to the board
export const AddColumnModal = ({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (form: any) => void;
}) => {
  const [form, setForm] = useState({
    name: '',
    type: 'TODO' as ColumnType,
    wip: '',
  });
  /* 
  JSX code:
  We have a form with three entries, one for column name, one for column type and one for WIP limit.
  first is text,second is drop down, third is number input.We ensure that number input is positive.
  finally we have cancel and add column buttons at the bottom.
  */
  return (
    <div className={styles.overlay} onClick={onClose}>
      <form
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(form);
        }}
      >
        <h3>Add Column</h3>
        <div className={styles.gp}>
          <label>Column Name</label>
          <input
            type="text"
            placeholder="e.g. QA Testing"
            value={form.name}
            onChange={(e) => setForm({...form, name: e.target.value})}
            required
            autoFocus
          />
        </div>
        <div className={styles.gp}>
          <label>Column Type</label>
          <select
            className={styles.select}
            value={form.type}
            onChange={(e) =>
              setForm({...form, type: e.target.value as ColumnType})
            }
          >
            <option value="TODO">Todo</option>
            <option value="INPROGRESS">In Progress</option>
            <option value="REVIEW">Review</option>
            <option value="DONE">Done</option>
          </select>
        </div>
        <div className={styles.gp}>
          <label>WIP Limit (optional)</label>
          <input
            type="number"
            placeholder="Max tasks in this column"
            value={form.wip}
            onChange={(e) => setForm({...form, wip: e.target.value})}
            min="0"
          />
        </div>
        <div className={styles.modalActions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.createBtn}>
            Add Column
          </button>
        </div>
      </form>
    </div>
  );
};

// modal to create a completely new board inside the project
export const CreateBoardModal = ({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (form: any) => void;
}) => {
  const [form, setForm] = useState({
    name: '',
    desc: '',
    resolvedColumnType: 'REVIEW' as ColumnType,
    closedColumnType: 'DONE' as ColumnType,
  });
  /* 
  We have a simple form with 2 entries,
  below that we have two buttons
  first one cancels, second one persists the new board and 
  navigates to the new board.
  */
  return (
    <div className={styles.overlay} onClick={onClose}>
      <form
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(form);
        }}
      >
        <h3>New Board</h3>
        <div className={styles.gp}>
          <label>Board Name</label>
          <input
            type="text"
            placeholder="e.g. COP290 Assignment 2"
            value={form.name}
            onChange={(e) => setForm({...form, name: e.target.value})}
            required
            autoFocus
          />
        </div>
        <div className={styles.gp}>
          <label>Description (optional)</label>
          <textarea
            className={styles.textarea}
            placeholder="What is this board for?"
            value={form.desc}
            onChange={(e) => setForm({...form, desc: e.target.value})}
            rows={2}
          />
        </div>
        <div className={styles.row}>
          <div className={styles.gp}>
            <label>Resolved Status Type</label>
            <select
              className={styles.select}
              value={form.resolvedColumnType}
              onChange={(e) =>
                setForm({
                  ...form,
                  resolvedColumnType: e.target.value as ColumnType,
                })
              }
            >
              <option value="TODO">Todo</option>
              <option value="INPROGRESS">In Progress</option>
              <option value="REVIEW">Review</option>
              <option value="DONE">Done</option>
            </select>
          </div>
          <div className={styles.gp}>
            <label>Closed Status Type</label>
            <select
              className={styles.select}
              value={form.closedColumnType}
              onChange={(e) =>
                setForm({
                  ...form,
                  closedColumnType: e.target.value as ColumnType,
                })
              }
            >
              <option value="TODO">Todo</option>
              <option value="INPROGRESS">In Progress</option>
              <option value="REVIEW">Review</option>
              <option value="DONE">Done</option>
            </select>
          </div>
        </div>
        <div className={styles.modalActions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.createBtn}>
            Create Board
          </button>
        </div>
      </form>
    </div>
  );
};

// simple wrapper for workflow transition manager component.
export const ManageWorkflowModal = ({
  boardId,
  onClose,
}: {
  boardId: string;
  onClose: () => void;
}) => (
  <div className={styles.overlay} onClick={onClose}>
    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
      <div className={styles.modalHead}>
        <h3>Manage Workflow</h3>
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>
      </div>
      <WorkflowTransitionManager boardId={boardId} />
    </div>
  </div>
);

export const TaskCard = ({
  task,
  isViewer,
  onOpen,
  onDragStart,
  onDragEnd,
}: {
  task: Task;
  isViewer: boolean;
  onOpen: (id: string) => void;
  onDragStart?: (e: React.DragEvent, taskId: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}) => {
  // stories can't be dragged because their status depends on their child tasks
  const isStory = task.type === 'STORY';
  // if they are a viewer or it's a story, dragging is blocked
  const canDrag = !isStory && !isViewer;
  return (
    <div
      className={`${styles.task} ${isStory ? styles.storyCard : ''} ${isViewer ? styles.viewerCard : ''}`}
      draggable={canDrag}
      onDragStart={(e) => canDrag && onDragStart && onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(task.id)}
      title={
        isStory ? 'Story status is derived from children — cannot drag' : ''
      }
    >
      <div className={styles.taskTop}>
        <span className={`${styles.typeIcon} ${typeClass[task.type]}`}>
          {typeLabel[task.type]}
        </span>
        <span className={styles.taskTitle}>{task.title}</span>
      </div>
      <div className={styles.taskBottom}>
        <span className={`${styles.priority} ${priorityType[task.priority]}`}>
          {priorityLabel[task.priority]}
        </span>
      </div>
    </div>
  );
};
