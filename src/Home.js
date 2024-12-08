import React from "react";
import { useNavigate } from "react-router-dom";
  
const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div>
            <h1>Welcome to the Online Courses Platform</h1>
            <button onClick={() => navigate("/admin")}>Go to Admin Dashboard</button>
        </div>
    );
};

export default HomePage;
