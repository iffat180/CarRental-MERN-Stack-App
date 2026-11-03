import React from "react";
import { Link } from "react-router-dom";
import { useListYourCar } from "./useListYourCar";
import { useAppContext } from "../../context/AppContext";
import type { Car } from "../../types";
import { carImage } from "../../utils/carImage";

const FEATURED_MODELS = ["Outback", "Grand Caravan", "EV9", "MX-5 Miata", "F-150", "Prius"];

export const A4Featured = () => {
  const { cars, navigate } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY || "$";

  // Prefer the six cars whose photo and name match; fall back to the first six.
  const picked = FEATURED_MODELS.map((m) => cars.find((c: Car) => c.model === m)).filter(
    Boolean
  ) as Car[];
  const featured = picked.length >= 3 ? picked : cars.slice(0, 6);

  return (
    <section id="featured" className="a4-wrap a4-section">
      <div className="a4-sec-head">
        <h2 className="disp">Featured cars</h2>
        <button
          type="button"
          className="a4-flink"
          style={{ background: "none", border: 0, padding: 0, fontWeight: 600 }}
          onClick={() => {
            navigate("/cars");
            window.scrollTo(0, 0);
          }}
        >
          See all {cars.length || 18} cars
        </button>
      </div>
      <div className="a4-grid">
        {featured.map((car) => (
          <Link
            key={car._id}
            to={`/car-details/${car._id}`}
            className="a4-fcard"
            onClick={() => window.scrollTo(0, 0)}
          >
            <div className="photo">
              <img
                src={carImage(car.image)}
                alt={`${car.year} ${car.brand} ${car.model}`}
                loading="lazy"
              />
            </div>
            <div className="body">
              <p className="mono a4-eyebrow" style={{ fontSize: 12, marginBottom: 6 }}>
                {car.location}
              </p>
              <h3 className="disp">
                {car.brand} {car.model}
              </h3>
              <p className="a4-muted" style={{ marginTop: 6, fontSize: 15 }}>
                {car.year} · {car.category} · {car.transmission}
              </p>
              <p className="mono" style={{ marginTop: 12, fontSize: 12 }}>
                {car.seating_capacity} seats{car.mpg ? ` · ${car.mpg} mpg` : ""}
                {car.trunk_capacity ? ` · ${car.trunk_capacity} L` : ""}
              </p>
              <div className="foot">
                <span className="disp" style={{ fontSize: 19 }}>
                  {currency}
                  {car.pricePerDay}
                  <span
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 14,
                      color: "var(--color-muted)",
                    }}
                  >
                    {" "}
                    / day
                  </span>
                </span>
                <span style={{ fontWeight: 600 }}>View car</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

// Example of what the AI search returns, copied from a real run of the query
// below against the live data. Live results appear in the "Describe the trip" tab above.
const SAMPLE_MATCHES = [
  {
    rank: 1,
    name: "Jeep Grand Cherokee",
    meta: "Chicago · SUV · 5 seats · 780 L",
    why: "Recommended for mountain and off-road conditions, with a large 780 L trunk for family and luggage.",
    price: 105,
  },
  {
    rank: 2,
    name: "Subaru Outback",
    meta: "Denver · SUV · 5 seats · 850 L",
    why: "Recommended for mountain and off-road conditions, with a large 850 L trunk, perfect for road trips.",
    price: 95,
  },
  {
    rank: 3,
    name: "Toyota RAV4",
    meta: "New York · SUV · 5 seats · 1000 L",
    why: "Recommended for mountain and off-road conditions, with 1000 L of cargo space for the whole trip.",
    price: 85,
  },
];

export const A4Matching = () => {
  const currency = import.meta.env.VITE_CURRENCY || "$";
  return (
    <section id="matching" className="a4-wrap a4-section a4-matching">
      <div className="left">
        <p className="mono a4-eyebrow" style={{ marginBottom: 16 }}>
          How a trip becomes a match
        </p>
        <h2 className="disp">Tell us the trip. We rank the cars.</h2>
        <p className="a4-muted" style={{ margin: "20px 0 28px", fontSize: 17 }}>
          Describe it the way you'd tell a friend. We read what you mean, rank every car, and say
          why each one made the list.
        </p>
        <div className="a4-typed">
          <p className="mono a4-eyebrow" style={{ fontSize: 11, marginBottom: 8 }}>
            You typed
          </p>
          <p style={{ fontSize: 19, fontWeight: 500, lineHeight: 1.35 }}>
            “Family SUV for a mountain road trip with luggage”
          </p>
        </div>
      </div>
      <div className="right">
        {SAMPLE_MATCHES.map((m) => (
          <div key={m.rank} className="a4-match">
            <span className="rank disp">{m.rank}</span>
            <div className="mid">
              <h3 className="disp">{m.name}</h3>
              <p className="mono a4-muted" style={{ marginTop: 6, fontSize: 12 }}>
                {m.meta}
              </p>
              <p style={{ marginTop: 12, fontSize: 15 }}>{m.why}</p>
            </div>
            <span className="price disp">
              {currency}
              {m.price}
              <small> / day</small>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export const A4Trust = () => (
  <section className="a4-wrap a4-section a4-trust">
    <div>
      <h3 className="disp">No double bookings</h3>
      <p className="a4-muted">
        Overlapping dates are rejected by the database itself, so two people can't hold the same car
        at once.
      </p>
    </div>
    <div>
      <h3 className="disp">A PDF invoice, every time</h3>
      <p className="a4-muted">
        Each booking generates an invoice you can download as soon as it's confirmed.
      </p>
    </div>
    <div>
      <h3 className="disp">Booked direct with owners</h3>
      <p className="a4-muted">
        Cars are listed by the people who own them, and each owner confirms their own bookings.
      </p>
    </div>
  </section>
);

export const A4Cities = () => {
  const { cars, navigate } = useAppContext();
  const counts = new Map<string, number>();
  cars.forEach((c: Car) => counts.set(c.location, (counts.get(c.location) || 0) + 1));
  const list = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  return (
    <section id="cities" className="a4-wrap a4-section" style={{ paddingBottom: 24 }}>
      <h2 className="disp" style={{ fontSize: 24, marginBottom: 20 }}>
        Waiting in {list.length || 11} cities
      </h2>
      <div className="a4-chips">
        {list.map(([name, count]) => (
          <button
            key={name}
            type="button"
            className="a4-chip"
            onClick={() => {
              navigate(`/cars?search=${encodeURIComponent(name)}`);
              window.scrollTo(0, 0);
            }}
          >
            <span>{name}</span>
            <span className="mono a4-muted" style={{ fontSize: 12 }}>
              {count}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

export const A4Owner = () => {
  const { listYourCar, modal } = useListYourCar();
  return (
    <section id="owners" className="a4-wrap" style={{ paddingTop: 72 }}>
      <div className="a4-owner">
        <div style={{ flex: "1 1 460px" }}>
          <h2 className="disp">Own a car? Put it on the road.</h2>
          <p className="a4-muted" style={{ margin: "16px 0 0", fontSize: 18, maxWidth: "52ch" }}>
            Add photos, set a daily price, and accept or decline each booking yourself.
          </p>
        </div>
        <button type="button" className="a4-primary" onClick={listYourCar}>
          List your car
        </button>
      </div>
      {modal}
    </section>
  );
};
