import { ChevronLeft } from 'lucide-react';

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentIndex: number;
  submittedMap: Record<number, boolean>;
  answerStatusMap: Record<number, 'correct' | 'wrong' | 'unsubmitted'>;
  onSelect: (index: number) => void;
  onBackToExamList: () => void;
}

export function QuestionNavigator({
  totalQuestions,
  currentIndex,
  submittedMap,
  answerStatusMap,
  onSelect,
  onBackToExamList,
}: QuestionNavigatorProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden box-border p-4 bg-transparent text-zinc-900 dark:text-zinc-100">
      <div className="mb-6">
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-zinc-600 dark:text-zinc-300 bg-white ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:ring-zinc-700 dark:hover:bg-zinc-700 w-fit group outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          onClick={onBackToExamList}
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          返回试卷列表
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pr-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: totalQuestions }).map((_, idx) => {
            const isSubmitted = submittedMap[idx];
            const isCurrent = idx === currentIndex;
            const status = answerStatusMap[idx] || 'unsubmitted';

            let className =
              'aspect-square w-full rounded-lg text-sm font-medium transition-colors flex items-center justify-center outline-none ';

            if (isCurrent) {
              className +=
                'bg-zinc-900 text-white shadow-sm font-semibold dark:bg-zinc-700 dark:text-zinc-100 dark:ring-1 dark:ring-zinc-600 ';
            } else if (isSubmitted && status === 'correct') {
              className +=
                'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 ';
            } else if (isSubmitted && status === 'wrong') {
              className +=
                'bg-red-100/80 text-red-800 dark:bg-red-500/20 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30 ';
            } else {
              className +=
                'bg-zinc-100/50 text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/80 ';
            }

            return (
              <button
                key={idx}
                className={className}
                onClick={() => onSelect(idx)}
                title={`第 ${idx + 1} 题${isSubmitted ? (status === 'correct' ? ' (正确)' : ' (错误)') : ''}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/50 flex flex-wrap gap-x-4 gap-y-3 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 dark:bg-zinc-500"></div>
          <span>当前</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-200 dark:bg-emerald-500/50"></div>
          <span>正确</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-200 dark:bg-red-500/50"></div>
          <span>错误</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-700"></div>
          <span>未做</span>
        </div>
      </div>
    </div>
  );
}
