import { describe, it, expect } from "@jest/globals";
import { validateTree } from "../../src/treeParser";
import { expandSequences } from "../../src/treeExpander";
import { resolveReferences } from "../../src/treeResolver";
import { ERR_INVALID_ATOM, ERR_INVALID_REF } from "../../src/treeErrors";

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
    expect(() => expandTree(input)).toThrow(ERR_INVALID_ATOM);
  });

  it("throws on ambiguous short path", () => {
    const input = ["A", "A", { ref: "A" }];
    expect(() => expandTree(input)).toThrow(ERR_INVALID_REF);
  });

  it("throws on forward reference", () => {
    const input = [{ ref: "/1" }, "A"];
    expect(() => expandTree(input)).toThrow(ERR_INVALID_REF);
  });

  it("throws on ancestor reference", () => {
    const input = [{ A: [{ ref: "/0" }] }];
    expect(() => expandTree(input)).toThrow(ERR_INVALID_REF);
  });

  it("expands sequences inside hierarchical objects", () => {
    const input = [{ A: { seq: { start: 2, end: 3 } } }];
    const output = expandTree(input);
    expect(output).toEqual([{ A: ["'2'", "'3'"] }]);
  });

  it("resolves reference to a sequence node and flattens", () => {
    const input = ["A", { seq: { start: 1, end: 2 } }, { ref: "/1" }];
    const output = expandTree(input);
    expect(output).toEqual(["A", ["'1'", "'2'"], "'1'", "'2'"]);
  });

  it("resolves nested references", () => {
    const input = ["A", { ref: "/0" }, { ref: "/1" }];
    const output = expandTree(input);
    expect(output).toEqual(["A", "A", "A"]);
  });

  it("resolves reference inside a hierarchical object", () => {
    const input = [{ A: "B" }, { A: { ref: "/0/A" } }];
    const output = expandTree(input);
    expect(output).toEqual([{ A: "B" }, { A: "B" }]);
  });

  it("expands and resolves deeply nested sequences and references", () => {
    const input = [
      { A: [{ seq: { start: 1, end: 2 } }, { ref: "/0/A/0" }] },
      { ref: "/0/A/1" },
    ];
    const output = expandTree(input);
    expect(output).toEqual([
      {
        A: [
          ["'1'", "'2'"],
          ["'1'", "'2'"],
        ],
      },
      "'1'",
      "'2'",
    ]);
  });

  it("throws on invalid sequence node", () => {
    const input = [{ seq: { start: 3, end: 1 } }];
    expect(() => expandTree(input)).toThrow();
  });

  it("resolves reference to a nested atom", () => {
    const input = [{ A: ["B"] }, { ref: "/0/A/0" }];
    const output = expandTree(input);
    expect(output).toEqual([{ A: ["B"] }, "B"]);
  });
});
