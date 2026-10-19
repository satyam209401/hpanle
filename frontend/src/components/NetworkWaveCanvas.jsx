import React, { useRef, useEffect } from 'react';

export default function NetworkWaveCanvas({ rx = 0, tx = 0 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let step = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      step += 0.04;

      // Draw Grid Lines (Subtle)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Inbound Wave (Cyan / Emerald)
      const rxAmp = Math.min(28, Math.max(8, (rx / 20)));
      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#06b6d4';

      for (let x = 0; x <= width; x++) {
        const y = centerY + Math.sin(x * 0.02 + step) * rxAmp + Math.cos(x * 0.01 + step * 0.5) * 6;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Inbound Area Gradient Fill
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      const gradRx = ctx.createLinearGradient(0, centerY, 0, height);
      gradRx.addColorStop(0, 'rgba(6, 182, 212, 0.15)');
      gradRx.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
      ctx.fillStyle = gradRx;
      ctx.shadowBlur = 0;
      ctx.fill();

      // Outbound Wave (Indigo / Violet)
      const txAmp = Math.min(26, Math.max(6, (tx / 20)));
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#818cf8';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#818cf8';

      for (let x = 0; x <= width; x++) {
        const y = centerY + Math.cos(x * 0.025 - step * 1.2) * txAmp + Math.sin(x * 0.015 + step) * 5;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [rx, tx]);

  return (
    <div className="relative w-full h-24 overflow-hidden rounded-xl bg-slate-950/80 border border-slate-800/80">
      <canvas
        ref={canvasRef}
        width={400}
        height={96}
        className="w-full h-full block"
      />
      <div className="absolute top-2 left-3 flex items-center gap-3 text-[10px] font-mono pointer-events-none">
        <span className="flex items-center gap-1 text-cyan-400">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          RX: {rx} KB/s
        </span>
        <span className="flex items-center gap-1 text-indigo-400">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
          TX: {tx} KB/s
        </span>
      </div>
    </div>
  );
}
