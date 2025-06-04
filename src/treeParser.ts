// This file is intended for Node.js runtime.
// If using TypeScript, ensure @types/node is installed for type definitions.

import type {
  Atom,
  Reference,
  Sequence,
  Hierarchical,
  TreeNode,
} from "./treeTypes";

// --- Constants ---
const ATOM_REGEX = /^([a-zA-Z][a-zA-Z0-9]*|'\d+')$/;

// --- Validation Logic ---
/**
 * Validates a tree node according to the grammar in INSTRUCTIONS.MD.
 * Throws an error if validation fails.
 */
export function validateTree(tree: TreeNode[]): void {
  if (!Array.isArray(tree)) {
    throw new Error("Root of the tree must be an array.");
  }
  tree.forEach((node, idx) => validateNode(node, [idx]));
}

function validateNode(node: TreeNode, path: (string | number)[]): void {
  if (typeof node === "string") {
    if (!isValidAtom(node)) {
      throw new Error(`Invalid atom at ${formatPath(path)}: ${node}`);
    }
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((child, idx) => validateNode(child, path.concat(idx)));
    return;
  }
  if (typeof node === "object" && node !== null) {
    if ("ref" in node) {
      if (typeof (node as any).ref !== "string") {
        throw new Error(
          `Reference path must be a string at ${formatPath(path)}`
        );
      }
      return;
    }
    if ("seq" in node) {
      const seq = (node as any).seq;
      if (
        typeof seq !== "object" ||
        typeof seq.start !== "number" ||
        typeof seq.end !== "number"
      ) {
        throw new Error(`Invalid sequence at ${formatPath(path)}`);
      }
      return;
    }
    const keys = Object.keys(node);
    if (keys.length !== 1) {
      throw new Error(
        `Hierarchical object must have exactly one key at ${formatPath(path)}`
      );
    }
    const key = keys[0];
    if (!isValidAtom(key)) {
      throw new Error(`Invalid atom key at ${formatPath(path)}: ${key}`);
    }
    validateNode((node as any)[key], path.concat(key));
    return;
  }
  throw new Error(
    `Invalid node at ${formatPath(path)}: ${JSON.stringify(node)}`
  );
}

function isValidAtom(atom: string): boolean {
  return ATOM_REGEX.test(atom);
}

function formatPath(path: (string | number)[]): string {
  return path.map(String).join("/");
}

// --- CLI/IO Logic ---
/**
 * Reads all input from stdin and returns it as a string.
 */
function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk: string) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

/**
 * Main entry point: reads JSON from stdin, validates, and prints result or error.
 */
export async function main() {
  try {
    const input = await readStdin();
    const tree = JSON.parse(input);
    validateTree(tree);
    console.log("Tree is valid.");
  } catch (err: any) {
    console.error("Validation error:", err.message);
    process.exit(1);
  }
}

// If run directly, execute main
if (require.main === module) {
  main();
}
