"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface FloatingXPProps {
  xp: number;
  show: boolean;
  onComplete?: () => void;
  position?: { x: number; y: number };
}

export default function FloatingXP({ xp, show, onComplete, position }: FloatingXPProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!isVisible) return null;

  return (
    <>
      <motion.div
          initial={{ 
            opacity: 0, 
            y: 0, 
            scale: 0.5,
            x: position?.x || 0,
            top: position?.y || "50%" 
          }}
          animate={{ 
            opacity: [0, 1, 1, 0], 
            y: -100, 
            scale: [0.5, 1.2, 1, 1],
          }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: 2,
            ease: "easeOut",
            times: [0, 0.2, 0.5, 1]
          }}
          className="fixed pointer-events-none z-50"
          style={{
            left: position?.x ? `${position.x}px` : "50%",
            top: position?.y ? `${position.y}px` : "50%",
            transform: "translateX(-50%)",
          }}
        >
          <div className="relative">
            {/* Glow effect */}
            <motion.div
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.5, 0.8, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: 0
              }}
              className="absolute inset-0 bg-yellow-400 blur-xl rounded-full"
            />
            
            {/* Main XP text */}
            <div className="relative bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white font-bold text-4xl px-6 py-3 rounded-full shadow-2xl border-4 border-yellow-300">
              +{xp} XP
            </div>

            {/* Sparkles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 1, 
                  scale: 0,
                  x: 0,
                  y: 0
                }}
                animate={{ 
                  opacity: [1, 0],
                  scale: [0, 1.5],
                  x: Math.cos((i / 8) * Math.PI * 2) * 60,
                  y: Math.sin((i / 8) * Math.PI * 2) * 60
                }}
                transition={{ 
                  duration: 1.5,
                  ease: "easeOut",
                  delay: 0.2
                }}
                className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-300 rounded-full"
                style={{
                  boxShadow: "0 0 10px #fbbf24"
                }}
              />
            ))}
          </div>
        </motion.div>
    </>
  );
}

// Component for multiple floating XP instances
interface XPBurstProps {
  xpGains: Array<{ id: string; xp: number; position?: { x: number; y: number } }>;
  onBurstComplete?: (id: string) => void;
}

export function XPBurst({ xpGains, onBurstComplete }: XPBurstProps) {
  return (
    <>
      {xpGains.map((gain) => (
        <FloatingXP
          key={gain.id}
          xp={gain.xp}
          show={true}
          position={gain.position}
          onComplete={() => onBurstComplete?.(gain.id)}
        />
      ))}
    </>
  );
}
