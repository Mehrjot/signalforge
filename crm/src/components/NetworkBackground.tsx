"use client";
import { useEffect, useRef } from "react";

// A lightweight, ambient "customer network" canvas. Nodes drift slowly and
// connect with faint lines when near — evoking a living graph of shoppers.
// Pure canvas (no Three.js) keeps it fast and dependency-free. Respects
// prefers-reduced-motion by rendering a static frame.
export default function NetworkBackground({ density = 46 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0,
      h = 0,
      raf = 0;

    type Node = { x: number; y: number; vx: number; vy: number; r: number; hot: boolean };
    let nodes: Node[] = [];

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas!.clientWidth;
      h = canvas!.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function init() {
      resize();
      nodes = Array.from({ length: density }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.6 + 0.8,
        hot: Math.random() < 0.18,
      }));
    }

    function frame() {
      ctx!.clearRect(0, 0, w, h);
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      // edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i],
            b = nodes[j];
          const dx = a.x - b.x,
            dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 130) {
            const op = (1 - dist / 130) * 0.18;
            ctx!.strokeStyle = `rgba(124,106,247,${op})`;
            ctx!.lineWidth = 0.6;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }
      // nodes
      for (const n of nodes) {
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx!.fillStyle = n.hot ? "rgba(0,229,160,0.9)" : "rgba(156,143,249,0.7)";
        ctx!.fill();
        if (n.hot) {
          ctx!.beginPath();
          ctx!.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2);
          ctx!.fillStyle = "rgba(0,229,160,0.08)";
          ctx!.fill();
        }
      }
      raf = requestAnimationFrame(frame);
    }

    init();
    if (reduced) {
      frame();
      cancelAnimationFrame(raf);
    } else {
      frame();
    }
    window.addEventListener("resize", init);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", init);
    };
  }, [density]);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
