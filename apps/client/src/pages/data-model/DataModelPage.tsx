import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Button, Typography, Table, Modal, Form, Input,
  message, Space, Popconfirm, Tabs, Row, Col, Tag, Tooltip, Spin, Upload,
} from 'antd';
import {
  PlusOutlined, ArrowLeftOutlined, TableOutlined, ApartmentOutlined,
  ThunderboltOutlined, UploadOutlined, DownloadOutlined, TeamOutlined, ProjectOutlined,
  ShoppingCartOutlined, FileTextOutlined, MessageOutlined, InboxOutlined, OrderedListOutlined,
} from '@ant-design/icons';
import { entityService } from '../../services/entity.service';
import { MODEL_TEMPLATES, ModelTemplate, EntityTemplate } from '../../config/model-templates';
import ERDView from '../../components/erd/ERDView';
import OptionSetManager from '../../components/data/OptionSetManager';
import type { UploadProps } from 'antd';

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  TeamOutlined: <TeamOutlined style={{ fontSize: 32 }} />,
  ProjectOutlined: <ProjectOutlined style={{ fontSize: 32 }} />,
  ShoppingCartOutlined: <ShoppingCartOutlined style={{ fontSize: 32 }} />,
  FileTextOutlined: <FileTextOutlined style={{ fontSize: 32 }} />,
  MessageOutlined: <MessageOutlined style={{ fontSize: 32 }} />,
};

