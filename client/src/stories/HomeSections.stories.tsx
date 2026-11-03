import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import A4Header from "../components/a4/A4Header";
import A4Stage from "../components/a4/A4Stage";
import { A4Featured, A4Cities, A4Matching, A4Trust } from "../components/a4/A4Sections";
import { MockApp } from "./mockApp";

const meta = {
  title: "Home page/Sections",
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <MockApp>
        <Story />
      </MockApp>
    ),
  ],
} satisfies Meta;
export default meta;

export const Header: StoryObj = { render: () => <A4Header /> };
export const CarSliderAndBooking: StoryObj = {
  name: "Car slider and booking console",
  render: () => <A4Stage />,
};
export const FeaturedCars: StoryObj = { render: () => <A4Featured /> };
export const HowMatchingWorks: StoryObj = { render: () => <A4Matching /> };
export const TrustPoints: StoryObj = { render: () => <A4Trust /> };
export const CitiesList: StoryObj = { render: () => <A4Cities /> };
