// Profile page - shows user info card + account settings form
import { useState, useContext, useRef } from 'react';
import { AuthContext } from '../../context/auth';
import { apiFetch } from '../../lib/api';
import styles from './profile.module.css';

//This utility function helps us to convert uploaded file to base64 string!
const toBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
};

const ProfilePage = () => {
  //fetch variables from context
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [showSaved, setShowSaved] = useState(false);
  //this is a html element reference
  const fileRef = useRef<HTMLInputElement>(null);
  // build initials for avatar circle
  let initials = 'U';
  if (user) {
    const words = user.name.trim().split(' ');
    if (words.length > 1) {
      initials = words[0][0].toUpperCase() + words[1][0].toUpperCase();
    } else {
      initials = user.name.substring(0, 2).toUpperCase();
    }
  }
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const updated = await apiFetch('/user/me', {
        method: 'PATCH',
        body: JSON.stringify({ name, email }),
      });
      auth?.login(updated);
      setShowSaved(true);
      //we also need to set the state variables to the updated values, otherwise if they change something and click save again, it will send the old values (since state variables are what we send in the body)
      setName(updated.name);
      setEmail(updated.email);
      //after 2 seconds, set showSaved to false.React is amazing right?
      setTimeout(() => setShowSaved(false), 2000);
    } catch {
      alert('That email is already in use by another account.');
    }
  };
  //this opens the file dialog!
  const handleAvatarClick = () => {
    fileRef.current?.click();
  };
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await toBase64(file);
    try {
      const res = await apiFetch('/user/avatar', {
        method: 'POST',
        body: JSON.stringify({ avatar: base64 }),
      });
      auth?.login(res); //elegant way to update user data!
    } catch {
      alert('Image too large to upload');
    }
  };
  /*JSX code, we have a wrapper with two sections: the card and the form.
  The card shows user info and avatar, the form allows changing name/email.
  card->
    if user has avatar, show it, else show initials in a circle.
    if hover on avatar, show an overlay with a camera icon.
    click on avatar->opens file dialog->select image->upload to server->update avatar
    beside the avatar we show name, username, email and role one below the other.
  form->
    we have two fields, display name and email, filled with existing values.
    user changes them and clicks save changes->send to server->if successful show a saved signal for 2 seconds.
  */
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div
          className={styles.avatarWrap}
          onClick={handleAvatarClick}
          title="Click to change avatar">
          {user?.avatar ? (
            <img src={user.avatar} alt="Avatar" className={styles.avatarImg} />
          ) : (
            <div className={styles.avatar}>{initials}</div>
          )}
          <div className={styles.avatarOverlay}>{'📷'}</div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarUpload}
          />
        </div>
        <div className={styles.info}>
          <h2> Name: {user?.name}</h2>
          <h2> Username: {user?.username}</h2>
          <p className={styles.email}>Email: {user?.email}</p>
          <span className={styles.role}>{user?.role}</span>
        </div>
      </div>
      <div className={styles.form}>
        <h3>Account Settings</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formgroup}>
            <label>Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className={styles.formgroup}>
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className={styles.actions}>
            <button type="submit" className={styles.btn}>
              Save changes
            </button>
            {showSaved && <span className={styles.saved}>Saved</span>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