export default function DataModelPage() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('table');
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [modelImportModalOpen, setModelImportModalOpen] = useState(false);
  const [modelImportLoading, setModelImportLoading] = useState(false);
  const [modelExportLoading, setModelExportLoading] = useState(false);
  const [optionSetModalOpen, setOptionSetModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchEntities = async () => {
    if (!appId) return;
    try {
      const res = await entityService.findAll(appId);
      setEntities(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEntities(); }, [appId]);

  const handleCreate = async () => {
    const values = await form.validateFields();
    await entityService.create(appId!, values);
    message.success('数据实体创建成功');
    setModalOpen(false);
    form.resetFields();
    fetchEntities();
  };

  const handleDelete = async (id: string) => {
    try {
      await entityService.remove(appId!, id);
      message.success('已删除');
      fetchEntities();
    } catch {
      // Error already displayed by API interceptor
    }
  };

  const handleClone = async (id: string, name: string) => {
    try {
      const res = await entityService.cloneEntity(appId!, id);
      message.success(`已克隆为 "${res.data?.displayName || '新实体'}"`);
      fetchEntities();
    } catch (err: any) {
      message.error('克隆失败: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleEntityClick = (entityId: string) => {
    navigate(`/apps/${appId}/models/${entityId}`);
  };

  // ========== Template Creation ==========
  const handleCreateFromTemplate = async (template: ModelTemplate) => {
    setCreateLoading(true);
    let created = 0;
    try {
      for (const entity of template.entities) {
        await entityService.create(appId!, {
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
          })),
        });
        created++;
      }
      message.success(`成功创建模板 "${template.name}"，共 ${created} 个实体`);
      setTemplateModalOpen(false);
      fetchEntities();
    } catch (err: any) {
      message.error(`已创建 ${created} 个实体后出错: ${err?.response?.data?.message || err.message}`);
    } finally {
      setCreateLoading(false);
    }
  };

  // ========== Excel Import ==========
  const handleExcelImport: UploadProps['customRequest'] = async (options) => {
    const file = options.file as File;
    setImportLoading(true);
    try {
      // Read file and parse first rows to infer schema
      const text = await file.text();
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length < 2) {
        message.error('CSV 文件至少需要表头行和一行数据');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim());
      const dataRows = lines.slice(1, 6).map((l) => l.split(',').map((c) => c.trim()));

      // Infer entity name from file name
      const entityName = file.name.replace(/\.(csv|xlsx?)$/i, '').replace(/[^a-zA-Z0-9_]/g, '_');
      const fieldName = entityName;

      // Infer field types from sample data
      const fields = headers.map((header, colIdx) => {
        const sampleValues = dataRows.map((r) => r[colIdx] || '').filter(Boolean);
        return {
          name: header.replace(/[^a-zA-Z0-9_]/g, '_'),
          displayName: header,
          type: inferType(sampleValues),
        };
      });

      // Create the entity
      await entityService.create(appId!, {
        name: entityName,
        displayName: fieldName,
        description: `从 ${file.name} 导入`,
        fields,
      });

      message.success(`成功从 "${file.name}" 导入实体 "${fieldName}" (${fields.length} 个字段)`);
      setImportModalOpen(false);
      fetchEntities();
    } catch (err: any) {
      message.error(`导入失败: ${err?.response?.data?.message || err.message}`);
    } finally {
      setImportLoading(false);
      options.onSuccess?.(null);
    }
  };

  // ========== Model Export / Import (JSON) ==========
  const handleExportModel = async () => {
    setModelExportLoading(true);
    try {
      const res = await entityService.exportModel(appId!);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `数据模型_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success(`已导出 ${res.data.entityCount} 个实体`);
    } catch (err: any) {
      message.error('导出失败: ' + (err?.response?.data?.message || err.message));
    } finally {
      setModelExportLoading(false);
    }
  };

  const handleImportModel = async (file: File) => {
    setModelImportLoading(true);
    try {
      const text = await file.text();
      const modelData = JSON.parse(text);
      if (!modelData.entities || !Array.isArray(modelData.entities)) {
        message.error('无效的模型文件：缺少 entities 数组');
        return;
      }
      const res = await entityService.importModel(appId!, modelData, 'skip');
      const result = res.data;
      message.success(`导入完成: 创建 ${result.created}, 跳过 ${result.skipped}, 覆盖 ${result.overwritten}`);
      setModelImportModalOpen(false);
      fetchEntities();
    } catch (err: any) {
      message.error('导入失败: ' + (err?.response?.data?.message || err.message));
    } finally {
      setModelImportLoading(false);
    }
  };

  const columns = [
    {
      title: '实体名称', dataIndex: 'displayName', key: 'displayName',
      render: (v: string, record: any) => {
        // Detect M:N junction tables (name contains underscore and all fields are RELATION)
        const isJunction = record.name?.includes('_') &&
          record.fields?.length >= 2 &&
          record.fields?.every((f: any) => f.type === 'RELATION');
        return (
          <Space>
            <span>{v}</span>
            {isJunction && <Tag color="purple">M:N 中间表</Tag>}
          </Space>
        );
      },
    },
    { title: '标识符', dataIndex: 'name', key: 'name' },
    {
      title: '字段数', dataIndex: 'fields', key: 'fieldsCount',
      render: (fields: any[]) => fields?.length || 0,
    },
    {
      title: '记录数', key: 'recordsCount',
      render: (_: any, record: any) => record._count?.records || 0,
    },
    {
      title: '创建时间', dataIndex: 'createdAt', key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作', key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/apps/${appId}/models/${record.id}`)}>
            编辑字段
          </Button>
          <Button type="link" onClick={() => navigate(`/apps/${appId}/data/${record.id}`)}>
            浏览数据
          </Button>
          <Popconfirm title="克隆此实体（包含所有字段）？" onConfirm={() => handleClone(record.id, record.name)}>
            <Button type="link">克隆</Button>
          </Popconfirm>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
      children: <ERDView appId={appId!} onEntityClick={handleEntityClick} />,
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/apps/${appId}`)} />
          <Typography.Title level={4} style={{ margin: 0 }}>数据模型</Typography.Title>
        </Space>
        <Space>
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
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            创建实体
          </Button>
        </Space>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* Create Entity Modal */}
      <Modal
        title="创建数据实体"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => setModalOpen(false)}
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
            <Input placeholder="如：User, Order" />
          </Form.Item>
          <Form.Item name="displayName" label="显示名称">
            <Input placeholder="如：用户, 订单" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Template Selection Modal */}
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

      {/* Excel Import Modal */}
      <Modal
        title="从 Excel / CSV 导入"
        open={importModalOpen}
        onCancel={() => setImportModalOpen(false)}
        footer={null}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Upload.Dragger
            accept=".csv,.xlsx,.xls"
            showUploadList={false}
            customRequest={handleExcelImport}
            disabled={importLoading}
          >
            {importLoading ? (
              <Spin tip="正在导入..." />
            ) : (
              <>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽文件到此区域</p>
                <p className="ant-upload-hint">
                  支持 .csv, .xlsx, .xls 格式，文件第一行为表头
                  <br />
                  系统将自动分析列名和数据类型并创建实体
                </p>
              </>
            )}
          </Upload.Dragger>
        </div>
        <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 8 }}>
          提示：CSV 文件应使用 UTF-8 编码，第一行为列名。建议先通过 Excel 导出为 CSV 格式再导入。
        </Typography.Text>
      </Modal>

      <OptionSetManager appId={appId!} open={optionSetModalOpen} onClose={() => setOptionSetModalOpen(false)} />

      {/* Model JSON Import Modal */}
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
                <p className="ant-upload-text">点击或拖拽 JSON 文件到此区域</p>
                <p className="ant-upload-hint">
                  上传之前通过"导出模型"功能导出的 JSON 文件
                  <br />
                  支持跳过已有实体、覆盖或自动重命名冲突实体
                </p>
              </>
            )}
          </Upload.Dragger>
        </div>
      </Modal>
    </div>
  );
}

/** Infer field type from sample values */
function inferType(samples: string[]): string {
  if (samples.length === 0) return 'STRING';

  const allNumber = samples.every((s) => !isNaN(Number(s)) && s !== '');
  if (allNumber && samples.some((s) => s.includes('.'))) return 'NUMBER';

  const allEmail = samples.every((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
  if (allEmail) return 'EMAIL';

  const allDate = samples.every((s) => /^\d{4}-\d{2}-\d{2}/.test(s));
  if (allDate) return 'DATE';

  const allBoolean = samples.every((s) => ['true', 'false', '是', '否', '0', '1'].includes(s.toLowerCase()));
  if (allBoolean) return 'BOOLEAN';

  const allUrl = samples.every((s) => s.startsWith('http://') || s.startsWith('https://'));
  if (allUrl) return 'URL';

  const allPhone = samples.every((s) => /^[\d\s\-+]{7,15}$/.test(s));
  if (allPhone) return 'PHONE';

  return 'STRING';
}
