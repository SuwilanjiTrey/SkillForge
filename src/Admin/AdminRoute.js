// src/Admin/AdminRoute.js
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

const AdminRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const db = getFirestore();
        const adminRef = collection(db, "admins");
        const adminQuery = query(adminRef, where("email", "==", user.email));
        const adminSnapshot = await getDocs(adminQuery);
        
        if (!adminSnapshot.empty) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  if (loading) {
    return <div className="loading">Checking permissions...</div>;
  }
  
  return isAdmin ? children : <Navigate to="/login" replace />;
};

export default AdminRoute;