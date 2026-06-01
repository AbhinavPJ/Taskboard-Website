// Register page - similar to login but with name + confirm password
import {useState, useContext} from 'react';
import {useNavigate, Link} from 'react-router-dom';
import {AuthContext} from '../../context/auth';
import {apiFetch} from '../../lib/api';
import styles from './register.module.css';

const RegisterPage = () => {
  //Setup state variables
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  //function to handle form submission
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!name || !username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    // register then auto-login
    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({name, username, email, password}),
      });
      // now log them in to get the cookie
      const user = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({email, password}),
      });
      auth?.login(user);
      //redirect to dashboard
      navigate('/');
    } catch {
      setError(
        'Registration failed. Email or username might already be in use.',
      );
    }
  };
  /*JSX code, have a background
  on the background setup a form with onSubmit function.
  on the form,we have the headers,
  below thatif error exists,we show it.
  We have two form fields.
  Note that we ensure that the state variables match input values
  and update they update onChange.
  e->eventObject
  e.target->which element triggered the event
  e.target.value->the current value of that element
  we can use /login as we defined it in App.tsx
  buttonclick->`handleSubmit` function runs
  */
  return (
    <div className={styles.background}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.header}>
          <h1>Create your account</h1>
          <h2>Start managing your projects today</h2>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.fields}>
          <label>Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className={styles.fields}>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
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
            placeholder="At least 4 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className={styles.fields}>
          <label>Confirm Password</label>
          <input
            type="password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <button type="submit" className={styles.bt}>
          Create account
        </button>
        <div className={styles.footer}>
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;
