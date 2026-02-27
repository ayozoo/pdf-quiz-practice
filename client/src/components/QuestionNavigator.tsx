import React from 'react';
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
    <div className="question-navigator">
      <div className="navigator-header">
        <button className="btn-back" onClick={onBackToExamList}>
          <ChevronLeft size={16} />
          返回试卷列表
        </button>
      </div>
      
      <div className="navigator-grid-wrapper">
        <div className="navigator-grid">
          {Array.from({ length: totalQuestions }).map((_, idx) => {
            const isSubmitted = submittedMap[idx];
            const isCurrent = idx === currentIndex;
            const status = answerStatusMap[idx] || 'unsubmitted';
            
            let className = 'q-nav-item';
            if (isCurrent) className += ' current';
            
            if (isSubmitted) {
              className += ' submitted';
              if (status === 'correct') className += ' correct';
              if (status === 'wrong') className += ' wrong';
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
      <div className="navigator-legend">
        <div className="legend-item">
          <span className="dot current"></span> 当前
        </div>
        <div className="legend-item">
          <span className="dot correct"></span> 正确
        </div>
        <div className="legend-item">
          <span className="dot wrong"></span> 错误
        </div>
        <div className="legend-item">
          <span className="dot"></span> 未做
        </div>
      </div>
    </div>
  );
}
