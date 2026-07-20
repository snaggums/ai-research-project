import type { Preview } from "@storybook/react-vite";

import "../src/index.css";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "error",
    },
    backgrounds: {
      default: "canvas",
      values: [
        { name: "canvas", value: "#f8fafc" },
        { name: "surface", value: "#ffffff" },
      ],
    },
  },
};

export default preview;
