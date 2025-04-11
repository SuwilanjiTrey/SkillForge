import React from "react";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from "./Home";
import AdminDashboard from "./Admin/Admin";
import AdminRoute from "./Admin/AdminRoute";

// Add this to your browser console to test admin access
localStorage.setItem("isAdmin", "true");

const App = () => {
  return (
    <BrowserRouter basename="/">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;