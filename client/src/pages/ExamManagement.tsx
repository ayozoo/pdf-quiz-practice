import { useState, useEffect } from 'react';
import type { ExamSummary, PdfTemplateConfig } from '../types/exam';
import { Trash2, FolderOpen, Inbox } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import {
  Card,
  Upload,
  Button,
  Select,
  Table,
  Typography,
  Popconfirm,
  Tag,
  Tooltip,
  ConfigProvider,
} from 'antd';
import type { UploadProps } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import type { ColumnsType } from 'antd/es/table';

const { Dragger } = Upload;
const { Text } = Typography;

interface ExamManagementProps {
  examList: ExamSummary[];
  onUpload: (file: File, templateId?: number) => Promise<void>;
  onDeleteOne: (id: number) => Promise<void>;
  onDeleteAll: () => Promise<void>;
  loading: boolean;
  error: string | null;
  baseUrl: string;
}

export function ExamManagement({
  examList,
  onUpload,
  onDeleteOne,
  onDeleteAll,
  loading,
  baseUrl,
}: ExamManagementProps) {
  const [file, setFile] = useState<File | null>(null);
  const [templates, setTemplates] = useState<PdfTemplateConfig[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | undefined>(undefined);

  useEffect(() => {
    void fetch(`${baseUrl}/templates`)
      .then((res) => res.json())
      .then((data: PdfTemplateConfig[]) => {
        setTemplates(data);
        const builtin = data.find((t) => t.isBuiltin);
        if (builtin) setSelectedTemplateId(builtin.id);
      })
      .catch(() => {});
  }, [baseUrl]);

  const handleUploadClick = async () => {
    if (file) {
      await onUpload(file, selectedTemplateId);
      setFile(null);
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    maxCount: 1,
    beforeUpload: (f) => {
      setFile(f);
      return false;
    },
    onRemove: () => {
      setFile(null);
    },
    fileList: file ? [file as unknown as UploadFile] : [],
  };

  const columns: ColumnsType<ExamSummary> = [
    {
      title: '试卷名称',
      dataIndex: 'title',
      key: 'title',
      render: (text) => (
        <div className="flex items-center gap-3 py-1">
          <Text
            className="font-medium text-gray-800 dark:text-gray-200"
            ellipsis={{ tooltip: text }}
            style={{ maxWidth: 300 }}
          >
            {text}
          </Text>
        </div>
      ),
    },
    {
      title: '题目数量',
      dataIndex: 'questionCount',
      key: 'questionCount',
      width: 120,
      render: (count) => (
        <Tag className="rounded-full px-3 py-0.5 border-0 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 m-0 font-medium tracking-wide">
          {count} 题
        </Tag>
      ),
    },
    {
      title: '上传时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date) => (
        <span className="text-gray-500 dark:text-gray-400 text-sm">
          {new Date(date).toLocaleString(undefined, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Popconfirm
          title="确认删除吗？"
          description="该试卷将被永久删除。"
          onConfirm={() => onDeleteOne(record.id)}
          okText="删除"
          cancelText="取消"
          okButtonProps={{ danger: true }}
          placement="left"
        >
          <Tooltip title="删除试卷">
            <Button
              type="text"
              danger
              icon={<Trash2 size={16} />}
              disabled={loading}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            />
          </Tooltip>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in pb-16">
      <PageHeader icon={FolderOpen} title="题库管理" subtitle="上传 PDF 题库，或管理已有的试卷。" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upload Section */}
        <div className="lg:col-span-4 space-y-6">
          <Card
            title={<span className="font-semibold text-lg">上传新题库</span>}
            className="shadow-sm sticky top-6 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
            styles={{
              body: { padding: '24px' },
              header: { padding: '20px 24px', borderBottom: '1px solid rgba(229, 231, 235, 0.5)' },
            }}
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  解析模版
                </label>
                <Select
                  className="w-full"
                  size="large"
                  placeholder="选择解析模版"
                  value={selectedTemplateId}
                  onChange={setSelectedTemplateId}
                  options={[
                    { value: null, label: '默认模版' },
                    ...templates.map((t) => ({
                      value: t.id,
                      label: t.name + (t.isBuiltin ? ' (内置)' : ''),
                    })),
                  ]}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  PDF 文件
                </label>
                <Dragger
                  {...uploadProps}
                  className="bg-gray-50/50 dark:bg-gray-800/20 hover:border-indigo-500 transition-all rounded-xl"
                >
                  <p className="ant-upload-drag-icon text-indigo-500 flex justify-center mb-3">
                    <Inbox size={42} strokeWidth={1.5} />
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    点击或拖拽 PDF 文件到此处
                  </p>
                  <p className="text-xs text-gray-400 mt-2">仅支持 .pdf 格式文件</p>
                </Dragger>
              </div>

              <Button
                type="primary"
                size="large"
                onClick={handleUploadClick}
                disabled={!file}
                loading={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 border-none shadow-sm rounded-xl font-medium transition-all h-11 mt-2"
              >
                {loading ? '处理中...' : '上传并解析'}
              </Button>
            </div>
          </Card>
        </div>

        {/* List Section */}
        <div className="lg:col-span-8">
          <Card
            title={
              <div className="flex items-center gap-3">
                <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                  已上传的试卷
                </span>
                <Tag className="m-0 rounded-full border-0 px-2.5 py-0.5 bg-gray-100/80 text-gray-600 dark:bg-gray-800 dark:text-gray-300 shadow-sm">
                  {examList.length}
                </Tag>
              </div>
            }
            extra={
              examList.length > 0 && (
                <Popconfirm
                  title="清空全部试卷"
                  description="此操作将永久删除所有试卷，不可恢复，确定要继续吗？"
                  onConfirm={onDeleteAll}
                  okText="确认清空"
                  cancelText="取消"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    danger
                    type="text"
                    icon={<Trash2 size={16} />}
                    disabled={loading}
                    className="px-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-1.5"
                  >
                    清空全部
                  </Button>
                </Popconfirm>
              )
            }
            className="shadow-sm overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 h-full"
            styles={{
              body: { padding: 0 },
              header: { padding: '20px 24px', borderBottom: '1px solid rgba(229, 231, 235, 0.5)' },
            }}
          >
            <ConfigProvider
              theme={{
                components: {
                  Table: {
                    headerBg: 'transparent',
                    headerSplitColor: 'transparent',
                    headerColor: '#6B7280',
                    rowHoverBg: 'rgba(249, 250, 251, 0.5)',
                    cellPaddingBlock: 16,
                  },
                },
              }}
            >
              <Table
                columns={columns}
                dataSource={examList}
                rowKey="id"
                pagination={{ pageSize: 15, hideOnSinglePage: true }}
                locale={{
                  emptyText: (
                    <div className="py-24 text-gray-400 flex flex-col items-center justify-center gap-3">
                      <Inbox
                        size={48}
                        strokeWidth={1}
                        className="text-gray-300 dark:text-gray-600"
                      />
                      <span className="text-sm">暂无试卷，请先在左侧上传</span>
                    </div>
                  ),
                }}
                className="exam-management-table"
                scroll={{ x: '100%' }}
              />
            </ConfigProvider>
          </Card>
        </div>
      </div>
    </div>
  );
}
