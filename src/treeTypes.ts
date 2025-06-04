export type Atom = string;
export type Reference = { ref: string };
export type Sequence = { seq: { start: number; end: number } };
export type Hierarchical = { [key: string]: TreeNode };
export type TreeNode = Atom | Reference | Sequence | Hierarchical | TreeNode[];
