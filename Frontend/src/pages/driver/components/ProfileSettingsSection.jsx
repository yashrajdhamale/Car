// src/pages/driver/components/ProfileSettingsSection.jsx
import React, { useState } from "react";

const ProfileSettingsSection = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div className="p-4 border rounded shadow">
      <h2 className="text-lg font-semibold mb-2">Profile Settings</h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        className="border rounded px-2 py-1 mb-2 w-full"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="border rounded px-2 py-1 w-full"
      />
    </div>
  );
};

export default ProfileSettingsSection; // ✅ Add this
