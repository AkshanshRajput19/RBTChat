import { useState } from "react";
import api from "../api";
import "./Register.css";

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

  return (
    <div className="container">
      <div className="register-box">
        <h2>Create Account</h2>

        <input
          type="text"
          placeholder="Enter Your Full Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && handleRegister()}
        />

        <button onClick={handleRegister} disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Account"}
        </button>

        <button
          className="switch-btn"
          onClick={() => setShowLogin(true)}
          disabled={isLoading}
        >
          Back To Login
        </button>
      </div>
    </div>
  );
}

export default Register;
