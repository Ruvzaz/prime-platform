'use client';

import * as React from 'react';
import { memo } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  type SpringOptions,
} from 'motion/react';

import { cn } from '@/lib/utils';

type BubbleColors = {
  first: string;
  second: string;
  third: string;
  fourth: string;
  fifth: string;
  sixth: string;
};

type BubbleBackgroundProps = React.ComponentProps<'div'> & {
  interactive?: boolean;
  transition?: SpringOptions;
  colors?: BubbleColors;
  bubbleOpacity?: number;
};

const BubbleBackground = memo(({
  children,
  className,
  colors = {
    first: '18,113,255',
    second: '221,74,255',
    third: '100,220,255',
    fourth: '200,50,50',
    fifth: '180,180,50',
    sixth: '140,100,255',
  },
  bubbleOpacity = 1,
  interactive = false,
  ...props
}: BubbleBackgroundProps) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  React.useEffect(() => {
    if (!interactive) return;
    const el = containerRef.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      mouseX.set(e.clientX - centerX);
      mouseY.set(e.clientY - centerY);
    };

    el.addEventListener('mousemove', handleMouseMove);
    return () => el.removeEventListener('mousemove', handleMouseMove);
  }, [interactive, mouseX, mouseY]);

  return (
    <div
      ref={containerRef}
      data-slot="bubble-background"
      className={cn(
        'relative size-full overflow-hidden',
        className,
      )}
      {...props}
    >
      <style>
        {`
            :root {
              --first-color: ${colors.first};
              --second-color: ${colors.second};
              --third-color: ${colors.third};
              --fourth-color: ${colors.fourth};
              --fifth-color: ${colors.fifth};
              --sixth-color: ${colors.sixth};
            }
            @keyframes float-1 {
              0% { transform: translate(0, 0) scale(1) rotate(0deg); }
              33% { transform: translate(200px, -150px) scale(1.2) rotate(20deg); }
              66% { transform: translate(-100px, 100px) scale(0.8) rotate(-10deg); }
              100% { transform: translate(0, 0) scale(1) rotate(0deg); }
            }
            @keyframes float-2 {
              0% { transform: translate(0, 0) scale(1) rotate(0deg); }
              33% { transform: translate(-150px, -200px) scale(0.9) rotate(-15deg); }
              66% { transform: translate(150px, -50px) scale(1.1) rotate(10deg); }
              100% { transform: translate(0, 0) scale(1) rotate(0deg); }
            }
            @keyframes float-3 {
              0% { transform: translate(0, 0) scale(1) rotate(0deg); }
              33% { transform: translate(100px, 150px) scale(1.1) rotate(-10deg); }
              66% { transform: translate(-200px, -100px) scale(1.3) rotate(20deg); }
              100% { transform: translate(0, 0) scale(1) rotate(0deg); }
            }
          `}
      </style>

      <svg className="hidden">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <div
        className="absolute inset-0"
        style={{ filter: 'url(#goo) blur(40px)', opacity: bubbleOpacity }}
      >
        {Array.from({ length: 12 }).map((_, i) => {
          const colorKeys: (keyof BubbleColors)[] = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
          const colorKey = colorKeys[i % colorKeys.length];
          // Much wider size range: from 15% to 90%
          const size = 15 + (i * 23) % 76; 
          const duration = 12 + (i % 6) * 4; // 12s to 32s
          const delay = i * -2.5;
          const animId = (i % 3) + 1; // 1, 2, or 3
          
          // Improved spread logic to cover edges
          const top = `${-10 + (i * 27) % 110}%`;
          const left = `${-10 + (i * 37) % 110}%`;

          return (
            <div
              key={i}
              className="absolute rounded-full mix-blend-hard-light"
              style={{
                width: `${size}%`,
                height: `${size}%`,
                top,
                left,
                background: `radial-gradient(circle at center, rgba(var(--${colorKey}-color), 0.8) 0%, rgba(var(--${colorKey}-color), 0) 50%)`,
                animation: interactive ? 'none' : `float-${animId} ${duration}s ease-in-out infinite`,
                animationDelay: `${delay}s`,
                willChange: 'transform'
              }}
            />
          );
        })}
      </div>

      {children}
    </div>
  );
});

BubbleBackground.displayName = "BubbleBackground";

export { BubbleBackground, type BubbleBackgroundProps };
