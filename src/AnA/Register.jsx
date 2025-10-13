// src/AnA/Register.js
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { db } from "../AnA/firebase.js";  // Added collection and getDocs
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { Code, User, Lock, Mail, AlertCircle } from "lucide-react";
import "./AuthStyles.css";


const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

const [programs, setPrograms] = useState([]);
const [selectedYear, setSelectedYear] = useState("");

const handleYearChange = (e) => {
  setSelectedYear(e.target.value);
};

useEffect(() => {
  const fetchPrograms = async () => {
    const programsRef = collection(db, 'programs');
    const snapshot = await getDocs(programsRef);
    setPrograms(snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name
    })));
  };
  fetchPrograms();
}, []);


  
  
  
  const navigate = useNavigate();

const handleRegister = async (e) => {
  e.preventDefault();
  setError("");

  // Validate passwords match
  if (password !== confirmPassword) {
    setError("Passwords do not match");
    return;
  }

  // Validate password strength
  if (password.length < 6) {
    setError("Password must be at least 6 characters");
    return;
  }

  // Get selected values
  const programSelect = document.querySelector('select[name="program"]');
  const selectedProgram = programSelect.value;

  setLoading(true);

  try {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user document in 'users' collection
    const userRef = doc(db, "users", userCredential.user.uid);
    await setDoc(userRef, {
      email: email,
      name: name,
      role: "viewer",
      createdAt: new Date().toISOString(),
      subscriptionStatus: "inactive",
      subscriptionStart: new Date().toISOString(),
      subscriptionEnd: null,
      program: selectedProgram,
      yearOfStudy: selectedYear,
      authProvider: "email"
    });
    
    setLoading(false);
    navigate("/login"); // Redirect to login after registration
  } catch (error) {
    setLoading(false);
    if (error.code === "auth/email-already-in-use") {
      setError("Email is already in use");
    } else if (error.code === "permission-denied") {
      setError("Permission denied. Please contact support.");
    } else {
      setError("Registration failed. Please try again.");
    }
    console.error("Registration error:", error);
  }
};

const handleGoogleSignUp = async () => {
  setError("");
  setLoading(true);
  
  try {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Check if user already exists
    const userRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userRef);
    
    if (userSnapshot.exists()) {
      setLoading(false);
      setError("Account already exists. Please login instead.");
      return;
    }
    
    // Get selected values
    const programSelect = document.querySelector('select[name="program"]');
    const selectedProgram = programSelect.value;
    
    // Create new user document with complete structure
    await setDoc(userRef, {
      email: user.email,
      name: user.displayName || "Google User",
      role: "viewer",
      createdAt: new Date().toISOString(),
      subscriptionStatus: "inactive",
      subscriptionStart: new Date().toISOString(),
      subscriptionEnd: null,
      program: selectedProgram,
      yearOfStudy: selectedYear,
      authProvider: "google"
    });
    
    setLoading(false);
    navigate("/login"); // Redirect to login after registration
  } catch (error) {
    setLoading(false);
    if (error.code === "auth/popup-closed-by-user") {
      setError("Sign-up cancelled");
    } else if (error.code === "auth/popup-blocked") {
      setError("Pop-up blocked. Please enable pop-ups for this site.");
    } else {
      setError("Google sign-up failed. Please try again.");
    }
    console.error("Google sign-up error:", error);
  }
};

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Code size={36} className="logo-icon" />
          <h1>Developer Hub</h1>
          <p>Create a new account</p>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="input-group">
            <User size={20} className="input-icon" />
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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

          <div className="input-group">
            <Lock size={20} className="input-icon" />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="input-dropdown">
			<select name="program" required>
			  <option value="">Select Program</option>
			  {programs.map(program => (
				<option key={program.id} value={program.name}>
				  {program.name}
				</option>
			  ))}
			</select>
		</div>
		
		<div className="filter-group">
		  <label htmlFor="year-filter">Year of Study:</label>
		  <select
			id="year-filter"
			name="year"
			value={selectedYear}
			onChange={handleYearChange}
			required
		  >
			<option value="">Select Year</option>
			<option value="1st year">1st Year</option>
			<option value="2nd year">2nd Year</option>
			<option value="3rd year">3rd Year</option>
			<option value="4th year">4th Year</option>
			<option value="5th year">5th Year</option>
			<option value="6th year">6th Year</option>
		  </select>
		</div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button 
          type="button" 
          className="google-button" 
          onClick={handleGoogleSignUp}
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
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
