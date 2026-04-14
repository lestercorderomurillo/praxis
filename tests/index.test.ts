import { describe, it, expect } from "vitest";
import { Praxis, createPraxis } from "../src";

describe("Praxis", () => {
  it("should instantiate with new", () => {
    const instance = new Praxis();
    expect(instance).toBeInstanceOf(Praxis);
  });

  it("should instantiate via createPraxis", () => {
    const instance = createPraxis();
    expect(instance).toBeInstanceOf(Praxis);
  });
});
