import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { db } from "./db.service";
import { tokenService } from "./token.service";
import { UserItem } from "../types/user";

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS || 10);
const MAX_LOGIN_ATTEMPTS = Number(process.env.MAX_LOGIN_ATTEMPTS || 5);
const LOCKOUT_MINUTES = Number(process.env.LOCKOUT_MINUTES || 15);

function addMinutesISO(minutes: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

export const userService = {
  async register(email: string, password: string, name?: string | null) {
    const lower = email.toLowerCase();
    // basic checks (in handler we'll also validate)
    if (password.length < 8) throw new Error("password must be >= 8 chars");

    const existing = await db.getUserByEmail(lower);
    if (existing) throw new Error("user already exists");

    const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
    const now = new Date().toISOString();
    const user: UserItem = {
      email: lower,
      userId: uuidv4(),
      passwordHash,
      name: name || null,
      createdAt: now,
      updatedAt: now,
      loginAttempts: 0,
      lockedUntil: null,
    };
    await db.putUser(user);
    return {
      userId: user.userId,
      email: user.email,
      createdAt: user.createdAt,
    };
  },

  async login(email: string, password: string) {
    const lower = email.toLowerCase();
    const user = await db.getUserByEmail(lower);

    const genericError = new Error("invalid credentials");

    if (!user) {
      throw genericError;
    }

    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      throw new Error("account locked due to repeated failed logins");
    }

    const ok = bcrypt.compareSync(password, user.passwordHash);
    if (!ok) {
      const attempts = (user.loginAttempts || 0) + 1;
      const lockedUntil =
        attempts >= MAX_LOGIN_ATTEMPTS ? addMinutesISO(LOCKOUT_MINUTES) : null;
      await db.updateLoginAttempts(user.email, attempts, lockedUntil);
      throw genericError;
    }

    await db.resetLoginAttempts(user.email);

    // create token
    const token = await tokenService.sign({
      sub: user.userId,
      email: user.email,
    });
    return { accessToken: token, tokenType: "Bearer", expiresIn: "15m" };
  },
};
