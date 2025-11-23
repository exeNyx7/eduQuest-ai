"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { getSoundManager } from "@/utils/soundManager";

interface SoundButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  hoverSound?: boolean;
  clickSound?: boolean;
}

export default function SoundButton({
  children,
  hoverSound = true,
  clickSound = true,
  onClick,
  onMouseEnter,
  ...props
}: SoundButtonProps) {
  const soundManager = getSoundManager();

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (hoverSound) {
      soundManager.play("hover");
    }
    onMouseEnter?.(e);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (clickSound) {
      soundManager.play("click");
    }
    onClick?.(e);
  };

  return (
    <button
      {...props}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
