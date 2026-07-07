import { useCallback, useEffect, useState } from "react";
import api from "../api";
import "./DashboardLayout.css";

function Users({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await api.get("/users");
      setUsers(response.data.users || []);
    } catch {
      setError("Users could not be loaded. Please check that the server is running.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = users.filter((user) => {
    const query = search.trim().toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  const getInitials = (name) =>
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <section className="users-page">
      <div className="users-page-heading">
        <div>
          <span className="welcome-kicker">COMMUNITY</span>
          <h2>All users</h2>
          <p>Everyone who has created an RBTChat account.</p>
        </div>

        <div className="users-count">
          <strong>{users.length}</strong>
          <span>{users.length === 1 ? "User" : "Users"}</span>
        </div>
      </div>

      <div className="users-toolbar">
        <div className="users-search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            type="search"
            placeholder="Search by name or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <button className="refresh-users" onClick={loadUsers} disabled={isLoading}>
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="users-state error">
          <p>{error}</p>
          <button onClick={loadUsers}>Try again</button>
        </div>
      )}

      {!error && isLoading && (
        <div className="users-state">
          <div className="users-loader" />
          <p>Loading registered users...</p>
        </div>
      )}

      {!error && !isLoading && filteredUsers.length === 0 && (
        <div className="users-state">
          <p>{search ? "No user matches your search." : "No users found."}</p>
        </div>
      )}

      {!error && !isLoading && filteredUsers.length > 0 && (
        <div className="users-grid">
          {filteredUsers.map((user) => {
            const isCurrentUser =
              user._id === currentUser.id || user.email === currentUser.email;

            return (
              <article className="user-card" key={user._id}>
                <div className="user-card-avatar">
                  {getInitials(user.name)}
                  <span />
                </div>

                <div className="user-card-details">
                  <div>
                    <h3>{user.name}</h3>
                    {isCurrentUser && <span className="you-badge">You</span>}
                  </div>
                  <p>{user.email}</p>
                  <span className="user-status">Active account</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default Users;
