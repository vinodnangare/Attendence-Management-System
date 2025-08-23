import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db, AuthAPI, DB } from "../firebase/firebase.js";
import { doc, getDoc } from "firebase/firestore";


const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);        // Firebase user
  const [profile, setProfile] = useState(null);  // {role, name, classId}
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = AuthAPI.onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        setProfile(snap.exists() ? snap.data() : null);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Allow setting a demo user/profile for hardcoded logins
  const setDemoUser = (role) => {
    setUser({ uid: "demo", email: `${role}@test.com` });
    setProfile({ role, name: role.charAt(0).toUpperCase() + role.slice(1), classId: "demo" });
    setLoading(false);
  };

  // Add logout function
  const logout = async () => {
    await AuthAPI.signOut(auth);
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  const value = { user, profile, loading, setDemoUser, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
