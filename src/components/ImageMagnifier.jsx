import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/ImageMagnifier.module.css';

const ImageMagnifier = ({ src, alt }) => {
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 });
  const imgRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!imgRef.current) return;

    const elem = imgRef.current;
    const { top, left, width, height } = elem.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;

    // Only update if within bounds
    if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
      setMagnifierPosition({ x, y });
    }
  };

  const handleMouseLeave = () => {
    setShowMagnifier(false);
    // Remove any inline styles that might affect scrolling
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('position');
  };

  const handleMouseEnter = () => {
    setShowMagnifier(true);
  };

  // Cleanup any scroll locks when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('position');
    };
  }, []);

  return (
    <div className={styles.magnifierWrapper}>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={styles.mainImage}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      />
      {showMagnifier && (
        <div
          className={styles.magnifier}
          style={{
            backgroundImage: `url(${src})`,
            backgroundPosition: `${magnifierPosition.x}% ${magnifierPosition.y}%`
          }}
        />
      )}
    </div>
  );
};

export default ImageMagnifier;