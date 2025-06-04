// This file is intended for Node.js runtime.
// If using TypeScript, ensure @types/node is installed for type definitions.

/**
 * Validates a tree node according to the grammar in INSTRUCTIONS.MD.
 * Throws an error if validation fails.
 */
export function validateTree(tree: any): void {
  if (!Array.isArray(tree)) {
    throw new Error("Root of the tree must be an array.");
  }
  tree.forEach((node, idx) => validateNode(node, [idx], tree));
}

function validateNode(node: any, path: (string | number)[], root: any): void {
  if (typeof node === "string") {
    // Atom: identifier or quoted number
    if (!/^([a-zA-Z][a-zA-Z0-9]*|'\d+')$/.test(node)) {
      throw new Error(`Invalid atom at ${formatPath(path)}: ${node}`);
    }
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((child, idx) => validateNode(child, path.concat(idx), root));
    return;
  }
  if (typeof node === "object" && node !== null) {
    if ("ref" in node) {
      // Reference node
      if (typeof node.ref !== "string") {
        throw new Error(
          `Reference path must be a string at ${formatPath(path)}`
        );
      }
      // Path validation is deferred to reference resolution
      return;
    }
    if ("seq" in node) {
      // Sequence node
      const seq = node.seq;
      if (
        typeof seq !== "object" ||
        typeof seq.start !== "number" ||
        typeof seq.end !== "number"
      ) {
        throw new Error(`Invalid sequence at ${formatPath(path)}`);
      }
      return;
    }
    // Hierarchical object: key is atom, value is node or array of nodes
    const keys = Object.keys(node);
    if (keys.length !== 1) {
      throw new Error(
        `Hierarchical object must have exactly one key at ${formatPath(path)}`
      );
    }
    const key = keys[0];
    if (!/^([a-zA-Z][a-zA-Z0-9]*|'\d+')$/.test(key)) {
      throw new Error(`Invalid atom key at ${formatPath(path)}: ${key}`);
    }
    validateNode(node[key], path.concat(key), root);
    return;
  }
  throw new Error(
    `Invalid node at ${formatPath(path)}: ${JSON.stringify(node)}`
  );
}

function formatPath(path: (string | number)[]): string {
  return path.map(String).join("/");
}

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
