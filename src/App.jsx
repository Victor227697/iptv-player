import React, { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import "./App.css";

const App = () => {
  const [serverUrl, setServerUrl] = useState(localStorage.getItem("serverUrl") || "");
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [password, setPassword] = useState(localStorage.getItem("password") || "");
  const [loggedIn, setLoggedIn] = useState(false);
  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!serverUrl || !username || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      const m3uUrl = `${serverUrl}/get.php?username=${username}&password=${password}&type=m3u&output=ts`;
      const encodedUrl = encodeURIComponent(m3uUrl);
      const res = await fetch(`/api/proxy?url=${encodedUrl}`);
      const text = await res.text();

      if (!res.ok) throw new Error("Failed to load playlist.");

      const parsedChannels = parseM3U(text);
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
    const channels = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("#EXTINF")) {
        const nameMatch = lines[i].match(/,(.*)$/);
        const logoMatch = lines[i].match(/tvg-logo="(.*?)"/);
        const name = nameMatch ? nameMatch[1] : "Unnamed Channel";
        const logo = logoMatch ? logoMatch[1] : "";
        const url = lines[i + 1];
        if (url) {
          channels.push({ name, logo, url });
        }
      }
    }

    return channels;
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
          <input
            placeholder="http://example.com:port/"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
          />
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
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
              <ReactPlayer url={currentChannel} playing controls width="100%" height="100%" />
            ) : (
              <p>Select a channel</p>
            )}
          </div>
          <div className="channel-grid">
            {channels.map((ch, index) => (
              <div key={index} className="channel-card" onClick={() => setCurrentChannel(ch.url)}>
                {ch.logo && <img src={ch.logo} alt={ch.name} className="channel-logo" />}
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
