export interface Toast {
  id: number;
  message: string;
}

export interface ToastContext {
  toast: (msg: string) => void;
}
