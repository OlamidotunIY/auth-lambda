export interface UserItem {
  email: string;
  userId: string;
  passwordHash: string;
  name?: string | null;
  createdAt: string;
  updatedAt: string;
  loginAttempts?: number;
  lockedUntil?: string | null;
}
