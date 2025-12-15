import React, { useState, useRef } from 'react';
import { X, Download, Upload, FileJson, AlertTriangle, Code, Copy, Check, FileCode, RotateCcw } from 'lucide-react';
import { Plan } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: Plan[];
  onImportJson: (json: string) => void;
  onResetToInitial: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentData,
  onImportJson,
  onResetToInitial,
}) => {
  const [activeTab, setActiveTab] = useState<'code' | 'file'>('code');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Logic for "Save to Code"
  const getSourceCode = () => {
    return `import { Plan } from '@/types';

export const initialData: Plan[] = ${JSON.stringify(currentData, null, 2)};`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getSourceCode()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadTs = () => {
    const code = getSourceCode();
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    // Create timestamp string like YYYY-MM-DD_HH-mm
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-').slice(0, 5);
    
    link.download = `initialData-${dateStr}_${timeStr}.ts`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 2. Logic for "File Download/Upload"
  const handleDownloadJson = () => {
    const dataStr = JSON.stringify(currentData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tomorrows-architect-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      onImportJson(content);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-gray-800">
            <FileJson className="text-indigo-600" size={20} />
            <h2 className="text-lg font-serif font-bold">Data Management</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('code')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'code' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Code size={16} /> Save to Code
          </button>
          <button 
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'file' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Download size={16} /> File Backup
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {activeTab === 'code' ? (
            <div className="space-y-4">
               <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 leading-relaxed">
                  <p className="font-bold mb-1">Developer Mode (Persistence):</p>
                  <p>1. <strong>Copy</strong> the code below.</p>
                  <p>2. Replace the content of <strong>data/initialData.ts</strong>.</p>
                  <p className="mt-1 text-blue-600/80 italic">Note: Local changes override file data. Use "Reset" below to load from file.</p>
               </div>
               
               <div className="relative group">
                 <textarea 
                    readOnly
                    value={getSourceCode()}
                    className="w-full h-40 p-3 bg-gray-800 text-green-400 border border-gray-700 rounded-xl font-mono text-xs focus:outline-none resize-none selection:bg-green-900"
                 />
                 <button 
                    onClick={handleCopyCode}
                    className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 shadow-sm rounded-lg text-xs font-medium text-gray-700 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                 >
                   {copied ? <Check size={14} className="text-emerald-500"/> : <Copy size={14} />}
                   {copied ? "Copied!" : "Copy Code"}
                 </button>
               </div>

               <div className="flex gap-2">
                 <button 
                    onClick={handleDownloadTs}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                 >
                   <FileCode size={18} />
                   Download .ts
                 </button>
               </div>

               <div className="border-t border-gray-100 my-2"></div>
               
               <button 
                  onClick={onResetToInitial}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 border border-red-100 font-medium rounded-xl hover:bg-red-100 transition-all"
               >
                 <RotateCcw size={16} />
                 Reset to Initial Data (Clear Cache)
               </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Download Section */}
              <div className="space-y-2">
                 <h3 className="text-sm font-semibold text-gray-800">Export as File</h3>
                 <button 
                    onClick={handleDownloadJson}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95"
                 >
                   <Download size={18} />
                   Download .json
                 </button>
              </div>

              <div className="border-t border-gray-100 my-2"></div>

              {/* Upload Section */}
              <div className="space-y-2">
                 <h3 className="text-sm font-semibold text-gray-800">Import from File</h3>
                 <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800 flex gap-2 text-left">
                    <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                    <p>Warning: Importing works for this session only. Use the "Save to Code" tab for permanent updates.</p>
                 </div>

                 <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".json"
                    className="hidden"
                 />

                 <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                >
                  <Upload size={18} />
                  Restore .json
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
