import React from 'react';
import { Plan } from '../types';
import { PRIORITY_COLORS, CATEGORY_COLORS } from '../constants';
import { Check, Trash2, Clock, Hourglass } from 'lucide-react';

interface PlanItemProps {
  plan: Plan;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  isReadOnly?: boolean;
}

export const PlanItem: React.FC<PlanItemProps> = ({ plan, onToggle, onDelete, isReadOnly = false }) => {
  // Fallback for older data that might not have a category
  const categoryColor = plan.category ? CATEGORY_COLORS[plan.category] : CATEGORY_COLORS['personal'];
  const categoryLabel = plan.category || 'personal';

  return (
    <div 
      className={`
        group flex items-start gap-3 p-3 rounded-xl border transition-all duration-200
        ${plan.isCompleted ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'}
      `}
    >
      <div className="flex flex-col pt-1">
        <button
          onClick={() => onToggle(plan.id)}
          disabled={isReadOnly && !plan.isCompleted} 
          className={`
            w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors
            ${plan.isCompleted 
              ? 'bg-indigo-500 border-indigo-500 text-white' 
              : 'border-gray-300 hover:border-indigo-400 text-transparent'}
          `}
        >
          <Check size={12} strokeWidth={4} />
        </button>
      </div>

      <div className="flex-grow min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
           {/* Tags Row */}
           <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${PRIORITY_COLORS[plan.priority]}`}>
            {plan.priority}
          </div>
          
          <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${categoryColor}`}>
            {categoryLabel}
          </div>

          {plan.suggestedTime && (
             <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
               <Clock size={10} />
               {plan.suggestedTime}
             </div>
          )}
        </div>

        <p className={`text-sm md:text-base leading-snug break-words transition-all ${plan.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {plan.content}
        </p>
        
        {plan.estimatedDuration && (
          <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
            <Hourglass size={10} />
            <span>{plan.estimatedDuration} min</span>
          </div>
        )}
      </div>

      {!isReadOnly && (
        <button 
          onClick={() => onDelete(plan.id)}
          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all self-center"
          title="Delete plan"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
};
