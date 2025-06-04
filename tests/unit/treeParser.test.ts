import { describe, it, expect } from "@jest/globals";
import { validateTree } from "../../src/treeParser";
import type { TreeNode } from "../../src/treeTypes";

describe("validateTree", () => {
  it("accepts a valid tree with atoms", () => {
    expect(() => validateTree(["A", "'42'"])).not.toThrow();
  });

  it("accepts a valid tree with references", () => {
    expect(() => validateTree(["A", { ref: "/0" }])).not.toThrow();
  });

  it("accepts a valid tree with sequences", () => {
    expect(() => validateTree([{ seq: { start: 1, end: 3 } }])).not.toThrow();
  });

  it("accepts a valid hierarchical object", () => {
    expect(() => validateTree([{ A: ["B", "C"] }])).not.toThrow();
  });

  it("rejects non-array root", () => {
    expect(() => validateTree({} as unknown as TreeNode[])).toThrow(
      "Root of the tree must be an array."
    );
  });

  it("rejects invalid atom", () => {
    expect(() => validateTree(["not valid!"])).toThrow("Invalid atom");
  });

  it("rejects reference with non-string path", () => {
    expect(() => validateTree([{ ref: 123 } as unknown as TreeNode])).toThrow(
      "Reference path must be a string"
    );
  });

  it("rejects invalid sequence", () => {
    expect(() =>
      validateTree([{ seq: { start: "a", end: 3 } } as unknown as TreeNode])
    ).toThrow("Invalid sequence");
  });

  it("rejects hierarchical object with multiple keys", () => {
    expect(() => validateTree([{ A: "B", B: "C" }])).toThrow(
      "Hierarchical object must have exactly one key"
    );
  });

  it("rejects hierarchical object with invalid atom key", () => {
    expect(() => validateTree([{ "not valid!": "B" }])).toThrow(
      "Invalid atom key"
    );
  });

  it("rejects completely invalid node", () => {
    expect(() => validateTree([null as unknown as TreeNode])).toThrow(
      "Invalid node"
    );
  });
});
