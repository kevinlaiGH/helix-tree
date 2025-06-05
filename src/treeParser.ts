import type { TreeNode } from "./treeTypes";
import {
  ERR_ROOT_ARRAY,
  ERR_INVALID_ATOM,
  ERR_REF_PATH,
  ERR_INVALID_SEQ,
  ERR_HIERARCHY_KEYS,
  ERR_INVALID_ATOM_KEY,
  ERR_INVALID_NODE,
} from "./treeErrors";

// --- Constants ---
const ATOM_REGEX = /^([a-zA-Z][a-zA-Z0-9]*|'\d+')$/;

// --- Validation Logic ---
/**
 * Validates a tree node according to the grammar in INSTRUCTIONS.MD.
 * Throws an error if validation fails.
 */
export function validateTree(tree: TreeNode[]): void {
  if (!Array.isArray(tree)) {
    throw new Error(ERR_ROOT_ARRAY);
  }
  tree.forEach((node, idx) => validateNode(node, [idx]));
}

function validateNode(node: TreeNode, path: (string | number)[]): void {
  if (typeof node === "string") {
    if (!isValidAtom(node)) {
      throw new Error(`${ERR_INVALID_ATOM} at ${formatPath(path)}: ${node}`);
    }
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((child, idx) => validateNode(child, path.concat(idx)));
    return;
  }
  if (typeof node === "object" && node !== null) {
    if ("ref" in node) {
      if (
        typeof (node as any).ref !== "string" ||
        (node as any).ref.length === 0
      ) {
        throw new Error(`${ERR_REF_PATH} at ${formatPath(path)}`);
      }
      return;
    }
    if ("seq" in node) {
      const seq = (node as any).seq;
      if (
        typeof seq !== "object" ||
        typeof seq.start !== "number" ||
        typeof seq.end !== "number" ||
        !Number.isInteger(seq.start) ||
        !Number.isInteger(seq.end) ||
        seq.start > seq.end
      ) {
        throw new Error(`${ERR_INVALID_SEQ} at ${formatPath(path)}`);
      }
      return;
    }
    const keys = Object.keys(node);
    if (keys.length !== 1) {
      throw new Error(`${ERR_HIERARCHY_KEYS} at ${formatPath(path)}`);
    }
    const key = keys[0];
    if (!isValidAtom(key)) {
      throw new Error(`${ERR_INVALID_ATOM_KEY} at ${formatPath(path)}: ${key}`);
    }
    validateNode((node as any)[key], path.concat(key));
    return;
  }
  throw new Error(
    `${ERR_INVALID_NODE} at ${formatPath(path)}: ${JSON.stringify(node)}`
  );
}

function isValidAtom(atom: string): boolean {
  return ATOM_REGEX.test(atom);
}

function formatPath(path: (string | number)[]): string {
  return path.map(String).join("/");
}
