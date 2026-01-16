import React from 'react';

const AnimatedParticles = () => {
  return (
    <div className="particles-container">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${10 + Math.random() * 10}s`,
            width: `${40 + Math.random() * 80}px`,
            height: `${40 + Math.random() * 80}px`,
            background: `rgba(${99 + Math.random() * 50}, ${102 + Math.random() * 50}, ${241 + Math.random() * 20}, ${0.1 + Math.random() * 0.2})`,
          }}
        />
      ))}
    </div>
  );
};

export default AnimatedParticles;
