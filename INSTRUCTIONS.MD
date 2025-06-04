# Tree Structure Expansion Exercise

## Objective

The goal of this exercise is to expand and implement the definition of a tree structure.
This tree structure adheres to the provided grammar, supporting atoms, references, sequences, and hierarchical structures.
Your implementation should handle resolving references, parsing sequences, and handling nested structures.

## Tree Grammar

```
<tree>         ::= "[" <node> ("," <node>)* "]"
<node>         ::= <atom> | <reference> | <sequence> | <hierachy>
<hierachy>     ::= "{" <atom> ":" <tree> "}"
<atom>         ::= identifier | "'" number "'"
<reference>    ::= { "ref": "\"" <path> "\"" }
<sequence>     ::= { "seq": { "start": number, "end": number } }
<path>         ::= <canonical-path> | <short-path>
<canonical-path> ::= "/" <part> ("/" <part>)*
<short-path>   ::= <atom>  ("/" <part>)*
<part>         ::= <atom> | number
```

## Input Format

You will receive a tree structure defined as a JSON object.
It can include the following node types:

1. **Atom**:

   - An identifier or a quoted number.
   - Identifier are of the form `[a-zA-Z][a-zA-Z0-9]`

     e.g.: `"ABC"` or `"'42'"`.

2. **Reference**:

   - Points to another nodes in the tree using a JSON object with the key `"ref"` and a path as the value.
   - Refs can only point to a node defined before the current node in the tree and is not the current node's parent or any of the current nodes direct ancestors. **Note** this quite a strict constrain and prevents circular references.

     That is

     - an earlier sibling,
     - an earlier sibling of any of ancestors.

   - Paths can be **canonical paths** or **short paths**:

     - **Canonical Path**: Starts with `/`, representing the root of the tree, and uses atoms or positions separated by `/`. Example: `/A/B`, `/0/0` or `/A/0`.
     - **Short Path**: Starts with a atom and is followed by a series of atoms or positions. Example: `A/B` or `A/0`.

       With short paths;

       - The first element in the series is used to anchor the rest of the search.
       - Ambigious short paths are considered to be invalid.

         e.g. for the tree `["A", "A"]` the short path `A` is ambigious

       - A short path is considered to ambigious if multiple nodes match at any step in the search

         e.g. for the tree `[{"A":"B"}, "A"]` the short path `A/B` is also ambigious

3. **Sequence**:

   - Specifies a range of integers (inclusive) using `"seq"`.
   - Example: `{ "seq": { "start": 1, "end": 5 } }`.

4. **Node List**:

   - An array containing multiple nodes.
   - Example: `[{"A": ["B", "C"]}, {"ref": "/A/B"}, { "seq": { "start": 1, "end": 3 }}]`.

5. **Hierarchical Object**:
   - An object where the key is an atom and the value is a node.
   - Examples:
     - `{"A": ["B", { "ref": "/0/0" }]}`.
     - `{"A": ["B": [{ "ref": "/0/0" }]]}`.
     - `{"A": ["B": ["C"]]}`.
     - `{"A": ["B": [{"C": ["D"]}]]}`.

## Output Format

Your implementation should process the input tree and produce the resolved tree structure with the following rules:

1. Expand all references into their corresponding nodes.
2. Replace sequence definitions with the list of integers from the defined range.
3. Ensure the output tree structure is in the same format as the input, with references and sequences fully expanded.
4. Handle invalid references or paths gracefully, returning an error or a detailed message.

## Examples

### Example Input

```json
[
  "A",
  { "ref": "/0" },
  { "seq": { "start": 1, "end": 3 } },
  ["B", { "ref": "/0" }],
  { "ref": "/2" }
]
```

### Tree Representation

0. `"A"`: Atom.
1. `{ "ref": "/0" }`: A reference to first node in the tree.
2. `{ "seq": { "start": 1, "end": 3 } }`: A sequence of numbers `[1, 2, 3]`.
3. Nested node list containing:
   - Atom: `"B"`.
   - Reference: `/0`.
4. Reference: `/2`.

### Example Output

```json
["A", "A", "'1'", "'2'", "'3'", ["B", "A"], "'1'"]
```

## Requirements

Your solution should read a json string from standard input and write a json string to standard output.

1. **Input Parsing**:

   - Parse the input tree according to the grammar.
   - Identify and validate each node type: atom, reference, sequence, node list, or hierarchical object.

2. **Sequence Expansion**:

   - Expand sequences into quoted numbers.
   - Expand sequences before resolving references.

3. **Reference Resolution**:

   - Resolve references based on short or canonical paths.
   - Handle nested and chained references.

4. **Error Handling**:

   - Detect invalid references (e.g., non-existent paths).
   - Detect ambigious short references.
   - Detect forward and ancestor references.
   - Provide meaningful error messages for invalid input.

5. **Output**:
   - Produce the resolved tree in the same format as the input.

## Deliverables

1. Source code for your implementation, in either Typescript.
2. A brief README explaining:
   - How to run your program.
   - Key design decisions.
   - Document any explicit assumptions you make,
     i.e. how you resolved missing or inconsistent information in the specification.
   - If you use AI assist, please give a brief description of which AI and your experience using it.
3. (Optional) Unit tests demonstrating the correctness of your implementation.

## Evaluation Criteria

1. **Correctness**: Does your program resolve references and expand sequences correctly?
2. **Clarity**: Is the code well-organized, commented, and easy to understand?
3. **Robustness**: Does it handle edge cases and invalid inputs gracefully?
4. **Testing**: Are there sufficient tests to cover various scenarios?

## Notes

- Unfortunately is it not practical to answer clarify questions.
  However we are happy to discuss these after your submission has been reviewed.
- If you find yourself spending more time than you can allocate to this exercise,
  please submit an incomplete (but working) solution and document what hasn't been completed and a brief description of the approach you had intended taking.
