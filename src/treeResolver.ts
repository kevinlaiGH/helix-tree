import type { TreeNode } from "./treeTypes";

function isAtom(node: TreeNode): node is string {
  return typeof node === "string";
}

// Helper marker for flattening
const FLATTEN = Symbol("flatten");

type FlattenedArray = string[] & { [FLATTEN]?: true };

/**
 * Resolves all references in the tree, replacing each { ref: <path> } node with the referenced node.
 * Throws errors for invalid, ambiguous, forward, or ancestor references.
 * Assumes the tree has already had sequences expanded.
 */
export function resolveReferences(tree: TreeNode): TreeNode {
  const nodeIndex: { path: (string | number)[]; node: TreeNode }[] = [];
  indexNodes(tree, [], nodeIndex);
  return resolveNode(tree, [], nodeIndex, [], true);
}

function indexNodes(
  node: TreeNode,
  path: (string | number)[],
  index: { path: (string | number)[]; node: TreeNode }[]
): void {
  if (!path.every((v) => typeof v === "string" || typeof v === "number")) {
    throw new Error(
      "Path contains non-string/number value: " + JSON.stringify(path)
    );
  }
  index.push({ path, node });
  if (Array.isArray(node)) {
    node.forEach((child, idx) => indexNodes(child, [...path, idx], index));
  } else if (typeof node === "object" && node !== null && !isAtom(node)) {
    if ("ref" in node) return; // Don't index inside references
    if ("seq" in node) return; // Sequences should already be expanded
    const keys = Object.keys(node);
    if (keys.length === 1) {
      const key = keys[0];
      if (typeof key !== "string") {
        throw new Error("Key is not a string: " + JSON.stringify(key));
      }
      indexNodes(
        (node as Record<string, TreeNode>)[key],
        [...path, key],
        index
      );
    }
  }
}

function resolveNode(
  node: TreeNode,
  path: (string | number)[],
  index: { path: (string | number)[]; node: TreeNode }[],
  ancestors: (string | number)[][],
  isTopLevel = false
): TreeNode {
  if (!path.every((v) => typeof v === "string" || typeof v === "number")) {
    throw new Error(
      "Path contains non-string/number value: " + JSON.stringify(path)
    );
  }
  if (isAtom(node)) return node;
  if (Array.isArray(node)) {
    const result = node.map((child, idx) =>
      resolveNode(child, [...path, idx], index, ancestors, isTopLevel)
    );
    if (isTopLevel) {
      // Only flatten children that are tagged as FLATTEN
      const flattened: TreeNode[] = [];
      for (const el of result) {
        if (Array.isArray(el) && (el as FlattenedArray)[FLATTEN]) {
          flattened.push(...el);
        } else {
          flattened.push(el);
        }
      }
      return flattened;
    }
    return result;
  }
  if (typeof node === "object" && node !== null && !isAtom(node)) {
    if ("ref" in node && typeof (node as any).ref === "string") {
      const refPath = (node as { ref: string }).ref;
      const resolved = resolveRefPath(refPath, path, index, ancestors);
      // If this is a top-level reference and resolves to an array of atoms, tag it for flattening
      if (isTopLevel && Array.isArray(resolved) && resolved.every(isAtom)) {
        (resolved as FlattenedArray)[FLATTEN] = true;
        return resolved;
      }
      return resolved;
    }
    const keys = Object.keys(node);
    if (keys.length === 1) {
      const key = keys[0];
      if (typeof key !== "string") {
        throw new Error("Key is not a string: " + JSON.stringify(key));
      }
      return {
        [key]: resolveNode(
          (node as Record<string, TreeNode>)[key],
          [...path, key],
          index,
          [...ancestors, path],
          false
        ),
      };
    }
    return { ...node };
  }
  return node;
}

