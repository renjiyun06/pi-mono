#!/usr/bin/env node
/**
 * CLI entry point for pi-tree: visualize session branch structure.
 */
process.title = "pi-tree";

import { piTree } from "./pi-tree.js";

piTree(process.argv.slice(2));
