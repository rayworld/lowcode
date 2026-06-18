import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  SelectionMode,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Spin, Empty, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

import EntityNode from './EntityNode';
import { toReactFlowGraph } from './transformGraph';
import { entityService } from '../../services/entity.service';
import { appService } from '../../services/app.service';
import { message } from 'antd';

const nodeTypes = { entityNode: EntityNode } as const;

interface ERDViewProps {
  appId: string;
  onEntityClick?: (entityId: string) => void;
}

export default function ERDView({ appId, onEntityClick }: ERDViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const nodesRef = useRef<Node[]>(nodes);
  const edgesRef = useRef<Edge[]>(edges);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

  // Keep refs in sync
  nodesRef.current = nodes;
  edgesRef.current = edges;

  // Update edge styles based on hover state
  useEffect(() => {
    setEdges((eds) =>
      eds.map((edge) => {
        const isHovered = edge.id === hoveredEdge;
        return {
          ...edge,
          style: {
            ...edge.style,
            strokeWidth: isHovered ? 3 : 2,
            opacity: hoveredEdge && !isHovered ? 0.2 : 0.7,
          },
          labelStyle: {
            ...edge.labelStyle,
            fontWeight: isHovered ? 700 : 600,
          },
        };
      }),
    );
  }, [hoveredEdge, setEdges]);

  const handleFieldEdit = useCallback(async (fieldId: string, fieldName: string, newDisplayName: string) => {
    await entityService.updateField(appId, fieldId, { displayName: newDisplayName });
    message.success(`字段 "${fieldName}" 已更新为 "${newDisplayName}"`);
    // Refresh the graph to reflect changes
    await fetchGraph();
  }, [appId]);

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    try {
      const res = await entityService.getRelationGraph(appId);
      const graph = res.data;
      if (!graph.nodes || graph.nodes.length === 0) {
        setNodes([]);
        setEdges([]);
        return;
      }
      const { nodes: rfNodes, edges: rfEdges } = toReactFlowGraph(graph, onEntityClick, handleFieldEdit, appId);
      setNodes(rfNodes);
      setEdges(rfEdges);
    } finally {
      setLoading(false);
    }
  }, [appId, onEntityClick, handleFieldEdit, setNodes, setEdges]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const saveLayout = useCallback(() => {
    const layout: Record<string, { x: number; y: number }> = {};
    nodesRef.current.forEach((node) => {
      layout[node.id] = { x: node.position.x, y: node.position.y };
    });
    appService.update(appId, { layout }).catch(() => {
      // silently fail — layout save is non-critical
    });
  }, [appId]);

  const onNodeDragStop = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(saveLayout, 1000);
  }, [saveLayout]);

  const onEdgeMouseEnter = useCallback((_event: React.MouseEvent, edge: Edge) => {
    setHoveredEdge(edge.id);
  }, []);

  const onEdgeMouseLeave = useCallback(() => {
    setHoveredEdge(null);
  }, []);

  if (loading) {
    return <Spin style={{ display: 'block', margin: '100px auto' }} />;
  }

  if (nodes.length === 0) {
    return (
      <Empty
        description="暂无实体关系，请先创建数据实体"
        style={{ marginTop: 80 }}
      >
        <Button icon={<ReloadOutlined />} onClick={fetchGraph}>
          刷新
        </Button>
      </Empty>
    );
  }

  return (
    <div style={{ width: '100%', height: 600, border: '1px solid #f0f0f0', borderRadius: 8 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onEdgeMouseEnter={onEdgeMouseEnter}
        onEdgeMouseLeave={onEdgeMouseLeave}
        nodeTypes={nodeTypes}
        fitView
        selectionMode={SelectionMode.Partial}
        selectionOnDrag
        panOnDrag={[1, 2]}
        selectNodesOnDrag={false}
        nodesDraggable={true}
        deleteKeyCode={null}
      >
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeWidth={2}
          maskColor="rgba(0,0,0,0.08)"
          style={{ border: '1px solid #f0f0f0', borderRadius: 4 }}
        />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e8e8e8" />
      </ReactFlow>
    </div>
  );
}
