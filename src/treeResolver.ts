/**
 * Resolves all references in the tree, replacing each { ref: <path> } node with the referenced node.
 * Throws errors for invalid, ambiguous, forward, or ancestor references.
 * Assumes the tree has already had sequences expanded.
 */
export function resolveReferences(tree: any): any {
  // We need to keep track of all nodes and their paths for reference resolution
  const nodeIndex: { path: (string | number)[]; node: any }[] = [];
  indexNodes(tree, [], nodeIndex);
  return resolveNode(tree, [], nodeIndex, []);
}

function indexNodes(
  node: any,
  path: (string | number)[],
  index: { path: (string | number)[]; node: any }[]
) {
  index.push({ path, node });
  if (Array.isArray(node)) {
    node.forEach((child, idx) => indexNodes(child, path.concat(idx), index));
  } else if (typeof node === "object" && node !== null) {
    if ("ref" in node) return; // Don't index inside references
    if ("seq" in node) return; // Sequences should already be expanded
    const keys = Object.keys(node);
    if (keys.length === 1) {
      const key = keys[0];
      indexNodes(node[key], path.concat(key), index);
    }
  }
}

function resolveNode(
  node: any,
  path: (string | number)[],
  index: { path: (string | number)[]; node: any }[],
  ancestors: (string | number)[][]
): any {
  if (typeof node === "string") return node;
  if (Array.isArray(node))
    return node.map((child, idx) =>
      resolveNode(child, path.concat(idx), index, ancestors)
    );
  if (typeof node === "object" && node !== null) {
    if ("ref" in node) {
      const refPath = node.ref;
      return resolveRefPath(refPath, path, index, ancestors);
    }
    const keys = Object.keys(node);
    if (keys.length === 1) {
      const key = keys[0];
      return {
        [key]: resolveNode(
          node[key],
          path.concat(key),
          index,
          ancestors.concat([path])
        ),
      };
    }
    // Other objects (should not occur)
    return { ...node };
  }
  return node;
}

function resolveRefPath(
  refPath: string,
  currentPath: (string | number)[],
  index: { path: (string | number)[]; node: any }[],
  ancestors: (string | number)[][]
): any {
  // Canonical path: starts with '/'
  if (refPath.startsWith("/")) {
    const parts = refPath
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
      throw new Error(
        `Invalid or ambiguous reference at ${formatPath(
          currentPath
        )}: ${refPath}`
      );
    }
    return match.node;
  } else {
    // Short path: must resolve uniquely
    const parts = refPath
      .split("/")
      .map((p) => (isNaN(Number(p)) ? p : Number(p)));
    // Find all candidates for the first part that are before the current node in traversal order
    let candidates = index.filter((entry) => {
      // Atom node
      if (
        typeof entry.node === "string" &&
        entry.node === parts[0] &&
        isBeforeInTraversal(entry.path, currentPath)
      ) {
        return true;
      }
      // Hierarchical object: key is atom
      if (typeof entry.node === "object" && entry.node !== null) {
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
    let matches: { path: (string | number)[]; node: any }[] = [];
    for (const candidate of candidates) {
      let match = candidate;
      let valid = true;
      for (let i = 1; i < parts.length; i++) {
        if (typeof match.node !== "object" || match.node === null) {
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
            node: match.node[parts[i]],
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
      throw new Error(
        `Invalid or ambiguous reference at ${formatPath(
          currentPath
        )}: ${refPath}`
      );
    }
  }
}

function isValidReference(
  targetPath: (string | number)[],
  currentPath: (string | number)[],
  ancestors: (string | number)[][]
): boolean {
  // No forward references (target must be before current in traversal order)
  for (let i = 0; i < Math.min(targetPath.length, currentPath.length); i++) {
    if (targetPath[i] < currentPath[i]) return true;
    if (targetPath[i] > currentPath[i]) return false;
  }
  if (targetPath.length < currentPath.length) return true;
  // No ancestor references
  for (const ancestor of ancestors) {
    if (pathsEqual(targetPath, ancestor)) return false;
  }
  // No self-reference
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
