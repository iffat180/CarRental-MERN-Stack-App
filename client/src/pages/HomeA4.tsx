import React from "react";
import Seo from "../components/Seo";
import A4Stage from "../components/a4/A4Stage";
import HeroParallax from "../components/a4/HeroParallax";
import { A4Featured, A4Matching, A4Trust, A4Cities, A4Owner } from "../components/a4/A4Sections";

// Home page, "A4 silver glass" design. Header and footer come from App.tsx.
const HomeA4 = () => (
  <>
    <Seo />
    <section className="a4-wrap a4-headline">
      <HeroParallax>
        <p className="mono a4-eyebrow">18 cars · 11 cities</p>
        <h1 className="disp">Every trip has its car.</h1>
        <p>
          Slide through the cars near you and pick your dates. Or describe the trip, and we'll match
          one.
        </p>
      </HeroParallax>
    </section>

    <A4Stage />
    <A4Featured />
    <A4Matching />
    <A4Trust />
    <A4Cities />
    <A4Owner />
  </>
);

export default HomeA4;
