import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
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
import { Spin, Empty, Button, Input, Space, Tag, message } from 'antd';
import { ReloadOutlined, SearchOutlined, DownloadOutlined, ClearOutlined } from '@ant-design/icons';

import EntityNode from './EntityNode';
import { toReactFlowGraph } from './transformGraph';
import { entityService } from '../../services/entity.service';
import { appService } from '../../services/app.service';
import type { EntityRelationGraph } from '@lowcode/shared';
import type { EntityLayoutMap } from '../../types';
import type { EntityNodeData } from './EntityNode';

const nodeTypes = { entityNode: EntityNode } as const;

interface ERDViewProps {
  appId: string;
  onEntityClick?: (entityId: string) => void;
  onFieldCreate?: (entityId: string) => void;
}

export default function ERDView({ appId, onEntityClick, onFieldCreate }: ERDViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<EntityNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [graph, setGraph] = useState<EntityRelationGraph | null>(null);
  const nodesRef = useRef<Node<EntityNodeData>[]>(nodes);
  const edgesRef = useRef<Edge[]>(edges);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

  // Keep refs in sync
  nodesRef.current = nodes;
  edgesRef.current = edges;

  // ── Update edge styles based on hover ──
  useEffect(() => {
    setEdges((eds) =>
      eds.map((edge) => {
        const isHovered = edge.id === hoveredEdge;
        return {
          ...edge,
          style: {
            ...edge.style,
            strokeWidth: isHovered ? 3 : 2,
            opacity: hoveredEdge && !isHovered ? 0.15 : 0.7,
          },
          labelStyle: {
            ...edge.labelStyle,
            fontWeight: isHovered ? 700 : 600,
          },
        };
      }),
    );
  }, [hoveredEdge, setEdges]);

  // ── Field inline edit handler ──
  const handleFieldEdit = useCallback(async (fieldId: string, fieldName: string, newDisplayName: string) => {
    try {
      await entityService.updateField(appId, fieldId, { displayName: newDisplayName });
      message.success(`字段 "${fieldName}" 已更新`);
      await fetchGraph();
    } catch (err: any) {
      message.error('更新失败: ' + (err?.response?.data?.message || err.message));
    }
  }, [appId]);

  // ── Fetch graph data ──
  const fetchGraph = useCallback(async () => {
    setLoading(true);
    try {
      const res = await entityService.getRelationGraph(appId);
      const graphData = res.data as EntityRelationGraph;
      setGraph(graphData);
      if (!graphData.nodes || graphData.nodes.length === 0) {
        setNodes([]);
        setEdges([]);
        return;
      }
      const { nodes: rfNodes, edges: rfEdges } = toReactFlowGraph(
        graphData, onEntityClick, handleFieldEdit, appId, onFieldCreate
      );
      setNodes(rfNodes);
      setEdges(rfEdges);
    } catch (err: any) {
      message.error('加载关系图失败');
    } finally {
      setLoading(false);
    }
  }, [appId, onEntityClick, handleFieldEdit, onFieldCreate, setNodes, setEdges]);

  useEffect(() => { fetchGraph(); }, [fetchGraph]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // ── 保存布局（带失败提示） ──
  const saveLayout = useCallback(async () => {
    const layout: EntityLayoutMap = {};
    nodesRef.current.forEach((node) => {
      layout[node.id] = { x: node.position.x, y: node.position.y };
    });
    try {
      await appService.update(appId, { layout });
    } catch {
      // 布局保存失败不阻断用户操作
      console.warn('ERD layout save failed');
    }
  }, [appId]);

  // ── 节点拖拽结束：防抖保存布局 ──
  const onNodeDragStop = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(saveLayout, 1000);
  }, [saveLayout]);

  // ── 搜索过滤 ──
  const filteredNodes = useMemo(() => {
    if (!searchText.trim()) return nodes;
    const lowerSearch = searchText.toLowerCase();
    return nodes.filter((n) => {
      const data = n.data;
      return (
        data.label?.toLowerCase().includes(lowerSearch) ||
        data.name?.toLowerCase().includes(lowerSearch) ||
        data.fields?.some((f) =>
          f.displayName?.toLowerCase().includes(lowerSearch) ||
          f.name?.toLowerCase().includes(lowerSearch)
        )
      );
    });
  }, [nodes, searchText]);

  const filteredEdges = useMemo(() => {
    if (!searchText.trim()) return edges;
    const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));
    return edges.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));
  }, [edges, filteredNodes]);

  // ── 导出为 JSON ──
  const handleExport = useCallback(() => {
    const dataStr = JSON.stringify({ nodes: nodesRef.current, edges: edgesRef.current }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `erd_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, []);

  // ── 重置布局 ──
  const handleResetLayout = useCallback(async () => {
    try {
      await appService.update(appId, { layout: {} });
      await fetchGraph();
      message.success('布局已重置');
    } catch {
      message.error('重置布局失败');
    }
  }, [appId, fetchGraph]);

  // ── Edge hover ──
  const onEdgeMouseEnter = useCallback((_event: React.MouseEvent, edge: Edge) => {
    setHoveredEdge(edge.id);
  }, []);
  const onEdgeMouseLeave = useCallback(() => {
    setHoveredEdge(null);
  }, []);

  if (loading) {
    return <Spin style={{ display: 'block', margin: '100px auto' }} />;
  }

  if (!graph || graph.nodes.length === 0) {
    return (
      <Empty description="暂无实体关系，请先创建数据实体" style={{ marginTop: 80 }}>
        <Button icon={<ReloadOutlined />} onClick={fetchGraph}>刷新</Button>
      </Empty>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* ── 工具栏 ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索实体或字段..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 260 }}
          />
          {searchText && (
            <>
              <Tag color="blue">{filteredNodes.length} / {nodes.length}</Tag>
              <Button size="small" icon={<ClearOutlined />} onClick={() => setSearchText('')}>清除</Button>
            </>
          )}
        </Space>
        <Space size="small">
          <Button size="small" onClick={handleResetLayout}>重置布局</Button>
          <Button size="small" icon={<DownloadOutlined />} onClick={handleExport}>导出</Button>
          <Button size="small" icon={<ReloadOutlined />} onClick={fetchGraph}>刷新</Button>
        </Space>
      </div>

      {/* ── ReactFlow ── */}
      <div style={{ width: '100%', height: 600, border: '1px solid #f0f0f0', borderRadius: 8 }}>
        <ReactFlow
          nodes={searchText ? filteredNodes : nodes}
          edges={searchText ? filteredEdges : edges}
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
          nodesDraggable={!searchText}
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
    </div>
  );
}
