import type { TreeNode, Sequence, Hierarchical } from "./treeTypes";

function isSequence(node: TreeNode): node is Sequence {
  return (
    typeof node === "object" &&
    node !== null &&
    "seq" in node &&
    typeof (node as any).seq === "object" &&
    node.seq !== null &&
    typeof (node.seq as { start: number; end: number }).start === "number" &&
    typeof (node.seq as { start: number; end: number }).end === "number"
  );
}

function isReference(node: TreeNode): node is { ref: string } {
  return (
    typeof node === "object" &&
    node !== null &&
    "ref" in node &&
    typeof (node as any).ref === "string"
  );
}

function isHierarchical(node: TreeNode): node is Hierarchical {
  return (
    typeof node === "object" &&
    node !== null &&
    !Array.isArray(node) &&
    !isSequence(node) &&
    !isReference(node)
  );
}

/**
 * Expands all sequence nodes in the tree into lists of quoted numbers.
 * Returns a new tree with sequences expanded.
 * Throws an error if a sequence node is invalid.
 */
export function expandSequences(tree: TreeNode): TreeNode {
  return expandNode(tree);
}

function expandNode(node: TreeNode): TreeNode {
  if (typeof node === "string") {
    return node;
  }
  if (Array.isArray(node)) {
    return node.map(expandNode);
  }
  if (isSequence(node)) {
    const seq = node.seq as { start: number; end: number };
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
  // If node is an object with a 'seq' key but not a valid sequence, throw
  if (
    typeof node === "object" &&
    node !== null &&
    !Array.isArray(node) &&
    "seq" in node
  ) {
    throw new Error("Invalid sequence node: " + JSON.stringify(node));
  }
  if (isHierarchical(node)) {
    const keys = Object.keys(node);
    if (keys.length === 1) {
      const key = keys[0];
      return { [key]: expandNode((node as Hierarchical)[key]) };
    }
    // Defensive: should not happen for valid trees
    return { ...node };
  }
  // For Reference or unknown object, return as is (should be caught by validation)
  return node;
}
