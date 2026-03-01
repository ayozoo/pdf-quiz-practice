import type { ExamSummary } from '../types/exam';
import { FileText } from 'lucide-react';

interface ExamListSidebarProps {
  exams: ExamSummary[];
  currentExamId: number | null;
  onSelectExam: (id: number) => void;
  loading: boolean;
}

export function ExamListSidebar({
  exams,
  currentExamId,
  onSelectExam,
  loading,
}: ExamListSidebarProps) {
  const getProgress = (examId: number, totalQuestions: number) => {
    try {
      const saved = localStorage.getItem(`exam_progress_${examId}`);
      if (!saved) return null;
      const data = JSON.parse(saved);
      // Count questions that are either submitted OR have selected options
      const submittedIds = Object.keys(data.submittedMap || {});
      const selectedIds = Object.keys(data.selectedOptions || {}).filter((k) => {
        const val = data.selectedOptions[k];
        return Array.isArray(val) && val.length > 0;
      });

      // Use Set to get unique count
      const uniqueDone = new Set([...submittedIds, ...selectedIds]);
      const doneCount = uniqueDone.size;

      return {
        count: doneCount,
        percent: Math.round((doneCount / totalQuestions) * 100),
      };
    } catch {
      return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50/50 dark:bg-[#141414] border-r border-zinc-200 dark:border-[#303030]">
      <div className="px-6 py-5 pb-2">
        <h3 className="m-0 text-sm font-semibold text-zinc-500 tracking-wider uppercase">
          试卷列表
        </h3>
      </div>

      {loading && exams.length === 0 ? (
        <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-sm">加载中...</div>
      ) : exams.length === 0 ? (
        <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-sm">
          暂无试卷，请先上传
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto m-0 p-3 list-none flex flex-col gap-1">
          {exams.map((exam) => {
            const progress = getProgress(exam.id, exam.questionCount);
            const isActive = exam.id === currentExamId;
            const itemClasses = `flex items-center px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-left hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 ${
              isActive
                ? 'bg-zinc-200/80 dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100 font-medium ring-1 ring-zinc-300/50 dark:ring-zinc-700/50'
                : 'text-zinc-600 dark:text-zinc-400'
            }`;

            return (
              <li key={exam.id} className={itemClasses} onClick={() => onSelectExam(exam.id)}>
                <div className="mr-3 flex-shrink-0 flex items-center justify-center">
                  <FileText size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm mb-1" title={exam.title}>
                    {exam.title}
                  </div>
                  <div className="flex items-center text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{exam.questionCount} 题</span>
                    {progress && progress.count > 0 && (
                      <span className="ml-2 text-blue-500 dark:text-blue-400">
                        (已做 {progress.count})
                      </span>
                    )}
                  </div>
                  {progress && progress.count > 0 && (
                    <div className="mt-2 w-full h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-300 ease-in-out"
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
