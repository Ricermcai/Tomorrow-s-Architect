import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Calendar, Sun, Moon, Sparkles, ChevronRight, Settings, X, Clock, Zap } from 'lucide-react';
import { Plan, Priority, Category } from './types';
import { STORAGE_KEY } from './constants';
import { PlanInput } from './components/PlanInput';
import { PlanItem } from './components/PlanItem';
import { StatsWidget } from './components/StatsWidget';
import { SettingsModal } from './components/SettingsModal';
import { Toast, ToastType } from './components/Toast';
import { reviewPlans, generateSchedule } from './services/geminiService';
// Import the initial data file (Named export from TS file)
import { initialData } from './data/initialData';

// Helper to parse time for sorting. Supports both "HH:MM" (24h) and "HH:MM AM/PM" (12h)
const parseTime = (timeStr: string): number => {
  if (!timeStr) return 99999; 
  
  // Handle 12-hour format "01:30 PM" (Legacy support)
  if (timeStr.match(/AM|PM/i)) {
    const [time, modifier] = timeStr.split(' ');
    if (!time || !modifier) return 99999;
    
    let [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return 99999;

    if (hours === 12 && modifier.toUpperCase() === 'AM') {
      hours = 0;
    }
    if (hours !== 12 && modifier.toUpperCase() === 'PM') {
      hours += 12;
    }
    return hours * 60 + minutes;
  }

  // Handle 24-hour format "14:30"
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return 99999;
  return hours * 60 + minutes;
};

// Helper: Get a Date object that visually represents Shanghai Time (UTC+8)
// This creates a Date object where .getHours(), .getDate() etc. return Shanghai values.
// NOTE: The internal timestamp of this object is technically shifted, but we use it for display logic.
const getShanghaiDate = () => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const shanghaiOffset = 8; // UTC+8
  return new Date(utc + (3600000 * shanghaiOffset));
};

