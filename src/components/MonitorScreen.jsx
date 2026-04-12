import { useState, useEffect, useRef, useCallback } from 'react';
import backgroundSpinner from '../assets/background-spinner.png';
import '../styles/MonitorScreen.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const LEVEL_COLORS = {
  info:  '#d4d4d4',
  warn:  '#f0c040',
  error: '#ff6b6b',
};

const CATEGORY_COLORS = {
  Twitch:       '#9146ff',
  Chatbot:      '#9146ff',
  Restream:     '#e91916',
  YouTube:      '#ff0000',
  EventSync:    '#4ade80',
  StreamNotify: '#60a5fa',
  Discord:      '#5865f2',
  BotService:   '#94a3b8',
  Monitor:      '#fbbf24',
};

function ServiceCard({ name, connected }) {
  const statusColor = connected === true ? '#4ade80' : connected === false ? '#ff6b6b' : '#94a3b8';
  const statusText  = connected === true ? 'Connected' : connected === false ? 'Token expired' : 'Connecting…';

  return (
    <div className="monitor-service-card">
      <div className="monitor-service-name">{name}</div>
      <div className="monitor-service-status" style={{ color: statusColor }}>
        <span style={{ marginRight: 6, fontSize: '0.7em' }}>●</span>{statusText}
      </div>
    </div>
  );
}

export function MonitorScreen({ onBack, discordAccessToken, discordUsername }) {
  const [logs, setLogs]         = useState([]);
  const [status, setStatus]     = useState(null);
  const [thumb, setThumb]       = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [fetchError, setFetchError] = useState('');
  const logEndRef = useRef(null);
  const logContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  const apiBase = API_BASE_URL;

  const fetchStatus = useCallback(async () => {
    try {
      const resp = await fetch(`${apiBase}/monitor/status`);
      if (resp.ok) {
        setStatus(await resp.json());
        setFetchError('');
      } else {
        setFetchError(`Status fetch failed: HTTP ${resp.status}`);
      }
    } catch (err) {
      setFetchError(`Status fetch error: ${err.message} (url: ${apiBase}/monitor/status)`);
    }
  }, [apiBase]);

  const fetchLogs = useCallback(async () => {
    try {
      const resp = await fetch(`${apiBase}/monitor/logs`);
      if (resp.ok) {
        const data = await resp.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('[Monitor] logs fetch error:', err);
    }
  }, [apiBase]);

  const fetchThumbnail = useCallback(async () => {
    try {
      const resp = await fetch(`${apiBase}/monitor/thumbnail`, {
        headers: {
          ...(discordAccessToken ? { Authorization: `Bearer ${discordAccessToken}` } : {}),
          ...(discordUsername ? { 'X-Discord-Username': discordUsername } : {}),
        },
      });
      if (resp.ok) {
        const blob = await resp.blob();
        setThumb(URL.createObjectURL(blob));
      }
    } catch { /* swallow */ }
  }, [apiBase, discordAccessToken, discordUsername]);

  // Initial load
  useEffect(() => {
    fetchStatus();
    fetchLogs();
    fetchThumbnail();
  }, [fetchStatus, fetchLogs, fetchThumbnail]);

  // Poll logs every 3 s, status every 15 s
  useEffect(() => {
    const logsInterval   = setInterval(fetchLogs,   3000);
    const statusInterval = setInterval(fetchStatus, 15000);
    return () => { clearInterval(logsInterval); clearInterval(statusInterval); };
  }, [fetchLogs, fetchStatus]);

  // Auto-scroll log feed to bottom (scroll within the container, not the whole page)
  useEffect(() => {
    const container = logContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [logs]);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg('');
    try {
      const form = new FormData();
      form.append('thumbnail', file);
      const resp = await fetch(`${apiBase}/monitor/upload-thumbnail`, {
        method: 'POST',
        headers: {
          ...(discordAccessToken ? { Authorization: `Bearer ${discordAccessToken}` } : {}),
          ...(discordUsername ? { 'X-Discord-Username': discordUsername } : {}),
        },
        body: form,
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setUploadMsg('Thumbnail saved — will apply on next update cycle.');
        fetchThumbnail();
      } else {
        setUploadMsg(data.error || 'Upload failed.');
      }
    } catch (err) {
      setUploadMsg(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString() : '—';

  return (
    <div className="monitor-container">
      {/* Background */}
      <div
        className="monitor-background"
        style={{ backgroundImage: `url(${backgroundSpinner})` }}
      />

      {/* Back button */}
      <button className="monitor-back-btn" onClick={onBack}>← Back</button>

      <div className="monitor-content">
        <h1 className="monitor-title">ESOC Monitor</h1>

        {fetchError && (
          <div style={{ background: '#3b1a1a', border: '1px solid #ff6b6b', borderRadius: 6, padding: '8px 12px', marginBottom: 12, color: '#ff6b6b', fontSize: '0.8em', fontFamily: 'monospace' }}>
            {fetchError}
          </div>
        )}

        {/* ── Service status cards ── */}
        <div className="monitor-section">
          <h2 className="monitor-section-title">Service Status</h2>
          <div className="monitor-services-row">
            <ServiceCard name="Twitch"   connected={status?.twitchTokenValid} />
            <ServiceCard name="Restream" connected={status?.restreamTokenValid} />
            <ServiceCard name="YouTube"  connected={status?.youtubeTokenValid} />
          </div>

          <div className="monitor-status-bar">
            <span>🔴 Twitch Live: <b>{status?.twitchLive ? 'YES' : 'No'}</b></span>
            <span>🔄 Last sync: <b>{fmtTime(status?.lastEventSync)}</b></span>
            <span>📺 Last thumbnail: <b>{fmtTime(status?.lastThumbnailUpdate)}</b></span>
            <span>📣 Last notification: <b>{fmtTime(status?.lastStreamNotify)}</b></span>
          </div>
        </div>

        {/* ── Thumbnail upload ── */}
        <div className="monitor-section">
          <h2 className="monitor-section-title">YouTube Thumbnail</h2>
          <div className="monitor-thumbnail-row">
            {thumb && (
              <img
                src={thumb}
                alt="Current thumbnail"
                className="monitor-thumbnail-preview"
              />
            )}
            <div className="monitor-thumbnail-controls">
              <p className="monitor-thumb-note">
                Upload a PNG or JPG to replace the current thumbnail.
                It will be applied to the latest YouTube livestream on the next update cycle (~15 min).
              </p>
              <button
                className="monitor-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Uploading…' : 'Choose File'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                style={{ display: 'none' }}
                onChange={handleUpload}
              />
              {uploadMsg && (
                <p className={`monitor-upload-msg ${uploadMsg.includes('saved') ? 'success' : 'error'}`}>
                  {uploadMsg}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Log feed ── */}
        <div className="monitor-section monitor-log-section">
          <h2 className="monitor-section-title">Live Logs</h2>
          <div className="monitor-log-feed" ref={logContainerRef}>
            {logs.length === 0 && (
              <p className="monitor-log-empty">No log entries yet…</p>
            )}
            {logs.map((entry, i) => (
              <div key={i} className="monitor-log-entry">
                <span className="monitor-log-time">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className="monitor-log-category"
                  style={{ color: CATEGORY_COLORS[entry.category] || '#94a3b8' }}
                >
                  [{entry.category}]
                </span>
                <span
                  className="monitor-log-message"
                  style={{ color: LEVEL_COLORS[entry.level] || '#d4d4d4' }}
                >
                  {entry.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
