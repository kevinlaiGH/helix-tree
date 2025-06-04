import { describe, it, expect } from "@jest/globals";
import { validateTree } from "../../src/treeParser";
import { expandSequences } from "../../src/treeExpander";
import { resolveReferences } from "../../src/treeResolver";

describe("E2E Tree Expansion", () => {
  function expandTree(input: any): any {
    validateTree(input);
    const expanded = expandSequences(input);
    return resolveReferences(expanded);
  }

  it("expands and resolves a simple tree", () => {
    const input = [
      "A",
      { ref: "/0" },
      { seq: { start: 1, end: 3 } },
      ["B", { ref: "/0" }],
      { ref: "/2" },
    ];
    const output = expandTree(input);
    expect(output).toEqual([
      "A",
      "A",
      ["'1'", "'2'", "'3'"],
      ["B", "A"],
      "'1'",
      "'2'",
      "'3'",
    ]);
  });

  it("throws on invalid atom", () => {
    const input = ["not valid!"];
    expect(() => expandTree(input)).toThrow("Invalid atom");
  });

  it("throws on ambiguous short path", () => {
    const input = ["A", "A", { ref: "A" }];
    expect(() => expandTree(input)).toThrow("Invalid or ambiguous reference");
  });

  it("throws on forward reference", () => {
    const input = [{ ref: "/1" }, "A"];
    expect(() => expandTree(input)).toThrow("Invalid or ambiguous reference");
  });

  it("throws on ancestor reference", () => {
    const input = [{ A: [{ ref: "/0" }] }];
    expect(() => expandTree(input)).toThrow("Invalid or ambiguous reference");
  });

  it("expands sequences inside hierarchical objects", () => {
    const input = [{ A: { seq: { start: 2, end: 3 } } }];
    const output = expandTree(input);
    expect(output).toEqual([{ A: ["'2'", "'3'"] }]);
  });
});
