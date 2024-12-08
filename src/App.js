import React from "react";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from "./Home.js";
import AdminDashboard from "./Admin/Admin.js";
import AdminRoute from "./Admin/AdminRoute.js";

const App = () => {
    return (
        <BrowserRouter basename="/SkillForge">
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