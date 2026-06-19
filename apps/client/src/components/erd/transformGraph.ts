import { Node, Edge } from '@xyflow/react';
import dagre from 'dagre';
import type { EntityRelationGraph, EntityRelationEdge } from '@lowcode/shared';
import type { EntityNodeData } from './EntityNode';

const NODE_WIDTH = 240;
const HEADER_HEIGHT = 60;
const FIELD_HEIGHT = 33;

/** 调色板 */
const GROUP_COLORS = [
  { bg: '#1677ff', border: '#1677ff' },
  { bg: '#722ed1', border: '#722ed1' },
  { bg: '#fa8c16', border: '#fa8c16' },
  { bg: '#52c41a', border: '#52c41a' },
  { bg: '#eb2f96', border: '#eb2f96' },
  { bg: '#13c2c2', border: '#13c2c2' },
  { bg: '#f5222d', border: '#f5222d' },
  { bg: '#fa541c', border: '#fa541c' },
];

/** 估算节点高度 */
function estimateNodeHeight(relationCount: number, normalCount: number, expanded: boolean): number {
  const relationSection = relationCount > 0 ? relationCount * FIELD_HEIGHT + 4 : 0;
  if (!expanded) {
    const summaryRow = normalCount > 0 ? 33 : 0;
    return HEADER_HEIGHT + relationSection + summaryRow + 8;
  }
  return HEADER_HEIGHT + relationSection + normalCount * FIELD_HEIGHT + 60;
}

/** 关联类型标签 */
function relationLabel(type: string): string {
  if (type === 'ONE_TO_ONE') return '1:1';
  if (type === 'MANY_TO_MANY') return 'M:N';
  return '1:N';
}

/** 基于实体名称的确定性颜色 */
function getEntityColor(entityName: string): { bg: string; border: string } {
  let hash = 0;
  for (let i = 0; i < entityName.length; i++) {
    hash = entityName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GROUP_COLORS[Math.abs(hash) % GROUP_COLORS.length];
}

/**
 * 将服务端 EntityRelationGraph 转换为 ReactFlow nodes/edges
 */
export function toReactFlowGraph(
  graph: EntityRelationGraph,
  onEntityClick?: (entityId: string) => void,
  onFieldEdit?: (fieldId: string, fieldName: string, newDisplayName: string) => Promise<void>,
  appId?: string,
  onFieldCreate?: (entityId: string) => void,
): { nodes: Node<EntityNodeData>[]; edges: Edge[] } {
  const savedLayout = graph.layout ?? {};

  // ── 构建节点 ──
  const reactFlowNodes: Node<EntityNodeData>[] = graph.nodes.map((entity) => {
    const saved = savedLayout[entity.id];
    const color = getEntityColor(entity.name);
    const relationCount = entity.fields.filter((f) => f.relationTo).length;
    const normalCount = entity.fields.length - relationCount;

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
        onFieldCreate,
      } as EntityNodeData,
      width: NODE_WIDTH,
      height: estimateNodeHeight(relationCount, normalCount, false),
    };
  });

  // ── 去重边：每对实体只保留一条边 ──
  const seenPairs = new Set<string>();
  const dedupEdges = graph.edges.filter((edge) => {
    const pair =
      edge.sourceEntityId < edge.targetEntityId
        ? `${edge.sourceEntityId}|${edge.targetEntityId}`
        : `${edge.targetEntityId}|${edge.sourceEntityId}`;
    if (seenPairs.has(pair)) return false;
    seenPairs.add(pair);
    return true;
  });

  // ── 构建边 ──
  const reactFlowEdges: Edge[] = dedupEdges.map((edge) => {
    const color = getEntityColor(edge.sourceEntityId);
    const sourceEntity = graph.nodes.find((n) => n.id === edge.sourceEntityId);
    const targetEntity = graph.nodes.find((n) => n.id === edge.targetEntityId);
    const targetRelationField = targetEntity?.fields.find(
      (f) => f.relationTo === sourceEntity?.name
    );

    return {
      id: edge.id,
      source: edge.sourceEntityId,
      target: edge.targetEntityId,
      sourceHandle: `field-${edge.sourceFieldName}`,
      targetHandle: targetRelationField ? `field-${targetRelationField.name}` : 'entity-target',
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

  // ── Dagre 自动布局（仅对没有保存位置的节点） ──
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
