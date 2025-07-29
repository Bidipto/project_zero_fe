"use client";

import React, { useRef, useEffect } from 'react';

// --- PROPS INTERFACE ---
// We define the types for the component's props for better type-checking and autocompletion.
interface AnimatedBackgroundProps {
  className?: string;
  mainColor?: string;
  highlightColor?: string;
  fontSize?: number;
  speed?: number; // Value from 0.1 (slow) to 2 (fast)
}

// --- THE COMPONENT ---
export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  className,
  mainColor = "#4c1d95",         // Default: purple-700
  highlightColor = "#a78bfa", // Default: purple-400
  fontSize = 18,
  speed = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const resizeTimeoutRef = useRef<number | null>(null);;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- STATE & CONFIGURATION ---
    // Using an object to hold state makes it cleaner to manage.
    const config = {
      width: 0,
      height: 0,
      columns: 0,
      // The iconic Katakana character set from The Matrix, plus some numbers and symbols.
      characters: "QWERTYUIOPSDFGHJKLXCV",
    };

    // --- PARTICLE CLASS ---
    // We use a class to represent each falling character "drop". This encapsulates its logic nicely.
    class Particle {
      x: number;
      y: number;
      speed: number;
      char: string;

      constructor(x: number, y: number, speed: number) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.char = config.characters.charAt(Math.floor(Math.random() * config.characters.length));
      }

      // The draw method is responsible for drawing the particle on the canvas.
      draw(context: CanvasRenderingContext2D) {
        // The lead character is brighter (highlightColor)
        context.fillStyle = highlightColor;
        context.fillText(this.char, this.x, this.y);

        // The rest of the trail is the main color.
        context.fillStyle = mainColor;
        context.fillText(this.char, this.x, this.y - fontSize); // Draw one step behind
      }

      // The update method handles the particle's movement and resets it when it goes off-screen.
      update() {
        this.y += this.speed;
        if (this.y > config.height + fontSize) {
          this.y = Math.random() * config.height / 4; // Reset near the top with some randomness
          this.speed = (Math.random() * 0.5 + 0.5) * speed * fontSize * 0.15; // Randomize speed
          this.char = config.characters.charAt(Math.floor(Math.random() * config.characters.length));
        }
      }
    }

    let particles: Particle[] = [];

    // --- INITIALIZATION ---
    // The init function sets up the canvas and creates the particles. It's called on load and on resize.
    const init = () => {
      // Handle high-DPI screens for a crisp render
      const dpr = window.devicePixelRatio || 1;
      config.width = window.innerWidth;
      config.height = window.innerHeight;

      canvas.width = config.width * dpr;
      canvas.height = config.height * dpr;
      ctx.scale(dpr, dpr);

      canvas.style.width = `${config.width}px`;
      canvas.style.height = `${config.height}px`;

      config.columns = Math.floor(config.width / fontSize);
      particles = [];

      for (let i = 0; i < config.columns; i++) {
        const x = i * fontSize;
        const y = Math.random() * config.height;
        const particleSpeed = (Math.random() * 0.5 + 0.5) * speed * fontSize * 0.15;
        particles.push(new Particle(x, y, particleSpeed));
      }
    };

    // --- ANIMATION LOOP ---
    // We use requestAnimationFrame for smoother, more efficient animations.
    const animate = () => {
      // 1. Draw a semi-transparent rectangle over the whole canvas to create the fading trail effect.
      ctx.fillStyle = "rgba(17, 24, 39, 0.1)"; // bg-gray-900 with alpha
      ctx.fillRect(0, 0, config.width, config.height);

      // 2. Set the font for the characters.
      ctx.font = `bold ${fontSize}px monospace`;

      // 3. Update and draw each particle.
      particles.forEach(p => {
        p.update();
        p.draw(ctx);
      });

      // 4. Request the next frame.
      animationFrameId.current = requestAnimationFrame(animate);
    };

    // --- START & EVENT LISTENERS ---
    init();
    animate();

    const handleResize = () => {
      // A simple debounce to prevent the init function from firing too rapidly on resize.
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        init();
      }, 150);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      // Cleanup function: This runs when the component unmounts or dependencies change.
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [mainColor, highlightColor, fontSize, speed]); // Re-run effect if props change

  return <canvas ref={canvasRef} className={`absolute top-0 left-0 w-full h-full z-0 ${className || ''}`} />;
};