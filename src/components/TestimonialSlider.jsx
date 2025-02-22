import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/TestimonialSlider.module.css';

const testimonials = [
  {
    id: 1,
    text: "Increíble calidad en las prendas. Los hoodies son extremadamente cómodos y el diseño racing es exactamente lo que buscaba. El servicio al cliente fue excepcional.",
    author: "Carlos Ramírez",
    stars: 5
  },
  {
    id: 2,
    text: "Las jackets de EndStore son impresionantes. El detalle en cada diseño y la calidad de los materiales superó mis expectativas. Definitivamente volveré a comprar.",
    author: "Andrea Torres",
    stars: 5
  },
  {
    id: 3,
    text: "Mi experiencia con EndStore ha sido fantástica. Desde el proceso de compra hasta la entrega, todo fue perfecto. Los polos tienen un ajuste excelente.",
    author: "Miguel Sánchez",
    stars: 5
  },
  {
    id: 4,
    text: "La colección F1 es espectacular. Se nota la pasión por el racing en cada prenda. El envío fue rápido y el empaque muy profesional. ¡100% recomendado!",
    author: "Diana Mendoza",
    stars: 5
  }
];

const TestimonialSlider = () => {
    const sliderRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
  
    useEffect(() => {
      const slider = sliderRef.current;
      if (!slider) return;
  
      const scroll = () => {
        if (isDragging) return;
        slider.scrollLeft += 1;
        if (slider.scrollLeft >= slider.scrollWidth / 2) {
          slider.scrollLeft = 0;
        }
      };
  
      const intervalId = setInterval(scroll, 30);
      return () => clearInterval(intervalId);
    }, [isDragging]);
  
    const handleMouseDown = (e) => {
      setIsDragging(true);
      setStartX(e.pageX - sliderRef.current.offsetLeft);
      setScrollLeft(sliderRef.current.scrollLeft);
    };
  
    const handleMouseLeave = () => {
      setIsDragging(false);
    };
  
    const handleMouseUp = () => {
      setIsDragging(false);
    };
  
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - sliderRef.current.offsetLeft;
      const walk = (x - startX) * 2;
      sliderRef.current.scrollLeft = scrollLeft - walk;
    };
  
    return (
      <div className={styles.testimonialWrapper}>
        <div
          className={styles.testimonialTrack}
          ref={sliderRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {/* Double the testimonials for infinite effect */}
          {[...testimonials, ...testimonials].map((testimonial, index) => (
            <div
              key={`${testimonial.id}-${index}`}
              className={styles.testimonialCard}
            >
              <div className={styles.testimonialContent}>
                <p className={styles.testimonialText}>{testimonial.text}</p>
                <h4 className={styles.authorName}>{testimonial.author}</h4>
                <div className={styles.stars}>
                  {[...Array(testimonial.stars)].map((_, i) => (
                    <i key={i} className="fas fa-star"></i>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default TestimonialSlider;