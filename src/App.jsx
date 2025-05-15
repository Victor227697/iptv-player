import React, { useState, useEffect } from 'react';
import Hls from 'hls.js';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [channels, setChannels] = useState([]);
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentStream, setCurrentStream] = useState(null);
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('favorites')) || []);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (currentStream) {
      const video = document.getElementById('videoPlayer');

      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(currentStream);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS.js error:', data);
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = currentStream;
      }
    }
  }, [currentStream]);

  const handleLogin = async () => {
    const m3uUrl = `${url}/get.php?username=${username}&password=${password}&type=m3u_plus&output=m3u8`;
    try {
      const res = await fetch(m3uUrl);
      const text = await res.text();
      const lines = text.split('\n');
      const parsedChannels = [];

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXTINF')) {
          const nameMatch = lines[i].match(/tvg-name="(.*?)"/);
          const logoMatch = lines[i].match(/tvg-logo="(.*?)"/);
          const name = nameMatch ? nameMatch[1] : 'Unknown';
          const logo = logoMatch ? logoMatch[1] : '';
          const streamUrl = lines[i + 1];
          parsedChannels.push({ name, logo, streamUrl });
        }
      }

      setChannels(parsedChannels);
      setFilteredChannels(parsedChannels);
      setLoggedIn(true);
    } catch (err) {
      alert('Failed to load channels. Check your login and server URL.');
    }
  };

  const toggleFavorite = (channel) => {
    const exists = favorites.find((fav) => fav.name === channel.name);
    if (exists) {
      setFavorites(favorites.filter((fav) => fav.name !== channel.name));
    } else {
      setFavorites([...favorites, channel]);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setFilteredChannels(
      channels.filter((channel) =>
        channel.name.toLowerCase().includes(term.toLowerCase())
      )
    );
  };

  if (!loggedIn) {
    return (
      <div className="login">
        <h1>Login to IPTV</h1>
        <input
          type="text"
          placeholder="Server URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Login</button>
      </div>
    );
  }

  return (
    <div className="app">
      <h1>IPTV Player</h1>
      {currentStream && (
        <div style={{ marginBottom: '1rem' }}>
          <h3>Now Playing</h3>
          <video
            id="videoPlayer"
            controls
            autoPlay
            width="100%"
            height="480px"
          />
        </div>
      )}
      <input
        type="text"
        placeholder="Search channels..."
        value={searchTerm}
        onChange={handleSearch}
        style={{ padding: '0.5rem', margin: '1rem 0', width: '100%' }}
      />
      <div className="grid">
        {filteredChannels.map((channel, index) => (
          <div key={index} className="card">
            <img
              src={channel.logo || 'https://via.placeholder.com/100'}
              alt={channel.name}
            />
            <p>{channel.name}</p>
            <button onClick={() => setCurrentStream(channel.streamUrl)}>
              ▶️ Play
            </button>
            <button onClick={() => toggleFavorite(channel)}>
              {favorites.find((fav) => fav.name === channel.name)
                ? '★ Remove Favorite'
                : '☆ Add Favorite'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
