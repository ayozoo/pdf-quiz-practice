import { useState, useEffect } from 'react';
import type { ParsedQuestion, AnswerOptionLabel } from '../types/exam';
import { User, ThumbsUp, Sparkles, Copy, Check } from 'lucide-react';

interface QuestionCardProps {
  question: ParsedQuestion;
  currentIndex: number;
  totalQuestions: number;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  selectedOptions: AnswerOptionLabel[];
  isSubmitted: boolean;
  onToggleOption: (label: AnswerOptionLabel) => void;
}

export function QuestionCard({
  question,
  currentIndex,
  totalQuestions,
  onPrev,
  onNext,
  onSubmit,
  selectedOptions,
  isSubmitted,
  onToggleOption,
}: QuestionCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {}, [isSubmitted]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isSubmitted) {
        setShowAnswer(true);
      } else {
        setShowAnswer(false);
        setShowDiscussion(false);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [question, isSubmitted]);

  const handleToggleAnswer = () => setShowAnswer((prev) => !prev);
  const handleToggleDiscussion = () => setShowDiscussion((prev) => !prev);

  const handleCopyQuestion = () => {
    if (!question) return;

    const optionsText = (question.options || [])
      .map((opt) => `${opt.label}. ${opt.text}`)
      .join('\n');

    const correctText = (question.correctAnswers || []).join(', ');

    const textToCopy = `Question #${question.number ?? currentIndex + 1}\n${question.text}\n\n${optionsText}\n\nCorrect Answer: ${correctText}${question.explanation ? `\nExplanation:\n${question.explanation}` : ''}`;

    if (!navigator.clipboard || !window.isSecureContext) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          return;
        }
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
    }

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
      });
  };

  if (!question) {
    return (
      <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 bg-white dark:bg-[#141414] rounded-xl shadow-sm border border-zinc-200 dark:border-[#303030]">
        题目数据丢失
      </div>
    );
  }

  const options = question.options || [];
  const correctAnswers = question.correctAnswers || [];

  return (
    <div className="bg-white dark:bg-[#141414] rounded-2xl shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 p-6 md:p-8 flex flex-col gap-6 md:gap-8 w-full mx-auto transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-100 flex items-baseline gap-2">
          Question {question.number ?? currentIndex + 1}
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-300 whitespace-nowrap bg-zinc-50 dark:bg-zinc-800/80 px-2.5 py-1 rounded-md">
            {currentIndex + 1} / {totalQuestions}
          </span>
          <button
            onClick={handleCopyQuestion}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 bg-transparent ${
              copied
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800'
            }`}
            title="复制题目和答案"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <div className="text-lg text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap font-medium">
          {question.text}
        </div>

        <ul className="flex flex-col gap-3">
          {options.map((opt) => {
            const isSelected = selectedOptions.includes(opt.label);
            const isCorrect = correctAnswers.includes(opt.label);

            let itemClass =
              'group flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#141414] ';

            if (showAnswer) {
              if (isCorrect) {
                itemClass +=
                  'bg-emerald-50/80 dark:bg-emerald-500/10 ring-1 ring-emerald-500/50 text-emerald-900 dark:text-zinc-200';
              } else if (isSelected) {
                itemClass +=
                  'bg-red-50/80 dark:bg-red-500/10 ring-1 ring-red-500/50 text-red-900 dark:text-zinc-200';
              } else {
                itemClass +=
                  'ring-1 ring-zinc-200 dark:ring-zinc-800 bg-transparent text-zinc-500 dark:text-zinc-400';
              }
            } else {
              if (isSelected) {
                itemClass +=
                  'bg-blue-50/80 dark:bg-blue-500/10 ring-1 ring-blue-500/50 text-blue-900 dark:text-zinc-200';
              } else {
                itemClass +=
                  'ring-1 ring-zinc-200 dark:ring-zinc-800 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300';
              }
            }

            return (
              <li
                key={opt.label}
                className={itemClass}
                onClick={() => !isSubmitted && onToggleOption(opt.label)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (!isSubmitted && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onToggleOption(opt.label);
                  }
                }}
              >
                <div
                  className={`flex-shrink-0 mt-0.5 font-medium text-sm w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
                    showAnswer
                      ? isCorrect
                        ? 'bg-emerald-200/50 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400'
                        : isSelected
                          ? 'bg-red-200/50 text-red-800 dark:bg-red-500/20 dark:text-red-400'
                          : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-400'
                      : isSelected
                        ? 'bg-blue-200/50 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-400 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700'
                  }`}
                >
                  {opt.label}
                </div>
                <span className="text-base pt-0.5 leading-relaxed">{opt.text}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-6 pt-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onPrev}
            disabled={currentIndex === 0}
            className="py-2 px-4 rounded-lg font-medium text-sm transition-colors text-zinc-700 bg-white ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:ring-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-zinc-800"
          >
            上一题
          </button>
          <button
            onClick={onNext}
            disabled={currentIndex === totalQuestions - 1}
            className="py-2 px-4 rounded-lg font-medium text-sm transition-colors text-zinc-700 bg-white ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:ring-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-zinc-800"
          >
            下一题
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleToggleAnswer}
            className="py-2 px-4 rounded-lg font-medium text-sm transition-colors bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {showAnswer ? '隐藏答案' : '显示答案'}
          </button>
          {question.discussion && (
            <button
              onClick={handleToggleDiscussion}
              className="py-2 px-4 rounded-lg font-medium text-sm transition-colors bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              {showDiscussion ? '收起解析' : '展开解析'}
            </button>
          )}
          {!isSubmitted && (
            <button
              onClick={onSubmit}
              className="py-2 px-6 rounded-lg font-medium text-sm transition-all bg-zinc-900 text-zinc-100 hover:bg-zinc-800 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 shadow-sm ring-1 ring-zinc-900 dark:ring-zinc-700"
            >
              提交本题
            </button>
          )}
        </div>
      </div>

      {showAnswer && question.explanation && (
        <div className="mt-2 p-6 rounded-2xl bg-amber-50/50 dark:bg-amber-500/5 ring-1 ring-amber-500/20">
          <div className="text-sm font-semibold text-amber-800 dark:text-amber-500 mb-3 flex items-center gap-2">
            <Sparkles size={16} />
            解析
          </div>
          <div className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
            {question.explanation}
          </div>
        </div>
      )}

      {showDiscussion && (
        <div className="mt-4 flex flex-col gap-5">
          <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2 pb-2">
            社区讨论 / 详细解析
          </div>
          {question.comments && question.comments.length > 0 ? (
            <div className="flex flex-col gap-4">
              {question.comments.map((comment, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 p-5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/20 ring-1 ring-zinc-200/50 dark:ring-zinc-800"
                >
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                      <User size={16} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5 text-xs">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {comment.user}
                      </span>
                      <span className="text-zinc-400">•</span>
                      <span className="text-zinc-500 dark:text-zinc-400">{comment.date}</span>

                      {(comment.isHighlyVoted || comment.isMostRecent) && (
                        <div className="flex items-center gap-2 ml-1">
                          {comment.isHighlyVoted && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                              <ThumbsUp size={10} /> Highly Voted
                            </span>
                          )}
                          {comment.isMostRecent && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              <Sparkles size={10} /> Most Recent
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {comment.selectedAnswer && (
                      <div className="mb-2 text-xs">
                        <span className="text-zinc-500 dark:text-zinc-400">Selected Answer:</span>{' '}
                        <strong className="text-zinc-700 dark:text-zinc-300">
                          {comment.selectedAnswer}
                        </strong>
                      </div>
                    )}

                    <div className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">
                      {comment.content}
                    </div>

                    {comment.voteCount !== undefined && (
                      <div className="mt-3 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                        <ThumbsUp size={12} /> upvoted {comment.voteCount} times
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <pre className="p-5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/20 ring-1 ring-zinc-200/50 dark:ring-zinc-800 text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">
              {question.discussion}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
