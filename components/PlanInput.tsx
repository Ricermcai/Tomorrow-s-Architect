import React, { useState } from 'react';
import { Priority, Category } from '../types';
import { Plus, ArrowRight, Clock, Tag } from 'lucide-react';

interface PlanInputProps {
  onAdd: (content: string, priority: Priority, category: Category, duration?: number) => void;
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
  const [category, setCategory] = useState<Category>('work');
  const [duration, setDuration] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    const durationNum = duration ? parseInt(duration) : undefined;
    onAdd(content, priority, category, durationNum);
    
    setContent('');
    setPriority('medium');
    setCategory('work'); // Default reset
    setDuration('');
  };

  const categories: Category[] = ['work', 'personal', 'research', 'entertainment'];

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
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-gray-50 gap-3">
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Priority Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Priority</span>
              <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-100">
                {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`
                      px-2.5 py-1 rounded-md text-xs font-medium transition-all capitalize
                      ${priority === p 
                        ? 'bg-white text-indigo-600 shadow-sm border border-gray-100' 
                        : 'text-gray-400 hover:text-gray-600'}
                    `}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</span>
              <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-100 overflow-x-auto">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`
                      px-2.5 py-1 rounded-md text-xs font-medium transition-all capitalize whitespace-nowrap
                      ${category === c 
                        ? 'bg-white text-indigo-600 shadow-sm border border-gray-100' 
                        : 'text-gray-400 hover:text-gray-600'}
                    `}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Duration Input */}
            <div className="flex items-center bg-gray-50 rounded-lg px-2 py-1.5 border border-gray-100 focus-within:border-indigo-200 transition-colors">
              <Clock size={12} className="text-gray-400 mr-1.5" />
              <input 
                type="number" 
                min="5" 
                step="5"
                placeholder="Min" 
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="bg-transparent w-10 text-xs outline-none text-gray-600 placeholder-gray-400"
              />
            </div>

            <button
              type="submit"
              disabled={!content.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitLabel} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
