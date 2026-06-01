import {useContext, useEffect, useState} from 'react';
import {AuthContext} from '../../context/auth';
import {apiFetch} from '../../lib/api';
import styles from './manage.module.css';

type ManageUser = {
  id: string;
  username: string;
  role: 'USER' | 'ADMIN';
};

const ManagePage = () => {
  const auth = useContext(AuthContext);
  const [users, setUsers] = useState<ManageUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const isGlobalAdmin = auth?.user?.role === 'ADMIN';

  useEffect(() => {
    const load = async () => {
      if (!isGlobalAdmin) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await apiFetch('/user/all');
        setUsers((data || []) as ManageUser[]);
        setError('');
      } catch {
        setError('Failed to load users.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isGlobalAdmin]);

  const updateRole = async (userId: string, selectedRole: 'USER' | 'ADMIN') => {
    const current = users.find((u) => u.id === userId);
    if (!current || current.role === selectedRole) return;
    try {
      setSavingId(userId);
      const updated = await apiFetch(`/user/${userId}/role`, {method: 'PATCH'});
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? {...u, role: updated.role} : u)),
      );
    } catch {
      alert('Failed to update user role.');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadWrap}>
        <div className={styles.spinner} />
        <p>Loading users...</p>
      </div>
    );
  }

  if (!isGlobalAdmin) {
    return (
      <div className={styles.errorWrap}>
        <p>Only global admins can access this page.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <h2>Manage Users</h2>
        <span className={styles.count}>{users.length} users</span>
      </div>

      {error && <div className={styles.errorMsg}>{error}</div>}

      <div className={styles.list}>
        {users.length === 0 && (
          <div className={styles.empty}>No users found</div>
        )}
        {users.map((u) => (
          <div key={u.id} className={styles.row}>
            <div className={styles.userBlock}>
              <div className={styles.username}>{u.username}</div>
              <div className={styles.userId}>{u.id}</div>
            </div>
            <select
              className={styles.roleSelect}
              value={u.role}
              disabled={savingId === u.id}
              onChange={(e) =>
                updateRole(u.id, e.target.value as 'USER' | 'ADMIN')
              }
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManagePage;
