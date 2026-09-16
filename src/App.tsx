import React, { useState, useEffect } from 'react';
import { Student, DrawRecord } from './types';
import { generateSampleStudents } from './utils/csvParser';
import { soundEffects } from './utils/audio';
import { StudentManager } from './components/StudentManager';
import { RandomPicker } from './components/RandomPicker';
import { GroupVisualizer } from './components/GroupVisualizer';
import { 
  Sparkles, 
  Users, 
  ListChecks, 
  Volume2, 
  VolumeX, 
  GraduationCap, 
  Dice5,
  HeartHandshake
} from 'lucide-react';

const STORAGE_KEY_STUDENTS = 'classroom_students_v1';
const STORAGE_KEY_DRAWN = 'classroom_drawn_records_v1';
const STORAGE_KEY_MUTED = 'classroom_audio_muted_v1';

export default function App() {
  // Students state with localStorage fallback
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STUDENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore
    }
    // Default to sample students so the teacher gets a ready-to-use experience immediately
    return generateSampleStudents();
  });

  // Drawn history records
  const [drawnRecords, setDrawnRecords] = useState<DrawRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DRAWN);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return [];
  });

  // Audio mute state
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_MUTED) === 'true';
    } catch {
      return false;
    }
  });

  // Active top-level function tab: 'picker' | 'groups' | 'roster'
  const [activeTab, setActiveTab] = useState<'picker' | 'groups' | 'roster'>('picker');

  // Sync mute state with sound engine
  useEffect(() => {
    soundEffects.setMuted(isMuted);
    try {
      localStorage.setItem(STORAGE_KEY_MUTED, String(isMuted));
    } catch {
      // Ignore
    }
  }, [isMuted]);

  // Persist students
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
    } catch {
      // Ignore
    }
  }, [students]);

  // Persist drawn records
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DRAWN, JSON.stringify(drawnRecords));
    } catch {
      // Ignore
    }
  }, [drawnRecords]);

  const handleToggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const handleAddDrawnRecord = (record: DrawRecord) => {
    setDrawnRecords(prev => [...prev, record]);
  };

  const handleRemoveDrawnRecord = (recordId: string) => {
    setDrawnRecords(prev => prev.filter(r => r.id !== recordId));
    soundEffects.playClick();
  };

  const handleClearDrawnRecords = () => {
    setDrawnRecords([]);
  };

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  課堂抽籤與分組工具
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  教師助手
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">隨機抽籤 • 互動音效 • 智慧分組</p>
            </div>
          </div>

          {/* Tab Navigation Controls */}
          <nav aria-label="主要功能分頁" className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60 text-xs sm:text-sm font-medium">
            <button
              id="nav-tab-picker"
              type="button"
              onClick={() => {
                setActiveTab('picker');
                soundEffects.playClick();
              }}
              className={`px-3 sm:px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'picker'
                  ? 'bg-white text-indigo-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Dice5 className="w-4 h-4 text-indigo-600" />
              <span>隨機抽籤</span>
            </button>
            <button
              id="nav-tab-groups"
              type="button"
              onClick={() => {
                setActiveTab('groups');
                soundEffects.playClick();
              }}
              className={`px-3 sm:px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'groups'
                  ? 'bg-white text-teal-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-teal-600" />
              <span>自動分組</span>
            </button>
            <button
              id="nav-tab-roster"
              type="button"
              onClick={() => {
                setActiveTab('roster');
                soundEffects.playClick();
              }}
              className={`px-3 sm:px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'roster'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListChecks className="w-4 h-4 text-slate-600" />
              <span>名單管理 ({students.length})</span>
            </button>
          </nav>

          {/* Quick Sound Control */}
          <div className="flex items-center gap-2">
            <button
              id="global-mute-btn"
              onClick={handleToggleMute}
              className={`p-2 rounded-xl border transition-all text-xs flex items-center gap-1.5 ${
                isMuted
                  ? 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
              }`}
              title={isMuted ? '音效已靜音（點擊開啟）' : '音效已開啟（點擊靜音）'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden md:inline font-medium">{isMuted ? '靜音' : '音效開啟'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Render Tab Contents */}
        {activeTab === 'picker' && (
          <RandomPicker
            students={students}
            drawnRecords={drawnRecords}
            onAddDrawnRecord={handleAddDrawnRecord}
            onRemoveDrawnRecord={handleRemoveDrawnRecord}
            onClearDrawnRecords={handleClearDrawnRecords}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onOpenRosterTab={() => setActiveTab('roster')}
          />
        )}

        {activeTab === 'groups' && (
          <GroupVisualizer
            students={students}
            onOpenRosterTab={() => setActiveTab('roster')}
          />
        )}

        {activeTab === 'roster' && (
          <StudentManager
            students={students}
            onUpdateStudents={setStudents}
            onClearDrawnHistory={handleClearDrawnRecords}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>課堂隨機抽籤與分組平台</span>
            <span>•</span>
            <span>支援 CSV / TXT 匯入、可重複/不重複抽籤、視覺化分組</span>
          </div>
          <div className="flex items-center gap-3">
            <span>目前學生人數：{students.length} 位</span>
            <span>•</span>
            <button
              id="footer-open-roster-btn"
              onClick={() => setActiveTab('roster')}
              className="text-indigo-600 hover:underline font-medium"
            >
              更換名單
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