const App: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isOptimizingToday, setIsOptimizingToday] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: ToastType } | null>(null);
  const [isAddingToday, setIsAddingToday] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Date Logic with "Night Owl" adjustment, strictly using Shanghai Time
  const { todayStr, tomorrowStr, todayDisplay, tomorrowDisplay } = useMemo(() => {
    // 1. Get current time in Shanghai
    const shanghaiNow = getShanghaiDate();

    // 2. Virtual date shift: if before 4 AM (Shanghai time), shift back 1 day
    if (shanghaiNow.getHours() < 4) {
      shanghaiNow.setDate(shanghaiNow.getDate() - 1);
    }

    const vToday = new Date(shanghaiNow);
    const vTomorrow = new Date(shanghaiNow);
    vTomorrow.setDate(vTomorrow.getDate() + 1);

    return {
      // toISOString returns UTC, but since we shifted the time manually to match Shanghai face value,
      // the date part of the ISO string matches Shanghai date.
      todayStr: vToday.toISOString().split('T')[0],
      tomorrowStr: vTomorrow.toISOString().split('T')[0],
      todayDisplay: vToday.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      tomorrowDisplay: vTomorrow.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    };
  }, []); // Empty dependency array means this runs once on mount/reload. Ideally we might want a timer, but this is sufficient.

  // Initial Load
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration: Ensure all plans have a category field (for legacy data)
        const migrated = parsed.map((p: any) => ({
          ...p,
          category: p.category || 'personal'
        }));
        setPlans(migrated);
      } catch (e) {
        console.error("Failed to parse plans", e);
        loadInitialData();
      }
    } else {
      loadInitialData();
    }
  }, [tomorrowStr]); // Add dependency to ensure dates are calculated

  const loadInitialData = () => {
    try {
      // Fix dates in initial data to be relative to "now" so they appear in the UI
      const adjustedData = initialData.map(p => {
        // If the task is the welcome task, map it to tomorrow so the user sees something immediately.
        if (p.id === 'welcome-task-1') {
          return { ...p, targetDate: tomorrowStr };
        }
        return p;
      });
      setPlans(adjustedData);
    } catch (e) {
      console.error("Failed to load initial data", e);
    }
  };

  // Save on Change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  }, [plans]);

  // Filter Plans
  const todayPlans = useMemo(() => {
    const list = plans.filter(p => p.targetDate === todayStr);
    return list.sort((a, b) => {
      // Sort priority: Uncompleted first, then by time
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      
      // Sort by suggested time parsed chronologically
      if (a.suggestedTime && b.suggestedTime) {
        return parseTime(a.suggestedTime) - parseTime(b.suggestedTime);
      }
      
      if (a.suggestedTime && !b.suggestedTime) return -1;
      if (!a.suggestedTime && b.suggestedTime) return 1;
      
      // Fallback to priority if no time
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      
      return 0;
    });
  }, [plans, todayStr]);

  const tomorrowPlans = useMemo(() => {
    const list = plans.filter(p => p.targetDate === tomorrowStr);
    return list.sort((a, b) => {
      // Sort by suggested time parsed chronologically
      if (a.suggestedTime && b.suggestedTime) {
        return parseTime(a.suggestedTime) - parseTime(b.suggestedTime);
      }
      if (a.suggestedTime && !b.suggestedTime) return -1;
      if (!a.suggestedTime && b.suggestedTime) return 1;
      
      // Fallback to priority if no time
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      
      return 0;
    });
  }, [plans, tomorrowStr]);

  // Handlers
  const showToast = (message: string, type: ToastType) => {
    setNotification({ message, type });
  };

  const addPlan = (content: string, priority: Priority, category: Category, targetDate: string, duration?: number) => {
    const newPlan: Plan = {
      id: crypto.randomUUID(),
      content,
      isCompleted: false,
      targetDate: targetDate, 
      priority,
      category,
      createdAt: Date.now(),
      estimatedDuration: duration,
    };
    setPlans(prev => [...prev, newPlan]);
    if (targetDate === tomorrowStr) {
      setAiTip(null);
    }
  };

  const togglePlan = (id: string) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, isCompleted: !p.isCompleted } : p));
  };

  const deletePlan = (id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id));
  };

  const handleAiReview = async () => {
    setIsAiLoading(true);
    const tip = await reviewPlans(tomorrowPlans);
    setAiTip(tip);
    setIsAiLoading(false);
  };

  const handleOptimizeSchedule = async () => {
    if (tomorrowPlans.length === 0) {
      showToast("Add some plans first!", 'error');
      return;
    }
    
    setIsOptimizing(true);
    try {
      // For tomorrow, start at 09:30 (24h format)
      const schedule = await generateSchedule(tomorrowPlans, "09:30");
      
      if (schedule.length > 0) {
        setPlans(prev => prev.map(p => {
          const suggestion = schedule.find(s => s.id === p.id);
          if (suggestion) {
            return { ...p, suggestedTime: suggestion.suggestedTime };
          }
          return p;
        }));
        showToast("Schedule optimized (Start: 09:30)!", 'success');
      } else {
        showToast("Could not generate schedule. Try again.", 'error');
      }
    } catch (e) {
      console.error(e);
      showToast("Something went wrong.", 'error');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleOptimizeTodaySchedule = async () => {
    const unfinishedPlans = todayPlans.filter(p => !p.isCompleted);
    if (unfinishedPlans.length === 0) {
      showToast("No unfinished tasks to schedule!", 'error');
      return;
    }

    setIsOptimizingToday(true);
    try {
      // Use Shanghai Time for current status
      const shanghaiNow = getShanghaiDate();
      let startTimeString = "";
      
      const currentHour = shanghaiNow.getHours();
      const currentMin = shanghaiNow.getMinutes();
      
      // 09:30 in minutes is 9 * 60 + 30 = 570 minutes
      const nowMinutes = currentHour * 60 + currentMin;
      const startWorkMinutes = 9 * 60 + 30;

      // If current time is before 09:30, force start at 09:30
      if (nowMinutes < startWorkMinutes) {
        startTimeString = "09:30";
      } else {
        // If it's already past 09:30, start "Now" (rounded to next 15 min)
        const remainder = 15 - (currentMin % 15);
        shanghaiNow.setMinutes(currentMin + remainder);
        
        // Manual 24h formatting to avoid locale issues "HH:MM"
        const h = shanghaiNow.getHours().toString().padStart(2, '0');
        const m = shanghaiNow.getMinutes().toString().padStart(2, '0');
        startTimeString = `${h}:${m}`;
      }
      
      const schedule = await generateSchedule(unfinishedPlans, startTimeString);

      if (schedule.length > 0) {
        setPlans(prev => prev.map(p => {
          const suggestion = schedule.find(s => s.id === p.id);
          if (suggestion) {
            return { ...p, suggestedTime: suggestion.suggestedTime };
          }
          return p;
        }));
        showToast(`Day scheduled starting ${startTimeString}!`, 'success');
      } else {
        showToast("Could not optimize schedule.", 'error');
      }
    } catch (e) {
      console.error(e);
      showToast("Something went wrong.", 'error');
    } finally {
      setIsOptimizingToday(false);
    }
  };

  const moveUnfinishedToTomorrow = () => {
    const unfinishedToday = todayPlans.filter(p => !p.isCompleted);
    if (unfinishedToday.length === 0) return;
    
    setPlans(prev => prev.map(p => {
      if (unfinishedToday.find(u => u.id === p.id)) {
        return { ...p, targetDate: tomorrowStr, suggestedTime: undefined }; 
      }
      return p;
    }));
    showToast(`${unfinishedToday.length} tasks moved to tomorrow`, 'success');
  };

  // Import Handler (Manual Backup Restore)
  const handleImportJson = (text: string) => {
    try {
      let jsonString = text;
      // If user pasted the full TS file content, extract the JSON array part
      if (text.includes('export const initialData')) {
        const match = text.match(/=\s*(\[[\s\S]*\]);/);
        if (match && match[1]) {
          jsonString = match[1];
        }
      }

      const parsedData = JSON.parse(jsonString);
      const isValidStructure = Array.isArray(parsedData);
      
      if (isValidStructure) {
        if (window.confirm("This will replace all current tasks with the data from the text box. Continue?")) {
           // Migration: Ensure all plans have a category field (for legacy data)
          const migrated = parsedData.map((p: any) => ({
            ...p,
            category: p.category || 'personal'
          }));
          setPlans(migrated);
          setIsSettingsOpen(false); 
          showToast("Data restored successfully!", 'success');
        }
      } else {
        showToast("Invalid data format", 'error');
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to parse data", 'error');
    }
  };

  const handleResetToInitial = () => {
    if (window.confirm("This will replace all current tasks with the data from 'data/initialData.ts'. \n\nAny changes made since you last saved to code/file will be lost.")) {
      localStorage.removeItem(STORAGE_KEY);
      loadInitialData();
      setIsSettingsOpen(false);
      showToast("Reset to initial data!", 'success');
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-ink pb-20 md:pb-0">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
              <Calendar size={20} />
            </div>
            <div>
              <h1 className="font-serif font-bold text-xl leading-tight">Tomorrow's Architect</h1>
              <p className="text-xs text-gray-500 font-medium tracking-wide">PLAN TODAY, THRIVE TOMORROW</p>
            </div>
          </div>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-xl transition-all"
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Today (Review) */}
        <section className="space-y-4 opacity-90">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sun className="text-amber-500" size={20} />
              <h2 className="text-lg font-bold text-gray-800">Today</h2>
              <span className="text-sm text-gray-400 font-normal hidden sm:inline">{todayDisplay}</span>
            </div>
            
            {/* Today's Schedule Button */}
            {todayPlans.some(p => !p.isCompleted) && (
              <button 
                onClick={handleOptimizeTodaySchedule}
                disabled={isOptimizingToday}
                className="flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors disabled:opacity-50"
              >
                <Zap size={12} fill="currentColor" />
                {isOptimizingToday ? 'Scheduling...' : 'Plan Remaining'}
              </button>
            )}
          </div>
          
          <StatsWidget plans={todayPlans} title="Today's Progress" />

          {/* Today's Quick Add */}
          {isAddingToday ? (
            <div className="animate-in fade-in zoom-in-95 duration-200 relative group">
              <PlanInput 
                onAdd={(c, p, cat, d) => {
                  addPlan(c, p, cat, todayStr, d);
                  setIsAddingToday(false);
                  showToast("Task added to Today", 'success');
                }}
                placeholder="Add a task for today..."
                submitLabel="Add Now"
                className="shadow-md border-indigo-200"
              />
              <button 
                onClick={() => setIsAddingToday(false)}
                className="absolute -top-3 -right-3 w-7 h-7 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsAddingToday(true)}
              className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 hover:bg-white rounded-xl border border-dashed border-gray-300 hover:border-indigo-200 transition-all"
            >
              <Plus size={16} /> Add task for today
            </button>
          )}

          <div className="space-y-3">
            {todayPlans.length === 0 && !isAddingToday ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400">
                <p>No plans set for today.</p>
              </div>
            ) : (
              todayPlans.map(plan => (
                <PlanItem 
                  key={plan.id} 
                  plan={plan} 
                  onToggle={togglePlan} 
                  onDelete={deletePlan}
                />
              ))
            )}
          </div>

          {todayPlans.some(p => !p.isCompleted) && (
            <button 
              onClick={moveUnfinishedToTomorrow}
              className="w-full py-3 mt-4 flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 hover:bg-white rounded-xl border border-transparent hover:border-gray-200 transition-all"
            >
              Move unfinished to Tomorrow <ChevronRight size={14} />
            </button>
          )}
        </section>

        {/* Right Column: Tomorrow (Planning) */}
        <section className="lg:bg-white lg:p-8 lg:rounded-[2rem] lg:shadow-xl lg:border lg:border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <Moon className="text-indigo-500" size={20} />
            <h2 className="text-lg font-bold text-gray-800">Tomorrow's Plan</h2>
            <span className="text-sm text-gray-400 font-normal ml-auto">{tomorrowDisplay}</span>
          </div>

          <PlanInput 
            onAdd={(c, p, cat, d) => addPlan(c, p, cat, tomorrowStr, d)} 
            className="mb-6"
          />

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Planned Tasks ({tomorrowPlans.length})</h3>
            
            <div className="flex gap-2">
              {tomorrowPlans.length > 0 && (
                <>
                  <button 
                    onClick={handleOptimizeSchedule}
                    disabled={isOptimizing}
                    className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-white border border-indigo-200 px-3 py-1.5 rounded-full hover:bg-indigo-50 transition-colors disabled:opacity-50"
                  >
                    <Clock size={12} />
                    {isOptimizing ? 'Scheduling...' : 'Auto-Schedule'}
                  </button>

                  <button 
                    onClick={handleAiReview}
                    disabled={isAiLoading}
                    className="flex items-center gap-1.5 text-xs font-medium text-white bg-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <Sparkles size={12} />
                    {isAiLoading ? 'Analyzing...' : 'Review'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* AI Tip Box */}
          {aiTip && (
             <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100 text-sm text-indigo-900 leading-relaxed shadow-sm animate-fade-in">
               <div className="flex gap-2">
                 <Sparkles className="flex-shrink-0 text-indigo-500 mt-0.5" size={16} />
                 <p>{aiTip}</p>
               </div>
             </div>
          )}

          <div className="space-y-3 min-h-[200px]">
            {tomorrowPlans.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-50">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Plus className="text-gray-400" />
                </div>
                <p className="text-gray-500">Your canvas is empty.</p>
                <p className="text-xs text-gray-400 mt-1">Add a task above to start building your day.</p>
              </div>
            ) : (
              tomorrowPlans.map(plan => (
                <PlanItem 
                  key={plan.id} 
                  plan={plan} 
                  onToggle={togglePlan} 
                  onDelete={deletePlan}
                />
              ))
            )}
          </div>
        </section>

      </main>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentData={plans}
        onImportJson={handleImportJson}
        onResetToInitial={handleResetToInitial}
      />
      
      {/* Notifications */}
      {notification && (
        <Toast 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(null)} 
        />
      )}
    </div>
  );
};

export default App;
