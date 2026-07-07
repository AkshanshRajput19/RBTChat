import { useEffect, useRef, useState } from "react";
import api from "../api";

const FILTERS = ["neon", "sunset", "ocean", "sepia"];

function Stories({ currentUser }) {
  const [stories, setStories] = useState([]);
  const [caption, setCaption] = useState("");
  const [filter, setFilter] = useState("neon");
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadStories = async () => {
      try {
        const response = await api.get("/stories");
        setStories(response.data.stories || []);
      } catch {
        // ignore
      }
    };

    loadStories();
  }, []);

  const handleCreateStory = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("caption", caption);
    formData.append("filter", filter);

    try {
      const response = await api.post("/stories", formData);
      setStories((currentStories) => [response.data.story, ...currentStories]);
      setCaption("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      // ignore
    }
  };

  return (
    <section className="stories-panel">
      <div className="stories-composer">
        <h3>Stories</h3>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
        />
        <input
          type="text"
          placeholder="Caption"
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
        />
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          {FILTERS.map((option) => (
            <option value={option} key={option}>
              {option}
            </option>
          ))}
        </select>
        <button type="button" onClick={handleCreateStory}>
          Share story
        </button>
      </div>

      <div className="story-list">
        {stories.map((story) => (
          <div className={`story-card ${story.filter || "neon"}`} key={story._id}>
            <img src={`${import.meta.env.VITE_SERVER_URL || "http://localhost:5000"}${story.imageUrl}`} alt="story" />
            <div className="story-overlay">
              <strong>{currentUser.name}</strong>
              <span>{story.caption || "Shared a moment"}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Stories;
