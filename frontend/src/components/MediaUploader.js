import React, { useState, useRef, useEffect } from "react";
import { API_URL } from "../constants";

const MediaUploader = ({ initialMedia = [] }) => {
  const [previews, setPreviews] = useState(
    initialMedia.map(f => ({ name: f, url: `${API_URL}/uploads/${f}`, existing: true }))
  );
  const [newFiles, setNewFiles] = useState([]);
  const inputRef = useRef();
  const hiddenInputsRef = useRef([]);

  const handleFiles = (files) => {
    const remaining = 6 - previews.length;
    if (remaining <= 0) return;
    const selected = Array.from(files).slice(0, remaining);
    const newPreviews = selected.map(file => ({
      name: file.name,
      url: URL.createObjectURL(file),
      file,
      existing: false,
      type: file.type
    }));
    setPreviews(prev => [...prev, ...newPreviews]);
    setNewFiles(prev => [...prev, ...selected]);
  };

  const removeFile = (idx) => {
    const item = previews[idx];
    if (!item.existing) {
      URL.revokeObjectURL(item.url);
      setNewFiles(prev => prev.filter(f => f.name !== item.name));
    }
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const isVideo = (item) => item.type?.startsWith("video/") || /\.(mp4|webm|mov|avi|gif)$/i.test(item.name);

  useEffect(() => {
    hiddenInputsRef.current.forEach((input, i) => {
      if (input && newFiles[i]) {
        const dt = new DataTransfer();
        dt.items.add(newFiles[i]);
        input.files = dt.files;
      }
    });
  }, [newFiles]);

  return (
    <div className="media-uploader">
      <div className="media-uploader-label">
        <span>📸 Property Media</span>
        <span className="media-count-badge">{previews.length}/6</span>
      </div>
      <p className="media-uploader-hint">Add up to 6 images, videos, or GIFs. First file = cover photo.</p>

      {newFiles.map((f, i) => (
        <input
          key={i}
          type="file"
          name="media"
          accept="image/*,video/*,.gif"
          style={{ display: "none" }}
          ref={el => hiddenInputsRef.current[i] = el}
        />
      ))}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*,.gif"
        multiple
        style={{ display: "none" }}
        onChange={e => handleFiles(e.target.files)}
      />

      <div className="media-grid">
        {previews.map((item, idx) => (
          <div key={idx} className={"media-thumb" + (idx === 0 ? " cover" : "")}>
            {isVideo(item) ? (
              <video src={item.url} className="media-thumb-media" muted />
            ) : (
              <img src={item.url} alt={item.name} className="media-thumb-media" />
            )}
            {idx === 0 && <span className="media-cover-badge">Cover</span>}
            <button type="button" className="media-remove-btn" onClick={() => removeFile(idx)}>✕</button>
          </div>
        ))}
        {previews.length < 6 && (
          <button type="button" className="media-add-btn" onClick={() => inputRef.current?.click()}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Add Media</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default MediaUploader;
