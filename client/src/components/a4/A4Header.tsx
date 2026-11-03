import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { useListYourCar } from "./useListYourCar";

const A4Header = () => {
  const { user, isOwner, logout, setShowLogin } = useAppContext();
  const { listYourCar, modal } = useListYourCar();
  const [open, setOpen] = useState(false);
  const { pathname, hash } = useLocation();

  // close the phone menu whenever we land on a new page or section
  useEffect(() => setOpen(false), [pathname, hash]);

  return (
    <header className="a4-wrap a4-nav-wrap">
      <div className="a4-nav">
        <Link to="/" className="a4-logo disp" aria-label="Wayfarer home">
          WAYFARER
        </Link>
        <button
          type="button"
          className="a4-menu-btn"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="a4-main-nav"
          onClick={() => setOpen((o) => !o)}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            {open ? (
              <path d="M6 6 L18 18 M18 6 L6 18" />
            ) : (
              <path d="M4 7 H20 M4 12 H20 M4 17 H20" />
            )}
          </svg>
        </button>
        <nav id="a4-main-nav" aria-label="Main" className={`a4-links${open ? " open" : ""}`}>
          <Link className="a4-flink" to="/cars">
            Cars
          </Link>
          <Link className="a4-flink" to="/#book">
            Book
          </Link>
          <Link className="a4-flink" to="/#cities">
            Cities
          </Link>
          {user && (
            <Link className="a4-flink" to="/my-bookings">
              My bookings
            </Link>
          )}
          {isOwner && (
            <Link className="a4-flink" to="/owner">
              Dashboard
            </Link>
          )}
          <button
            type="button"
            className="a4-link a4-flink"
            onClick={() => {
              setOpen(false);
              listYourCar();
            }}
          >
            List your car
          </button>
          <button
            type="button"
            className="a4-primary a4-login"
            onClick={() => (user ? logout() : setShowLogin(true))}
          >
            {user ? "Log out" : "Log in"}
          </button>
        </nav>
      </div>
      {modal}
    </header>
  );
};

export default A4Header;
