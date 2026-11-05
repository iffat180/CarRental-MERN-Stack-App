import React, { type ReactNode } from "react";
import { m, useReducedMotion, useScroll, useTransform } from "motion/react";

/**
 * The home page headline drifts a little slower than the page as it scrolls away and
 * fades slightly, with a soft silver glow behind it moving at its own speed. The two
 * different speeds are what give the sense of depth (parallax).
 *
 * People who ask their device for less motion get the plain, still headline.
 */
const HeroParallax = ({ children }: { children: ReactNode }) => {
  const reduceMotion = useReducedMotion();

  // Pixels scrolled from the top of the page. The text has faded out completely by 300px;
  // the drift and the glow keep easing until 400px, then stay put.
  const { scrollY } = useScroll();
  const textY = useTransform(scrollY, [0, 400], [0, 110]);
  const textOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const glowY = useTransform(scrollY, [0, 400], [0, 240]);

  if (reduceMotion) return <div>{children}</div>;

  return (
    <div className="a4-parallax">
      <m.div className="a4-parallax-glow" aria-hidden="true" style={{ y: glowY }} />
      <m.div style={{ y: textY, opacity: textOpacity }}>{children}</m.div>
    </div>
  );
};

export default HeroParallax;
