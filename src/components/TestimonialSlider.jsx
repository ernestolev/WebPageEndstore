import React, { useState, useEffect } from 'react';
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
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === testimonials.length - 3 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.testimonialSlider}>
      <div 
        className={styles.sliderTrack}
        style={{ transform: `translateX(-${currentIndex * 33.33}%)` }}
      >
        {testimonials.map((testimonial) => (
          <div key={testimonial.id} className={styles.testimonialCard}>
            <p className={styles.testimonialText}>{testimonial.text}</p>
            <h4 className={styles.authorName}>{testimonial.author}</h4>
            <div className={styles.stars}>
              {[...Array(testimonial.stars)].map((_, i) => (
                <i key={i} className="fas fa-star"></i>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className={styles.sliderDots}>
        {[...Array(testimonials.length - 2)].map((_, idx) => (
          <button
            key={idx}
            className={`${styles.dot} ${currentIndex === idx ? styles.active : ''}`}
            onClick={() => setCurrentIndex(idx)}
          />
        ))}
      </div>
    </div>
  );
};

export default TestimonialSlider;