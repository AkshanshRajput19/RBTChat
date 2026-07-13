import { useState } from "react";
import api from "../api";
import AuthLayout from "./AuthLayout";

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

  const handleSubmit = (event) => {
    event.preventDefault();

    if (requiresOtp) {
      handleOtpSubmit();
      return;
    }

    handleLogin();
  };

  const resetOtpStep = () => {
    setOtp("");
    setRequiresOtp(false);
  };

  return (
    <AuthLayout
      mode="login"
      setShowLogin={setShowLogin}
      eyebrow="Secure social messaging"
      heroTitle="Step back into your conversations under a calmer sky."
      heroText="RBTChat brings messages, calling, stories, and AI support into one warm workspace that still feels personal."
      highlights={["Private access", "Live calls and chat", "RBT-AI assistance"]}
      cardEyebrow={requiresOtp ? "Two-factor sign in" : "Welcome back"}
      cardTitle={requiresOtp ? "Verify your login" : "Login to RBTChat"}
      cardDescription={
        requiresOtp
          ? "We found your account. Enter the 6-digit verification code to finish signing in."
          : "Access your workspace, continue your chats, and pick up right where you left off."
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {!requiresOtp ? (
          <>
            <label className="auth-field">
              <span>Email address</span>
              <input
                className="auth-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label className="auth-field">
              <span>Password</span>
              <input
                className="auth-input"
                type="password"
                placeholder="Enter your password"
                value={password}
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
          </>
        ) : (
          <>
            <div className="auth-inline-note">
              <strong>Check your inbox</strong>
              <span>Use the code sent to {email} to unlock your account.</span>
            </div>

            <label className="auth-field">
              <span>Verification code</span>
              <input
                className="auth-input"
                type="text"
                placeholder="Enter the 6-digit code"
                value={otp}
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) => setOtp(event.target.value)}
              />
            </label>
          </>
        )}

        <button className="auth-primary-btn" type="submit" disabled={isLoading}>
          {requiresOtp
            ? isLoading
              ? "Verifying..."
              : "Verify Code"
            : isLoading
              ? "Logging in..."
              : "Login"}
        </button>

        {requiresOtp && (
          <button
            className="auth-ghost-btn"
            type="button"
            onClick={resetOtpStep}
            disabled={isLoading}
          >
            Use a different email
          </button>
        )}
      </form>

      <div className="auth-card-footer">
        <span>Need an account?</span>
        <button
          className="auth-link-btn"
          type="button"
          onClick={() => setShowLogin(false)}
          disabled={isLoading}
        >
          Create one
        </button>
      </div>
    </AuthLayout>
  );
}

export default Login;
