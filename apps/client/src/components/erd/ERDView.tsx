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
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep ref in sync
  nodesRef.current = nodes;

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
      const { nodes: rfNodes, edges: rfEdges } = toReactFlowGraph(graph, onEntityClick);
      setNodes(rfNodes);
      setEdges(rfEdges);
    } finally {
      setLoading(false);
    }
  }, [appId, onEntityClick, setNodes, setEdges]);

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
          nodeStrokeColor="#1677ff"
          nodeColor="#e6f4ff"
          maskColor="rgba(0,0,0,0.08)"
          style={{ border: '1px solid #f0f0f0', borderRadius: 4 }}
        />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e8e8e8" />
      </ReactFlow>
    </div>
  );
}
