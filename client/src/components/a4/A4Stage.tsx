import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import type { Car, CarRecommendation } from "../../types";
import { simplifyQuery } from "../../utils/simplifyQuery";
import { m, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import A4Track from "./A4Track";

// The slider shows cut-out photos (static files in /public/cutouts). We only have
// cut-outs for these models, so the slider shows the live cars that match them.
// Name, price, seats, city etc. all come from the database.
const CUTOUTS: { model: string; img: string }[] = [
  { model: "Outback", img: "/cutouts/outback.webp" },
  { model: "MX-5 Miata", img: "/cutouts/miata.webp" },
  { model: "E-Class", img: "/cutouts/eclass.webp" },
  { model: "EV9", img: "/cutouts/ev9.webp" },
  { model: "Prius", img: "/cutouts/prius.webp" },
];

// shown for a moment while the cars are still loading from the API
const PLACEHOLDER = {
  id: "",
  name: "Loading cars…",
  year: "",
  cat: "",
  city: "",
  seats: 0,
  mpg: 0,
  trunk: 0,
  price: 0,
  img: "",
};

const TIMES = Array.from({ length: 15 }, (_, k) => {
  const h = k + 8;
  const hh = h > 12 ? h - 12 : h;
  return { v: String(h).padStart(2, "0") + ":00", l: `${hh}:00 ${h >= 12 ? "PM" : "AM"}` };
});

const toISO = (d: Date) => d.toISOString().slice(0, 10);
const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toISO(d);
};

// "A weekend" -> 3, "2 weeks" -> 14, "5 days" -> 5, anything else -> 3
const parseTripDays = (text: string) => {
  const t = text.toLowerCase();
  const n = parseInt(t.replace(/[^0-9]/g, ""), 10);
  if (t.includes("week") && !t.includes("weekend")) return Math.min(30, (n || 1) * 7);
  if (n) return Math.min(30, n);
  return 3;
};

/**
 * The stage stays pinned while the page scrolls, and the car card and booking box (frosted
 * glass) slide up over it. As that happens the car grows a little and softens, so it reads
 * as sitting behind the glass. The numbers go to the CSS as variables (--car-zoom,
 * --car-fade), so the row can still slide and be dragged without fighting this. Left alone
 * for reduced motion.
 */
const useCarBehindGlass = (stage: React.RefObject<HTMLDivElement | null>) => {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => {
    const el = stage.current;
    if (!el || reduceMotion) return;
    const t = Math.min(1, Math.max(0, y / 600));
    el.style.setProperty("--car-zoom", String(1 + 0.15 * t));
    el.style.setProperty("--car-fade", String(1 - 0.7 * t));
  });
};

