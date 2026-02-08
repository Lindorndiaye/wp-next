"use client";

import { Column, Heading, Text, Avatar, Row, IconButton, Media } from "@once-ui-system/core";
import { useState, useEffect, useRef } from "react";
import styles from "./TestimonialsSlider.module.scss";

interface Testimonial {
  name: string;
  role?: string;
  avatar?: string;
  image?: string;
  content: React.ReactNode;
  companyLogo?: string;
}

interface TestimonialsSliderProps {
  title?: React.ReactNode;
  testimonials: Testimonial[];
}

export function TestimonialsSlider({ title, testimonials }: TestimonialsSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  // Auto-play every 10 seconds
  useEffect(() => {
    if (testimonials.length <= 1) return;

    // Clear existing interval
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }

    // Only start auto-play if not dragging
    if (!isDragging) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
      }, 10000);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isDragging, testimonials.length]);

  // Handle swipe start
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    startXRef.current = clientX;
    currentXRef.current = clientX;
    isDraggingRef.current = true;
    setIsDragging(true);
    setStartX(clientX);
    setCurrentX(clientX);
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  // Global mouse/touch move handlers
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      currentXRef.current = clientX;
      setCurrentX(clientX);
    };

    const handleEnd = () => {
      if (!isDraggingRef.current) return;
      const diff = startXRef.current - currentXRef.current;
      const threshold = 50;

      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          nextTestimonial();
        } else {
          prevTestimonial();
        }
      }

      isDraggingRef.current = false;
      setIsDragging(false);
      setStartX(0);
      setCurrentX(0);
    };

    window.addEventListener('mousemove', handleMove, { passive: false });
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('mouseleave', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('mouseleave', handleEnd);
    };
  }, [isDragging]);

  const currentTestimonial = testimonials[currentIndex];

  return (
    <Column fillWidth gap="m" paddingY="l">
      {title && (
        <Column horizontal="center" paddingBottom="m">
          <Heading as="h2" variant="display-strong-xs" wrap="balance">
            {title}
          </Heading>
        </Column>
      )}
      <Column
        fillWidth
        horizontal="center"
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
      >
        <div className={styles.testimonialWrapper}>
          {testimonials.length > 1 && (
            <>
              <IconButton
                variant="tertiary"
                icon="chevronLeft"
                onClick={prevTestimonial}
                aria-label="Témoignage précédent"
                className={styles.arrowButtonLeft}
              />
              <IconButton
                variant="tertiary"
                icon="chevronRight"
                onClick={nextTestimonial}
                aria-label="Témoignage suivant"
                className={styles.arrowButtonRight}
              />
            </>
          )}
          <Column
            className={styles.testimonialCard}
            gap="m"
            padding="l"
            horizontal="center"
            align="center"
            maxWidth="m"
            style={{
              transform: isDragging ? `translateX(${(currentX - startX) * 0.1}px)` : undefined,
              transition: isDragging ? 'none' : 'transform 0.3s ease',
            }}
          >
          {currentTestimonial.content && (
            <Text
              variant="heading-default-s"
              wrap="balance"
              onBackground="neutral-weak"
              style={{ fontStyle: "normal", textAlign: "center", whiteSpace: "pre-line" }}
            >
              {currentTestimonial.content}
            </Text>
          )}
          <Column horizontal="center" gap="s" paddingTop="m">
            {currentTestimonial.image && (
              <img
                src={currentTestimonial.image}
                alt={currentTestimonial.name}
                className={styles.clientImage}
                onError={(e) => {
                  // Fallback to avatar if image fails to load
                  if (currentTestimonial.avatar) {
                    e.currentTarget.style.display = 'none';
                  }
                }}
              />
            )}
            {!currentTestimonial.image && currentTestimonial.avatar && (
              <Avatar src={currentTestimonial.avatar} size="m" />
            )}
            <Column horizontal="center" gap="xs">
              <Text variant="heading-strong-m" onBackground="neutral-strong">
                {currentTestimonial.name}
              </Text>
              {currentTestimonial.role && (
                <Text variant="body-default-s" onBackground="neutral-weak">
                  {currentTestimonial.role}
                </Text>
              )}
            </Column>
            {currentTestimonial.companyLogo && (
              <img
                src={currentTestimonial.companyLogo}
                alt={`Logo ${currentTestimonial.name}`}
                className={styles.companyLogo}
              />
            )}
          </Column>
        </Column>
        </div>
        {testimonials.length > 1 && (
          <Row gap="xs" paddingTop="l" horizontal="center" vertical="center">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`${styles.dot} ${index === currentIndex ? styles.active : ''}`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Aller au témoignage ${index + 1}`}
              />
            ))}
          </Row>
        )}
      </Column>
    </Column>
  );
}

