import { create } from 'zustand';
import { ComponentNode } from '@lowcode/shared';

interface DesignerState {
  schema: ComponentNode | null;
  selectedNodeId: string | null;
  history: ComponentNode[];
  historyIndex: number;
  setSchema: (schema: ComponentNode) => void;
  selectNode: (id: string | null) => void;
  updateNodeProps: (id: string, props: Record<string, unknown>) => void;
  addChild: (parentId: string, child: ComponentNode) => void;
  removeNode: (id: string) => void;
  undo: () => void;
  redo: () => void;
}

export const useDesignerStore = create<DesignerState>((set, get) => ({
  schema: null,
  selectedNodeId: null,
  history: [],
  historyIndex: -1,

  setSchema: (schema) => {
    set({ schema, history: [schema], historyIndex: 0 });
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  updateNodeProps: (id, props) => {
    const { schema, history, historyIndex } = get();
    if (!schema) return;

    const newSchema = JSON.parse(JSON.stringify(schema));
    updateNodePropsRecursive(newSchema, id, props);

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newSchema);
    set({ schema: newSchema, history: newHistory, historyIndex: historyIndex + 1 });
  },

  addChild: (parentId, child) => {
    const { schema, history, historyIndex } = get();
    if (!schema) return;

    const newSchema = JSON.parse(JSON.stringify(schema));
    addChildRecursive(newSchema, parentId, child);

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newSchema);
    set({ schema: newSchema, history: newHistory, historyIndex: historyIndex + 1 });
  },

  removeNode: (id) => {
    const { schema, history, historyIndex } = get();
    if (!schema) return;

    const newSchema = JSON.parse(JSON.stringify(schema));
    removeNodeRecursive(newSchema, id);

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newSchema);
    set({ schema: newSchema, history: newHistory, historyIndex: historyIndex + 1, selectedNodeId: null });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    set({ schema: history[newIndex], historyIndex: newIndex, selectedNodeId: null });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    set({ schema: history[newIndex], historyIndex: newIndex, selectedNodeId: null });
  },
}));

function updateNodePropsRecursive(
  node: ComponentNode,
  id: string,
  props: Record<string, unknown>,
) {
  if (node.id === id) {
    node.props = { ...node.props, ...props };
    return;
  }
  node.children?.forEach((child) => updateNodePropsRecursive(child, id, props));
}

function addChildRecursive(node: ComponentNode, parentId: string, child: ComponentNode) {
  if (node.id === parentId) {
    if (!node.children) node.children = [];
    node.children.push(child);
    return;
  }
  node.children?.forEach((c) => addChildRecursive(c, parentId, child));
}

function removeNodeRecursive(node: ComponentNode, id: string): boolean {
  if (!node.children) return false;
  const index = node.children.findIndex((c) => c.id === id);
  if (index !== -1) {
    node.children.splice(index, 1);
    return true;
  }
  node.children.forEach((c) => removeNodeRecursive(c, id));
  return false;
}
