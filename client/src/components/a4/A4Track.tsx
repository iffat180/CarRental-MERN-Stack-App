import React, { useLayoutEffect, useRef, useState } from "react";
import { m, useReducedMotion, type PanInfo } from "motion/react";

export interface TrackSlide {
  id: string;
  name: string;
  year: number | string;
  img: string;
}

interface A4TrackProps {
  slides: TrackSlide[];
  index: number;
  onChange: (index: number) => void;
}

/** Each slide is 62% of the stage wide, and the active one is centred. */
const SLIDE = 0.62;
const CENTRE_OFFSET = 0.19;

/** Dragging further than this fraction of a slide (or flicking fast) changes the car. */
const SWIPE_FRACTION = 0.18;

const spring = { type: "spring", stiffness: 230, damping: 30 } as const;

/**
 * The sliding row of cars. The row springs to the active car, can be dragged or swiped
 * sideways (vertical scrolling still works on touch screens), and neighbouring cars
 * shrink and fade. The arrow buttons and dots live in A4Stage, so there is always a way
 * to change the car without dragging.
 *
 * With "reduce motion" on, Motion skips transform animations altogether, so the row
 * and the slide sizes are set directly (no spring) and dragging is off; the buttons do
 * the work.
 *
 * Everything is animated through the `animate` prop (not the imperative animate()
 * function), so the animation engine stays in the lazily loaded LazyMotion chunk
 * instead of the main bundle. Drag is pinned to the active position with
 * dragConstraints, so letting go without swiping far enough springs back by itself.
 */
const slideLook = (d: number) => ({
  opacity: d === 0 ? 1 : Math.abs(d) === 1 ? 0.55 : 0.18,
  scale: d === 0 ? 1 : 0.8,
});

const SlideContent = ({ slide }: { slide: TrackSlide }) => (
  <>
    <div className="shadow" aria-hidden="true" />
    <div className="car">
      <img src={slide.img} alt={`${slide.year} ${slide.name}`} decoding="async" draggable={false} />
    </div>
    <div className="mirror" aria-hidden="true">
      <img src={slide.img} alt="" draggable={false} />
    </div>
  </>
);

const A4Track = (props: A4TrackProps) => {
  // Motion skips transform animations for people who asked for less motion (and then
  // would not move the row at all), so they get plain CSS and no animation.
  const reduceMotion = useReducedMotion();
  return reduceMotion ? <StaticTrack {...props} /> : <MotionTrack {...props} />;
};

/** No animation, no dragging: the row jumps to the chosen car. */
const StaticTrack = ({ slides, index }: A4TrackProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useMeasure(ref, setWidth);

  return (
    <div
      ref={ref}
      className="a4-track"
      style={{ transform: `translateX(${width * (CENTRE_OFFSET - index * SLIDE)}px)` }}
    >
      {slides.map((s, idx) => {
        const { opacity, scale } = slideLook(idx - index);
        return (
          <div
            key={s.id}
            className="a4-slide"
            aria-hidden={idx !== index}
            style={{ opacity, transform: `scale(${scale})` }}
          >
            <SlideContent slide={s} />
          </div>
        );
      })}
    </div>
  );
};

/** Measures an element's width now and whenever it is resized. */
const useMeasure = (ref: React.RefObject<HTMLElement | null>, onWidth: (w: number) => void) => {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => onWidth(el.offsetWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

const MotionTrack = ({ slides, index, onChange }: A4TrackProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  const n = slides.length;
  const target = width * (CENTRE_OFFSET - index * SLIDE);
  const wrap = (i: number) => (n ? ((i % n) + n) % n : 0);

  useMeasure(ref, setWidth);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const slideWidth = width * SLIDE;
    const push = info.offset.x + info.velocity.x * 0.2; // distance plus a bit of flick speed
    if (push < -slideWidth * SWIPE_FRACTION) onChange(wrap(index + 1));
    else if (push > slideWidth * SWIPE_FRACTION) onChange(wrap(index - 1));
    // otherwise the constraints pull the row back to the current car
  };

  return (
    // a plain wrapper does the measuring, so the animated row below is only created once
    // the width is known and starts in place instead of sliding in from the side
    <div ref={ref} style={{ width: "100%", height: "100%" }}>
      {width > 0 && (
        <m.div
          className="a4-track"
          style={{ touchAction: "pan-y" }}
          initial={false}
          animate={{ x: target }}
          transition={spring}
          drag={n > 1 ? "x" : false}
          dragConstraints={{ left: target, right: target }}
          dragElastic={0.35}
          dragMomentum={false}
          onDragEnd={onDragEnd}
        >
          {slides.map((s, idx) => (
            <m.div
              key={s.id}
              className="a4-slide"
              aria-hidden={idx !== index}
              initial={false}
              animate={slideLook(idx - index)}
              transition={spring}
            >
              <SlideContent slide={s} />
            </m.div>
          ))}
        </m.div>
      )}
    </div>
  );
};

export default A4Track;
