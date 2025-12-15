import React from 'react';
import { Plan } from '../types';
import { PRIORITY_COLORS } from '../constants';
import { Check, Trash2, Clock, Hourglass } from 'lucide-react';

interface PlanItemProps {
  plan: Plan;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  isReadOnly?: boolean;
}

export const PlanItem: React.FC<PlanItemProps> = ({ plan, onToggle, onDelete, isReadOnly = false }) => {
  return (
    <div 
      className={`
        group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200
        ${plan.isCompleted ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'}
      `}
    >
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onToggle(plan.id)}
          disabled={isReadOnly && !plan.isCompleted} 
          className={`
            flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
            ${plan.isCompleted 
              ? 'bg-indigo-500 border-indigo-500 text-white' 
              : 'border-gray-300 hover:border-indigo-400 text-transparent'}
          `}
        >
          <Check size={14} strokeWidth={3} />
        </button>
      </div>

      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {plan.suggestedTime && (
             <div className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
               <Clock size={10} />
               {plan.suggestedTime}
             </div>
          )}
          <p className={`text-sm md:text-base truncate transition-all ${plan.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {plan.content}
          </p>
        </div>
        
        {plan.estimatedDuration && (
          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <Hourglass size={10} />
            <span>{plan.estimatedDuration} min</span>
          </div>
        )}
      </div>

      <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide border ${PRIORITY_COLORS[plan.priority]}`}>
        {plan.priority}
      </div>

      {!isReadOnly && (
        <button 
          onClick={() => onDelete(plan.id)}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
          title="Delete plan"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
};
