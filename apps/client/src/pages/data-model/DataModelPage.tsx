import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Button, Typography, Table, Modal, Form, Input,
  message, Space, Popconfirm, Tabs, Row, Col, Tag, Tooltip, Spin, Upload, Skeleton, Alert,
} from 'antd';
import {
  PlusOutlined, ArrowLeftOutlined, TableOutlined, ApartmentOutlined,
  ThunderboltOutlined, UploadOutlined, DownloadOutlined,
  TeamOutlined, ProjectOutlined, ShoppingCartOutlined, FileTextOutlined,
  MessageOutlined, InboxOutlined, OrderedListOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';

import { useEntityStore } from '../../stores/entityStore';
import { useEntityList } from '../../hooks';
import { MODEL_TEMPLATES, ModelTemplate } from '../../config/model-templates';
import { inferFieldType, inferEntityName } from '../../utils';
import ERDView from '../../components/erd/ERDView';
import OptionSetManager from '../../components/data/OptionSetManager';
import { entityService } from '../../services/entity.service';
import { useKeyboard } from '../../hooks';
import type { Entity, CreateEntityRequest, CreateFieldRequest } from '../../types';

// ── 模板图标映射 ──
const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  TeamOutlined: <TeamOutlined style={{ fontSize: 32 }} />,
  ProjectOutlined: <ProjectOutlined style={{ fontSize: 32 }} />,
  ShoppingCartOutlined: <ShoppingCartOutlined style={{ fontSize: 32 }} />,
  FileTextOutlined: <FileTextOutlined style={{ fontSize: 32 }} />,
  MessageOutlined: <MessageOutlined style={{ fontSize: 32 }} />,
};

/** 检测是否为 M:N 中间表 */
function isJunctionTable(entity: Entity): boolean {
  return !!(
    entity.name?.includes('_') &&
    entity.fields?.length >= 2 &&
    entity.fields?.every((f) => f.type === 'RELATION')
  );
}

