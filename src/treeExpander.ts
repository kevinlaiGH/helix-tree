/**
 * Expands all sequence nodes in the tree into lists of quoted numbers.
 * Returns a new tree with sequences expanded.
 * Throws an error if a sequence node is invalid.
 */
export function expandSequences(tree: any): any {
  return expandNode(tree);
}

function expandNode(node: any): any {
  if (typeof node === "string") {
    return node;
  }
  if (Array.isArray(node)) {
    return node.map(expandNode);
  }
  if (typeof node === "object" && node !== null) {
    if ("seq" in node) {
      const seq = node.seq;
      if (
        typeof seq !== "object" ||
        typeof seq.start !== "number" ||
        typeof seq.end !== "number" ||
        !Number.isInteger(seq.start) ||
        !Number.isInteger(seq.end) ||
        seq.start > seq.end
      ) {
        throw new Error("Invalid sequence node: " + JSON.stringify(node));
      }
      // Expand to array of quoted numbers as strings
      const result = [];
      for (let i = seq.start; i <= seq.end; i++) {
        result.push(`'${i}'`);
      }
      return result;
    }
    // Hierarchical object: key is atom, value is node or array of nodes
    const keys = Object.keys(node);
    if (keys.length === 1) {
      const key = keys[0];
      return { [key]: expandNode(node[key]) };
    }
    // Reference or other object
    return { ...node };
  }
  // For null or other types, return as is (should be caught by validation)
  return node;
}
