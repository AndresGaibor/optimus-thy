import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("application shell", () => {
  it("identifies the OPTIMUS-THY application", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "OPTIMUS-THY" }),
    ).toBeInTheDocument();
  });
});
