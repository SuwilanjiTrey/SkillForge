/*import React, { useEffect, useState } from "react";
import { auth, db } from "../AnA/firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AdminRoute = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                setIsAdmin(userDoc.exists() && userDoc.data().role === "admin");
            } else {
                setIsAdmin(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) return <p>Loading...</p>;
    return isAdmin ? children : <p>Access Denied</p>;
};

export default AdminRoute; */


import React from "react";
import { Navigate } from "react-router-dom";

// This is a simplified example. In a real app, you would check authentication state
const AdminRoute = ({ children }) => {
  // Replace this with your actual authentication logic
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default AdminRoute;