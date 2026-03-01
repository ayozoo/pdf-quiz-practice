import { Modal } from 'antd';
import { ExamListSidebar } from './ExamListSidebar';
import type { ExamSummary } from '../types/exam';

interface ExamSelectModalProps {
  open: boolean;
  onClose: () => void;
  exams: ExamSummary[];
  currentExamId: number | null;
  onSelectExam: (id: number) => void;
  loading: boolean;
}

export function ExamSelectModal({
  open,
  onClose,
  exams,
  currentExamId,
  onSelectExam,
  loading,
}: ExamSelectModalProps) {
  const handleSelect = (id: number) => {
    onSelectExam(id);
    onClose();
  };

  return (
    <Modal
      title="选择试卷"
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      styles={{
        body: { padding: 0, maxHeight: '60vh', overflowY: 'auto' },
        content: { padding: 0 },
      }}
      className="exam-select-modal"
    >
      <div className="bg-white dark:bg-[#121212]">
        <ExamListSidebar
          exams={exams}
          currentExamId={currentExamId}
          onSelectExam={handleSelect}
          loading={loading}
        />
      </div>
    </Modal>
  );
}
