import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from "./Home";
import AdminDashboard from "./Admin/Admin";
import AdminRoute from "./Admin/AdminRoute";
import Login from "./AnA/Login";
import Register from "./AnA/Register";
import AuthRoute from "./AnA/AuthRoute";
import ViewerDashboard from "./Viewers/MainInter.jsx";
import MemberDashboard from "./Members/MainInter.jsx";
import OnlineCompiler from "./Members/Compiler.jsx";
import Settings from "./System/Settings.jsx";
import MathSolver from "./Members/MathModule.jsx";
import PastPapers from "./Members/past_papers.jsx";
import NavigationDrawer from "./System/MemberNavigation.jsx";

const App = () => {
  // Helper component to wrap member routes with NavigationDrawer
  const MemberRoute = ({ children }) => (
    <AuthRoute>
      <NavigationDrawer>
        {children}
      </NavigationDrawer>
    </AuthRoute>
  );

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/viewer" element={<ViewerDashboard />} />
        
        {/* Protected member routes with NavigationDrawer */}
        <Route
          path="/dashboard"
          element={
            <MemberRoute>
              <MemberDashboard />
            </MemberRoute>
          }
        />
        <Route
          path="/compiler"
          element={
            <MemberRoute>
              <OnlineCompiler />
            </MemberRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <MemberRoute>
              <Settings />
            </MemberRoute>
          }
        />
        <Route
          path="/math-solver"
          element={
            <MemberRoute>
              <MathSolver />
            </MemberRoute>
          }
        />
        <Route
          path="/past-papers"
          element={
            <MemberRoute>
              <PastPapers />
            </MemberRoute>
          }
        />
        
        {/* Protected admin routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;