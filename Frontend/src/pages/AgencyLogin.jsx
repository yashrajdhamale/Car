import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAgency } from "../services/agencyAuthService";

export default function AgencyLogin() {
  const navigate = useNavigate();
  const [officeEmail, setOfficeEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const { user, profile } = await loginAgency(officeEmail, password);

      if (!user.emailVerified) {
        navigate(`/agency-verify-phone?uid=${user.uid}`);
        return;
      }

      if (!profile.phoneVerified) {
        navigate(`/agency-verify-phone?uid=${user.uid}`);
        return;
      }

      navigate("/agency-dashboard");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={onSubmit}>
        <h2>Agency Login</h2>
        {error ? <p style={styles.error}>{error}</p> : null}

        <input
          type="email"
          placeholder="Office Email"
          value={officeEmail}
          onChange={(e) => setOfficeEmail(e.target.value)}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Please wait..." : "Login"}
        </button>

        <p style={styles.linkText}>
          New agency?{" "}
          <span style={styles.link} onClick={() => navigate("/agency-register")}>
            Register
          </span>
        </p>
      </form>
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
    maxWidth: 420,
    background: "#111a2e",
    border: "1px solid #223252",
    borderRadius: 16,
    padding: 24,
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  input: {
    height: 46,
    borderRadius: 10,
    border: "1px solid #2d446f",
    background: "#0f1728",
    color: "#fff",
    padding: "0 12px",
  },
  button: {
    height: 46,
    border: "none",
    borderRadius: 10,
    background: "#4f8cff",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  error: { color: "#ff8c8c", fontSize: 14 },
  linkText: { fontSize: 14, color: "#cbd5e1" },
  link: { color: "#7fb0ff", cursor: "pointer" },
};