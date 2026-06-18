import { Node, Edge } from '@xyflow/react';
import dagre from 'dagre';
import { EntityRelationGraph } from '@lowcode/shared';
import { EntityNodeData } from './EntityNode';

const NODE_WIDTH = 240;
const HEADER_HEIGHT = 60;
const FIELD_HEIGHT = 33;
const PADDING = 12;

/** Predefined color palette for entity groups */
const GROUP_COLORS = [
  { bg: '#1677ff', border: '#1677ff' },   // blue
  { bg: '#722ed1', border: '#722ed1' },   // purple
  { bg: '#fa8c16', border: '#fa8c16' },   // orange
  { bg: '#52c41a', border: '#52c41a' },   // green
  { bg: '#eb2f96', border: '#eb2f96' },   // pink
  { bg: '#13c2c2', border: '#13c2c2' },   // cyan
  { bg: '#f5222d', border: '#f5222d' },   // red
  { bg: '#fa541c', border: '#fa541c' },   // volcano
];

function estimateNodeHeight(fieldCount: number, expanded: boolean): number {
  if (!expanded) return HEADER_HEIGHT + Math.min(fieldCount, 5) * FIELD_HEIGHT + PADDING;
  return HEADER_HEIGHT + fieldCount * FIELD_HEIGHT + PADDING;
}

function relationLabel(type: string): string {
  if (type === 'ONE_TO_ONE') return '1:1';
  if (type === 'MANY_TO_MANY') return 'M:N';
  return '1:N';
}

/** Deterministic color from entity name */
function getEntityColor(entityName: string): { bg: string; border: string } {
  let hash = 0;
  for (let i = 0; i < entityName.length; i++) {
    hash = entityName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % GROUP_COLORS.length;
  return GROUP_COLORS[idx];
}

export function toReactFlowGraph(
  graph: EntityRelationGraph,
  onEntityClick?: (entityId: string) => void,
  onFieldEdit?: (fieldId: string, fieldName: string, newDisplayName: string) => Promise<void>,
  appId?: string,
): { nodes: Node[]; edges: Edge[] } {
  const savedLayout = graph.layout ?? {};

  // Build nodes, use saved positions when available
  const reactFlowNodes: Node[] = graph.nodes.map((entity) => {
    const saved = savedLayout[entity.id];
    const color = getEntityColor(entity.name);
    return {
      id: entity.id,
      type: 'entityNode',
      position: saved ? { x: saved.x, y: saved.y } : { x: 0, y: 0 },
      data: {
        label: entity.displayName,
        name: entity.name,
        entityId: entity.id,
        appId,
        color: color.bg,
        borderColor: color.border,
        fields: entity.fields.map((f) => ({
          id: f.id,
          name: f.name,
          displayName: f.displayName,
          type: f.type,
          required: f.required,
          isRelation: !!f.relationTo,
          relationType: f.relationType,
        })),
        onEntityClick,
        onFieldEdit,
      } as EntityNodeData,
      width: NODE_WIDTH,
      height: estimateNodeHeight(entity.fields.length, entity.fields.length <= 5),
    };
  });

  const reactFlowEdges: Edge[] = graph.edges.map((edge) => {
    const color = getEntityColor(edge.sourceEntityId);
    return {
      id: edge.id,
      source: edge.sourceEntityId,
      target: edge.targetEntityId,
      sourceHandle: `field-${edge.sourceFieldName}`,
      targetHandle: 'entity-target',
      type: 'smoothstep',
      animated: true,
      style: { stroke: color.border, strokeWidth: 2, opacity: 0.7 },
      label: relationLabel(edge.relationType),
      labelStyle: { fill: color.border, fontWeight: 600, fontSize: 11 },
      labelBgStyle: { fill: '#f0f5ff' },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 4,
    };
  });

  // Dagre auto-layout for nodes WITHOUT saved positions
  const nodesToLayout = reactFlowNodes.filter((n) => !savedLayout[n.id]);
  const nodesWithLayout = reactFlowNodes.filter((n) => savedLayout[n.id]);

  if (nodesToLayout.length > 0) {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: 'LR', nodesep: 80, ranksep: 120, marginx: 40, marginy: 40 });

    nodesToLayout.forEach((node) => {
      g.setNode(node.id, { width: node.width ?? NODE_WIDTH, height: node.height ?? HEADER_HEIGHT });
    });
    reactFlowEdges.forEach((edge) => {
      // Only add edges between nodes being laid out, or from a laid-out node
      if (nodesToLayout.some((n) => n.id === edge.source) || nodesToLayout.some((n) => n.id === edge.target)) {
        g.setEdge(edge.source, edge.target);
      }
    });

    dagre.layout(g);

    const positionedNodes = nodesToLayout.map((node) => {
      const dagreNode = g.node(node.id);
      return {
        ...node,
        position: {
          x: dagreNode.x - (node.width ?? NODE_WIDTH) / 2,
          y: dagreNode.y - (node.height ?? HEADER_HEIGHT) / 2,
        },
      };
    });

    return { nodes: [...positionedNodes, ...nodesWithLayout], edges: reactFlowEdges };
  }

  return { nodes: reactFlowNodes, edges: reactFlowEdges };
}
