import React from 'react';
import styles from './workflow.module.css';

export interface Column {
  id: string;
  name: string;
}

export interface BlockedPair {
  sourceColumnId: string;
  targetColumnId: string;
}

export const WorkflowManager: React.FC<{
  columns?: Column[];
  sourceId: string;
  setSourceId: (id: string) => void;
  targetId: string;
  setTargetId: (id: string) => void;
  currentBlocked: boolean;
  togglePair: () => void;
  blocked?: BlockedPair[];
  colName: (id: string) => string;
  error?: string;
}> = ({
  columns = [],
  sourceId,
  setSourceId,
  targetId,
  setTargetId,
  currentBlocked,
  togglePair,
  blocked = [],
  colName,
  error,
}) => {
  /*
    JSX code:
    two drop downs to select source and target column,
    below that, we
    have a status card indicating if the transition is blocked or allowed,
    along with a button to toggle the state.
    below that, we have a section listing all currently blocked transitions 
    finally, we have a save button at the bottom to persist changes(sent to the other file lol)
    */
  return (
    <div className={styles.container}>
      {error && <div className={styles.errorMsg}>{error}</div>}
      <div className={styles.dropdownRow}>
        <div className={styles.dropdownGroup}>
          <span className={styles.label}>Moving From</span>
          <select
            className={styles.select}
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
          >
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.dropdownGroup}>
          <span className={styles.label}>Moving To</span>
          <select
            className={styles.select}
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
          >
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {sourceId === targetId ? (
        <div className={styles.statusCard} style={{backgroundColor: '#f8f9fa'}}>
          <span style={{fontSize: '0.9rem', color: '#666'}}>
            Select two different columns to manage a transition.
          </span>
        </div>
      ) : (
        <div
          className={`${styles.statusCard} ${
            currentBlocked ? styles.statusBlocked : styles.statusAllowed
          }`}
        >
          <span className={styles.statusText}>
            <strong>Status:</strong>{' '}
            {currentBlocked ? 'Transition Blocked' : 'Transition Allowed'}
          </span>
          <button
            className={currentBlocked ? styles.btnUnblock : styles.btnBlock}
            onClick={togglePair}
          >
            {currentBlocked ? 'Unblock' : 'Block'}
          </button>
        </div>
      )}
      <div className={styles.blockedSection}>
        <span className={styles.blockedTitle}>
          Blocked Transitions ({blocked.length})
        </span>

        {blocked.length === 0 ? (
          <p className={styles.emptyBlocked}>
            All transitions are currently allowed.
          </p>
        ) : (
          <ul className={styles.blockedList}>
            {blocked.map((p) => (
              <li
                key={`${p.sourceColumnId}-${p.targetColumnId}`}
                className={styles.blockedItem}
              >
                <span className={styles.blockedItemText}>
                  {colName(p.sourceColumnId)}
                  <span className={styles.arrow}>→</span>
                  {colName(p.targetColumnId)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
