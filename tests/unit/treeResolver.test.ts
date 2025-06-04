import { describe, it, expect } from "@jest/globals";
import { resolveReferences } from "../../src/treeResolver";

describe("resolveReferences", () => {
  it("resolves canonical path references", () => {
    const input = ["A", { ref: "/0" }];
    const output = resolveReferences(input);
    expect(output).toEqual(["A", "A"]);
  });

  it("resolves short path references", () => {
    const input = ["A", { ref: "A" }];
    const output = resolveReferences(input);
    expect(output).toEqual(["A", "A"]);
  });

  it("resolves references inside arrays", () => {
    const input = [["A"], { ref: "/0/0" }];
    const output = resolveReferences(input);
    expect(output).toEqual([["A"], "A"]);
  });

  it("throws on ambiguous short path", () => {
    const input = ["A", "A", { ref: "A" }];
    expect(() => resolveReferences(input)).toThrow(
      "Invalid or ambiguous reference"
    );
  });

  it("throws on invalid canonical path", () => {
    const input = ["A", { ref: "/99" }];
    expect(() => resolveReferences(input)).toThrow(
      "Invalid or ambiguous reference"
    );
  });

  it("throws on forward reference", () => {
    const input = [{ ref: "/1" }, "A"];
    expect(() => resolveReferences(input)).toThrow(
      "Invalid or ambiguous reference"
    );
  });

  it("throws on ancestor reference", () => {
    const input = [{ A: [{ ref: "/0" }] }];
    expect(() => resolveReferences(input)).toThrow(
      "Invalid or ambiguous reference"
    );
  });

  it("leaves atoms and non-ref objects unchanged", () => {
    const input = ["A", { foo: "bar" }];
    const output = resolveReferences(input);
    expect(output).toEqual(["A", { foo: "bar" }]);
  });
});
