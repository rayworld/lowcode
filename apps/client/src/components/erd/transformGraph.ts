import { Node, Edge } from '@xyflow/react';
import dagre from 'dagre';
import { EntityRelationGraph } from '@lowcode/shared';
import { EntityNodeData } from './EntityNode';

const NODE_WIDTH = 240;
const HEADER_HEIGHT = 60;
const FIELD_HEIGHT = 33;
const PADDING = 12;

function estimateNodeHeight(fieldCount: number): number {
  return HEADER_HEIGHT + fieldCount * FIELD_HEIGHT + PADDING;
}

function relationLabel(type: string): string {
  if (type === 'ONE_TO_ONE') return '1:1';
  if (type === 'MANY_TO_MANY') return 'M:N';
  return '1:N';
}

export function toReactFlowGraph(
  graph: EntityRelationGraph,
  onEntityClick?: (entityId: string) => void,
): { nodes: Node[]; edges: Edge[] } {
  const savedLayout = graph.layout ?? {};

  // Build nodes, use saved positions when available
  const reactFlowNodes: Node[] = graph.nodes.map((entity) => {
    const saved = savedLayout[entity.id];
    return {
      id: entity.id,
      type: 'entityNode',
      position: saved ? { x: saved.x, y: saved.y } : { x: 0, y: 0 },
      data: {
        label: entity.displayName,
        name: entity.name,
        entityId: entity.id,
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
      } as EntityNodeData,
      width: NODE_WIDTH,
      height: estimateNodeHeight(entity.fields.length),
    };
  });

  const reactFlowEdges: Edge[] = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.sourceEntityId,
    target: edge.targetEntityId,
    sourceHandle: `field-${edge.sourceFieldName}`,
    targetHandle: 'entity-target',
    type: 'smoothstep',
    animated: false,
    style: { stroke: '#1677ff', strokeWidth: 2 },
    label: relationLabel(edge.relationType),
    labelStyle: { fill: '#1677ff', fontWeight: 600, fontSize: 11 },
    labelBgStyle: { fill: '#e6f4ff' },
    labelBgPadding: [4, 2] as [number, number],
    labelBgBorderRadius: 4,
  }));

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
