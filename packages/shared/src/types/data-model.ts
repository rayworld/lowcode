/** 关系图中的字段信息 */
export interface EntityFieldGraph {
  id: string;
  name: string;
  displayName: string;
  type: string;
  required: boolean;
  unique: boolean;
  isList: boolean;
  relationTo?: string;
  relationType?: string;
}

/** 关系图中的实体节点 */
export interface EntityNodeData {
  id: string;
  name: string;
  displayName: string;
  tableName: string;
  fields: EntityFieldGraph[];
}

/** 实体关系边 */
export interface EntityRelationEdge {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  sourceFieldName: string;
  relationType: string; // ONE_TO_ONE | ONE_TO_MANY | MANY_TO_MANY
}

/** 节点位置数据 */
export interface EntityLayoutPosition {
  x: number;
  y: number;
}

/** 实体关系图完整数据 */
export interface EntityRelationGraph {
  nodes: EntityNodeData[];
  edges: EntityRelationEdge[];
  layout?: Record<string, EntityLayoutPosition>;
}
