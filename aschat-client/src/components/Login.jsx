import { useState } from "react";
import api from "../api";
import "./Login.css";

function Login({ setShowLogin, onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (email.trim() === "" || password.trim() === "") {
      alert("Please fill all fields");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post("/login", { email, password });

      if (response.data.requiresTwoFactor) {
        setRequiresOtp(true);
        alert(response.data.message);
        return;
      }

      alert(response.data.message);
      onAuth(response.data);
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Cannot connect to the server. Make sure the backend is running."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (!otp.trim()) {
      alert("Please enter the verification code.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post("/verify-otp", { email, otp });
      alert(response.data.message);
      onAuth(response.data);
    } catch (error) {
      alert(error.response?.data?.message || "Verification failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="login-box">
        <h2>Login...</h2>

        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <br /><br />

        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && handleLogin()}
        />

        <br /><br />

        {requiresOtp && (
          <>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleOtpSubmit()}
            />

            <br /><br />

            <button onClick={handleOtpSubmit} disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify Code"}
            </button>
          </>
        )}

        {!requiresOtp && (
          <button onClick={handleLogin} disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        )}

        <br /><br />

        <button onClick={() => setShowLogin(false)} disabled={isLoading}>
          Create New Account
        </button>
      </div>
    </div>
  );
}

export default Login;
