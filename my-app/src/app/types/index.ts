export interface User {
  id: number;
  email: string;
}

export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export interface AuthButtonProps {
  children: React.ReactNode;
  onClick: () => void;
}