export default function DataModelPage() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();

  // ── Store + Hooks ──
  const { entities, loading, error, refresh } = useEntityList(appId);
  const store = useEntityStore();

  // ── UI State ──
  const [activeTab, setActiveTab] = useState('table');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateCreating, setTemplateCreating] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [modelImportModalOpen, setModelImportModalOpen] = useState(false);
  const [modelImportLoading, setModelImportLoading] = useState(false);
  const [modelExportLoading, setModelExportLoading] = useState(false);
  const [optionSetModalOpen, setOptionSetModalOpen] = useState(false);
  const [form] = Form.useForm();

  // ── 键盘快捷键 ──
  useKeyboard([
    { key: 'n', ctrl: true, handler: () => setCreateModalOpen(true) },
    { key: 'e', ctrl: true, handler: () => setActiveTab('erd') },
    { key: 'l', ctrl: true, handler: () => setActiveTab('table') },
  ]);

  // ── 创建实体 ──
  const handleCreate = useCallback(async () => {
    if (!appId) return;
    const values = await form.validateFields() as CreateEntityRequest;
    setCreateLoading(true);
    try {
      await store.createEntity(appId, values);
      message.success('数据实体创建成功');
      setCreateModalOpen(false);
      form.resetFields();
    } catch (err: any) {
      message.error('创建失败: ' + (err?.response?.data?.message || err.message));
    } finally {
      setCreateLoading(false);
    }
  }, [appId, form, store]);

  // ── 删除实体 ──
  const handleDelete = useCallback(async (id: string) => {
    if (!appId) return;
    try {
      await store.deleteEntity(appId, id);
      message.success('已删除');
    } catch (err: any) {
      message.error('删除失败: ' + (err?.response?.data?.message || err.message));
    }
  }, [appId, store]);

  // ── 克隆实体 ──
  const handleClone = useCallback(async (id: string) => {
    if (!appId) return;
    try {
      await store.cloneEntity(appId, id);
      message.success('实体已克隆');
    } catch (err: any) {
      message.error('克隆失败: ' + (err?.response?.data?.message || err.message));
    }
  }, [appId, store]);

  // ── 从模板创建 ──
  const handleCreateFromTemplate = useCallback(async (template: ModelTemplate) => {
    if (!appId) return;
    setTemplateCreating(true);
    let created = 0;
    try {
      for (const entity of template.entities) {
        const req: CreateEntityRequest = {
          name: entity.name,
          displayName: entity.displayName,
          description: entity.description,
          fields: entity.fields.map((f) => ({
            name: f.name,
            displayName: f.displayName,
            type: f.type,
            required: f.required || false,
            unique: f.unique || false,
            defaultValue: f.defaultValue,
            options: f.options,
            relationTo: f.relationTo,
            relationType: f.relationType,
          } as CreateFieldRequest)),
        };
        await entityService.create(appId, req);
        created++;
      }
      message.success(`成功创建模板 "${template.name}"，共 ${created} 个实体`);
      setTemplateModalOpen(false);
      refresh();
    } catch (err: any) {
      message.error(`已创建 ${created} 个实体后出错: ${err?.response?.data?.message || err.message}`);
    } finally {
      setTemplateCreating(false);
    }
  }, [appId, refresh]);

  // ── CSV 导入 ──
  const handleCsvImport: UploadProps['customRequest'] = useCallback(async (options: any) => {
    if (!appId) return;
    const file = options.file as File;
    setImportLoading(true);
    try {
      const text = await file.text();
      const Papa = await import('papaparse');
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
      });

      if (parsed.errors.length > 0) {
        console.warn('CSV parsing warnings:', parsed.errors);
      }

      const headers = parsed.meta.fields || [];
      const dataRows = parsed.data as Record<string, string>[];
      if (headers.length < 1) {
        message.error('CSV 文件未找到有效列名');
        return;
      }

      const entityName = inferEntityName(file.name);

      const fields: CreateFieldRequest[] = headers.map((header) => {
        const sampleValues = dataRows
          .slice(0, 10)
          .map((row) => row[header] || '')
          .filter(Boolean);
        return {
          name: header.replace(/[^a-zA-Z0-9_]/g, '_'),
          displayName: header,
          type: inferFieldType(sampleValues),
        };
      });

      await store.createEntity(appId, {
        name: entityName,
        displayName: entityName,
        description: `从 ${file.name} 导入`,
        fields,
      });

      message.success(`成功从 "${file.name}" 导入实体 (${fields.length} 个字段)`);
      setImportModalOpen(false);
      refresh();
    } catch (err: any) {
      message.error('导入失败: ' + (err?.response?.data?.message || err.message));
    } finally {
      setImportLoading(false);
      options.onSuccess?.(null);
    }
  }, [appId, store, refresh]);

  // ── JSON 模型导出 ──
  const handleExportModel = useCallback(async () => {
    if (!appId) return;
    setModelExportLoading(true);
    try {
      const { entityService } = await import('../../services/entity.service');
      const res = await entityService.exportModel(appId);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `数据模型_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('模型导出成功');
    } catch (err: any) {
      message.error('导出失败: ' + (err?.response?.data?.message || err.message));
    } finally {
      setModelExportLoading(false);
    }
  }, [appId]);

  // ── JSON 模型导入 ──
  const handleImportModel = useCallback(async (file: File) => {
    if (!appId) return;
    setModelImportLoading(true);
    try {
      const text = await file.text();
      const modelData = JSON.parse(text);
      if (!modelData.entities || !Array.isArray(modelData.entities)) {
        message.error('无效的模型文件：缺少 entities 数组');
        return;
      }
      const { entityService } = await import('../../services/entity.service');
      const res = await entityService.importModel(appId, modelData, 'skip');
      const result = res.data;
      message.success(`导入完成: 创建 ${result.created}, 跳过 ${result.skipped}, 覆盖 ${result.overwritten}`);
      setModelImportModalOpen(false);
      refresh();
    } catch (err: any) {
      message.error('导入失败: ' + (err?.response?.data?.message || err.message));
    } finally {
      setModelImportLoading(false);
    }
  }, [appId, refresh]);

  // ── 表格列定义 ──
  const columns = [
    {
      title: '实体名称',
      dataIndex: 'displayName',
      key: 'displayName',
      render: (v: string, record: Entity) => (
        <Space>
          <span>{v}</span>
          {isJunctionTable(record) && <Tag color="purple">M:N 中间表</Tag>}
        </Space>
      ),
    },
    { title: '标识符', dataIndex: 'name', key: 'name' },
    {
      title: '字段数',
      dataIndex: 'fields',
      key: 'fieldsCount',
      render: (fields: Entity['fields']) => fields?.length || 0,
    },
    {
      title: '记录数',
      key: 'recordsCount',
      render: (_: unknown, record: Entity) => record._count?.records || 0,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Entity) => (
        <Space size="small">
          <Button type="link" size="small"
            onClick={() => navigate(`/apps/${appId}/models/${record.id}`)}>
            编辑字段
          </Button>
          <Button type="link" size="small"
            onClick={() => navigate(`/apps/${appId}/data/${record.id}`)}>
            浏览数据
          </Button>
          <Popconfirm title="克隆此实体？" onConfirm={() => handleClone(record.id)}>
            <Button type="link" size="small">克隆</Button>
          </Popconfirm>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ── Tab 定义 ──
  const tabItems = [
    {
      key: 'table',
      label: <span><TableOutlined /> 列表视图</span>,
      children: (
        <Card>
          <Table
            columns={columns}
            dataSource={entities}
            rowKey="id"
            loading={loading}
            locale={{ emptyText: '还没有数据实体，创建一个吧' }}
          />
        </Card>
      ),
    },
    {
      key: 'erd',
      label: <span><ApartmentOutlined /> 关系图</span>,
      children: (
        <ERDView
          appId={appId!}
          onEntityClick={(id) => navigate(`/apps/${appId}/models/${id}`)}
          onFieldCreate={(id) => navigate(`/apps/${appId}/models/${id}`)}
        />
      ),
    },
  ];

  if (loading && entities.length === 0) {
    return (
      <div className="page-container">
        <div className="page-header">
          <Space>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/apps/${appId}`)} />
            <Typography.Title level={4} style={{ margin: 0 }}>数据模型</Typography.Title>
          </Space>
        </div>
        <Card>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/apps/${appId}`)} />
          <Typography.Title level={4} style={{ margin: 0 }}>数据模型</Typography.Title>
          {entities.length > 0 && <Tag>{entities.length} 个实体</Tag>}
        </Space>
        <Space wrap>
          <Button icon={<OrderedListOutlined />} onClick={() => setOptionSetModalOpen(true)}>
            选项集
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExportModel} loading={modelExportLoading}>
            导出模型
          </Button>
          <Button icon={<UploadOutlined />} onClick={() => setModelImportModalOpen(true)}>
            导入模型
          </Button>
          <Button icon={<UploadOutlined />} onClick={() => setImportModalOpen(true)}>
            从 Excel 导入
          </Button>
          <Button icon={<ThunderboltOutlined />} onClick={() => setTemplateModalOpen(true)}>
            从模板创建
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
            创建实体
          </Button>
        </Space>
      </div>

      {error && (
        <Alert type="error" message="加载失败" description={error} showIcon closable
          action={<Button size="small" onClick={refresh}>重试</Button>}
          style={{ marginBottom: 16 }} />
      )}

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* ── 创建实体 Modal ── */}
      <Modal
        title="创建数据实体"
        open={createModalOpen}
        onOk={handleCreate}
        onCancel={() => { setCreateModalOpen(false); form.resetFields(); }}
        confirmLoading={createLoading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="实体标识"
            rules={[
              { required: true, message: '请输入实体标识' },
              { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '只能包含字母、数字和下划线，以字母开头' },
            ]}
          >
            <Input placeholder="如：User, Order" autoFocus />
          </Form.Item>
          <Form.Item name="displayName" label="显示名称">
            <Input placeholder="如：用户, 订单" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── 模板选择 Modal ── */}
      <Modal
        title="从模板创建数据模型"
        open={templateModalOpen}
        onCancel={() => setTemplateModalOpen(false)}
        footer={null}
        width={700}
      >
        <Row gutter={[16, 16]}>
          {MODEL_TEMPLATES.map((tmpl) => (
            <Col key={tmpl.id} xs={24} sm={12}>
              <Card
                hoverable
                onClick={() => handleCreateFromTemplate(tmpl)}
                styles={{ body: { padding: 20 } }}
              >
                <Space align="start" size={16}>
                  <div style={{ color: tmpl.color }}>
                    {TEMPLATE_ICONS[tmpl.icon] || <ThunderboltOutlined style={{ fontSize: 32 }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Typography.Text strong style={{ fontSize: 16 }}>{tmpl.name}</Typography.Text>
                    <br />
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>{tmpl.description}</Typography.Text>
                    <div style={{ marginTop: 8 }}>
                      {tmpl.entities.map((e) => (
                        <Tag key={e.name} color={tmpl.color} style={{ marginBottom: 4 }}>
                          {e.displayName}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Modal>

      {/* ── Excel 导入 Modal ── */}
      <Modal
        title="从 Excel / CSV 导入"
        open={importModalOpen}
        onCancel={() => setImportModalOpen(false)}
        footer={null}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Upload.Dragger
            accept=".csv"
            showUploadList={false}
            customRequest={handleCsvImport}
            disabled={importLoading}
          >
            {importLoading ? (
              <Spin tip="正在导入..." />
            ) : (
              <>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽 CSV 文件到此区域</p>
                <p className="ant-upload-hint">
                  文件第一行为表头，系统将自动分析列名和数据类型
                </p>
              </>
            )}
          </Upload.Dragger>
        </div>
      </Modal>

      {/* ── 选项集管理 ── */}
      <OptionSetManager appId={appId!} open={optionSetModalOpen} onClose={() => setOptionSetModalOpen(false)} />

      {/* ── JSON 导入 Modal ── */}
      <Modal
        title="导入数据模型 (JSON)"
        open={modelImportModalOpen}
        onCancel={() => setModelImportModalOpen(false)}
        footer={null}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Upload.Dragger
            accept=".json"
            showUploadList={false}
            customRequest={async (options) => {
              await handleImportModel(options.file as File);
              options.onSuccess?.(null);
            }}
            disabled={modelImportLoading}
          >
            {modelImportLoading ? (
              <Spin tip="正在导入..." />
            ) : (
              <>
                <p className="ant-upload-drag-icon">
                  <DownloadOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽 JSON 文件</p>
                <p className="ant-upload-hint">
                  上传之前通过"导出模型"导出的 JSON 文件
                </p>
              </>
            )}
          </Upload.Dragger>
        </div>
      </Modal>
    </div>
  );
}
