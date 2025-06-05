import { describe, it, expect } from "@jest/globals";
import { expandSequences } from "../../src/treeExpander";
import type { TreeNode } from "../../src/treeTypes";

const ERR_INVALID_SEQUENCE = "Invalid sequence node";

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

  it("expands a sequence with negative numbers", () => {
    const input = [{ seq: { start: -2, end: 0 } }];
    const output = expandSequences(input);
    expect(output).toEqual([["'-2'", "'-1'", "'0'"]]);
  });

  it("expands a sequence with start == end (single value)", () => {
    const input = [{ seq: { start: 5, end: 5 } }];
    const output = expandSequences(input);
    expect(output).toEqual([["'5'"]]);
  });

  it("expands deeply nested sequences", () => {
    const input = [[[{ seq: { start: 1, end: 2 } }]]];
    const output = expandSequences(input);
    expect(output).toEqual([[[["'1'", "'2'"]]]]);
  });

  it("expands sequences in arrays with mixed content", () => {
    const input = ["A", { seq: { start: 1, end: 2 } }, "B"];
    const output = expandSequences(input);
    expect(output).toEqual(["A", ["'1'", "'2'"], "B"]);
  });

  it("throws on sequence with missing start", () => {
    const input = [{ seq: { end: 3 } } as unknown as TreeNode];
    expect(() => expandSequences(input)).toThrow(ERR_INVALID_SEQUENCE);
  });

  it("throws on sequence with missing end", () => {
    const input = [{ seq: { start: 1 } } as unknown as TreeNode];
    expect(() => expandSequences(input)).toThrow(ERR_INVALID_SEQUENCE);
  });

  it("throws on sequence with non-numeric start", () => {
    const input = [{ seq: { start: "a", end: 3 } } as unknown as TreeNode];
    expect(() => expandSequences(input)).toThrow(ERR_INVALID_SEQUENCE);
  });

  it("throws on sequence with non-numeric end", () => {
    const input = [{ seq: { start: 1, end: "b" } } as unknown as TreeNode];
    expect(() => expandSequences(input)).toThrow(ERR_INVALID_SEQUENCE);
  });

  it("expands multiple sequences in one array", () => {
    const input = [
      { seq: { start: 1, end: 2 } },
      { seq: { start: 3, end: 4 } },
    ];
    const output = expandSequences(input);
    expect(output).toEqual([
      ["'1'", "'2'"],
      ["'3'", "'4'"],
    ]);
  });
});
