import {useState, useRef, useEffect, useContext, useCallback} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {AuthContext} from '../../context/auth';
import {apiFetch} from '../../lib/api';
import styles from './kanbanboard.module.css';
import type {
  Board,
  Col,
  Member,
  Task,
  ColumnType,
  ColumnScope,
} from './kanbanboard.types';
import {colColors, priorityOrder} from './kanbanboard.types';
import {
  CreateTaskModal,
  AddColumnModal,
  CreateBoardModal,
  TaskCard,
  ManageWorkflowModal,
} from './kanbanboard.modals';

const BoardPage = () => {
  const navigate = useNavigate();
  const {projectId, boardId} = useParams();
  const auth = useContext(AuthContext);
  //main board state
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [boardList, setBoardList] = useState<{id: string; name: string}[]>([]);
  // members states
  const [members, setMembers] = useState<Member[]>([]);
  const [memberRole, setMemberRole] = useState<string>('MEMBER');
  //states we need for drag and drop functionality
  const dragId = useRef<string | null>(null);
  const dragSourceCol = useRef<string | null>(null);
  const [dragError, setDragError] = useState('');
  //states for reordering columns functionality
  const [colDragId, setColDragId] = useState<string | null>(null);
  const [colDragOverId, setColDragOverId] = useState<string | null>(null);
  // states for visibility of various modals that might pop up.
  const [modalCol, setModalCol] = useState<string | null>(null);
  const [colModalOpen, setColModalOpen] = useState(false);
  const [boardModalOpen, setBoardModalOpen] = useState(false);
  const [wfModalOpen, setWfModalOpen] = useState(false);
  // states for renaming
  const [renameColId, setRenameColId] = useState<string | null>(null);
  const [renameValue, setRenameVal] = useState('');
  //usecallback->we dont want fetchboard to be re created on every render, only when boardId or projectId changes
  const fetchBoard = useCallback(
    async (already = false) => {
      try {
        if (boardId === 'main' && !projectId) {
          setError('Missing project id for main board.');
          setLoading(false);
          return;
        }
        //only show the full loading spinner if we haven't fetched it yet
        if (!already) setLoading(true);
        const data = await apiFetch(
          boardId === 'main'
            ? `/projects/${projectId}/boards/main`
            : `/boards/${boardId}`,
        );
        //parse the incoming data,ensure correct types
        const parsedBoard = {
          ...data,
          columns:
            data.columns?.map((c: Partial<Col> & {issues?: Task[]}) => ({
              ...c,
              columnType: (c.columnType || 'TODO') as ColumnType,
              scope: (c.scope || 'TASKBUG') as ColumnScope,
              isImmutable: Boolean(c.isImmutable),
              limit: c.limit,
              tasks: c.issues || [],
            })) || [],
        };
        setBoard(parsedBoard);
        setError('');
      } catch {
        setError('Failed to load board. Make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    },
    [boardId, projectId],
  );
  // grab the board whenever the url changes
  useEffect(() => {
    if (boardId) fetchBoard();
  }, [boardId, fetchBoard]);
  useEffect(() => {
    if (projectId) {
      apiFetch(`/projects/${projectId}/members`)
        .then((m: Member[]) => {
          setMembers(m);
          // find out who the current user is so we know if they are an admin or just a viewer
          const me = m.find((x) => x.userId === auth?.user?.id);
          if (me) setMemberRole(me.role);
        })
        .catch(() => {});
      //we need list of boards for the drop down in header
      apiFetch(`/boards?projectId=${projectId}`)
        .then((boards: {id: string; name: string}[]) => setBoardList(boards))
        .catch(() => {});
    }
  }, [projectId, auth?.user?.id]);
  //we need below function to set up the drag and drop functionality for our task cards
  const onDragStart = (e: React.DragEvent, taskId: string, colId: string) => {
    dragId.current = taskId;
    dragSourceCol.current = colId;
    e.dataTransfer.effectAllowed = 'move';
    const target = e.currentTarget as HTMLElement | null;
    requestAnimationFrame(() => target?.classList.add(styles.dragging));
  };
  //we clean up
  const onDragEnd = (e: React.DragEvent) => {
    dragId.current = null;
    dragSourceCol.current = null;
    (e.currentTarget as HTMLElement).classList.remove(styles.dragging);
  };
  //let the browser know this column is a valid place to drop a card
  const onDragOverCol = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const reorderMutableColumns = async () => {
    if (!board || !colDragId || !colDragOverId || colDragId === colDragOverId)
      return;
    //select the task/bug columns only since story columns are separate and immutable
    const mutable = [...taskBugColumns]; //shallow copy
    const fromIndex = mutable.findIndex((c) => c.id === colDragId);
    const toIndex = mutable.findIndex((c) => c.id === colDragOverId);
    if (fromIndex < 0 || toIndex < 0) return;
    const reordered = [...mutable];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    //recalculate positions
    const withPositions = reordered.map((col, idx) => ({
      ...col,
      position: 11000 + idx * 1000,
    }));
    const byId = new Map(withPositions.map((c) => [c.id, c]));
    // update state locally immediately so the user sees it snap into place
    setBoard((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        columns: prev.columns.map((col) =>
          col.scope === 'TASKBUG' ? (byId.get(col.id) ?? col) : col,
        ),
      };
    });
    //we just did an optimistic update.
    //after that we send the api call, sometimes the backend might find a flaw which the frontend didnt catch
    //so we might see a delay during an error event between drop and error message,but it works eventually :)
    try {
      await Promise.all(
        withPositions.map((col) =>
          apiFetch(`/columns/${col.id}`, {
            method: 'PATCH',
            body: JSON.stringify({position: col.position}),
          }),
        ),
      );
    } catch {
      // if it fails, refresh the board, so that it reverts the invalid move
      fetchBoard(true);
      setDragError('Failed to reorder columns.');
      setTimeout(() => setDragError(''), 3000);
    }
  };
  // handles dropping a task into a new column
  const onDrop = async (e: React.DragEvent, targetColId: string) => {
    if (isViewer) return; //just to be safe
    e.preventDefault();
    setDragError('');
    const taskId = dragId.current;
    const sourceColId = dragSourceCol.current;
    if (!taskId || !board || sourceColId === targetColId) return;
    const targetCol = board.columns.find((c) => c.id === targetColId);
    // checking if we hit the WIP limit
    if (targetCol?.limit && targetCol.tasks.length >= targetCol.limit) {
      setDragError(
        `WIP limit reached for "${targetCol.name}" (max ${targetCol.limit})`,
      );
      setTimeout(() => setDragError(''), 3000);
      return;
    }
    setBoard((prev) => {
      if (!prev) return prev;
      //find the task
      const allTasks = prev.columns.flatMap((col) => col.tasks);
      const taskToMove = allTasks.find((t) => t.id === taskId);
      if (!taskToMove) return prev;
      const updatedColumns = prev.columns.map((col) => {
        //remove from source column
        if (col.id === sourceColId) {
          return {
            ...col,
            tasks: col.tasks.filter((t) => t.id !== taskId),
          };
        }
        //add to target column
        if (col.id === targetColId) {
          const movedTask = {
            ...taskToMove,
            columnId: targetColId,
          };
          return {
            ...col,
            tasks: [...col.tasks, movedTask],
          };
        }
        // leave other columns unchanged
        return col;
      });
      //return updated board
      return {
        ...prev,
        columns: updatedColumns,
      };
    });
    // persist the move to the backend
    try {
      await apiFetch(`/issues/${taskId}/move`, {
        method: 'PATCH',
        body: JSON.stringify({columnId: targetColId}),
      });
      fetchBoard(true); //refresh just to be safe
    } catch {
      //this refresh reverts the optimistic update
      fetchBoard();
      setDragError('This move is not allowed.');
      setTimeout(() => setDragError(''), 3000);
    }
  };
  const handleCreateTask = async (form: any) => {
    if (isViewer || !form.title.trim() || !modalCol || !board) return;
    const targetCol = board.columns.find((c) => c.id === modalCol);
    if (targetCol?.limit && targetCol.tasks.length >= targetCol.limit) {
      alert(
        `WIP limit reached for "${targetCol.name}" (max ${targetCol.limit}). Cannot add more tasks.`,
      );
      return;
    }
    try {
      const payload: Record<string, string> = {
        title: form.title.trim(),
        type: form.type,
        priority: form.pri,
        columnId: modalCol,
      };
      //only attach optional fields if they actually typed something
      //this ensures that we dont send empty stuff that messes up our null checks
      if (form.description.trim())
        payload.description = form.description.trim();
      if (form.assignee.trim()) payload.assigneeId = form.assignee.trim();
      if (form.dueDate) payload.dueDate = form.dueDate;
      if (form.parentId.trim()) payload.parentId = form.parentId.trim();
      await apiFetch(`/columns/${modalCol}/issues`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setModalCol(null);
      //refresh to show the new task
      fetchBoard(true);
    } catch {
      alert('Failed to create task.');
    }
  };
  const handleAddColumn = async (form: any) => {
    if (!isAdmin || !form.name.trim() || !board) return;
    try {
      const parsedLimit =
        form.wip === '' || form.wip === undefined
          ? undefined
          : Number(form.wip);
      if (
        parsedLimit !== undefined &&
        (!Number.isInteger(parsedLimit) || parsedLimit < 0)
      ) {
        alert('WIP limit must be a non-negative whole number.');
        return;
      }
      // prevent duplicate column names
      if (
        board.columns
          .filter((c) => c.scope === 'TASKBUG')
          .some((c) => c.name.toLowerCase() === form.name.trim().toLowerCase())
      ) {
        alert('A column with this name already exists.');
        return;
      }
      const newCol = await apiFetch(`/boards/${board.id}/columns`, {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          columnType: form.type,
          ...(parsedLimit !== undefined ? {limit: parsedLimit} : {}),
        }),
      });
      setBoard(
        (prev) =>
          prev && {
            ...prev,
            columns: [...prev.columns, {...newCol, tasks: newCol.tasks || []}],
          },
      );
      setColModalOpen(false);
    } catch {
      alert('Failed to add column.');
    }
  };
  const handleCreateBoard = async (form: any) => {
    if (!isAdmin || !form.name.trim() || !projectId) return;
    try {
      const created = await apiFetch('/boards', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.desc.trim(),
          projectId: projectId,
          resolvedColumnType: form.resolvedColumnType,
          closedColumnType: form.closedColumnType,
        }),
      });
      //add it to the dropdown list and navigate to it instantly
      setBoardList((prev) => [...prev, created]);
      setBoardModalOpen(false);
      navigate(`/projects/${projectId}/boards/${created.id}`);
    } catch {
      alert('Failed to create board.');
    }
  };
  const deleteColumn = async (colId: string) => {
    if (!isAdmin || !board) return;
    const col = board.columns.find((c) => c.id === colId);
    //Design decision: dont allow column deletion that has tasks in it
    if (col && col.tasks.length > 0) {
      alert('Cannot delete a column that has tasks. Move tasks first.');
      return;
    }
    if (!confirm(`Delete column "${col?.name}"?`)) return;
    try {
      await apiFetch(`/columns/${colId}`, {method: 'DELETE'});
      setBoard(
        (prev) =>
          prev && {
            ...prev,
            columns: prev.columns.filter((c) => c.id !== colId),
          },
      );
    } catch {
      alert('Failed to delete column.');
    }
  };

  const renameColumn = async () => {
    if (!isAdmin || !renameColId || !renameValue.trim() || !board) return;
    try {
      await apiFetch(`/columns/${renameColId}`, {
        method: 'PATCH',
        body: JSON.stringify({name: renameValue.trim()}),
      });
      setBoard(
        (prev) =>
          prev && {
            ...prev,
            columns: prev.columns.map((c) =>
              c.id === renameColId ? {...c, name: renameValue.trim()} : c,
            ),
          },
      );
      setRenameColId(null);
      setRenameVal('');
    } catch {
      alert('Failed to rename column.');
    }
  };
  const allStories = board
    ? board.columns.flatMap((c) => c.tasks).filter((t) => t.type === 'STORY')
    : [];
  const storyColumns = board
    ? board.columns
        .filter((c) => c.scope === 'STORY')
        .sort((a, b) => a.position - b.position)
    : [];
  const taskBugColumns = board
    ? board.columns
        .filter((c) => c.scope === 'TASKBUG')
        .sort((a, b) => a.position - b.position)
    : [];
  //for permissions
  const isAdmin = memberRole === 'ADMIN' || auth?.user?.role === 'ADMIN';
  const isViewer = memberRole === 'VIEWER';
  const openTask = (taskId: string) => navigate(`/tasks/${taskId}`);
  if (loading) {
    return (
      <div className={styles.loadWrap}>
        <div className={styles.spinner} />
        <p>Loading board...</p>
      </div>
    );
  }
  if (error || !board) {
    return (
      <div className={styles.errorWrap}>
        <p>{error || 'Board not found.'}</p>
        <button className={styles.back} onClick={() => navigate('/projects')}>
          ← Back to projects
        </button>
      </div>
    );
  }
  return (
    <div>
      <div className={styles.head}>
        <button className={styles.back} onClick={() => navigate('/projects')}>
          ← Back
        </button>
        {boardList.length > 0 ? (
          <select
            className={styles.boardSelect}
            value={board.id}
            onChange={(e) =>
              navigate(`/projects/${projectId}/boards/${e.target.value}`)
            }
          >
            {boardList.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        ) : (
          <h2>{board.name}</h2>
        )}
        {isAdmin && (
          <>
            <button
              className={styles.addColBtn}
              onClick={() => setBoardModalOpen(true)}
            >
              + New Board
            </button>
            <button
              className={styles.addColBtn}
              onClick={() => setColModalOpen(true)}
            >
              + Add Column
            </button>
            <button
              className={styles.addColBtn}
              onClick={() => setWfModalOpen(true)}
            >
              Workflow
            </button>
          </>
        )}
      </div>
      {dragError && <div className={styles.dragAlert}>{dragError}</div>}
      <div className={styles.storySectionTitle}>Stories</div>
      <div className={styles.storyCols}>
        {storyColumns.map((col, idx) => {
          const storyTasks = col.tasks.filter((task) => task.type === 'STORY');
          return (
            <div key={`story-${col.id}`} className={styles.storyCol}>
              <div className={styles.colHead}>
                <div
                  className={styles.colDot}
                  style={{
                    background: col.colour || colColors[idx % colColors.length],
                  }}
                />
                <span className={styles.colTitle}>{col.name}</span>
                <span className={styles.colCount}>{storyTasks.length}</span>
              </div>
              <div className={styles.storyList}>
                {storyTasks.length === 0 && (
                  <div className={styles.colEmpty}>No stories</div>
                )}
                {storyTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isViewer={isViewer}
                    onOpen={openTask}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className={styles.storySectionTitle}>Tasks & Bugs</div>
      <div className={styles.cols}>
        {taskBugColumns.map((col, idx) => {
          const colTasks = [...col.tasks]
            .filter((task) => task.type !== 'STORY')
            .sort(
              (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority],
            );
          return (
            <div
              key={col.id}
              className={`${styles.colStack} ${colDragOverId === col.id ? styles.colDropTarget : ''}`}
              onDragOver={(e) => {
                if (!isAdmin) return;
                e.preventDefault();
                if (colDragOverId !== col.id) setColDragOverId(col.id);
              }}
              onDragLeave={() => setColDragOverId(null)}
              onDrop={async (e) => {
                if (!isAdmin) return;
                e.preventDefault();
                await reorderMutableColumns();
                setColDragId(null);
                setColDragOverId(null);
              }}
            >
              <div className={styles.col}>
                <div className={styles.colHead}>
                  <div
                    className={styles.colDot}
                    style={{
                      background:
                        col.colour || colColors[idx % colColors.length],
                    }}
                  />
                  {renameColId === col.id ? (
                    <div className={styles.renameWrap}>
                      <input
                        className={styles.renameInput}
                        value={renameValue}
                        onChange={(e) => setRenameVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') renameColumn();
                          if (e.key === 'Escape') setRenameColId(null);
                        }}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <span
                      className={styles.colTitle}
                      onDoubleClick={() => {
                        if (isAdmin) {
                          setRenameColId(col.id);
                          setRenameVal(col.name);
                        }
                      }}
                      title={isAdmin ? 'Double-click to rename' : ''}
                    >
                      {col.name}
                    </span>
                  )}
                  {isAdmin && (
                    <button
                      className={styles.colReorderBtn}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move';
                        setColDragId(col.id);
                      }}
                      onDragEnd={() => {
                        setColDragId(null);
                        setColDragOverId(null);
                      }}
                      title="Drag to reorder column"
                    >
                      :
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      className={styles.colMenuBtn}
                      onClick={() => deleteColumn(col.id)}
                      title="Delete column"
                    >
                      ×
                    </button>
                  )}
                </div>
                <div
                  className={styles.taskList}
                  onDragOver={onDragOverCol}
                  onDrop={(e) => onDrop(e, col.id)}
                >
                  {colTasks.length === 0 && (
                    <div className={styles.colEmpty}>No tasks yet</div>
                  )}
                  {colTasks.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      isViewer={isViewer}
                      onOpen={openTask}
                      onDragStart={(e, id) => onDragStart(e, id, col.id)}
                      onDragEnd={onDragEnd}
                    />
                  ))}
                </div>
              </div>
              {!isViewer && (
                <button
                  className={styles.addBtnOutside}
                  onClick={() => setModalCol(col.id)}
                >
                  + Add task
                </button>
              )}
            </div>
          );
        })}
      </div>
      {!isViewer && modalCol && (
        <CreateTaskModal
          onClose={() => setModalCol(null)}
          onSubmit={handleCreateTask}
          members={members}
          allStories={allStories}
        />
      )}
      {isAdmin && colModalOpen && (
        <AddColumnModal
          onClose={() => setColModalOpen(false)}
          onSubmit={handleAddColumn}
        />
      )}
      {isAdmin && boardModalOpen && (
        <CreateBoardModal
          onClose={() => setBoardModalOpen(false)}
          onSubmit={handleCreateBoard}
        />
      )}
      {isAdmin && wfModalOpen && (
        <ManageWorkflowModal
          boardId={board.id}
          onClose={() => setWfModalOpen(false)}
        />
      )}
    </div>
  );
};

export default BoardPage;
