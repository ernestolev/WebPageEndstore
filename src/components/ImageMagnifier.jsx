import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/ImageMagnifier.module.css';

const ImageMagnifier = ({ src, alt }) => {
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0.5, y: 0.5 });
  const [touchActive, setTouchActive] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  // Magnification level - ajustable para mejor experiencia
  const magnificationLevel = 2.5;
  
  // Tamaño de la lupa
  const magnifierSize = {
    desktop: 200,
    mobile: 150
  };

  // Reset state when image changes
  useEffect(() => {
    // Reset states for new image
    setShowMagnifier(false);
    setImageLoaded(false);
    setCursorPosition({ x: 0.5, y: 0.5 });
    
    const img = new Image();
    img.onload = () => {
      setImageLoaded(true);
      if (imgRef.current) {
        updateDimensions();
      }
    };
    img.onerror = () => {
      console.error("Error loading image:", src);
      setImageLoaded(false);
    };
    img.src = src;

    const updateDimensions = () => {
      if (imgRef.current) {
        const rect = imgRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height,
          naturalWidth: imgRef.current.naturalWidth,
          naturalHeight: imgRef.current.naturalHeight,
        });
      }
    };

    // Listen for window resize to update dimensions
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      // Cancelar la carga de imagen si el componente se desmonta
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  // Calculate cursor position relative to image with bounds checking
  const getRelativeCoordinates = (event) => {
    if (!imgRef.current) return { x: 0.5, y: 0.5 };
    
    const { left, top, width, height } = imgRef.current.getBoundingClientRect();
    
    let x, y;
    
    // For mouse events
    if (event.clientX !== undefined) {
      x = Math.max(0, Math.min(1, (event.clientX - left) / width));
      y = Math.max(0, Math.min(1, (event.clientY - top) / height));
    } 
    // For touch events
    else if (event.touches && event.touches[0]) {
      x = Math.max(0, Math.min(1, (event.touches[0].clientX - left) / width));
      y = Math.max(0, Math.min(1, (event.touches[0].clientY - top) / height));
    } else {
      return { x: 0.5, y: 0.5 };
    }
    
    return { x, y };
  };

  // Mouse handlers
  const handleMouseEnter = (e) => {
    if (imageLoaded) {
      setShowMagnifier(true);
      // Actualizar la posición inicial del cursor
      setCursorPosition(getRelativeCoordinates(e));
    }
  };

  const handleMouseLeave = () => {
    setShowMagnifier(false);
  };

  const handleMouseMove = (e) => {
    if (imgRef.current && imageLoaded) {
      setCursorPosition(getRelativeCoordinates(e));
    }
  };

  // Touch handlers - mejorados para dispositivos móviles
  const handleTouchStart = (e) => {
    if (imageLoaded) {
      e.preventDefault(); // Prevent scrolling while zooming
      setTouchActive(true);
      setShowMagnifier(true);
      setCursorPosition(getRelativeCoordinates(e));
    }
  };

  const handleTouchMove = (e) => {
    if (touchActive && imgRef.current && imageLoaded) {
      e.preventDefault(); // Prevent scrolling while zooming
      setCursorPosition(getRelativeCoordinates(e));
    }
  };

  const handleTouchEnd = () => {
    setTouchActive(false);
    setShowMagnifier(false);
  };

  // Show zoom indicator when hovering but not zooming
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  
  const handleContainerEnter = () => {
    if (imageLoaded) {
      setShowZoomIndicator(true);
    }
  };

  const handleContainerLeave = () => {
    setShowZoomIndicator(false);
    setShowMagnifier(false);
  };

  // Calculate magnifier styles with improvements
  const getMagnifierStyle = () => {
    // Si la imagen no está cargada o no tenemos dimensiones, no mostrar
    if (!imageLoaded || dimensions.width === 0) {
      return { display: 'none' };
    }
    
    let width = window.innerWidth > 768 ? magnifierSize.desktop : magnifierSize.mobile;
    let height = width;
    
    return {
      backgroundImage: `url(${src})`,
      backgroundPosition: `${cursorPosition.x * 100}% ${cursorPosition.y * 100}%`,
      backgroundSize: `${dimensions.width * magnificationLevel}px ${dimensions.height * magnificationLevel}px`,
      width: `${width}px`,
      height: `${height}px`,
      left: `${cursorPosition.x * 100}%`,
      top: `${cursorPosition.y * 100}%`,
      transform: 'translate(-50%, -50%)',
      opacity: showMagnifier ? 1 : 0,
      visibility: showMagnifier ? 'visible' : 'hidden',
      backgroundRepeat: 'no-repeat'
    };
  };

  return (
    <div 
      className={styles.imageMagnifierContainer} 
      ref={containerRef}
      onMouseEnter={handleContainerEnter}
      onMouseLeave={handleContainerLeave}
    >
      <div className={styles.imageContainer}>
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={styles.image}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onLoad={() => {
            setImageLoaded(true);
            if (imgRef.current) {
              const rect = imgRef.current.getBoundingClientRect();
              setDimensions({
                width: rect.width,
                height: rect.height,
                naturalWidth: imgRef.current.naturalWidth,
                naturalHeight: imgRef.current.naturalHeight,
              });
            }
          }}
        />
        {showZoomIndicator && !showMagnifier && (
          <div className={styles.zoomIndicator}>
            <i className="fas fa-search-plus"></i>
            <span>Zoom</span>
          </div>
        )}
        <div 
          className={styles.magnifier} 
          style={getMagnifierStyle()}
        />
      </div>
    </div>
  );
};

export default ImageMagnifier;