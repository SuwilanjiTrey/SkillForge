// src/components/Settings.jsx
import React from "react";
import { Settings as SettingsIcon } from "lucide-react";
import "../Styles/placeholder.css";

const Settings = () => {
  return (
    <div className="placeholder-page">
      <div className="placeholder-icon">
        <SettingsIcon size={48} />
      </div>
      <h1>Settings</h1>
      <p>This feature is coming soon. You'll be able to customize your account preferences and application settings.</p>
    </div>
  );
};

export default Settings;

