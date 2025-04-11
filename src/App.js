import React from "react";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from "./Home";
import AdminDashboard from "./Admin/Admin";
import AdminRoute from "./Admin/AdminRoute";
import Login from "./AnA/Login";
import Register from "./AnA/Register";
import AuthRoute from "./AnA/AuthRoute";

const App = () => {
  return (
    <BrowserRouter basename="/">
      <Routes>
        <Route path="/" element={
          <AuthRoute>
            <HomePage />
          </AuthRoute>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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