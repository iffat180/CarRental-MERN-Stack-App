import type { Meta, StoryObj } from "@storybook/react-vite";
import CarCard from "../components/CarCard";

const car = {
  _id: "car17",
  brand: "Subaru",
  model: "Outback",
  image: "https://d3c38yoff69w1u.cloudfront.net/cars/car17.jpg",
  year: 2023,
  category: "SUV",
  seating_capacity: 5,
  fuel_type: "Petrol",
  transmission: "Automatic",
  pricePerDay: 95,
  location: "Denver",
  description: "A roomy all-weather wagon.",
  mpg: 29,
  trunk_capacity: 850,
  tags: ["AWD", "Adventure", "Family", "Camping"],
  isAvailable: true,
};

const meta = {
  title: "Cars/CarCard",
  component: CarCard,
  args: { car },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 340 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CarCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Available: Story = {};
export const Unavailable: Story = { args: { car: { ...car, isAvailable: false } } };
export const Electric: Story = {
  args: {
    car: {
      ...car,
      _id: "car12",
      brand: "KIA",
      model: "EV9",
      image: "https://d3c38yoff69w1u.cloudfront.net/cars/car12.jpg",
      fuel_type: "Electric",
      seating_capacity: 7,
      pricePerDay: 135,
      location: "Chicago",
      mpg: 80,
      tags: ["Electric", "7-Seater"],
    },
  },
};
