import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAgencyProfile, logoutAgency } from "../services/agencyAuthService";

export default function AgencyDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const p = await getAgencyProfile();
        setProfile(p || null);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutAgency();
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2>Agency Dashboard</h2>
        {profile ? (
          <>
            <p style={styles.meta}>Agency: {profile.agencyName || profile.name}</p>
            <p style={styles.meta}>Email: {profile.officeEmail}</p>
            <p style={styles.meta}>Phone: {profile.phone}</p>
          </>
        ) : (
          <p style={styles.meta}>Loading...</p>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button style={styles.button} onClick={() => navigate("/agency-register")}>Edit Profile</button>
          <button style={styles.button} onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b1220",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 720,
    background: "#111a2e",
    border: "1px solid #223252",
    borderRadius: 12,
    padding: 24,
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  meta: { color: "#dbe5ff", fontSize: 14, margin: 0 },
  button: { height: 40, border: "none", borderRadius: 8, background: "#4f8cff", color: "#fff", padding: "0 12px", cursor: "pointer" },
};
