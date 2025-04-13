// src/AnA/Login.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { Code, Lock, Mail, AlertCircle } from "lucide-react";
import "./AuthStyles.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const auth = getAuth();
      
      // First authenticate the user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Store basic auth info immediately
      localStorage.setItem("userEmail", email);
      localStorage.setItem("userId", user.uid);
      
      // Get user document directly by ID instead of querying by email
      try {
        const db = getFirestore();
        
        // First check if user is an admin
        const adminRef = doc(db, "admins", user.uid);
        const adminSnapshot = await getDoc(adminRef);
        
        if (adminSnapshot.exists()) {
          // User is an admin
          console.log("User is an admin");
          localStorage.setItem("userRole", "admin");
          setLoading(false);
          navigate("/admin");
          return;
        }
        
        // Check if user exists in users collection
        const userRef = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userRef);
        
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          
          // Check if user is a member with valid subscription
          if (userData.role === "member") {
            if (userData.subscriptionEnd) {
              const subscriptionEnd = new Date(userData.subscriptionEnd);
              const now = new Date();
              
              if (subscriptionEnd > now) {
                // Valid member subscription
                localStorage.setItem("userRole", "member");
                setLoading(false);
                navigate("/dashboard");
                return;
              } else {
                // Expired subscription
                localStorage.setItem("userRole", "viewer");
                setLoading(false);
                navigate("/viewer");
                return;
              }
            } else {
              // Member without subscription date, assume valid
              localStorage.setItem("userRole", "member");
              setLoading(false);
              navigate("/dashboard");
              return;
            }
          } else if (userData.role === "viewer") {
            // Regular viewer
            localStorage.setItem("userRole", "viewer");
            setLoading(false);
            navigate("/viewer");
            return;
          }
        }
        
        // If we get here, assume viewer as default
        localStorage.setItem("userRole", "viewer");
        setLoading(false);
        navigate("/viewer");
        
      } catch (firestoreError) {
        console.warn("Firestore error but continuing:", firestoreError);
        // Default to viewer if any error occurs
        localStorage.setItem("userRole", "viewer");
        setLoading(false);
        navigate("/viewer");
      }
      
    } catch (authError) {
      setLoading(false);
      setError("Invalid email or password. Please try again.");
      console.error("Login error:", authError);
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Code size={36} className="logo-icon" />
          <h1>Skillforge Dev hub</h1>
          <p>Login to access the course platform</p>
        </div>
        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <Mail size={20} className="input-icon" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <Lock size={20} className="input-icon" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;