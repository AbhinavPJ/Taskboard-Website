import {useContext, useState, useEffect, useRef} from 'react';
import {
  Outlet,
  NavLink,
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {AuthContext} from '../../context/auth';
import {apiFetch} from '../../lib/api';
import {useToast} from '../popup/popup';
import styles from './layout.module.css';
import type {Notification} from './layout.types';
import dashboardIcon from '../../assets/dashboard.svg';
import menuIcon from '../../assets/menu.svg';
import sunIcon from '../../assets/sun.svg';
import moonIcon from '../../assets/moon.svg';
import projectsIcon from '../../assets/projects.svg';
import notificationsIcon from '../../assets/notifications.svg';
import logoutIcon from '../../assets/logout.svg';
import usersIcon from '../../assets/users.svg';
type NotificationSyncEvent = CustomEvent<{unreadCount: number}>;

const Layout = () => {
  const auth = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const toastContext = useToast();
  const name = auth?.user?.name ?? 'User';
  const avatar = auth?.user?.avatar;
  // notification badge count
  const [unreadCount, setUnreadCount] = useState(0);
  const isFirstNotificationFetch = useRef(true);
  const prevUnreadIds = useRef<Set<string>>(new Set());
  //  sidebar toggle
  const [sideBarOpen, setsideBarOpen] = useState(false);
  // get user initials for avatar circle (safely handling double spaces)
  let initials = 'U';
  const words = name.trim().split(' ');
  if (words.length > 1) {
    initials = words[0][0].toUpperCase() + words[1][0].toUpperCase();
  } else {
    initials = name.substring(0, 2).toUpperCase();
  }
  //extract page title from url path
  const pathSeg = location.pathname.split('/')[1];
  let pageTitle = 'Dashboard';
  if (pathSeg === 'projects') pageTitle = 'Projects';
  else if (pathSeg === 'notifications') pageTitle = 'Notifications';
  else if (pathSeg === 'profile') pageTitle = 'Profile';
  else if (pathSeg === 'manage') pageTitle = 'Manage Users';
  // dark mode state
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  // apply dark mode class to html element when state changes
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);
  // poll for notification count and show toast for new unread notifications
  useEffect(() => {
    const fetchCount = () => {
      apiFetch('/notifications')
        .then((notifs: Notification[]) => {
          const unreadNotifs = notifs.filter((n) => !n.read);
          setUnreadCount(unreadNotifs.length);
          const currentUnreadIds = new Set(unreadNotifs.map((n) => n.id));
          if (!isFirstNotificationFetch.current) {
            const newUnread = unreadNotifs.find(
              (n) => !prevUnreadIds.current.has(n.id),
            );
            if (newUnread) {
              toastContext?.toast(newUnread.msg);
            }
          }
          prevUnreadIds.current = currentUnreadIds;
          isFirstNotificationFetch.current = false;
        })
        .catch(() => {});
    };
    const onNotificationSync = (event: Event) => {
      const customEvent = event as NotificationSyncEvent;
      const count = customEvent.detail?.unreadCount;
      if (typeof count === 'number') {
        setUnreadCount(count);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 5000);
    window.addEventListener('notifications:sync', onNotificationSync);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications:sync', onNotificationSync);
    };
  }, [toastContext]);
  //  clear cookie on server then clear context
  const handleLogout = async () => {
    try {
      await apiFetch('/auth/logout', {method: 'POST'});
    } catch {}
    auth?.logout();
    navigate('/login');
  };
  // elegant way to update styles based on active NavLink
  const getNavClass = ({isActive}: {isActive: boolean}) =>
    isActive ? `${styles.active}` : '';
  /* 
JSX code: left: sidebar with logo, nav links and logout button
right: topbar, with sidebar toggle+page title+theme toggle+ pfp+ name
outlet helps us to  render child components
*/
  return (
    <div
      className={`${styles.shell} ${!sideBarOpen ? styles.sideBarCollapsed : ''}`}
    >
      <aside
        className={`${styles.sideBar} ${sideBarOpen ? styles.sideBarOpen : ''}`}
      >
        <div className={styles.logo}>
          <span>Task Board</span>
        </div>
        <nav className={styles.nav}>
          <NavLink to="/" end className={getNavClass}>
            <img src={dashboardIcon} alt="Dashboard" className={styles.icon} />
            Dashboard
          </NavLink>
          <NavLink to="/projects" className={getNavClass}>
            <img src={projectsIcon} alt="Projects" className={styles.icon} />
            Projects
          </NavLink>
          <NavLink to="/notifications" className={getNavClass}>
            <img
              src={notificationsIcon}
              alt="Notifications"
              className={styles.icon}
            />
            Notifications
            {unreadCount > 0 && (
              <span className={styles.notifBadge}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
          {auth?.user?.role === 'ADMIN' && (
            <NavLink to="/manage" className={getNavClass}>
              <img src={usersIcon} alt="Manage Users" className={styles.icon} />
              Manage Users
            </NavLink>
          )}
        </nav>
        <button onClick={handleLogout} className={styles.logout}>
          <img src={logoutIcon} alt="Logout" className={styles.icon} />
          Log out
        </button>
      </aside>
      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              onClick={() => setsideBarOpen((prev) => !prev)}
              className={styles.menuToggle}
              title="Toggle sidebar"
            >
              <img src={menuIcon} alt="Menu" className={styles.icon} />
            </button>
            <h1>{pageTitle}</h1>
          </div>
          <div className={styles.topActions}>
            <button
              className={styles.themeToggle}
              onClick={() => setIsDark(!isDark)}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              <img
                src={isDark ? sunIcon : moonIcon}
                alt="Theme Toggle"
                className={styles.icon}
              />
            </button>
            <Link
              to="/profile"
              className={styles.user}
              style={{textDecoration: 'none'}}
            >
              {avatar ? (
                <img src={avatar} alt="Avatar" className={styles.avatarImg} />
              ) : (
                <div className={styles.avatar}>{initials}</div>
              )}
              <span className={styles.userName}>{name}</span>
            </Link>
          </div>
        </header>
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
