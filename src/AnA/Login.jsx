import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { Code, Lock, Mail, AlertCircle } from "lucide-react";
import "./AuthStyles.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

// In Login.js, update the handleUserNavigation function

const handleUserNavigation = async (user) => {
  try {
    const db = getFirestore();
    
    // Store basic auth info
    localStorage.setItem("userEmail", user.email);
    localStorage.setItem("userId", user.uid);
    
    // Check if user is an admin
    const adminRef = doc(db, "admins", user.uid);
    const adminSnapshot = await getDoc(adminRef);
    
    if (adminSnapshot.exists()) {
      console.log("User is an admin");
      localStorage.setItem("userRole", "admin");
      navigate("/admin");
      return;
    }
    
    // Check if user is a tutor
    const tutorRef = doc(db, "tutors", user.uid);
    const tutorSnapshot = await getDoc(tutorRef);
    
    if (tutorSnapshot.exists()) {
      console.log("User is a tutor");
      localStorage.setItem("userRole", "tutor");
      navigate("/tutor");
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
          // Handle Firestore Timestamp properly
          let subscriptionEndDate;
          
          // Check if it's a Firestore Timestamp object
          if (userData.subscriptionEnd && typeof userData.subscriptionEnd.toDate === 'function') {
            subscriptionEndDate = userData.subscriptionEnd.toDate();
          } else {
            // If it's already a Date object or a string
            subscriptionEndDate = new Date(userData.subscriptionEnd);
          }
          
          const now = new Date();
          
          if (subscriptionEndDate > now) {
            localStorage.setItem("userRole", "member");
            navigate("/dashboard");
            return;
          } else {
            localStorage.setItem("userRole", "viewer");
            navigate("/viewer");
            return;
          }
        } else {
          localStorage.setItem("userRole", "member");
          navigate("/dashboard");
          return;
        }
      } else if (userData.role === "viewer") {
        localStorage.setItem("userRole", "viewer");
        navigate("/viewer");
        return;
      }
    }
    
    // Default to viewer if no specific role found
    localStorage.setItem("userRole", "viewer");
    navigate("/viewer");
    
  } catch (firestoreError) {
    console.warn("Firestore error but continuing:", firestoreError);
    localStorage.setItem("userRole", "viewer");
    navigate("/viewer");
  }
};

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleUserNavigation(userCredential.user);
      setLoading(false);
    } catch (authError) {
      setLoading(false);
      setError("Invalid email or password. Please try again.");
      console.error("Login error:", authError);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if this is a new user and create a basic profile
      const db = getFirestore();
      const userRef = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userRef);
      
      if (!userSnapshot.exists()) {
        // Create a new user document with viewer role by default
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName || "Google User",
          email: user.email,
          role: "viewer",
          createdAt: new Date(),
          authProvider: "google"
        });
      }
      
      await handleUserNavigation(user);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      if (error.code === "auth/popup-closed-by-user") {
        setError("Sign-in cancelled");
      } else if (error.code === "auth/popup-blocked") {
        setError("Pop-up blocked. Please enable pop-ups for this site.");
      } else {
        setError("Google sign-in failed. Please try again.");
      }
      console.error("Google sign-in error:", error);
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
          
          <div className="forgot-password-link">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button 
          type="button" 
          className="google-button" 
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg className="google-icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

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
