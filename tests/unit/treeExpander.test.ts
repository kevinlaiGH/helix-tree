import { describe, it, expect } from "@jest/globals";
import { expandSequences } from "../../src/treeExpander";

describe("expandSequences", () => {
  it("expands a simple sequence", () => {
    const input = [{ seq: { start: 1, end: 3 } }];
    const output = expandSequences(input);
    expect(output).toEqual([["'1'", "'2'", "'3'"]]);
  });

  it("expands nested sequences", () => {
    const input = [[{ seq: { start: 2, end: 4 } }]];
    const output = expandSequences(input);
    expect(output).toEqual([[["'2'", "'3'", "'4'"]]]);
  });

  it("expands sequences inside hierarchical objects", () => {
    const input = [{ A: { seq: { start: 5, end: 6 } } }];
    const output = expandSequences(input);
    expect(output).toEqual([{ A: ["'5'", "'6'"] }]);
  });

  it("leaves atoms and references unchanged", () => {
    const input = ["A", { ref: "/0" }];
    const output = expandSequences(input);
    expect(output).toEqual(["A", { ref: "/0" }]);
  });

  it("throws on invalid sequence (non-integer)", () => {
    const input = [{ seq: { start: 1.5, end: 3 } }];
    expect(() => expandSequences(input)).toThrow("Invalid sequence node");
  });

  it("throws on invalid sequence (start > end)", () => {
    const input = [{ seq: { start: 5, end: 2 } }];
    expect(() => expandSequences(input)).toThrow("Invalid sequence node");
  });

  it("leaves non-sequence objects unchanged", () => {
    const input = [{ ref: "/0" }];
    const output = expandSequences(input);
    expect(output).toEqual([{ ref: "/0" }]);
  });
});
