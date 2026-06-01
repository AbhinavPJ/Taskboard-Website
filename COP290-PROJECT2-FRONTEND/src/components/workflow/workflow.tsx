import {useState, useEffect, useCallback} from 'react';
import {apiFetch} from '../../lib/api';
import styles from './workflow.module.css';
import type {Column, BlockedPair, Props} from './workflow.types';
import {WorkflowManager} from './workflow.manager';
export default function Workflow({boardId, onClose}: Props) {
  //state variables for set of columns, blocked pairs,loading state,
  // saving state,error message,selected source and target column ids
  const [columns, setColumns] = useState<Column[]>([]);
  const [blocked, setBlocked] = useState<BlockedPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      //run parallel calls
      const [boardData, wf] = await Promise.all([
        apiFetch(`/boards/${boardId}`),
        apiFetch(`/boards/${boardId}/workflows`),
      ]);
      const fetchedCols: Column[] = boardData?.columns;
      //we are not interested in story columns
      const taskBugColumns = fetchedCols.filter((c) => c.scope === 'TASKBUG');
      setColumns(taskBugColumns);
      setBlocked(wf?.workflow);
      //default from->to
      if (taskBugColumns.length > 1) {
        setSourceId(taskBugColumns[0].id);
        setTargetId(taskBugColumns[1].id);
      } else {
        if (taskBugColumns.length === 1) {
          setSourceId(taskBugColumns[0].id);
          setTargetId(taskBugColumns[0].id);
        } else {
          setSourceId('');
          setTargetId('');
        }
      }
    } catch {
      setError('Failed to load workflow');
    } finally {
      setLoading(false);
    }
  }, [boardId]);
  //fetch data on reload/boardId change
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const isBlocked = (source: string, target: string) =>
    blocked.some(
      (p) => p.sourceColumnId === source && p.targetColumnId === target,
    );
  const colName = (id: string) => columns.find((c) => c.id === id)?.name ?? id;
  const pairSelected = sourceId && targetId && sourceId !== targetId;
  const currentBlocked = pairSelected ? isBlocked(sourceId, targetId) : false;
  const removePair = (source: string, target: string) => {
    setBlocked((prev) =>
      prev.filter(
        (p) => !(p.sourceColumnId === source && p.targetColumnId === target),
      ),
    );
  };
  const togglePair = () => {
    if (!pairSelected) return;
    //if currently blocked,remove it from blocked list, otherwise add it.
    if (currentBlocked) {
      removePair(sourceId, targetId);
    } else {
      setBlocked((prev) => [
        ...prev,
        {sourceColumnId: sourceId, targetColumnId: targetId},
      ]);
    }
  };
  //send a patch request
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/boards/${boardId}/workflows`, {
        method: 'PATCH',
        body: JSON.stringify({workflow: blocked}),
      });
    } catch {
      setError('Failed to save workflow');
    } finally {
      setSaving(false);
      //close the workflow manager after saving
      onClose?.();
    }
  };
  //set loading screen
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          Loading workflow
        </div>
      </div>
    );
  }
  /*
  JSX code:
  first we show error if exists
  no columns-> inform the user
  else show the workflow manager component.
  */
  return (
    <div className={styles.container}>
      {error && <div className={styles.errorMsg}>{error}</div>}
      {columns.length === 0 && (
        <div className={styles.statusCard}>
          No TASKBUG columns found for this board.
        </div>
      )}
      {columns.length > 0 && (
        <>
          <WorkflowManager
            columns={columns}
            sourceId={sourceId}
            setSourceId={setSourceId}
            targetId={targetId}
            setTargetId={setTargetId}
            currentBlocked={currentBlocked}
            togglePair={togglePair}
            blocked={blocked}
            colName={colName}
          />
          <button
            className={styles.btnSave}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving' : 'Save Workflow'}
          </button>
        </>
      )}
    </div>
  );
}
