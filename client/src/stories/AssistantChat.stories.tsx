import type { Meta, StoryObj } from "@storybook/react-vite";
import AssistantChat from "../assistant/AssistantChat";
import { MockApp } from "./mockApp";

const meta = {
  title: "Assistant/AssistantChat",
  component: AssistantChat,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The floating chat. Ask something in the open story: the mock answers with a car card. The chat is not modal, so the page behind stays usable, and Escape closes it.",
      },
    },
  },
  decorators: [
    (Story) => (
      <MockApp>
        <div style={{ minHeight: 700 }}>
          <Story />
        </div>
      </MockApp>
    ),
  ],
} satisfies Meta<typeof AssistantChat>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ClosedButton: Story = {};
export const Open: Story = { args: { defaultOpen: true } };
