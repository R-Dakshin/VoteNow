import React from 'react';

const BackgroundVideo = () => {
  return (
    <div className="video-background">
      <video autoPlay loop muted playsInline>
        <source 
          src="https://videos.pexels.com/video-files/3045163/3045163-hd_1920_1080_30fps.mp4" 
          type="video/mp4" 
        />
        {/* Fallback video URLs */}
        <source 
          src="https://videos.pexels.com/video-files/2491284/2491284-hd_1920_1080_30fps.mp4" 
          type="video/mp4" 
        />
      </video>
      <div className="video-overlay"></div>
    </div>
  );
};

export default BackgroundVideo;
