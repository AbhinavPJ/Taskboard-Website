import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import {useContext} from 'react';
import {AuthContext} from './context/auth';
import Layout from './components/layout/layout';
import LoginPage from './pages/login/login';
import RegisterPage from './pages/register/register';
import DashBoardPage from './pages/dashboard/dashboard';
import ProfilePage from './pages/profile/profile';
import NotificationPage from './pages/notifications/notifications';
import ProjectPage from './pages/project/project';
import BoardPage from './pages/kanbanboard/kanbanboard';
import TaskPage from './pages/task/task';
import ManagePage from './pages/manage/manage';

//any attempt to access protected route without authentication will be redirected to login page.
const ProtectedRoute = () => {
  const auth = useContext(AuthContext);
  if (!auth) return null;
  if (auth.loading) return <div style={{padding: '2rem'}}>Loading...</div>;
  if (!auth.user) return <Navigate to="/login" />;
  //if successful auth,show layout,else redirect to login page.
  return auth.user ? <Layout /> : <Navigate to="/login" />;
};

const App = () => {
  //we have two public routes(register,login),rest are protected.
  //why protect tho? because we dont want unauthorized access to dashboard,profile etc.
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashBoardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/projects" element={<ProjectPage />} />
          <Route path="/projects/:projectId" element={<ProjectPage />} />
          <Route
            path="/projects/:projectId/boards/:boardId"
            element={<BoardPage />}
          />
          <Route path="/tasks/:taskId" element={<TaskPage />} />
          <Route path="/notifications" element={<NotificationPage />} />
          <Route path="/manage" element={<ManagePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
