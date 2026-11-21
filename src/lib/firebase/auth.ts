import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "./config";

export type UserRole = "analyst" | "admin";

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isDemo?: boolean;
}

const DEMO_USERS: Record<string, AuthUser> = {
  "analyst@bank.com": {
    uid: "demo-analyst-001",
    email: "analyst@bank.com",
    displayName: "Priya Sharma (Sr. Analyst)",
    role: "analyst",
    isDemo: true,
  },
  "admin@bank.com": {
    uid: "demo-admin-001",
    email: "admin@bank.com",
    displayName: "Arjun Verma (Fraud Ops Lead)",
    role: "admin",
    isDemo: true,
  },
};

const LOCAL_STORAGE_KEY = "fraudshield_current_user";

export async function loginWithEmail(
  email: string,
  pass: string
): Promise<AuthUser> {
  // If Firebase is configured and ready, try real Firebase Auth first
  if (isFirebaseConfigured && auth) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const role: UserRole = email.toLowerCase().includes("admin") ? "admin" : "analyst";
      const user: AuthUser = {
        uid: cred.user.uid,
        email: cred.user.email || email,
        displayName: cred.user.displayName || (role === "admin" ? "Fraud Admin" : "Fraud Analyst"),
        role,
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
      }
      return user;
    } catch (err) {
      console.warn("[Auth] Firebase auth failed, checking demo fallback accounts:", err);
    }
  }

  // Fallback demo accounts / offline credentials
  const normalized = email.trim().toLowerCase();
  if (DEMO_USERS[normalized]) {
    const user = DEMO_USERS[normalized];
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
    }
    return user;
  }

  // Allow custom analyst email with default role
  const role: UserRole = normalized.includes("admin") ? "admin" : "analyst";
  const user: AuthUser = {
    uid: `user-${Date.now()}`,
    email: normalized,
    displayName: normalized.split("@")[0].toUpperCase() + (role === "admin" ? " (Admin)" : " (Analyst)"),
    role,
    isDemo: true,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
  }
  return user;
}

export async function registerWithEmail(
  email: string,
  pass: string,
  role: UserRole = "analyst"
): Promise<AuthUser> {
  if (isFirebaseConfigured && auth) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const user: AuthUser = {
        uid: cred.user.uid,
        email: cred.user.email || email,
        displayName: role === "admin" ? "Fraud Admin" : "Fraud Analyst",
        role,
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
      }
      return user;
    } catch (err) {
      console.warn("[Auth] Firebase registration failed, using local registration:", err);
    }
  }

  const user: AuthUser = {
    uid: `user-${Date.now()}`,
    email: email.trim().toLowerCase(),
    displayName: email.split("@")[0] + ` (${role})`,
    role,
    isDemo: true,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
  }
  return user;
}

export async function logoutUser(): Promise<void> {
  if (isFirebaseConfigured && auth) {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("[Auth] Sign out error:", err);
    }
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
}

export function getCurrentStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function subscribeToAuthChanges(callback: (user: AuthUser | null) => void): () => void {
  // If real Firebase Auth is active
  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const stored = getCurrentStoredUser();
        const role = stored?.role || (fbUser.email?.includes("admin") ? "admin" : "analyst");
        const user: AuthUser = {
          uid: fbUser.uid,
          email: fbUser.email || "analyst@bank.com",
          displayName: fbUser.displayName || stored?.displayName || "Fraud Analyst",
          role,
        };
        callback(user);
      } else {
        // Fall back to stored local user
        callback(getCurrentStoredUser());
      }
    });
  }

  // Otherwise check stored user
  callback(getCurrentStoredUser());
  return () => {};
}
