import {useState, useEffect, useContext, useRef} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {AuthContext} from '../../context/auth';
import {apiFetch} from '../../lib/api';
import {renderCommentRichText} from '../../lib/commentRichText';
import type {Comment, EditorTarget, Member, TaskDetail} from './task.types';
import {typeLabels} from './task.types';
import {
  applyInlineToken,
  applyLinkToken,
  applyListToken,
  relTime,
} from './task.utils';
import styles from './task.module.css';

const TaskPage = () => {
  const navigate = useNavigate();
  const {taskId} = useParams();
  const auth = useContext(AuthContext);
  const userId = auth?.user?.id;
  const currentUserName = auth?.user?.name || auth?.user?.email || 'User';
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  //edit states
  const [editTitle, setEditTitle] = useState(false);
  const [titleVal, setTitleVal] = useState('');
  const [editDescription, setEditDescription] = useState(false);
  const [descVal, setDescVal] = useState('');
  const [saved, setSaved] = useState('');
  //project members for assignee selection
  const [members, setMembers] = useState<Member[]>([]);
  const [memberRole, setMemberRole] = useState<string>('MEMBER');
  const [activity, setActivity] = useState<TaskDetail['auditLogs']>([]);
  //comment states
  const [newComment, setNewComment] = useState('');
  const [editCommentId, setEditCommentId] = useState<string | null>(null);
  const [editCommentVal, setEditCommentVal] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyVal, setReplyVal] = useState('');
  const newCommentRef = useRef<HTMLTextAreaElement | null>(null);
  const editCommentRef = useRef<HTMLTextAreaElement | null>(null);
  const replyCommentRef = useRef<HTMLTextAreaElement | null>(null);
  const [newTab, setNewTab] = useState<'write' | 'preview'>('write');
  const [editTab, setEditTab] = useState<'write' | 'preview'>('write');
  const [replyTab, setReplyTab] = useState<'write' | 'preview'>('write');
  //helper to set editor value and ref based on target
  const getEditorState = (target: EditorTarget) =>
    target === 'new'
      ? {value: newComment, setValue: setNewComment, ref: newCommentRef}
      : target === 'edit'
        ? {
            value: editCommentVal,
            setValue: setEditCommentVal,
            ref: editCommentRef,
          }
        : {
            value: replyVal,
            setValue: setReplyVal,
            ref: replyCommentRef,
          };
  //simple jsx for the bold/italic/link/list buttons
  const renderEditorToolbar = (target: EditorTarget) => (
    <div className={styles.editorToolbar}>
      <button
        type="button"
        className={styles.toolbarBtn}
        onClick={() =>
          applyInlineToken(getEditorState(target), '**', '**', 'bold text')
        }
        title="Bold"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        className={styles.toolbarBtn}
        onClick={() =>
          applyInlineToken(getEditorState(target), '*', '*', 'italic text')
        }
        title="Italic"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        className={styles.toolbarBtn}
        onClick={() => applyLinkToken(getEditorState(target))}
        title="Link"
      >
        Link
      </button>
      <button
        type="button"
        className={styles.toolbarBtn}
        onClick={() => applyListToken(getEditorState(target))}
        title="Bullet list"
      >
        - List
      </button>
      <button
        type="button"
        className={styles.toolbarBtn}
        onClick={() =>
          applyInlineToken(getEditorState(target), '`', '`', 'code')
        }
        title="Inline code"
      >
        {'<>'} Code
      </button>
    </div>
  );
  useEffect(() => {
    if (!taskId) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await apiFetch(`/issues/${taskId}`);
        setTask(data);
        setError('');
      } catch {
        setError('Failed to load task.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [taskId]);

  useEffect(() => {
    if (!taskId) return;
    const loadActivity = async () => {
      try {
        const logs = await apiFetch(`/issues/${taskId}/activity`);
        setActivity(logs || []);
      } catch {
        setActivity([]);
      }
    };
    loadActivity();
  }, [taskId]);
  //load project members and determine user role for permissions
  useEffect(() => {
    if (task?.projectId) {
      apiFetch(`/projects/${task.projectId}/members`)
        .then((projectMembers: Member[]) => {
          setMembers(projectMembers);
          const me = projectMembers.find((m) => m.userId === userId);
          if (me) setMemberRole(me.role);
        })
        .catch(() => {});
    }
  }, [task?.projectId, userId]);
  //show saved
  const showSaved = (field: string) => {
    setSaved(field);
    setTimeout(() => setSaved(''), 2000);
  };

  const refreshActivity = async () => {
    if (!taskId) return;
    try {
      const logs = await apiFetch(`/issues/${taskId}/activity`);
      setActivity(logs || []);
    } catch {
      setActivity((prev) => prev || []);
    }
  };

  const updateField = async (field: string, value: string | null) => {
    if (isViewer) return;
    if (!task) return;
    try {
      const updated = await apiFetch(`/issues/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({[field]: value}),
      });
      setTask((prev) => (prev ? {...prev, ...updated} : prev));
      await refreshActivity();
      showSaved(field);
    } catch {
      alert(`Failed to update ${field}.`);
    }
  };
  const saveTitle = () => {
    if (isViewer) return;
    if (titleVal.trim() && titleVal !== task?.title) {
      updateField('title', titleVal.trim());
    }
    setEditTitle(false);
  };
  const saveDesc = () => {
    if (isViewer) return;
    if (descVal !== (task?.description ?? '')) {
      updateField('description', descVal);
    }
    setEditDescription(false);
  };
  //delete task
  const deleteTask = async () => {
    if (isViewer) return;
    if (!task || !confirm('Delete this task? This cannot be undone.')) return;
    try {
      await apiFetch(`/issues/${task.id}`, {method: 'DELETE'});
      navigate(-1);
    } catch {
      alert('Failed to delete task.');
    }
  };
  const addComment = async () => {
    if (isViewer) return;
    if (!newComment.trim() || !task) return;
    try {
      const comment = await apiFetch(`/issues/${task.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({content: newComment.trim()}),
      });
      const commentWithAuthor = {
        ...comment,
        userName: comment.userName || currentUserName,
      };
      setTask((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: [...(prev.comments || []), commentWithAuthor],
        };
      });
      await refreshActivity();
      setNewComment('');
    } catch {
      alert('Failed to add comment.');
    }
  };

  const addReply = async () => {
    if (isViewer) return;
    if (!task || !replyToId || !replyVal.trim()) return;
    try {
      const comment = await apiFetch(`/issues/${task.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content: replyVal.trim(),
          parentId: replyToId,
        }),
      });
      const replyWithAuthor = {
        ...comment,
        userName: comment.userName || currentUserName,
        replies: [],
      } as Comment;
      setTask((prev) => {
        if (!prev) return prev;
        const insertReply = (list: Comment[]): Comment[] =>
          list.map((item) => {
            if (item.id === replyToId) {
              return {
                ...item,
                replies: [...(item.replies || []), replyWithAuthor],
              };
            }
            if (item.replies && item.replies.length > 0) {
              return {...item, replies: insertReply(item.replies)};
            }
            return item;
          });
        return {
          ...prev,
          comments: insertReply(prev.comments || []),
        };
      });
      await refreshActivity();
      setReplyToId(null);
      setReplyVal('');
      setReplyTab('write');
    } catch {
      alert('Failed to add reply.');
    }
  };

  const saveEditComment = async () => {
    if (isViewer) return;
    if (!editCommentId || !editCommentVal.trim()) return;
    try {
      const updated = await apiFetch(`/comments/${editCommentId}`, {
        method: 'PATCH',
        body: JSON.stringify({content: editCommentVal.trim()}),
      });
      setTask((prev) => {
        if (!prev) return prev;
        const updateInTree = (list: Comment[]): Comment[] =>
          list.map((item) => {
            if (item.id === editCommentId) return {...item, ...updated};
            if (item.replies && item.replies.length > 0) {
              return {...item, replies: updateInTree(item.replies)};
            }
            return item;
          });
        return {
          ...prev,
          comments: updateInTree(prev.comments || []),
        };
      });
      await refreshActivity();
      setEditCommentId(null);
      setEditCommentVal('');
      setEditTab('write');
    } catch {
      alert('Failed to edit comment.');
    }
  };

  const deleteComment = async (commentId: string) => {
    if (isViewer) return;
    if (!confirm('Delete this comment?')) return;
    try {
      await apiFetch(`/comments/${commentId}`, {method: 'DELETE'});
      setTask((prev) => {
        if (!prev) return prev;
        const removeFromTree = (list: Comment[]): Comment[] =>
          list
            .filter((item) => item.id !== commentId)
            .map((item) => ({
              ...item,
              replies: item.replies ? removeFromTree(item.replies) : [],
            }));
        return {
          ...prev,
          comments: removeFromTree(prev.comments || []),
        };
      });
      await refreshActivity();
      if (replyToId === commentId) {
        setReplyToId(null);
        setReplyVal('');
        setReplyTab('write');
      }
    } catch {
      alert('Failed to delete comment.');
    }
  };

  const countComments = (list: Comment[]): number =>
    list.reduce((acc, item) => acc + 1 + countComments(item.replies || []), 0);

  const renderThread = (comments: Comment[], depth = 0) =>
    comments.map((c) => (
      <div
        key={c.id}
        className={`${styles.comment} ${depth > 0 ? styles.replyComment : ''}`}
        style={depth > 0 ? {marginLeft: `${depth}rem`} : undefined}
      >
        <div className={styles.commentHead}>
          <span className={styles.commentAuthor}>{c.userName || 'User'}</span>
          <span className={styles.commentTime}>{relTime(c.createdAt)}</span>
        </div>
        {editCommentId === c.id ? (
          <>
            <div className={styles.editorWrap}>
              <div className={styles.editorTabs}>
                <button
                  type="button"
                  className={`${styles.editorTab} ${editTab === 'write' ? styles.editorTabActive : ''}`}
                  onClick={() => setEditTab('write')}
                >
                  Write
                </button>
                <button
                  type="button"
                  className={`${styles.editorTab} ${editTab === 'preview' ? styles.editorTabActive : ''}`}
                  onClick={() => setEditTab('preview')}
                >
                  Preview
                </button>
              </div>
              {editTab === 'write' ? (
                <>
                  {renderEditorToolbar('edit')}
                  <textarea
                    ref={editCommentRef}
                    className={styles.editCommentInput}
                    value={editCommentVal}
                    onChange={(e) => setEditCommentVal(e.target.value)}
                    autoFocus
                  />
                </>
              ) : (
                <div className={styles.previewPane}>
                  <div className={styles.commentBody}>
                    {editCommentVal.trim() ? (
                      renderCommentRichText(editCommentVal)
                    ) : (
                      <p className={styles.previewEmpty}>Nothing to preview.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className={styles.editActions}>
              <button className={styles.saveBtn} onClick={saveEditComment}>
                Save
              </button>
              <button
                className={styles.cancelEditBtn}
                onClick={() => {
                  setEditCommentId(null);
                  setEditTab('write');
                }}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.commentBody}>
              {renderCommentRichText(c.content)}
            </div>
            {!isViewer && (
              <div className={styles.commentActions}>
                <button
                  className={styles.commentActionBtn}
                  onClick={() => {
                    setReplyToId(c.id);
                    setReplyVal('');
                    setReplyTab('write');
                  }}
                >
                  Reply
                </button>
                {c.userId === userId && (
                  <>
                    <button
                      className={styles.commentActionBtn}
                      onClick={() => {
                        setEditCommentId(c.id);
                        setEditCommentVal(c.content);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className={`${styles.commentActionBtn} ${styles.del}`}
                      onClick={() => deleteComment(c.id)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
            {!isViewer && replyToId === c.id && (
              <div className={styles.replyComposer}>
                <div className={styles.editorWrap}>
                  <div className={styles.editorTabs}>
                    <button
                      type="button"
                      className={`${styles.editorTab} ${replyTab === 'write' ? styles.editorTabActive : ''}`}
                      onClick={() => setReplyTab('write')}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      className={`${styles.editorTab} ${replyTab === 'preview' ? styles.editorTabActive : ''}`}
                      onClick={() => setReplyTab('preview')}
                    >
                      Preview
                    </button>
                  </div>
                  {replyTab === 'write' ? (
                    <>
                      {renderEditorToolbar('reply')}
                      <textarea
                        ref={replyCommentRef}
                        className={styles.editCommentInput}
                        value={replyVal}
                        onChange={(e) => setReplyVal(e.target.value)}
                        autoFocus
                      />
                    </>
                  ) : (
                    <div className={styles.previewPane}>
                      <div className={styles.commentBody}>
                        {replyVal.trim() ? (
                          renderCommentRichText(replyVal)
                        ) : (
                          <p className={styles.previewEmpty}>
                            Nothing to preview.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className={styles.editActions}>
                  <button
                    className={styles.saveBtn}
                    onClick={addReply}
                    disabled={!replyVal.trim()}
                  >
                    Reply
                  </button>
                  <button
                    className={styles.cancelEditBtn}
                    onClick={() => {
                      setReplyToId(null);
                      setReplyVal('');
                      setReplyTab('write');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        {c.replies &&
          c.replies.length > 0 &&
          renderThread(c.replies, depth + 1)}
      </div>
    ));

  const isViewer = memberRole === 'VIEWER';

  if (loading) {
    return (
      <div className={styles.loadWrap}>
        <div className={styles.spinner} />
        <p>Loading task...</p>
      </div>
    );
  }
  //error state,one way this might happen is if the task was deleted after we loaded the page
  if (error || !task) {
    return (
      <div className={styles.errorWrap}>
        <p>{error || 'Task not found.'}</p>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ← Go back
        </button>
      </div>
    );
  }
  /*
  big jsx code,
  too lazy to comment every part but main things to note:
  - we have edit fields for title and description that show up on click
  - we render comments with edit/delete buttons if the comment belongs to the user
  - we have a sidebar with metadata and dropdowns for changing priority/type/assignee
  - we use helper functions to render the rich text in comments and to apply formatting tokens
  - we show a saved flash message when title/description is updated
  - we disable all editing if the user is a viewer
  - subtle feature: clicking on child tasks or parent story will navigate to that task page
  */
  return (
    <div className={styles.wrap}>
      <div className={styles.backRow}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>
      <div className={styles.header}>
        <span className={`${styles.typeBadge} ${styles[task.type]}`}>
          {typeLabels[task.type]}
        </span>
        <div className={styles.titleWrap}>
          {!isViewer && editTitle ? (
            <input
              className={styles.titleInput}
              value={titleVal}
              onChange={(e) => setTitleVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTitle();
                if (e.key === 'Escape') setEditTitle(false);
              }}
              autoFocus
              onBlur={saveTitle}
            />
          ) : (
            <h1
              className={styles.titleDisplay}
              onClick={() => {
                if (!isViewer) {
                  setEditTitle(true);
                  setTitleVal(task.title);
                }
              }}
              title={isViewer ? '' : 'Click to edit'}
            >
              {task.title}
              {saved === 'title' && (
                <span className={styles.savedFlash}> Saved</span>
              )}
            </h1>
          )}
        </div>
        {!isViewer && (
          <button className={styles.deleteBtn} onClick={deleteTask}>
            Delete
          </button>
        )}
      </div>
      <div className={styles.body}>
        <div className={styles.main}>
          <div className={styles.section}>
            <h3>
              Description{' '}
              {saved === 'description' && (
                <span className={styles.savedFlash}>Saved</span>
              )}
            </h3>
            {!isViewer && editDescription ? (
              <>
                <textarea
                  className={styles.descInput}
                  value={descVal}
                  onChange={(e) => setDescVal(e.target.value)}
                  autoFocus
                />
                <div className={styles.editActions}>
                  <button className={styles.saveBtn} onClick={saveDesc}>
                    Save
                  </button>
                  <button
                    className={styles.cancelEditBtn}
                    onClick={() => setEditDescription(false)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div
                className={styles.descDisplay}
                onClick={() => {
                  if (!isViewer) {
                    setEditDescription(true);
                    setDescVal(task.description ?? '');
                  }
                }}
                title={isViewer ? '' : 'Click to edit'}
              >
                {task.description || ''}
              </div>
            )}
          </div>
          {task.type === 'STORY' &&
            task.children &&
            task.children.length > 0 && (
              <div className={styles.section}>
                <h3>Child Tasks ({task.children.length})</h3>
                <div className={styles.childList}>
                  {task.children.map((c) => (
                    <div
                      key={c.id}
                      className={styles.childItem}
                      onClick={() => navigate(`/tasks/${c.id}`)}
                    >
                      <span className={`${styles.childType} ${styles[c.type]}`}>
                        {c.type === 'BUG' ? 'B' : 'T'}
                      </span>
                      <span className={styles.childTitle}>{c.title}</span>
                      <span className={styles.statusBadge}>{c.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {task.parentId && (
            <div className={styles.section}>
              <h3>Parent Story</h3>
              <div
                className={styles.childItem}
                onClick={() => navigate(`/tasks/${task.parentId}`)}
              >
                <span
                  className={`${styles.childType}`}
                  style={{
                    background: 'var(--colour-badge-story-bg)',
                    color: 'var(--colour-badge-story-text)',
                  }}
                >
                  S
                </span>
                <span className={styles.childTitle}>
                  {task.parentTitle || task.parentId}
                </span>
              </div>
            </div>
          )}
          <div className={styles.section}>
            <h3>Comments ({countComments(task.comments || [])})</h3>
            {task.comments && task.comments.length > 0 ? (
              <div className={styles.commentList}>
                {renderThread(task.comments)}
              </div>
            ) : (
              <p className={styles.emptyState}>No comments yet</p>
            )}
            {!isViewer && (
              <div className={styles.newComment}>
                <div className={styles.editorWrap}>
                  <div className={styles.editorTabs}>
                    <button
                      type="button"
                      className={`${styles.editorTab} ${newTab === 'write' ? styles.editorTabActive : ''}`}
                      onClick={() => setNewTab('write')}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      className={`${styles.editorTab} ${newTab === 'preview' ? styles.editorTabActive : ''}`}
                      onClick={() => setNewTab('preview')}
                    >
                      Preview
                    </button>
                  </div>
                  {newTab === 'write' ? (
                    <>
                      {renderEditorToolbar('new')}
                      <textarea
                        ref={newCommentRef}
                        className={styles.commentInput}
                        placeholder="Add a formatted comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={4}
                      />
                    </>
                  ) : (
                    <div className={styles.previewPane}>
                      <div className={styles.commentBody}>
                        {newComment.trim() ? (
                          renderCommentRichText(newComment)
                        ) : (
                          <p className={styles.previewEmpty}>
                            Nothing to preview.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className={styles.newCommentFooter}>
                  <button
                    className={styles.commentSubmit}
                    onClick={addComment}
                    disabled={!newComment.trim()}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className={styles.section}>
            <h3>Activity</h3>
            {activity && activity.length > 0 ? (
              <div className={styles.timeline}>
                {activity.map((entry) => (
                  <div key={entry.id} className={styles.timelineItem}>
                    <span className={styles.timelineIcon}>•</span>
                    <div className={styles.timelineText}>
                      <strong>{entry.userName || 'User'}</strong> {entry.action}
                      {entry.newValue ? `: ${entry.newValue}` : ''}
                    </div>
                    <span className={styles.timelineTime}>
                      {relTime(entry.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyState}>No activity yet</p>
            )}
          </div>
        </div>
        <div className={styles.sidebar}>
          <div className={styles.metaCard}>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Status</span>
              <span className={styles.statusBadge}>{task.status}</span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Priority</span>
              {isViewer ? (
                <span className={styles.metaValue}>{task.priority}</span>
              ) : (
                <select
                  className={styles.metaSelect}
                  value={task.priority}
                  onChange={(e) => updateField('priority', e.target.value)}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              )}
            </div>
            {task.type !== 'STORY' && (
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Type</span>
                {isViewer ? (
                  <span className={styles.metaValue}>
                    {typeLabels[task.type]}
                  </span>
                ) : (
                  <select
                    className={styles.metaSelect}
                    value={task.type}
                    onChange={(e) => updateField('type', e.target.value)}
                  >
                    <option value="TASK">Task</option>
                    <option value="BUG">Bug</option>
                  </select>
                )}
              </div>
            )}
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Assignee</span>
              {isViewer ? (
                <span className={styles.metaValue}>
                  {task.assigneeName || 'Unassigned'}
                </span>
              ) : (
                <select
                  className={styles.metaSelect}
                  value={task.assigneeId || ''}
                  onChange={async (e) => {
                    const newAssigneeId = e.target.value || null;
                    await updateField('assigneeId', newAssigneeId);
                    // Optimistically update name
                    const member = members.find(
                      (m) => m.userId === newAssigneeId,
                    );
                    if (member) {
                      setTask((prev) =>
                        prev
                          ? {
                              ...prev,
                              assigneeName:
                                member.user?.name ||
                                member.user?.email ||
                                member.userId,
                            }
                          : prev,
                      );
                    } else {
                      setTask((prev) =>
                        prev ? {...prev, assigneeName: 'Unassigned'} : prev,
                      );
                    }
                  }}
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user?.name || m.user?.email || m.userId}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Reporter</span>
              <span className={styles.metaValue}>
                {task.reporterName || 'Unknown'}
              </span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Due Date</span>
              {isViewer ? (
                <span className={styles.metaValue}>
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '-'}
                </span>
              ) : (
                <input
                  type="date"
                  className={styles.metaInput}
                  value={task.dueDate ? task.dueDate.slice(0, 10) : ''}
                  onChange={(e) => updateField('dueDate', e.target.value)}
                />
              )}
            </div>
          </div>
          <div className={styles.metaCard}>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Created</span>
              <span className={styles.metaValue}>
                {task.createdAt
                  ? new Date(task.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  : '-'}
              </span>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Updated</span>
              <span className={styles.metaValue}>
                {task.updatedAt ? relTime(task.updatedAt) : '-'}
              </span>
            </div>
            {task.resolvedAt && (
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Resolved</span>
                <span className={styles.metaValue}>
                  {new Date(task.resolvedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
            {task.closedAt && (
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Closed</span>
                <span className={styles.metaValue}>
                  {new Date(task.closedAt).toLocaleDateString('en-US', {
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskPage;
