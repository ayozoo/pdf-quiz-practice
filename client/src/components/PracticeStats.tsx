import { Progress, Statistic, Row, Col } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

interface PracticeStatsProps {
  total: number;
  answered: number;
  correct: number;
  wrong: number;
}

export function PracticeStats({ total, answered, correct, wrong }: PracticeStatsProps) {
  const percent = total > 0 ? Math.round((answered / total) * 100) : 0;
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl mb-6 border border-gray-100 dark:border-gray-800">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 mt-0 uppercase tracking-wider">
        答题统计
      </h3>

      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 dark:text-gray-300">完成进度</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {answered} / {total}
          </span>
        </div>
        <Progress
          percent={percent}
          showInfo={false}
          className="m-0"
          strokeColor={{ '0%': '#818cf8', '100%': '#4f46e5' }}
        />
        <div className="text-right text-xs text-gray-400 mt-1">{percent}%</div>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Statistic
            title={<span className="text-xs text-gray-500">正确</span>}
            value={correct}
            valueStyle={{ color: '#10b981', fontSize: '1.25rem' }}
            prefix={<CheckCircleOutlined className="text-sm mr-1" />}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title={<span className="text-xs text-gray-500">错误</span>}
            value={wrong}
            valueStyle={{ color: '#ef4444', fontSize: '1.25rem' }}
            prefix={<CloseCircleOutlined className="text-sm mr-1" />}
          />
        </Col>
        <Col span={24}>
          <div className="flex items-center justify-between bg-white dark:bg-[#1f1f1f] p-3 rounded-lg border border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">正确率</span>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {accuracy}%
            </span>
          </div>
        </Col>
      </Row>
    </div>
  );
}
