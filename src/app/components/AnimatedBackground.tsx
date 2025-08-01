"use client";

import React, { useRef, useEffect } from 'react';
import { Renderer, Camera, Geometry, Program, Mesh } from 'ogl';

interface ParticleBackgroundProps {
  className?: string;
  particleCount?: number;
  particleSpread?: number;
  speed?: number;
  colors?: string[];
  moveParticlesOnHover?: boolean;
  particleHoverFactor?: number;
  alphaParticles?: boolean;
  particleBaseSize?: number;
  sizeRandomness?: number;
  cameraDistance?: number;
  disableRotation?: boolean;
}

export const AnimatedBackground: React.FC<ParticleBackgroundProps> = ({
  className = '',
  particleCount = 2000,
  particleSpread = 10,
  speed = 0.1,
  colors = ['#4c1d95', '#a78bfa', '#7e22ce'],
  moveParticlesOnHover = true,
  particleHoverFactor = 1,
  alphaParticles = true,
  particleBaseSize = 100,
  sizeRandomness = 1,
  cameraDistance = 20,
  disableRotation = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const smoothMouseRef = useRef({ x: 0, y: 0 });
  const animationFrameId = useRef<number | null>(null);
  const rendererRef = useRef<{ render: (options: { scene: any; camera: any }) => void; setSize: (width: number, height: number) => void; gl: any } | null>(null);
  const particlesRef = useRef<{ position: { x: number; y: number }; rotation: { x: number; y: number; z: number } } | null>(null);
  const lastTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);

  useEffect(() => {
    const initWebGL = async () => {
      const container = containerRef.current;
      if (!container) return;

      const renderer = new Renderer({ depth: false, alpha: true });
      const gl = renderer.gl;
      rendererRef.current = renderer;

      gl.canvas.style.width = '100%';
      gl.canvas.style.height = '100%';
      gl.canvas.style.display = 'block';
      container.appendChild(gl.canvas);

      const camera = new Camera(gl, { fov: 15 });
      camera.position.set(0, 0, cameraDistance);

      const handleResize = () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        renderer.setSize(width, height);
        camera.perspective({ aspect: width / height });
      };
      window.addEventListener('resize', handleResize);
      handleResize();

      const handleMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      };

      if (moveParticlesOnHover) {
        window.addEventListener('mousemove', handleMouseMove);
      }

      const hexToRgb = (hex: string) => {
        hex = hex.replace(/^#/, '');
        const int = parseInt(hex, 16);
        return [
          ((int >> 16) & 255) / 255,
          ((int >> 8) & 255) / 255,
          (int & 255) / 255,
        ];
      };

      const positions = new Float32Array(particleCount * 3);
      const randoms = new Float32Array(particleCount * 4);
      const particleColors = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        let x, y, z, len;
        do {
          x = Math.random() * 2 - 1;
          y = Math.random() * 2 - 1;
          z = Math.random() * 2 - 1;
          len = x * x + y * y + z * z;
        } while (len > 1 || len === 0);

        const r = Math.cbrt(Math.random());
        positions.set([x * r, y * r, z * r], i * 3);
        randoms.set([
          Math.random(),
          Math.random(),
          Math.random(),
          Math.random(),
        ], i * 4);

        const color = hexToRgb(colors[Math.floor(Math.random() * colors.length)]);
        particleColors.set(color, i * 3);
      }

      const geometry = new Geometry(gl, {
        position: { size: 3, data: positions },
        random: { size: 4, data: randoms },
        color: { size: 3, data: particleColors },
      });

      const vertex = /* glsl */ `
        attribute vec3 position;
        attribute vec4 random;
        attribute vec3 color;

        uniform mat4 modelMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        uniform float uSpread;
        uniform float uBaseSize;
        uniform float uSizeRandomness;

        varying vec4 vRandom;
        varying vec3 vColor;

        void main() {
          vRandom = random;
          vColor = color;

          vec3 pos = position * uSpread;
          pos.z *= 10.0;

          vec4 mPos = modelMatrix * vec4(pos, 1.0);
          float t = uTime;
          mPos.x += sin(t * random.z + 6.28 * random.w) * mix(0.1, 1.5, random.x);
          mPos.y += sin(t * random.y + 6.28 * random.x) * mix(0.1, 1.5, random.w);
          mPos.z += sin(t * random.w + 6.28 * random.y) * mix(0.1, 1.5, random.z);

          vec4 mvPos = viewMatrix * mPos;
          gl_PointSize = (uBaseSize * (1.0 + uSizeRandomness * (random.x - 0.5))) / length(mvPos.xyz);
          gl_Position = projectionMatrix * mvPos;
        }
      `;

      const fragment = /* glsl */ `
        precision highp float;

        uniform float uTime;
        uniform float uAlphaParticles;
        varying vec4 vRandom;
        varying vec3 vColor;

        void main() {
          vec2 uv = gl_PointCoord.xy;
          float d = length(uv - vec2(0.5));

          if(uAlphaParticles < 0.5) {
            if(d > 0.5) {
              discard;
            }
            gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), 1.0);
          } else {
            float circle = smoothstep(0.5, 0.4, d) * 0.8;
            gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), circle);
          }
        }
      `;

      const program = new Program(gl, {
        vertex,
        fragment,
        uniforms: {
          uTime: { value: 0 },
          uSpread: { value: particleSpread },
          uBaseSize: { value: particleBaseSize },
          uSizeRandomness: { value: sizeRandomness },
          uAlphaParticles: { value: alphaParticles ? 1 : 0 },
        },
        transparent: true,
        depthTest: false,
      });

      const particles = new Mesh(gl, {
        mode: gl.POINTS,
        geometry,
        program
      });
      particlesRef.current = particles;

      const animate = (time: number) => {
        animationFrameId.current = requestAnimationFrame(animate);

        const delta = time - lastTimeRef.current;
        lastTimeRef.current = time;
        elapsedRef.current += delta * speed;

        program.uniforms.uTime.value = elapsedRef.current * 0.001;

        smoothMouseRef.current.x = smoothMouseRef.current.x * 0.9 + mouseRef.current.x * 0.1;
        smoothMouseRef.current.y = smoothMouseRef.current.y * 0.9 + mouseRef.current.y * 0.1;

        if (moveParticlesOnHover) {
          particles.position.x = -smoothMouseRef.current.x * particleHoverFactor;
          particles.position.y = -smoothMouseRef.current.y * particleHoverFactor;
        } else {
          particles.position.x = 0;
          particles.position.y = 0;
        }

        if (!disableRotation) {
          particles.rotation.x = Math.sin(elapsedRef.current * 0.0002) * 0.1;
          particles.rotation.y = Math.cos(elapsedRef.current * 0.0005) * 0.15;
          particles.rotation.z += 0.01 * speed;
        }

        renderer.render({ scene: particles, camera });
      };

      lastTimeRef.current = performance.now();
      animationFrameId.current = requestAnimationFrame(animate);

      return () => {
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
        }
        window.removeEventListener('resize', handleResize);
        if (moveParticlesOnHover) {
          window.removeEventListener('mousemove', handleMouseMove);
        }
        if (container.contains(gl.canvas)) {
          container.removeChild(gl.canvas);
        }
      };
    };
    initWebGL();
  }, [
    particleCount,
    particleSpread,
    speed,
    colors,
    moveParticlesOnHover,
    particleHoverFactor,
    alphaParticles,
    particleBaseSize,
    sizeRandomness,
    cameraDistance,
    disableRotation,
  ]);

  return <div ref={containerRef} className={`absolute top-0 left-0 w-full h-full z-0 ${className}`} />;
};