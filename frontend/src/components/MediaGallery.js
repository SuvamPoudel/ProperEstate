import React, { useState } from "react";
import { API_URL } from "../constants";

// Resolve a file reference — supports both local uploads and external URLs
const resolveUrl = (f) => f && f.startsWith("http") ? f : `${API_URL}/uploads/${f}`;

const MediaGallery = ({ mediaFiles = [], title = "" }) => {
  const [active, setActive] = useState(0);
  const files = mediaFiles.length > 0 ? mediaFiles : [];
  if (files.length === 0) return (
    <div className="gallery-main-wrap">
      <img src="https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600" alt={title} className="gallery-main-img" />
    </div>
  );
  const src = resolveUrl(files[active]);
  const isVid = /\.(mp4|webm|mov|avi)$/i.test(files[active]);
  return (
    <div className="gallery-wrap">
      <div className="gallery-main-wrap">
        {isVid ? (
          <video key={src} src={src} className="gallery-main-img" controls autoPlay muted loop />
        ) : (
          <img key={src} src={src} alt={title} className="gallery-main-img" />
        )}
        {files.length > 1 && (
          <>
            <button className="gallery-arrow left" onClick={() => setActive(a => (a - 1 + files.length) % files.length)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button className="gallery-arrow right" onClick={() => setActive(a => (a + 1) % files.length)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <div className="gallery-counter">{active + 1} / {files.length}</div>
          </>
        )}
      </div>
      {files.length > 1 && (
        <div className="gallery-thumbs">
          {files.map((f, i) => {
            const tSrc = resolveUrl(f);
            const tVid = /\.(mp4|webm|mov|avi)$/i.test(f);
            return (
              <div key={i} className={"gallery-thumb" + (i === active ? " active" : "")} onClick={() => setActive(i)}>
                {tVid ? (
                  <video src={tSrc} className="gallery-thumb-media" muted />
                ) : (
                  <img src={tSrc} alt="" className="gallery-thumb-media" />
                )}
                {tVid && <span className="gallery-thumb-play">▶</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MediaGallery;
