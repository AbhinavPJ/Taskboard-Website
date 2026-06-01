import {createRoot} from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import {AuthProvider} from './context/auth.tsx';
import {ToastProvider} from './components/popup/popup.tsx';

/*

final project structure:
outermost layer: auth
then:notification provider
then:app
why? app depends on auth and notif context,
similary notif context depends on auth context
*/
createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <ToastProvider>
      <App />
    </ToastProvider>
  </AuthProvider>,
);
