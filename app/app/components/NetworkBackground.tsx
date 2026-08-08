"use client";

import { useEffect, useRef } from "react";

/**
 * Sparse, slow-drifting node/edge graph behind the landing hero - a quiet "ledger network"
 * motif. Steel-blue by default with occasional teal accent edges/nodes and rare traveling
 * signal pulses. Deliberately restrained: low per-shape alpha, long drift/breath cycles
 * (20-35s), infrequent pulses (one every ~4-7s, max 3 concurrent). Respects
 * prefers-reduced-motion by rendering a single static frame instead of animating.
 */

const STEEL_COLORS = ["#2E3E5C", "#3E4C6B"];
const TEAL = "#2DD4BF";

const NODE_COUNT = 22;
const TEAL_NODE_FRACTION = 0.18;
const TEAL_EDGE_FRACTION = 0.16;
const MAX_CONCURRENT_PULSES = 3;

type NetworkNode = {
  bx: number;
  by: number;
  driftRadius: number;
  angularSpeed: number;
  phase: number;
  isTeal: boolean;
};

type NetworkEdge = {
  a: number;
  b: number;
  isTeal: boolean;
  baseOpacity: number;
  breathPeriod: number;
  breathPhase: number;
};

type Pulse = {
  edge: number;
  reverse: boolean;
  start: number;
  duration: number;
};

function seedNetwork() {
  const nodes: NetworkNode[] = Array.from({ length: NODE_COUNT }, () => ({
    bx: Math.random(),
    by: Math.random(),
    driftRadius: 0.015 + Math.random() * 0.02,
    angularSpeed: (2 * Math.PI) / (20 + Math.random() * 15),
    phase: Math.random() * Math.PI * 2,
    isTeal: Math.random() < TEAL_NODE_FRACTION,
  }));

  const edgeSet = new Set<string>();
  const edges: NetworkEdge[] = [];

  function addEdge(a: number, b: number) {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (a === b || edgeSet.has(key)) return;
    edgeSet.add(key);
    edges.push({
      a,
      b,
      isTeal: Math.random() < TEAL_EDGE_FRACTION,
      baseOpacity: 0.1 + Math.random() * 0.12,
      breathPeriod: 15 + Math.random() * 15,
      breathPhase: Math.random() * Math.PI * 2,
    });
  }

  nodes.forEach((node, i) => {
    const nearest = nodes
      .map((other, j) => ({ j, d: Math.hypot(other.bx - node.bx, other.by - node.by) }))
      .filter((entry) => entry.j !== i)
      .sort((a, b) => a.d - b.d);
    const neighborCount = 1 + Math.floor(Math.random() * 2);
    nearest.slice(0, neighborCount).forEach(({ j }) => addEdge(i, j));
  });

  for (let i = 0; i < 3; i++) {
    addEdge(Math.floor(Math.random() * NODE_COUNT), Math.floor(Math.random() * NODE_COUNT));
  }

  return { nodes, edges };
}

export function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { nodes, edges } = seedNetwork();
    const pulses: Pulse[] = [];

    let lastPulseSpawn = 0;
    let width = 0;
    let height = 0;
    let rafId = 0;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize);

    function nodePosition(node: NetworkNode, t: number) {
      const x = node.bx + Math.cos(t * node.angularSpeed + node.phase) * node.driftRadius;
      const y = node.by + Math.sin(t * node.angularSpeed + node.phase) * node.driftRadius;
      return { x: x * width, y: y * height };
    }

    function draw(now: number) {
      const t = now / 1000;
      ctx!.clearRect(0, 0, width, height);

      const positions = nodes.map((node) => nodePosition(node, t));

      edges.forEach((edge) => {
        const p1 = positions[edge.a];
        const p2 = positions[edge.b];
        const breath =
          0.75 + 0.25 * Math.sin((t / edge.breathPeriod) * Math.PI * 2 + edge.breathPhase);
        const opacity = edge.baseOpacity * breath * (edge.isTeal ? 2.2 : 1);

        ctx!.strokeStyle = edge.isTeal ? TEAL : STEEL_COLORS[edge.a % STEEL_COLORS.length];
        ctx!.globalAlpha = Math.min(opacity, edge.isTeal ? 0.5 : 0.28);
        ctx!.lineWidth = edge.isTeal ? 1 : 0.75;
        ctx!.beginPath();
        ctx!.moveTo(p1.x, p1.y);
        ctx!.lineTo(p2.x, p2.y);
        ctx!.stroke();
      });

      nodes.forEach((node, i) => {
        const p = positions[i];
        ctx!.globalAlpha = node.isTeal ? 0.55 : 0.3;
        ctx!.fillStyle = node.isTeal ? TEAL : STEEL_COLORS[i % STEEL_COLORS.length];
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, node.isTeal ? 2.4 : 1.6, 0, Math.PI * 2);
        ctx!.fill();
      });

      if (
        !prefersReducedMotion &&
        pulses.length < MAX_CONCURRENT_PULSES &&
        now - lastPulseSpawn > 4000 + Math.random() * 3000
      ) {
        pulses.push({
          edge: Math.floor(Math.random() * edges.length),
          reverse: Math.random() < 0.5,
          start: now,
          duration: 2800 + Math.random() * 2200,
        });
        lastPulseSpawn = now;
      }

      for (let i = pulses.length - 1; i >= 0; i--) {
        const pulse = pulses[i];
        const progress = (now - pulse.start) / pulse.duration;
        if (progress >= 1) {
          pulses.splice(i, 1);
          continue;
        }

        const edge = edges[pulse.edge];
        const from = positions[pulse.reverse ? edge.b : edge.a];
        const to = positions[pulse.reverse ? edge.a : edge.b];
        const eased =
          progress < 0.5 ? 2 * progress * progress : 1 - ((-2 * progress + 2) ** 2) / 2;
        const x = from.x + (to.x - from.x) * eased;
        const y = from.y + (to.y - from.y) * eased;
        const fade = Math.sin(progress * Math.PI);

        ctx!.globalAlpha = 0.8 * fade;
        ctx!.fillStyle = TEAL;
        ctx!.shadowColor = TEAL;
        ctx!.shadowBlur = 8;
        ctx!.beginPath();
        ctx!.arc(x, y, 2.6, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.shadowBlur = 0;
      }

      ctx!.globalAlpha = 1;
      rafId = requestAnimationFrame(draw);
    }

    if (prefersReducedMotion) {
      draw(0);
    } else {
      rafId = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 42%, rgba(10,16,30,0.9) 0%, rgba(10,16,30,0.6) 32%, rgba(10,16,30,0.22) 58%, rgba(10,16,30,0) 82%)",
        }}
      />
    </div>
  );
}
