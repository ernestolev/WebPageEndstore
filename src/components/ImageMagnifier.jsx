import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/ImageMagnifier.module.css';

const ImageMagnifier = ({ src, alt }) => {
    const [showMagnifier, setShowMagnifier] = useState(false);
    const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 });
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
    const magnifierSize = 200;
    const zoomLevel = 5;
    const imageRef = useRef(null);

    const handleMouseMove = (e) => {
        const { left, top, width, height } = imageRef.current.getBoundingClientRect();
        
        // Calculate cursor position relative to the image
        const x = ((e.pageX - left) / width) * 100;
        const y = ((e.pageY - top) / height) * 100;
        setCursorPosition({ x, y });

        // Calculate magnifier position
        const magnifierOffset = magnifierSize / 2;
        setMagnifierPosition({
            x: e.pageX - magnifierOffset,
            y: e.pageY - magnifierOffset
        });
    };

    return (
        <div className={styles.magnifierWrapper}>
            <div
                className={styles.imageContainer}
                onMouseEnter={() => setShowMagnifier(true)}
                onMouseLeave={() => setShowMagnifier(false)}
                onMouseMove={handleMouseMove}
                ref={imageRef}
            >
                <img 
                    src={src} 
                    alt={alt} 
                    className={styles.mainImage}
                />
                {showMagnifier && (
                    <div 
                        className={styles.magnifier}
                        style={{
                            left: `${magnifierPosition.x}px`,
                            top: `${magnifierPosition.y}px`,
                            width: `${magnifierSize}px`,
                            height: `${magnifierSize}px`,
                            backgroundImage: `url(${src})`,
                            backgroundPosition: `${cursorPosition.x}% ${cursorPosition.y}%`,
                            backgroundSize: `${zoomLevel * 100}%`
                        }}
                    >
                        <div className={styles.zoomIcon}>
                            <i className="fas fa-search-plus"></i>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageMagnifier;