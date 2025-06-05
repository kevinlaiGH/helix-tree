# Tree Structure Expansion

## Overview

This project reolves around a json tree structure expansion with reference resolution in TypeScript. The implementation supports atoms, references (with canonical and short paths), sequences, and hierarchical objects, and produces a fully expanded and resolved tree.

## How to Run

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Run all tests (unit and e2e):**
   ```sh
   npm run test:all
   ```
3. **Run the program (example):**
   Run:
   ```sh
   npx ts-node src/cli.ts < input.json
   ```

## Key Design Decisions

- **Type Safety:** All tree node types are defined in `src/treeTypes.ts` and used throughout the codebase for clarity and safety.
- **Separation of Concerns:**
  - `treeParser.ts` handles validation and parsing.
  - `treeExpander.ts` expands sequences.
  - `treeResolver.ts` resolves references and handles flattening logic.
- **Reference Resolution:**
  - Canonical and short paths are supported, with ambiguity and invalid references detected and reported.
  - Only top-level references that resolve to arrays of atoms are flattened into the top-level array, matching the output requirements.
- **Error Handling:**
  - All invalid references, ambiguous paths, forward/ancestor/self references, and invalid atoms are detected and reported with clear error messages.

## Assumptions & Notes

- The input tree is provided as a JSON array or object, following the grammar in the instructions.
- Atoms are either identifiers (`[a-zA-Z][a-zA-Z0-9]*`) or quoted numbers (e.g., `"'42'"`).
- Sequences are always expanded before reference resolution.
- References can only point to nodes defined before the current node and not to ancestors or self.
- Ambiguous short paths and invalid references result in errors.
- The output tree is fully expanded, with all references and sequences resolved.
- The code is robust to edge cases and invalid input, and will throw meaningful errors.

## AI Assist Disclosure

- Some portions of this project were developed with the assistance of OpenAI's GPT-4, used for code generation, refactoring, and test design. All code was reviewed and tested for correctness and compliance with the project requirements.
