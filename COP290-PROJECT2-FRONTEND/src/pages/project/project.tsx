// Projects page - lists projects, create project, project settings + member management
import {useState, useEffect, useContext} from 'react';
import {useNavigate} from 'react-router-dom';
import {AuthContext} from '../../context/auth';
import {apiFetch} from '../../lib/api';
import styles from './project.module.css';

interface Member {
  id: string;
  userId: string;
  user?: {
    name: string;
    email: string;
  };
  role: string;
}

interface Project {
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

const presetColors = [
  '#7c5dfa',
  '#0052cc',
  '#00b894',
  '#e17055',
  '#fdcb6e',
  '#e84393',
];

const ProjectPage = () => {
  const [list, setList] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const currentUserId = auth?.user?.id;

  // create form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [colour, setColour] = useState(presetColors[0]);

  // project settings modal
  const [settingsProject, setSettingsProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColour, setEditColour] = useState('');

  // member management
  const [members, setMembers] = useState<Member[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');

  // fetch projects on mount
  useEffect(() => {
    apiFetch('/projects')
      .then(setList)
      .catch(() => {});
  }, []);

  // create project and add to list
  const create = async () => {
    if (!name.trim()) return;
    try {
      const p = await apiFetch('/projects', {
        method: 'POST',
        body: JSON.stringify({name, description, colour}),
      });
      setList((prev) => [...prev, p]);
      setName('');
      setDescription('');
      setColour(presetColors[0]);
      setOpen(false);
    } catch {}
  };

  // open project settings
  const openSettings = (e: React.MouseEvent, p: Project) => {
    e.stopPropagation();
    setSettingsProject(p);
    setEditName(p.name);
    setEditDescription(p.description);
    setEditColour(p.colour);
    // fetch members
    apiFetch(`/projects/${p.id}/members`)
      .then(setMembers)
      .catch(() => setMembers([]));
  };

  // save project settings
  const saveSettings = async () => {
    if (!settingsProject) return;
    try {
      const updated = await apiFetch(`/projects/${settingsProject.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          colour: editColour,
        }),
      });
      setList((prev) =>
        prev.map((p) => (p.id === settingsProject.id ? {...p, ...updated} : p)),
      );
      setSettingsProject(null);
    } catch {
      alert('Failed to update project.');
    }
  };

  // archive/unarchive project
  const toggleArchive = async (p: Project) => {
    const nextArchived = !p.isArchived;
    try {
      await apiFetch(`/projects/${p.id}/archive`, {
        method: 'PATCH',
        body: JSON.stringify({isArchived: nextArchived}),
      });
      setList((prev) =>
        prev.map((pr) =>
          pr.id === p.id ? {...pr, isArchived: nextArchived} : pr,
        ),
      );
      setSettingsProject((prev) =>
        prev && prev.id === p.id ? {...prev, isArchived: nextArchived} : prev,
      );
    } catch {
      alert('Failed to archive project.');
    }
  };

  // delete project
  const deleteProject = async (p: Project) => {
    if (!confirm('Delete this project permanently?')) return;
    try {
      await apiFetch(`/projects/${p.id}`, {
        method: 'DELETE',
      });
      setList((prev) => prev.filter((pr) => pr.id !== p.id));
      setSettingsProject(null);
    } catch {
      alert('Failed to delete project.');
    }
  };

  // add member
  const addMember = async () => {
    if (!newMemberEmail.trim() || !settingsProject) return;
    try {
      const member = await apiFetch(`/projects/${settingsProject.id}/members`, {
        method: 'POST',
        body: JSON.stringify({
          email: newMemberEmail.trim(),
          role: newMemberRole,
        }),
      });
      setMembers((prev) => [...prev, member]);
      setNewMemberEmail('');
      setNewMemberRole('member');
    } catch {
      alert('Failed to add member. Check the email address.');
    }
  };

  // change member role
  const changeMemberRole = async (
    memberId: string,
    userId: string,
    role: string,
  ) => {
    if (!settingsProject) return;
    try {
      await apiFetch(`/projects/${settingsProject.id}/members/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({role}),
      });
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? {...m, role} : m)),
      );
    } catch {
      alert('Failed to change role.');
    }
  };

  // remove member
  const removeMember = async (userId: string) => {
    if (!settingsProject || !confirm('Remove this member?')) return;
    try {
      await apiFetch(`/projects/${settingsProject.id}/members/${userId}`, {
        method: 'DELETE',
      });
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } catch {
      alert('Failed to remove member.');
    }
  };

  return (
    <div>
      <div className={styles.head}>
        <h2>Projects</h2>
        {auth?.user?.role === 'ADMIN' && (
          <button className={styles.newBtn} onClick={() => setOpen(true)}>
            + New Project
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <div className={styles.empty}>No projects yet.</div>
      ) : (
        <div className={styles.grid}>
          {list.map((p) => (
            <div
              key={p.id}
              className={`${styles.card} ${p.isArchived ? styles.isArchived : ''}`}
              onClick={() => navigate(`/projects/${p.id}/boards/main`)}
            >
              <div className={styles.bar} style={{background: p.colour}} />
              <div className={styles.cardHead}>
                <h3>{p.name}</h3>
                {(p.members?.some(
                  (m) => m.userId === currentUserId && m.role === 'ADMIN',
                ) ||
                  auth?.user?.role === 'ADMIN') && (
                  <button
                    className={styles.settingsBtn}
                    onClick={(e) => openSettings(e, p)}
                    title="Project settings"
                  >
                    ⚙
                  </button>
                )}
              </div>
              <p>{p.description}</p>
              <div className={styles.cardFooter}>
                <span className={styles.taskCount}>
                  {p.tasks ?? 0} {p.tasks === 1 ? 'task' : 'tasks'}
                </span>
                {p.isArchived && (
                  <span className={styles.isArchivedBadge}>Archived</span>
                )}
                {p.createdAt && (
                  <span className={styles.dateLabel}>
                    {new Date(p.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>New Project</h3>

            <div className={styles.gp}>
              <label>Project Name</label>
              <input
                type="text"
                placeholder="e.g. Website Redesign"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className={styles.gp}>
              <label>Description</label>
              <textarea
                placeholder="What's this project about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className={styles.gp}>
              <label>Color</label>
              <div className={styles.colors}>
                {presetColors.map((c) => (
                  <div
                    key={c}
                    className={`${styles.clrDot} ${colour === c ? styles.active : ''}`}
                    style={{background: c}}
                    onClick={() => setColour(c)}
                  />
                ))}
              </div>
            </div>

            <div className={styles.actions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button className={styles.createBtn} onClick={create}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      {settingsProject && (
        <div
          className={styles.overlay}
          onClick={() => setSettingsProject(null)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Project Settings — {settingsProject.name}</h3>
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${!showMembers ? styles.tabActive : ''}`}
                onClick={() => setShowMembers(false)}
              >
                Settings
              </button>
              <button
                className={`${styles.tab} ${showMembers ? styles.tabActive : ''}`}
                onClick={() => setShowMembers(true)}
              >
                Members ({members.length})
              </button>
            </div>

            {!showMembers ? (
              /*settings tab*/
              <>
                <div className={styles.gp}>
                  <label>Project Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className={styles.gp}>
                  <label>Description</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>
                <div className={styles.gp}>
                  <label>Color</label>
                  <div className={styles.colors}>
                    {presetColors.map((c) => (
                      <div
                        key={c}
                        className={`${styles.clrDot} ${editColour === c ? styles.active : ''}`}
                        style={{background: c}}
                        onClick={() => setEditColour(c)}
                      />
                    ))}
                  </div>
                </div>
                <div className={styles.actions}>
                  <button
                    className={styles.cancelBtn}
                    onClick={() => toggleArchive(settingsProject)}
                  >
                    {settingsProject.isArchived ? 'Unarchive' : 'Archive'}
                  </button>
                  <button
                    className={styles.cancelBtn}
                    onClick={() => deleteProject(settingsProject)}
                  >
                    Delete Project
                  </button>
                  <button className={styles.createBtn} onClick={saveSettings}>
                    Save Changes
                  </button>
                </div>
              </>
            ) : (
              /*members tab*/
              <>
                <div className={styles.memberList}>
                  {members.length === 0 && (
                    <p className={styles.emptyMembers}>No members yet</p>
                  )}
                  {members.map((m) => (
                    <div key={m.id} className={styles.memberRow}>
                      <div className={styles.memberInfo}>
                        <span className={styles.memberName}>
                          {m.user?.name}
                        </span>
                        <span className={styles.memberEmail}>
                          {m.user?.email || ''}
                        </span>
                      </div>
                      <select
                        className={styles.memberRole}
                        value={m.role}
                        onChange={(e) =>
                          changeMemberRole(m.id, m.userId, e.target.value)
                        }
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="MEMBER">Member</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                      <button
                        className={styles.removeMemberBtn}
                        onClick={() => removeMember(m.userId)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className={styles.addMemberRow}>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className={styles.addMemberInput}
                  />
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className={styles.memberRole}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MEMBER">Member</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                  <button className={styles.addMemberBtn} onClick={addMember}>
                    Add
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectPage;
