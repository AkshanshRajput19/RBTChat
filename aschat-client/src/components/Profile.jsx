import "./Profile.css";
function Profile({ currentUser }) {
  return (
    <div className="profile-page">

      <div className="profile-header">
        <button className="back-btn">←</button>
        <h2>Edit Profile</h2>
      </div>

      <div className="profile-content">

        <div className="profile-avatar">
          <div className="avatar-circle">
            {currentUser.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>

          <button className="change-photo-btn">
            Change Photo
          </button>
        </div>

        <div className="profile-section">

          <label>Name</label>

          <input
            type="text"
            defaultValue={currentUser.name}
          />

        </div>

        <div className="profile-section">

          <label>Email</label>

          <input
            type="email"
            defaultValue={currentUser.email}
          />

        </div>

        <div className="profile-section">

          <label>About</label>

          <textarea
            rows="4"
            placeholder="Tell everyone about yourself..."
          ></textarea>

        </div>

        <button className="save-profile-btn">
          Save Changes
        </button>

      </div>

    </div>
  );
}

export default Profile;