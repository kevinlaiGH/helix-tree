import { validateTree } from "./treeParser";
import { expandSequences } from "./treeExpander";
import { resolveReferences } from "./treeResolver";

/**
 * Main entry point: reads JSON from stdin, validates, and prints result or error.
 */

async function main() {
  const input = await new Promise<string>((resolve, reject) => {
    let data = "";
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
  const tree = JSON.parse(input);
  validateTree(tree);
  const expanded = expandSequences(tree);
  const resolved = resolveReferences(expanded);
  console.log(JSON.stringify(resolved));
}
main();
