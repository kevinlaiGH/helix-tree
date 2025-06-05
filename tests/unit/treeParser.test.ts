import { describe, it, expect } from "@jest/globals";
import { validateTree } from "../../src/treeParser";
import type { TreeNode } from "../../src/treeTypes";

import {
  ERR_ROOT_ARRAY,
  ERR_INVALID_ATOM,
  ERR_REF_PATH,
  ERR_INVALID_SEQ,
  ERR_HIERARCHY_KEYS,
  ERR_INVALID_ATOM_KEY,
  ERR_INVALID_NODE,
} from "../../src/treeErrors";

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

  it("accepts an empty array as root", () => {
    expect(() => validateTree([])).not.toThrow();
  });

  it("rejects non-array root", () => {
    expect(() => validateTree({} as unknown as TreeNode[])).toThrow(
      ERR_ROOT_ARRAY
    );
  });

  it("rejects invalid atom", () => {
    expect(() => validateTree(["not valid!"])).toThrow(ERR_INVALID_ATOM);
  });

  it("rejects reference with non-string path", () => {
    expect(() => validateTree([{ ref: 123 } as unknown as TreeNode])).toThrow(
      ERR_REF_PATH
    );
  });

  it("rejects invalid sequence", () => {
    expect(() =>
      validateTree([{ seq: { start: "a", end: 3 } } as unknown as TreeNode])
    ).toThrow(ERR_INVALID_SEQ);
  });

  it("rejects hierarchical object with multiple keys", () => {
    expect(() => validateTree([{ A: "B", B: "C" }])).toThrow(
      ERR_HIERARCHY_KEYS
    );
  });

  it("rejects hierarchical object with invalid atom key", () => {
    expect(() => validateTree([{ "not valid!": "B" }])).toThrow(
      ERR_INVALID_ATOM_KEY
    );
  });

  it("rejects completely invalid node", () => {
    expect(() => validateTree([null as unknown as TreeNode])).toThrow(
      ERR_INVALID_NODE
    );
  });

  it("rejects sequence with start > end", () => {
    expect(() =>
      validateTree([{ seq: { start: 5, end: 3 } } as unknown as TreeNode])
    ).toThrow(ERR_INVALID_SEQ);
  });

  it("rejects sequence with non-integer start/end", () => {
    expect(() =>
      validateTree([{ seq: { start: 1.5, end: 3 } } as unknown as TreeNode])
    ).toThrow(ERR_INVALID_SEQ);
  });

  it("rejects reference with empty string path", () => {
    expect(() => validateTree([{ ref: "" } as unknown as TreeNode])).toThrow(
      ERR_REF_PATH
    );
  });

  it("accepts deeply nested valid structure", () => {
    expect(() =>
      validateTree([{ A: [{ B: [{ C: ["'1'"] }] }] }])
    ).not.toThrow();
  });

  it("accepts reference to a sequence node", () => {
    expect(() =>
      validateTree(["A", { seq: { start: 1, end: 2 } }, { ref: "/1" }])
    ).not.toThrow();
  });
});
