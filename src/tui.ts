import blessed from "blessed";
import fs from "fs/promises";
import path from "path";

const baseDir = process.cwd();
const statePath = path.join(baseDir, ".contexty", "ui-state.json");
const selectionPath = path.join(baseDir, ".contexty", "ui-selection.json");

type UiState = {
  includedFiles: string[];
  pinnedFiles: string[];
  ignoredFiles: string[];
  otherParts: Array<{ type: string; label: string }>;
  updatedAt: string;
};

type TreeNode = {
  name: string;
  path: string;
  children: Map<string, TreeNode>;
  checked: boolean;
  ignored: boolean;
};

const loadState = async (): Promise<UiState | null> => {
  try {
    const file = await fs.readFile(statePath, "utf8");
    return JSON.parse(file) as UiState;
  } catch {
    return null;
  }
};

const writeSelection = async (pinnedFiles: string[], ignoredFiles: string[]): Promise<void> => {
  await fs.mkdir(path.dirname(selectionPath), { recursive: true });
  await fs.writeFile(
    selectionPath,
    JSON.stringify({ pinnedFiles, ignoredFiles }, null, 2),
    "utf8"
  );
};

const buildTree = (files: string[], pinned: string[], ignored: string[]): TreeNode => {
  const root: TreeNode = { name: ".", path: "", children: new Map(), checked: false, ignored: false };
  const pinnedSet = new Set(pinned);
  const ignoredSet = new Set(ignored);

  for (const file of files) {
    const parts = file.split("/");
    let node = root;
    let currentPath = "";

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      if (!node.children.has(part)) {
        node.children.set(part, {
          name: part,
          path: currentPath,
          children: new Map(),
          checked: pinnedSet.has(currentPath),
          ignored: ignoredSet.has(currentPath)
        });
      }
      node = node.children.get(part)!;
    }
  }

  return root;
};

const flattenTree = (node: TreeNode, depth = 0): Array<{ node: TreeNode; depth: number }> => {
  const entries = [{ node, depth }];
  const sorted = Array.from(node.children.values()).sort((a, b) => a.name.localeCompare(b.name));
  for (const child of sorted) {
    entries.push(...flattenTree(child, depth + 1));
  }
  return entries;
};

const renderList = (
  list: blessed.Widgets.ListElement,
  entries: Array<{ node: TreeNode; depth: number }>
): void => {
  const lines = entries.map(({ node, depth }) => {
    if (node.path === "") {
      return ".";
    }
    const indent = "  ".repeat(depth - 1);
    const checkbox = node.ignored ? "[ ]" : node.checked ? "[x]" : "[ ]";
    const marker = node.ignored ? "(ignored)" : node.checked ? "(pinned)" : "";
    return `${indent}${checkbox} ${node.name} ${marker}`.trimEnd();
  });
  list.setItems(lines);
};

const updateSelectionFromEntries = (entries: Array<{ node: TreeNode; depth: number }>) => {
  const pinned: string[] = [];
  const ignored: string[] = [];

  for (const { node } of entries) {
    if (!node.path) {
      continue;
    }
    if (node.ignored) {
      ignored.push(node.path);
    } else if (node.checked) {
      pinned.push(node.path);
    }
  }

  return { pinned, ignored };
};

const main = async () => {
  const screen = blessed.screen({
    smartCSR: true,
    title: "Contexty TUI"
  });

  const info = blessed.box({
    top: 0,
    left: 0,
    height: 3,
    width: "100%",
    content: "Contexty: arrows to navigate, space to toggle pin, i to ignore, u to unignore, r to refresh, q to quit",
    style: { fg: "white" }
  });

  const list = blessed.list({
    top: 3,
    left: 0,
    width: "70%",
    height: "100%-3",
    keys: true,
    mouse: true,
    vi: true,
    tags: false,
    style: {
      selected: { bg: "blue" }
    },
    border: "line",
    label: " Project Context "
  });

  const otherBox = blessed.box({
    top: 3,
    left: "70%",
    width: "30%",
    height: "100%-3",
    border: "line",
    label: " Other Context "
  });

  screen.append(info);
  screen.append(list);
  screen.append(otherBox);

  let entries: Array<{ node: TreeNode; depth: number }> = [];

  const refresh = async () => {
    const state = await loadState();
    if (!state) {
      otherBox.setContent("No ui-state.json yet.\nTrigger a prompt in OpenCode.");
      list.setItems(["(waiting for context state)"]);
      screen.render();
      return;
    }
    const tree = buildTree(state.includedFiles, state.pinnedFiles, state.ignoredFiles);
    entries = flattenTree(tree).filter((entry) => entry.node.path !== "");
    renderList(list, entries);
    otherBox.setContent(
      state.otherParts.length
        ? state.otherParts.map((part) => `- ${part.label}`).join("\n")
        : "(none)"
    );
    screen.render();
  };

  list.key(["space"], async () => {
    const selected = entries[list.selected];
    if (!selected) return;
    selected.node.checked = !selected.node.checked;
    selected.node.ignored = false;
    renderList(list, entries);
    const { pinned, ignored } = updateSelectionFromEntries(entries);
    await writeSelection(pinned, ignored);
    screen.render();
  });

  list.key(["i"], async () => {
    const selected = entries[list.selected];
    if (!selected) return;
    selected.node.ignored = true;
    selected.node.checked = false;
    renderList(list, entries);
    const { pinned, ignored } = updateSelectionFromEntries(entries);
    await writeSelection(pinned, ignored);
    screen.render();
  });

  list.key(["u"], async () => {
    const selected = entries[list.selected];
    if (!selected) return;
    selected.node.ignored = false;
    selected.node.checked = false;
    renderList(list, entries);
    const { pinned, ignored } = updateSelectionFromEntries(entries);
    await writeSelection(pinned, ignored);
    screen.render();
  });

  screen.key(["r"], async () => {
    await refresh();
  });

  screen.key(["q", "C-c"], () => {
    screen.destroy();
    process.exit(0);
  });

  await refresh();
  list.focus();
  screen.render();
};

void main();
