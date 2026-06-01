import {useState, useContext} from 'react';
import {useNavigate, Link} from 'react-router-dom';
import {AuthContext} from '../../context/auth';
import {apiFetch} from '../../lib/api';
import styles from './login.module.css';

const LoginPage = () => {
  //we have email,password,error states and functions which set them
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  //we need these for redirecting and updating auth state on login
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  //Login attempt handler
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    try {
      const user = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({email, password}),
      });
      //if auth exists, we send a login action
      auth?.login(user);
      //successful? go to dashboard
      navigate('/');
    } catch (error) {
      //unsuccessful? set error variable to this
      setError('Invalid email or password.');
    }
  };
  /*JSX code, have a background
  on the background setup a form with onSubmit function.
  on the form,we have a header,if error exists,we show it.
  We have two form fields.
   Note that we ensure that the state variables match input values
  and update they update onChange.
  e->eventObject
  e.target->which element triggered the event
  e.target.value->the current value of that element
  Also note how we have &apos instead of ' (these are called escape sequences)
  we can use /register as we defined it in App.tsx
  buttonclick->`handleSubmit` function runs
  */
  return (
    <div className={styles.background}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.header}>
          <h1>Sign in to Task Board</h1>
          <h2>Manage your projects and tasks</h2>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.fields}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className={styles.fields}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className={styles.bt}>
          Sign in
        </button>
        <div className={styles.footer}>
          Don&apos;t have an account? <Link to="/register">Sign up</Link>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
