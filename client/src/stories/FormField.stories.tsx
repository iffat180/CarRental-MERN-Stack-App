import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import FormField, { type FieldControlProps } from "../components/FormField";

const meta = {
  title: "Forms/FormField",
  component: FormField,
  args: {
    id: "phone",
    label: "Phone Number",
    required: true,
    children: (control: FieldControlProps) => <input type="tel" {...control} />,
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "A label, a control and its error, wired together: the label points at the control and the error is linked with aria-describedby and announced with role=alert.",
      },
    },
  },
} satisfies Meta<typeof FormField>;
export default meta;
type Story = StoryObj<typeof meta>;

const input =
  (type = "text") =>
  (control: any) => <input type={type} {...control} />;

export const Default: Story = {
  args: { required: false, label: "Notes", id: "notes", children: input() },
};
export const Required: Story = { args: { children: input("tel") } };
export const WithError: Story = {
  args: { error: "Phone number is required", children: input("tel") },
};
export const Select: Story = {
  args: {
    id: "pickup",
    label: "Pickup Location",
    children: (control: FieldControlProps) => (
      <select {...control}>
        <option value="">Select pickup location</option>
        <option>Denver Airport</option>
        <option>Downtown Denver</option>
      </select>
    ),
  },
};
