'use client';

import React from 'react';

interface CultureBubbleProps {
  long: string;
  videoUrl: string;
  culturaUrl: string;
}

export default function CultureBubble({ long, videoUrl, culturaUrl }: CultureBubbleProps) {
  // Converte youtu.be/ID ou youtube.com/watch?v=ID para embed
  const getEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|v=)([A-Za-z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <div className="culture-bubble">
      <div className="culture-bubble-text">{long}</div>

      {embedUrl && (
        <div className="culture-video-wrapper">
          <iframe
            src={embedUrl}
            title="Cultura Mar Brasil"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      <div className="culture-links">
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="culture-link culture-link-video"
          id="culture-video-link"
        >
          ▶ Ver vídeo no YouTube
        </a>
        <a
          href={culturaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="culture-link culture-link-pdf"
          id="culture-page-link"
        >
          📖 Manual de Cultura completo
        </a>
      </div>
    </div>
  );
}
