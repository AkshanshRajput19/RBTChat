import { useState } from "react";
import api from "../api";
import AuthLayout from "./AuthLayout";

function Register({ setShowLogin, onAuth }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      alert("Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post("/register", {
        name,
        email,
        password,
      });

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

  const handleSubmit = (event) => {
    event.preventDefault();
    handleRegister();
  };

  return (
    <AuthLayout
      mode="register"
      setShowLogin={setShowLogin}
      eyebrow="Dreamy onboarding"
      heroTitle="Create a colorful new place for your people to connect."
      heroText="Build your profile and start messaging in a space made for lively conversations, quick calls, stories, and secure collaboration."
      highlights={["Fast account setup", "Stories and live chat", "Ready for groups and AI"]}
      cardEyebrow="New account"
      cardTitle="Create your account"
      cardDescription="A few details and you are ready to join RBTChat."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span>Full name</span>
          <input
            className="auth-input"
            type="text"
            placeholder="Enter your full name"
            value={name}
            autoComplete="name"
            onChange={(event) => setName(event.target.value)}
          />
        </label>

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
            placeholder="Create a password"
            value={password}
            autoComplete="new-password"
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <label className="auth-field">
          <span>Confirm password</span>
          <input
            className="auth-input"
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            autoComplete="new-password"
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>

        <div className="auth-inline-note auth-inline-note--soft">
          <strong>Quick tip</strong>
          <span>Use at least 6 characters so your password stays easy to remember and harder to guess.</span>
        </div>

        <button className="auth-primary-btn" type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Account"}
        </button>
      </form>

      <div className="auth-card-footer">
        <span>Already have an account?</span>
        <button
          className="auth-link-btn"
          type="button"
          onClick={() => setShowLogin(true)}
          disabled={isLoading}
        >
          Back to login
        </button>
      </div>
    </AuthLayout>
  );
}

export default Register;
