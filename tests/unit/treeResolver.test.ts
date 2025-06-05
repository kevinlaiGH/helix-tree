import { describe, it, expect } from "@jest/globals";
import { resolveReferences } from "../../src/treeResolver";
import type { TreeNode } from "../../src/treeTypes";
import { ERR_INVALID_REF } from "../../src/treeErrors";
import { expandSequences } from "../../src/treeExpander";

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
    expect(() => resolveReferences(input)).toThrow(ERR_INVALID_REF);
  });

  it("throws on invalid canonical path", () => {
    const input = ["A", { ref: "/99" }];
    expect(() => resolveReferences(input)).toThrow(ERR_INVALID_REF);
  });

  it("throws on forward reference", () => {
    const input = [{ ref: "/1" }, "A"];
    expect(() => resolveReferences(input)).toThrow(ERR_INVALID_REF);
  });

  it("throws on ancestor reference", () => {
    const input = [{ A: [{ ref: "/0" }] }];
    expect(() => resolveReferences(input)).toThrow(ERR_INVALID_REF);
  });

  it("leaves atoms and non-ref objects unchanged", () => {
    const input = ["A", { foo: "bar" }];
    const output = resolveReferences(input);
    expect(output).toEqual(["A", { foo: "bar" }]);
  });

  it("resolves reference to a sequence node", () => {
    const input = ["A", { seq: { start: 1, end: 2 } }, { ref: "/1" }];
    const output = resolveReferences(expandSequences(input));
    expect(output).toEqual(["A", ["'1'", "'2'"], "'1'", "'2'"]);
  });

  it("resolves reference to a hierarchical node", () => {
    const input = [{ A: "B" } as TreeNode, { ref: "/0" } as TreeNode];
    const output = resolveReferences(input);
    expect(output).toEqual([{ A: "B" }, { A: "B" }]);
  });

  it("resolves reference to an atom inside a nested structure", () => {
    const input = [{ A: ["B"] } as TreeNode, { ref: "/0/A/0" } as TreeNode];
    const output = resolveReferences(input);
    expect(output).toEqual([{ A: ["B"] }, "B"]);
  });

  it("throws on non-existent short path", () => {
    const input = ["A", { ref: "B" }];
    expect(() => resolveReferences(input)).toThrow(ERR_INVALID_REF);
  });

  it("throws on non-existent canonical path", () => {
    const input = ["A", { ref: "/1" }];
    expect(() => resolveReferences(input)).toThrow(ERR_INVALID_REF);
  });

  it("resolves reference to a nested array of atoms", () => {
    const input = [["A", "B"], { ref: "/0" }];
    const output = resolveReferences(expandSequences(input));
    expect(output).toEqual([["A", "B"], "A", "B"]);
  });
});
