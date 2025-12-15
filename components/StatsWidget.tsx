import React from 'react';
import { Plan } from '../types';

export const StatsWidget: React.FC<{ plans: Plan[], title: string }> = ({ plans, title }) => {
  const total = plans.length;
  const completed = plans.filter(p => p.isCompleted).length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg mb-6">
      <h3 className="text-indigo-100 text-sm font-medium mb-1 uppercase tracking-wider">{title}</h3>
      <div className="flex items-end justify-between">
        <div>
          <span className="text-3xl font-serif font-bold">{completed}</span>
          <span className="text-indigo-200 text-lg">/{total}</span>
          <p className="text-xs text-indigo-200 mt-1">Tasks Completed</p>
        </div>
        <div className="w-12 h-12 rounded-full border-4 border-indigo-400/30 flex items-center justify-center relative">
            <span className="text-xs font-bold">{progress}%</span>
            <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-white drop-shadow-md"
                strokeDasharray={`${progress}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
              />
            </svg>
        </div>
      </div>
    </div>
  );
};
