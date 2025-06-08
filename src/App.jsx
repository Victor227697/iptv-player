import React, { useState, useRef, useEffect } from "react";
import "./App.css";

const App = () => {
  const [serverUrl, setServerUrl] = useState(localStorage.getItem("serverUrl") || "");
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [password, setPassword] = useState(localStorage.getItem("password") || "");
  const [loggedIn, setLoggedIn] = useState(false);
  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [error, setError] = useState("");
  const videoRef = useRef(null);

  const handleLogin = async () => {
    if (!serverUrl || !username || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      const cleanUrl = serverUrl.endsWith("/") ? serverUrl.slice(0, -1) : serverUrl;
      const m3uUrl = `${cleanUrl}/get.php?username=${username}&password=${password}&type=m3u&output=ts`;
      const encodedUrl = encodeURIComponent(m3uUrl);
      const res = await fetch(`/api/proxy?url=${encodedUrl}`);
      const text = await res.text();

      if (!res.ok) throw new Error("Failed to load playlist.");

      const parsedChannels = parseM3U(text);
      if (parsedChannels.length === 0) throw new Error("No channels found.");
      setChannels(parsedChannels);
      setLoggedIn(true);
      localStorage.setItem("serverUrl", serverUrl);
      localStorage.setItem("username", username);
      localStorage.setItem("password", password);
      setError("");
    } catch (err) {
      setError("Failed to load channels. Check your login and server URL.");
    }
  };

  const parseM3U = (m3uText) => {
    const lines = m3uText.split("\n");
    const parsed = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("#EXTINF")) {
        const name = lines[i].split(",")[1] || "Unnamed Channel";
        const url = lines[i + 1];
        if (url && url.endsWith(".ts")) {
          parsed.push({ name, url });
        }
      }
    }

    return parsed;
  };

  const handleLogout = () => {
    localStorage.clear();
    setServerUrl("");
    setUsername("");
    setPassword("");
    setChannels([]);
    setCurrentChannel(null);
    setLoggedIn(false);
  };

  return (
    <div className="App">
      {!loggedIn ? (
        <div className="login-container">
          <h1>Login to IPTV</h1>
          <input placeholder="http://example.com:port/" value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} />
          <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={handleLogin}>Login</button>
          {error && <p className="error">{error}</p>}
        </div>
      ) : (
        <div className="player-container">
          <div className="header">
            <h2>Now Playing</h2>
            <button onClick={handleLogout}>Logout</button>
          </div>
          <div className="video-wrapper">
            {currentChannel ? (
              <video ref={videoRef} src={currentChannel} controls autoPlay style={{ width: "100%" }} />
            ) : (
              <p>Select a channel</p>
            )}
          </div>
          <div className="channel-grid">
            {channels.map((ch, index) => (
              <div key={index} className="channel-card" onClick={() => setCurrentChannel(ch.url)}>
                <span>{ch.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
