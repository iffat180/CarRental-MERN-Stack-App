import React from "react";
import { Link } from "react-router-dom";

const A4Footer = () => {
  return (
    <footer className="a4-wrap a4-footer">
      <div className="top">
        <div style={{ flex: "1 1 340px", maxWidth: 440 }}>
          <span className="disp" style={{ fontSize: 17, letterSpacing: "0.2em", color: "var(--color-ink)" }}>WAYFARER</span>
          <p style={{ margin: "14px 0 0" }}>Cars from real owners, booked by the day.</p>
        </div>
        <nav aria-label="Footer" className="cols">
          <div>
            <h3 className="mono">Rent</h3>
            <ul>
              <li><Link className="a4-flink" to="/cars">Browse cars</Link></li>
              <li><Link className="a4-flink" to="/#featured">Featured</Link></li>
              <li><Link className="a4-flink" to="/#cities">Cities</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mono">Own</h3>
            <ul>
              <li><Link className="a4-flink" to="/owner">Owner dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mono">Help</h3>
            <ul>
              <li><Link className="a4-flink" to="/#matching">How matching works</Link></li>
            </ul>
          </div>
        </nav>
      </div>
      <p style={{ margin: "24px 0 0", fontSize: 14 }}>© Wayfarer · working name</p>
    </footer>
  );
};

export default A4Footer;
