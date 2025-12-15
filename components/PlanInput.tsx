import React, { useState } from 'react';
import { Priority } from '../types';
import { Plus, ArrowRight, Clock } from 'lucide-react';

interface PlanInputProps {
  onAdd: (content: string, priority: Priority, duration?: number) => void;
  placeholder?: string;
  submitLabel?: string;
  className?: string;
}

export const PlanInput: React.FC<PlanInputProps> = ({ 
  onAdd, 
  placeholder = "What needs to happen tomorrow?",
  submitLabel = "Add Plan",
  className = ""
}) => {
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [duration, setDuration] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    const durationNum = duration ? parseInt(duration) : undefined;
    onAdd(content, priority, durationNum);
    
    setContent('');
    setPriority('medium');
    setDuration('');
  };

  return (
    <form onSubmit={handleSubmit} className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 ${className}`}>
      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-lg text-gray-800 placeholder-gray-400 outline-none"
        />
        
        <div className="flex items-center justify-between pt-2 border-t border-gray-50 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`
                    px-3 py-1 rounded-full text-xs font-medium transition-all capitalize
                    ${priority === p 
                      ? 'bg-indigo-600 text-white shadow-md transform scale-105' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}
                  `}
                >
                  {p}
                </button>
              ))}
            </div>
            
            <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>

            <div className="flex items-center bg-gray-50 rounded-lg px-2 py-1 border border-gray-100 focus-within:border-indigo-200 transition-colors">
              <Clock size={12} className="text-gray-400 mr-1.5" />
              <input 
                type="number" 
                min="5" 
                step="5"
                placeholder="Time (min)" 
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="bg-transparent w-16 text-xs outline-none text-gray-600 placeholder-gray-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!content.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all ml-auto"
          >
            {submitLabel} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </form>
  );
};
