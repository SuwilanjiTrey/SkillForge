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

const App = () => {
  return (
    <BrowserRouter>
  <Routes>
    {/* Public routes */}
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/viewer" element={<ViewerDashboard />} />

    {/* Protected member routes */}
    <Route 
      path="/dashboard" 
      element={
        <AuthRoute>
          <MemberDashboard />
        </AuthRoute>
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