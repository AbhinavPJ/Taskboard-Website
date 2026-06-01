import {useContext, useState, useEffect} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {AuthContext} from '../../context/auth';
import {apiFetch} from '../../lib/api';
import type {Stats, Project, Activity} from './dashboard.types';
import styles from './dashboard.module.css';

// greeting based on time of day
const getGreeting = (name: string) => {
  const h = new Date().getHours();
  if (h < 3) return 'Burning the midnight oil?';
  if (h < 7) return 'Did you just wake up or are you working late?';
  if (h < 16) return 'Good afternoon';
  return `Good evening, ${name}!`;
};

const DashBoardPage = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const name = auth?.user?.name ?? 'User';

  const [stats, setStats] = useState<Stats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // fetch stats,projects and activity in parallel
    Promise.all([
      apiFetch('/dashboard/stats')
        .then(setStats)
        .catch(() => {}),
      apiFetch('/dashboard/recent-projects')
        .then(setProjects)
        .catch(() => {}),
      apiFetch('/dashboard/recent-activity')
        .then(setActivity)
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);
  // compute progress percentage
  const total = stats?.assignedTasks ?? 0;
  const pct =
    total > 0 ? Math.floor(((stats?.completedTasks ?? 0) * 100) / total) : 0;
  /*
  JSX code:
  at the top, greet the user
  below that, we have some stats cards(total projects,assigned tasks,in progress,completed)
  below that, if there are any assigned tasks, show progress
  below that we have two panels side by side(recent projects and recent activity)
  recent projects, view all
  below that show projects one below other, show purple dot beside it
  right form->
  recent activity, view all
  below that we show activity one below other, if not read show a blue dot beside it, 
  on the right show how long ago it was.
  */
  return (
    <div>
      <div className={styles.welcome}>
        <h2>{getGreeting(name)}</h2>
        <p>Here&apos;s what&apos;s happening across your projects today.</p>
      </div>
      {
        <div className={styles.stats}>
          <div className={`${styles.card} ${styles.red}`}>
            <div className={`${styles.cardIcon} ${styles.red}`}></div>
            <h3>{stats?.totalProjects ?? '-'}</h3>
            <p>Total Projects</p>
          </div>
          <div className={`${styles.card} ${styles.blue}`}>
            <div className={`${styles.cardIcon} ${styles.blue}`}></div>
            <h3>{stats?.assignedTasks ?? '-'}</h3>
            <p>My Assigned</p>
          </div>
          <div className={`${styles.card} ${styles.yellow}`}>
            <div className={`${styles.cardIcon} ${styles.yellow}`}></div>
            <h3>{stats?.activeTasks ?? '-'}</h3>
            <p>In Progress</p>
          </div>
          <div className={`${styles.card} ${styles.green}`}>
            <div className={`${styles.cardIcon} ${styles.green}`}></div>
            <h3>{stats?.completedTasks ?? '-'}</h3>
            <p>Completed</p>
          </div>
        </div>
      }
      {!loading && total > 0 && (
        <div className={styles.progressPanel}>
          <div className={styles.progressHead}>
            <span className={styles.progressLabel}>Overall completion</span>
            <span className={styles.progressPct}>{pct}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{width: `${pct}%`}} />
          </div>
          <span className={styles.progressSub}>
            {stats?.completedTasks ?? 0} of {total} tasks completed
          </span>
        </div>
      )}
      <div className={styles.grid}>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3>Recent Projects</h3>
            <Link to="/projects">View all</Link>
          </div>
          {projects.length === 0 && (
            <div className={styles.emptyMsg}>No projects yet</div>
          )}
          {projects.map((project) => (
            <div
              key={project.id}
              className={styles.projectRow}
              role="button"
              onClick={() => navigate(`/projects/${project.id}/boards/main`)}
            >
              <div
                className={styles.dot}
                style={{background: project.colour}}
              />
              <div className={styles.projectInfo}>
                <strong>{project.name}</strong>
                <span>
                  {project.description?.substring(0, 30) || 'No description '}
                </span>
              </div>
              <span className={styles.badge}>
                {project.tasks ?? 0} {project.tasks === 1 ? 'task' : 'tasks'}
              </span>
            </div>
          ))}
        </div>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3>Recent Activity</h3>
            <Link to="/notifications">View all</Link>
          </div>
          {activity.length === 0 && (
            <div className={styles.emptyMsg}>No activity yet</div>
          )}
          <div className={styles.activityList}>
            {activity.map((act) => (
              <div key={act.id} className={styles.actItem}>
                {!Boolean(act.read) && (
                  <div
                    className={styles.actDot}
                    style={{background: 'var(--colour-primary)'}}
                  />
                )}
                <div className={styles.actText}>
                  <strong>{act.what}</strong>
                  <span>{act.tag}</span>
                </div>
                <span className={styles.actTime}>{act.ago}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashBoardPage;
