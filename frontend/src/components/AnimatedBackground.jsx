import React from 'react';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Ambient glowing orb 1 */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl animate-ambient-1" />

      {/* Ambient glowing orb 2 */}
      <div className="absolute top-1/3 -right-32 w-[30rem] h-[30rem] bg-cyan-600/10 rounded-full blur-3xl animate-ambient-2" />

      {/* Ambient glowing orb 3 */}
      <div className="absolute -bottom-40 left-1/3 w-[32rem] h-[32rem] bg-purple-600/10 rounded-full blur-3xl animate-ambient-1" />

      {/* Subtle digital grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.4) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />
    </div>
  );
}
