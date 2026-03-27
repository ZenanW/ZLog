"use client";

import { useState, useEffect, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";
import { getFirebaseAuth, getGoogleProvider } from "@/lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        setIdToken(token);
      } else {
        setIdToken(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      const token = await user.getIdToken(true);
      setIdToken(token);
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const signIn = useCallback(async () => {
    await signInWithPopup(getFirebaseAuth(), getGoogleProvider());
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(getFirebaseAuth());
  }, []);

  return { user, idToken, loading, signIn, signOut };
}
