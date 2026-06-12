import { describe, expect, it } from "vitest";
import { APP_NAME, APP_TAGLINE } from "./app-info";

describe("app-info", () => {
  it("declares the product identity", () => {
    expect(APP_NAME).toBe("Priora");
    expect(APP_TAGLINE).toBe("The decisions that come before scale.");
  });
});
