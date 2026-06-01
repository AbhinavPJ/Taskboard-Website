//User struct
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

//We use this as auth state
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => void;
}
