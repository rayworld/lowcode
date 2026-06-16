import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Table, Space, Modal, Form, Input, message, Spin, Popconfirm, Tag } from 'antd';
import { PlusOutlined, ArrowLeftOutlined, EyeOutlined } from '@ant-design/icons';
import { entityService } from '../../services/entity.service';
import dayjs from 'dayjs';

export default function DataBrowserPage() {
  const { appId, entityId } = useParams();
  const navigate = useNavigate();
  const [entity, setEntity] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    if (!entityId) return;
    try {
      const [eRes, rRes] = await Promise.all([
        entityService.findById(entityId),
        entityService.getRecords(entityId, page, 20),
      ]);
      setEntity(eRes.data);
      setRecords(rRes.data?.items || []);
      setTotal(rRes.data?.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [entityId, page]);

  const handleCreate = async () => {
    const values = await form.validateFields();
    await entityService.createRecord(entityId!, values);
    message.success('创建成功');
    setModalOpen(false);
    form.resetFields();
    fetchData();
  };

  const handleEdit = async (id: string) => {
    const values = await form.validateFields();
    await entityService.updateRecord(entityId!, id, values);
    message.success('更新成功');
    setModalOpen(false);
    setRecordId(null);
    form.resetFields();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await entityService.deleteRecord(entityId!, id);
    message.success('已删除');
    fetchData();
  };

  const openEdit = async (id: string) => {
    setRecordId(id);
    const res = await entityService.getRecords(entityId!, 1, 1); // hack
    const record = records.find(r => r.id === id);
    if (record) {
      form.setFieldsValue(record);
    }
    setModalOpen(true);
  };

  if (loading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;

  const fields = entity?.fields || [];
  const columns = fields.slice(0, 6).map((f: any) => ({
    title: f.displayName,
    dataIndex: f.name,
    key: f.name,
    ellipsis: true,
    render: (v: any) => {
      if (v === null || v === undefined) return '-';
      if (f.type === 'BOOLEAN') return v ? '是' : '否';
      if (f.type === 'DATETIME') return dayjs(v).format('YYYY-MM-DD HH:mm');
      if (f.type === 'DATE') return dayjs(v).format('YYYY-MM-DD');
      return String(v);
    },
  }));

  columns.push({
    title: '操作', key: 'action', width: 160,
    render: (_: any, record: any) => (
      <Space>
        <Button type="link" size="small" onClick={() => openEdit(record.id)}>编辑</Button>
        <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
          <Button type="link" size="small" danger>删除</Button>
        </Popconfirm>
      </Space>
    ),
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(`/apps/${appId}/models`)} />
          <Typography.Title level={4} style={{ margin: 0 }}>{entity?.displayName} - 数据浏览</Typography.Title>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setRecordId(null); form.resetFields(); setModalOpen(true); }}>
          新增
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          pagination={{ current: page, total, pageSize: 20, onChange: setPage }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        title={recordId ? '编辑记录' : '新增记录'}
        open={modalOpen}
        onOk={() => recordId ? handleEdit(recordId) : handleCreate()}
        onCancel={() => { setModalOpen(false); setRecordId(null); }}
      >
        <Form form={form} layout="vertical">
          {fields.map((f: any) => (
            <Form.Item
              key={f.id}
              name={f.name}
              label={f.displayName}
              rules={[{ required: f.required, message: `请输入${f.displayName}` }]}
            >
              {f.type === 'TEXT' ? <Input.TextArea rows={3} /> : <Input />}
            </Form.Item>
          ))}
        </Form>
      </Modal>
    </div>
  );
}