const A4Stage = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  useCarBehindGlass(stageRef);
  const { axios, navigate, cars, setPickupDate, setReturnDate } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY || "$";

  const [i, setI] = useState(0);
  const [mode, setMode] = useState<"dates" | "trip">("dates");
  const [pickup, setPickup] = useState(daysFromNow(7));
  const [ret, setRet] = useState(daysFromNow(10));
  const [pt, setPt] = useState("10:00");
  const [rt, setRt] = useState("18:00");
  const [dateError, setDateError] = useState("");

  const [how, setHow] = useState("A weekend");
  const [where, setWhere] = useState("Denver");
  const [who, setWho] = useState("4 people, skis, one big dog");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiResults, setAiResults] = useState<CarRecommendation[]>([]);

  const slides = CUTOUTS.flatMap((c) => {
    const car = cars.find((x: Car) => x.model === c.model);
    return car
      ? [
          {
            id: car._id,
            name: `${car.brand} ${car.model}`,
            year: car.year,
            cat: car.category,
            city: car.location,
            seats: car.seating_capacity,
            mpg: car.mpg ?? 0,
            trunk: car.trunk_capacity ?? 0,
            price: car.pricePerDay,
            img: c.img,
          },
        ]
      : [];
  });
  const n = slides.length;
  const cur = slides[Math.min(i, Math.max(n - 1, 0))] ?? PLACEHOLDER;
  const go = (k: number) => () => setI(n ? ((k % n) + n) % n : 0);

  const days = Math.max(
    0,
    Math.ceil((new Date(ret).getTime() - new Date(pickup).getTime()) / 86400000)
  );

  const checkAvailability = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cur.id) return;
    const today = toISO(new Date());
    if (!pickup || !ret) return setDateError("Choose a pick-up and a return date.");
    if (pickup < today) return setDateError("Pick-up date cannot be in the past.");
    if (ret <= pickup) return setDateError("Return date must be after the pick-up date.");
    setDateError("");
    // CarDetails reads these two from context, so the dates arrive pre-filled
    setPickupDate(pickup);
    setReturnDate(ret);
    navigate(`/car-details/${cur.id}`);
    window.scrollTo(0, 0);
  };

  const matchMyCar = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = `${how} in ${where}: ${who}`.trim();
    if (query.length < 3) return setAiError("Tell us a little more about the trip.");
    const complexity = simplifyQuery(query);
    if (complexity.isComplex) {
      setAiResults([]);
      return setAiError(
        `${complexity.message} Examples: ${(complexity.suggestions ?? []).slice(0, 2).join(", ")}`
      );
    }
    setAiLoading(true);
    setAiError("");
    try {
      const { data } = await axios.post("/api/recommendations", {
        query,
        tripDays: parseTripDays(how),
      });
      if (!data.success) throw new Error(data.error || "Failed to get recommendations");
      setAiResults((data.recommendations || []).slice(0, 5));
      if (data.lowConfidence && data.message) setAiError(data.message);
    } catch (err: any) {
      setAiError(
        err.response?.data?.error ||
          err.message ||
          "Unable to get recommendations. Please try again."
      );
      setAiResults([]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="a4-hero">
      {/* STAGE */}
      <div
        id="cars"
        ref={stageRef}
        role="group"
        aria-roledescription="carousel"
        aria-label="Cars available to rent"
        className="a4-stage"
        onKeyDown={(e) => {
          // arrow keys change the car while focus is on the slider or its buttons
          if (e.key === "ArrowRight") go(i + 1)();
          if (e.key === "ArrowLeft") go(i - 1)();
        }}
      >
        <A4Track slides={slides} index={i} onChange={setI} />

        <div className="a4-floor" aria-hidden="true" />

        <button
          type="button"
          className="a4-arrow prev a4-round"
          aria-label="Previous car"
          onClick={go(i - 1)}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 5 L8 12 L15 19" />
          </svg>
        </button>
        <button
          type="button"
          className="a4-arrow next a4-round"
          aria-label="Next car"
          onClick={go(i + 1)}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 5 L16 12 L9 19" />
          </svg>
        </button>
      </div>

      {/* SELECTED CAR */}
      <div className="a4-selwrap">
        <div aria-live="polite" className="a4-sel">
          <m.div
            key={cur.id}
            className="info"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className="avail mono">
              <span className="a4-dot" aria-hidden="true" />
              Available · {cur.city}
            </p>
            <h2 className="disp">{cur.name}</h2>
            <p className="a4-muted" style={{ marginTop: 6, fontSize: 15 }}>
              {cur.year} · {cur.cat}
            </p>
          </m.div>
          <m.dl
            key={`${cur.id}-specs`}
            className="mono"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.04 }}
          >
            <div>
              <dt>Seats</dt>
              <dd>{cur.seats}</dd>
            </div>
            <div>
              <dt>MPG</dt>
              <dd>{cur.mpg}</dd>
            </div>
            <div>
              <dt>Trunk</dt>
              <dd>{cur.trunk} L</dd>
            </div>
          </m.dl>
          <m.p
            key={`${cur.id}-price`}
            className="price disp"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.08 }}
          >
            {currency}
            {cur.price}
            <small> / day</small>
          </m.p>
        </div>
        <div className="a4-dots">
          {slides.map((s, idx) => (
            <button
              key={s.name}
              type="button"
              aria-label={`Show ${s.name}`}
              aria-current={idx === i ? "true" : undefined}
              onClick={go(idx)}
            >
              <span
                style={{
                  width: idx === i ? 28 : 8,
                  background: idx === i ? "var(--color-ink)" : "rgba(20,24,28,0.35)",
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* BOOKING CONSOLE */}
      <section id="book" className="a4-wrap a4-console-wrap">
        <div className="a4-glass a4-console">
          <div className="a4-tabbar">
            <div className="a4-tabs">
              <button
                type="button"
                aria-pressed={mode === "dates"}
                onClick={() => setMode("dates")}
                style={{
                  background: mode === "dates" ? "var(--color-ink)" : "transparent",
                  color: mode === "dates" ? "#fff" : "var(--color-ink)",
                }}
              >
                Pick dates
              </button>
              <button
                type="button"
                aria-pressed={mode === "trip"}
                onClick={() => setMode("trip")}
                style={{
                  background: mode === "trip" ? "var(--color-ink)" : "transparent",
                  color: mode === "trip" ? "#fff" : "var(--color-ink)",
                }}
              >
                Describe the trip
              </button>
            </div>
            <p className="a4-muted" style={{ fontSize: 15 }}>
              <strong style={{ color: "var(--color-ink)" }}>{cur.name}</strong> · {currency}
              {cur.price} / day
              {mode === "dates" && days > 0 && cur.price > 0 && (
                <span className="mono" style={{ fontSize: 13 }}>
                  {" "}
                  · {days} {days === 1 ? "day" : "days"} = {currency}
                  {days * cur.price} est.
                </span>
              )}
            </p>
          </div>

          {mode === "dates" ? (
            <>
              <form onSubmit={checkAvailability} noValidate className="a4-form">
                <div className="a4-field" style={{ flex: "1.2 1 120px" }}>
                  <label htmlFor="a4-loc" className="mono">
                    Pick-up city
                  </label>
                  <input id="a4-loc" type="text" readOnly value={cur?.city ?? ""} />
                </div>
                <div className="a4-field" style={{ flex: "1 1 130px" }}>
                  <label htmlFor="a4-pd" className="mono">
                    Pick-up date
                  </label>
                  <input
                    id="a4-pd"
                    type="date"
                    value={pickup}
                    min={toISO(new Date())}
                    onChange={(e) => setPickup(e.target.value)}
                  />
                </div>
                <div className="a4-field" style={{ flex: "0.9 1 112px" }}>
                  <label htmlFor="a4-pt" className="mono">
                    Time
                  </label>
                  <select id="a4-pt" value={pt} onChange={(e) => setPt(e.target.value)}>
                    {TIMES.map((t) => (
                      <option key={t.v} value={t.v}>
                        {t.l}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="a4-field" style={{ flex: "1 1 130px" }}>
                  <label htmlFor="a4-rd" className="mono">
                    Return date
                  </label>
                  <input
                    id="a4-rd"
                    type="date"
                    value={ret}
                    min={pickup}
                    onChange={(e) => setRet(e.target.value)}
                  />
                </div>
                <div className="a4-field" style={{ flex: "0.9 1 112px" }}>
                  <label htmlFor="a4-rt" className="mono">
                    Time
                  </label>
                  <select id="a4-rt" value={rt} onChange={(e) => setRt(e.target.value)}>
                    {TIMES.map((t) => (
                      <option key={t.v} value={t.v}>
                        {t.l}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="a4-primary a4-submit">
                  Check availability
                </button>
              </form>
              {dateError && (
                <p role="alert" className="a4-error">
                  {dateError}
                </p>
              )}
            </>
          ) : (
            <>
              <form onSubmit={matchMyCar} className="a4-form">
                <div className="a4-field" style={{ flex: "1 1 180px" }}>
                  <label htmlFor="a4-when" className="mono">
                    How long
                  </label>
                  <input
                    id="a4-when"
                    type="text"
                    value={how}
                    onChange={(e) => setHow(e.target.value)}
                  />
                </div>
                <div className="a4-field" style={{ flex: "1 1 180px" }}>
                  <label htmlFor="a4-where" className="mono">
                    Where
                  </label>
                  <input
                    id="a4-where"
                    type="text"
                    value={where}
                    onChange={(e) => setWhere(e.target.value)}
                  />
                </div>
                <div className="a4-field" style={{ flex: "2 1 340px" }}>
                  <label htmlFor="a4-who" className="mono">
                    Who's coming, what's coming
                  </label>
                  <input
                    id="a4-who"
                    type="text"
                    value={who}
                    onChange={(e) => setWho(e.target.value)}
                  />
                </div>
                <button type="submit" className="a4-primary a4-submit" disabled={aiLoading}>
                  {aiLoading ? "Matching…" : "Match my car"}
                </button>
              </form>
              <p className="a4-hint" style={{ fontSize: 15 }}>
                Describe it any way you like. Cars are ranked by meaning, not keywords.
              </p>
              {aiError && (
                <p role="alert" className="a4-error">
                  {aiError}
                </p>
              )}
              {aiResults.length > 0 && (
                <ol
                  style={{
                    listStyle: "none",
                    margin: "24px 0 0",
                    padding: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {aiResults.map((r, idx) => (
                    <li key={r.car_id || r._id}>
                      <Link
                        to={`/car-details/${r.car_id || r._id}`}
                        className="a4-match"
                        style={{ padding: "18px 24px" }}
                      >
                        <span className="rank disp" style={{ fontSize: 28 }}>
                          {idx + 1}
                        </span>
                        <div className="mid">
                          <h3 className="disp">
                            {r.brand} {r.model}
                          </h3>
                          <p className="mono a4-muted" style={{ marginTop: 4, fontSize: 12 }}>
                            {r.location} · {r.category} · {r.seating_capacity} seats
                          </p>
                          {r.reason && <p style={{ marginTop: 8, fontSize: 15 }}>{r.reason}</p>}
                        </div>
                        <span className="price disp">
                          {currency}
                          {r.pricePerDay}
                          <small> / day</small>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default A4Stage;