function resolveRefPath(
  refPath: string,
  currentPath: (string | number)[],
  index: { path: (string | number)[]; node: TreeNode }[],
  ancestors: (string | number)[][]
): TreeNode {
  // Canonical path: starts with '/'
  if (refPath.startsWith("/")) {
    const parts: (string | number)[] = refPath
      .slice(1)
      .split("/")
      .map((p) => (isNaN(Number(p)) ? p : Number(p)));
    // Find node with exact path
    const match = index.find((entry) => pathsEqual(entry.path, parts));
    if (
      !match ||
      !isValidReference(match.path, currentPath, ancestors) ||
      (match.path.length < currentPath.length &&
        match.path.every((v, i) => v === currentPath[i]))
    ) {
      let pathStr = JSON.stringify(currentPath);
      throw new Error(
        `Invalid or ambiguous reference at ${pathStr}: ${refPath}`
      );
    }
    return match.node;
  } else {
    // Short path: must resolve uniquely
    const parts: (string | number)[] = refPath
      .split("/")
      .map((p) => (isNaN(Number(p)) ? p : Number(p)));
    // Find all candidates for the first part that are before the current node in traversal order
    let candidates = index.filter((entry) => {
      // Atom node
      if (
        isAtom(entry.node) &&
        entry.node === parts[0] &&
        isBeforeInTraversal(entry.path, currentPath)
      ) {
        return true;
      }
      // Hierarchical object: key is atom
      if (
        typeof entry.node === "object" &&
        entry.node !== null &&
        !isAtom(entry.node)
      ) {
        const keys = Object.keys(entry.node);
        if (
          keys.length === 1 &&
          keys[0] === parts[0] &&
          isBeforeInTraversal(entry.path, currentPath)
        ) {
          return true;
        }
      }
      return false;
    });
    // Walk down the path for each candidate
    let matches: { path: (string | number)[]; node: TreeNode }[] = [];
    for (const candidate of candidates) {
      let match = candidate;
      let valid = true;
      for (let i = 1; i < parts.length; i++) {
        if (
          typeof match.node !== "object" ||
          match.node === null ||
          isAtom(match.node)
        ) {
          valid = false;
          break;
        }
        if (Array.isArray(match.node)) {
          if (typeof parts[i] === "number" && Number.isInteger(parts[i])) {
            const idx: number = parts[i] as number;
            if (idx >= 0 && idx < match.node.length) {
              match = { path: match.path.concat(idx), node: match.node[idx] };
            } else {
              valid = false;
              break;
            }
          } else {
            valid = false;
            break;
          }
        } else if (typeof parts[i] === "string" && parts[i] in match.node) {
          match = {
            path: match.path.concat(parts[i]),
            node: (match.node as Record<string, TreeNode>)[parts[i]],
          };
        } else {
          valid = false;
          break;
        }
      }
      // Ancestor reference check: if match.path is a prefix of currentPath (but not equal)
      if (
        valid &&
        match.path.length < currentPath.length &&
        match.path.every((v, i) => v === currentPath[i])
      ) {
        valid = false;
      }
      if (valid && isValidReference(match.path, currentPath, ancestors)) {
        matches.push(match);
      }
    }
    // If exactly one match, use it; otherwise ambiguous or invalid
    if (matches.length === 1) {
      return matches[0].node;
    } else {
      let pathStr = JSON.stringify(currentPath);
      throw new Error(
        `Invalid or ambiguous reference at ${pathStr}: ${refPath}`
      );
    }
  }
}

function isValidReference(
  targetPath: (string | number)[],
  currentPath: (string | number)[],
  ancestors: (string | number)[][]
): boolean {
  for (let i = 0; i < Math.min(targetPath.length, currentPath.length); i++) {
    if (targetPath[i] < currentPath[i]) return true;
    if (targetPath[i] > currentPath[i]) return false;
  }
  if (targetPath.length < currentPath.length) return true;
  for (const ancestor of ancestors) {
    if (pathsEqual(targetPath, ancestor)) return false;
  }
  if (pathsEqual(targetPath, currentPath)) return false;
  return true;
}

function pathsEqual(a: (string | number)[], b: (string | number)[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function formatPath(path: (string | number)[]): string {
  return path.map(String).join("/");
}

function isBeforeInTraversal(
  a: (string | number)[],
  b: (string | number)[]
): boolean {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) continue;
    if (typeof a[i] === "number" && typeof b[i] === "number") {
      return a[i] < b[i];
    } else {
      return String(a[i]) < String(b[i]);
    }
  }
  return a.length < b.length;
}
