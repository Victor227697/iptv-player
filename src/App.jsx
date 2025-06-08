import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import "./App.css";

const App = () => {
  const [serverUrl, setServerUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [error, setError] = useState("");
  const videoRef = useRef(null);

  useEffect(() => {
    if (currentChannel && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(currentChannel);
      hls.attachMedia(videoRef.current);
      return () => hls.destroy();
    } else if (videoRef.current?.canPlayType("application/vnd.apple.mpegurl")) {
      videoRef.current.src = currentChannel;
    }
  }, [currentChannel]);

  const handleLogin = async () => {
    if (!serverUrl || !username || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      const cleanUrl = serverUrl.endsWith("/") ? serverUrl.slice(0, -1) : serverUrl;
      const m3uUrl = `${cleanUrl}/get.php?username=${username}&password=${password}&type=m3u&output=ts`;
      const res = await fetch(m3uUrl);
      const text = await res.text();
      const parsed = parseM3U(text);

      if (parsed.length === 0) throw new Error("No channels found.");
      setChannels(parsed);
      setLoggedIn(true);
      setError("");
    } catch (err) {
      setError("Failed to load channels. Check your login and server URL.");
    }
  };

  const parseM3U = (text) => {
    const lines = text.split("\n");
    const parsed = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("#EXTINF")) {
        const name = lines[i].split(",")[1] || "Unnamed";
        const logoMatch = lines[i].match(/tvg-logo="(.*?)"/);
        const logo = logoMatch ? logoMatch[1] : "";
        const url = lines[i + 1];
        if (url?.endsWith(".m3u8")) parsed.push({ name, logo, url });
      }
    }
    return parsed;
  };

  return (
    <div className="App">
      {!loggedIn ? (
        <div className="login-container">
          <h1>Login to IPTV</h1>
          <input placeholder="Server URL" value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} />
          <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={handleLogin}>Login</button>
          {error && <p className="error">{error}</p>}
        </div>
      ) : (
        <div className="player">
          <video ref={videoRef} controls autoPlay style={{ width: "100%" }} />
          <div className="channel-list">
            {channels.map((ch, i) => (
              <div key={i} onClick={() => setCurrentChannel(ch.url)} className="channel-card">
                {ch.logo && <img src={ch.logo} alt={ch.name} />}
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
