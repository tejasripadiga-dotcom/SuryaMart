import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OwnerLogin.css";
import API_BASE_URL from "../api";

function OwnerLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleLogin(event) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/owner-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed");
        return;
      }

      sessionStorage.setItem("ownerToken", data.token);

      setMessage("Login successful!");

      navigate("/admin");
    } catch (error) {
      setMessage(
        "Backend connection failed. Please check the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="owner-login">
      <h1>SuryaMart Owner Login</h1>

      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="username">Username</label>

          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Enter owner username"
            required
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter owner password"
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        {message && <p role="status">{message}</p>}
      </form>
    </div>
  );
}

export default OwnerLogin;