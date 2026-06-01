import {createContext, useContext, useState} from 'react';
import type {ReactNode} from 'react';
import styles from './popup.module.css';
import type {ToastContext, Toast} from './popup.types';
import toastSound from '../../assets/fahh.mp3';
const Context = createContext<ToastContext | null>(null);
//broad goal: toast("good morning") anywhere in the app should show a popup with that message.
export const useToast = () => {
  const tempContext = useContext(Context);
  return tempContext;
};

export const ToastProvider = ({children}: {children: ReactNode}) => {
  //toasts state to hold all active toasts,note that multiple toasts can be active at the same time!
  const [toasts, setToasts] = useState<Toast[]>([]);
  //this function
  const toast = (message: string) => {
    const id = Date.now(); //unique identifier
    setToasts((prev) => [...prev, {id, message}]); //add new toast to the list
    const audio = new Audio(toastSound);
    void audio.play().catch(() => {
      // ignore errors
    });
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500); //remove the toast after 3.5 seconds
  };
  /*
  JSX code:
  value={toast}->actual context value
  first we have the children(actual app)
  then we have a container for toasts.
  fun fact: we can render all the active toasts simultaneously
  one below the other
  */
  return (
    <Context.Provider value={{toast}}>
      {children}
      <div className={styles.container}>
        {toasts.map((t) => (
          <div key={t.id} className={styles.toast}>
            <span className={styles.msg}>{t.message}</span>
          </div>
        ))}
      </div>
    </Context.Provider>
  );
};
