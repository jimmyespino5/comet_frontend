export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  role_id?: number;
  /** Roles de Spatie: es lo que devuelve /api/login (con $user->load('roles')) */
  roles?: { id: number; name: string }[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Player {
  id: number;
  first_name: string;
  last_name: string;
  dni: string;
  birth_date: string;
  position?: string;
  jersey_number?: number;
  pivot?: {
    position?: string;
    jersey_number?: number;
  };
}