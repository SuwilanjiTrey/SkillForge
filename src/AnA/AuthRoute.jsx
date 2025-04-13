// src/AnA/AuthRoute.js
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const AuthRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const db = getFirestore();
        // Direct document access by UID instead of querying by email
        const userRef = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userRef);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          if (userData.role === "member") {
            // Check if subscription is still valid
            if (userData.subscriptionEnd) {
              const subscriptionEnd = new Date(userData.subscriptionEnd);
              const now = new Date();
              if (subscriptionEnd > now) {
                setIsMember(true);
              } else {
                setIsMember(false);
              }
            } else {
              // If no subscription end date, assume they are a member
              setIsMember(true);
            }
          } else {
            setIsMember(false);
          }
        } else {
          setIsMember(false);
        }
      } else {
        setIsMember(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Checking subscription...</div>;
  }

  return isMember ? children : <Navigate to="/login" />;
};

export default AuthRoute;