import { Node, Edge } from '@xyflow/react';
import dagre from 'dagre';
import { EntityRelationGraph } from '@lowcode/shared';
import { EntityNodeData, EntityNodeType } from './EntityNode';

const NODE_WIDTH = 240;
const HEADER_HEIGHT = 60;
const FIELD_HEIGHT = 33;
const PADDING = 12;

function estimateNodeHeight(fieldCount: number): number {
  return HEADER_HEIGHT + fieldCount * FIELD_HEIGHT + PADDING;
}

export function toReactFlowGraph(
  graph: EntityRelationGraph,
  onEntityClick?: (entityId: string) => void,
): { nodes: Node[]; edges: Edge[] } {
  const reactFlowNodes: Node[] = graph.nodes.map((entity) => ({
    id: entity.id,
    type: 'entityNode',
    position: { x: 0, y: 0 },
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
  }));

  const reactFlowEdges: Edge[] = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.sourceEntityId,
    target: edge.targetEntityId,
    sourceHandle: `field-${edge.sourceFieldName}`,
    targetHandle: 'entity-target',
    type: 'smoothstep',
    animated: false,
    style: { stroke: '#1677ff', strokeWidth: 2 },
    label: edge.relationType === 'MANY_TO_MANY' ? 'M:N' : '1:N',
    labelStyle: { fill: '#1677ff', fontWeight: 600, fontSize: 11 },
    labelBgStyle: { fill: '#e6f4ff' },
    labelBgPadding: [4, 2] as [number, number],
    labelBgBorderRadius: 4,
  }));

  // Dagre auto-layout (left-to-right)
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 80, ranksep: 120, marginx: 40, marginy: 40 });

  reactFlowNodes.forEach((node) => {
    g.setNode(node.id, { width: node.width ?? NODE_WIDTH, height: node.height ?? HEADER_HEIGHT });
  });
  reactFlowEdges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const positionedNodes = reactFlowNodes.map((node) => {
    const dagreNode = g.node(node.id);
    return {
      ...node,
      position: {
        x: dagreNode.x - (node.width ?? NODE_WIDTH) / 2,
        y: dagreNode.y - (node.height ?? HEADER_HEIGHT) / 2,
      },
    };
  });

  return { nodes: positionedNodes, edges: reactFlowEdges };
}
