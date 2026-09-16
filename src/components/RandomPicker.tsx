import React, { useState, useEffect, useRef } from 'react';
import { Student, DrawRecord } from '../types';
import { soundEffects } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Check, 
  History, 
  UserCheck, 
  Award, 
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

interface RandomPickerProps {
  students: Student[];
  drawnRecords: DrawRecord[];
  onAddDrawnRecord: (record: DrawRecord) => void;
  onRemoveDrawnRecord: (recordId: string) => void;
  onClearDrawnRecords: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenRosterTab: () => void;
}

export const RandomPicker: React.FC<RandomPickerProps> = ({
  students,
  drawnRecords,
  onAddDrawnRecord,
  onRemoveDrawnRecord,
  onClearDrawnRecords,
  isMuted,
  onToggleMute,
  onOpenRosterTab,
}) => {
  // Configs
  const [allowDuplicate, setAllowDuplicate] = useState<boolean>(false);
  const [durationMode, setDurationMode] = useState<'fast' | 'normal' | 'dramatic'>('normal');
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [currentDisplayedStudent, setCurrentDisplayedStudent] = useState<Student | null>(null);
  const [lastWinner, setLastWinner] = useState<Student | null>(null);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);

  const rollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Available students for drawing
  const drawnStudentIds = new Set(drawnRecords.map(r => r.student.id));
  const availablePool = allowDuplicate 
    ? students 
    : students.filter(s => !drawnStudentIds.has(s.id));

  // Keep a default display student if available
  useEffect(() => {
    if (!currentDisplayedStudent && students.length > 0) {
      setCurrentDisplayedStudent(students[0]);
    }
  }, [students, currentDisplayedStudent]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
    };
  }, []);

  const triggerConfetti = () => {
    try {
      // Left side burst
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { x: 0.2, y: 0.6 },
        colors: ['#4f46e5', '#06b6d4', '#f59e0b', '#10b981', '#ec4899'],
      });
      // Right side burst
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { x: 0.8, y: 0.6 },
        colors: ['#4f46e5', '#06b6d4', '#f59e0b', '#10b981', '#ec4899'],
      });
    } catch {
      // Ignore confetti error
    }
  };

  const startRolling = () => {
    if (isRolling) return;
    if (students.length === 0) {
      alert('請先在學生名單中加入學生！');
      return;
    }
    if (!allowDuplicate && availablePool.length === 0) {
      alert('所有學生皆已被抽出！請重設抽籤池或開啟允許重複抽取。');
      return;
    }

    setIsRolling(true);
    setLastWinner(null);

    // Pick winning candidate in advance from available pool
    const pool = availablePool.length > 0 ? availablePool : students;
    const winnerIndex = Math.floor(Math.random() * pool.length);
    const chosenWinner = pool[winnerIndex];

    // Determine animation parameters based on durationMode
    let totalSteps = 24;
    let baseDelay = 50;
    if (durationMode === 'fast') {
      totalSteps = 16;
      baseDelay = 40;
    } else if (durationMode === 'dramatic') {
      totalSteps = 34;
      baseDelay = 50;
    }

    let currentStep = 0;

    // Recursive step runner for decelerating roll with audio sync
    const runStep = () => {
      currentStep++;

      // Pick a random student to display during intermediate steps
      const randIndex = Math.floor(Math.random() * students.length);
      const intermediate = students[randIndex];
      setCurrentDisplayedStudent(intermediate);

      // Audio click sound: slightly higher pitch towards the end
      const pitch = 0.8 + (currentStep / totalSteps) * 0.5;
      soundEffects.playTick(pitch);

      if (currentStep < totalSteps) {
        // Deceleration easing curve: delay gets exponentially larger at the end
        const progress = currentStep / totalSteps;
        let nextDelay = baseDelay;
        if (progress > 0.6) {
          nextDelay = baseDelay + Math.pow((progress - 0.6) * 2.5, 2.8) * 350;
        }

        // Suspense sound when close to finish
        if (currentStep === totalSteps - 3) {
          soundEffects.playSuspense();
        }

        rollTimerRef.current = setTimeout(runStep, nextDelay);
      } else {
        // Final reveal!
        setCurrentDisplayedStudent(chosenWinner);
        setLastWinner(chosenWinner);
        setIsRolling(false);

        // Record history
        onAddDrawnRecord({
          id: `draw_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          student: chosenWinner,
          timestamp: Date.now(),
        });

        // Trigger celebratory fanfare & confetti!
        soundEffects.playFanfare();
        triggerConfetti();
      }
    };

    runStep();
  };

  return (
    <div 
      id="random-picker-section"
      className={`space-y-6 transition-all duration-300 ${
        isTheaterMode 
          ? 'fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md p-6 sm:p-12 overflow-y-auto flex flex-col justify-between' 
          : ''
      }`}
    >
      {/* Top Controls & Status Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border ${
        isTheaterMode 
          ? 'bg-slate-900/80 border-slate-800 text-slate-100' 
          : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`font-bold text-base sm:text-lg ${isTheaterMode ? 'text-white' : 'text-slate-800'}`}>
              課堂隨機抽籤
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>名單總數: {students.length} 人</span>
              <span>•</span>
              <span className={!allowDuplicate && availablePool.length === 0 ? 'text-rose-500 font-semibold' : 'text-emerald-600 font-semibold'}>
                {allowDuplicate ? '每次抽取皆由全體抽出' : `待抽池剩餘: ${availablePool.length} 人`}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Toolbar: Repeat toggle, duration, sound, theater */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Duplicate Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
            <button
              id="mode-no-duplicate-btn"
              type="button"
              disabled={isRolling}
              onClick={() => {
                setAllowDuplicate(false);
                soundEffects.playClick();
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                !allowDuplicate 
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              不重複抽取
            </button>
            <button
              id="mode-allow-duplicate-btn"
              type="button"
              disabled={isRolling}
              onClick={() => {
                setAllowDuplicate(true);
                soundEffects.playClick();
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                allowDuplicate 
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              可重複抽取
            </button>
          </div>

          {/* Duration mode */}
          <select
            id="picker-duration-select"
            disabled={isRolling}
            value={durationMode}
            onChange={(e) => setDurationMode(e.target.value as 'fast' | 'normal' | 'dramatic')}
            className="text-xs py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="fast">快速抽籤 (1.5秒)</option>
            <option value="normal">標準節奏 (3秒)</option>
            <option value="dramatic">刺激懸疑 (5秒)</option>
          </select>

          {/* Sound Toggle */}
          <button
            id="picker-mute-btn"
            onClick={onToggleMute}
            className={`p-2 rounded-xl border transition-colors ${
              isMuted 
                ? 'border-slate-200 text-slate-400 bg-slate-50 hover:bg-slate-100' 
                : 'border-indigo-200 text-indigo-600 bg-indigo-50/60 hover:bg-indigo-100/60'
            }`}
            title={isMuted ? '開啟音效' : '靜音'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Projector / Theater Mode */}
          <button
            id="theater-mode-toggle-btn"
            onClick={() => setIsTheaterMode(!isTheaterMode)}
            className={`p-2 rounded-xl border transition-colors ${
              isTheaterMode 
                ? 'border-amber-400 bg-amber-400/20 text-amber-300' 
                : 'border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title={isTheaterMode ? '退出投影模式' : '開啟大螢幕投影模式'}
          >
            {isTheaterMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Big Stage */}
      <div 
        id="picker-main-stage"
        className={`relative overflow-hidden rounded-3xl border transition-all duration-300 flex flex-col items-center justify-center text-center p-8 sm:p-14 ${
          isTheaterMode 
            ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-indigo-900/60 shadow-2xl flex-1 min-h-[420px]' 
            : 'bg-gradient-to-b from-white to-slate-50 border-slate-200 shadow-sm min-h-[380px]'
        }`}
      >
        {/* Ambient glow decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {students.length === 0 ? (
          <div className="relative z-10 max-w-md mx-auto space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">尚未設定學生名單</h3>
            <p className="text-sm text-slate-500">
              抽籤前請先載入或上傳班級學生名單。
            </p>
            <button
              id="picker-empty-go-roster-btn"
              onClick={onOpenRosterTab}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-md transition-all cursor-pointer"
            >
              前往設定學生名單
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center">
            {/* Status Pill */}
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/60 dark:border-indigo-800/80 text-xs font-medium text-indigo-700 dark:text-indigo-300">
              <span className={`w-2 h-2 rounded-full ${isRolling ? 'bg-amber-500 animate-ping' : lastWinner ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
              {isRolling ? '隨機抽取中...' : lastWinner ? '恭喜中籤！' : '準備就緒，點擊下方按鈕開始'}
            </div>

            {/* Candidate Display Box */}
            <div 
              id="drawn-student-display-box"
              className={`w-full py-8 px-6 sm:py-12 sm:px-10 rounded-3xl transition-all duration-300 flex flex-col items-center justify-center border ${
                lastWinner && !isRolling
                  ? 'bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-amber-500/10 border-indigo-400 dark:border-indigo-500 shadow-xl ring-4 ring-indigo-500/20'
                  : isRolling
                    ? 'bg-white/90 dark:bg-slate-800/90 border-amber-400/80 shadow-lg scale-[1.02]'
                    : isTheaterMode
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-white border-slate-200/90'
              }`}
            >
              {/* Student Number */}
              {currentDisplayedStudent?.number && (
                <span 
                  id="drawn-student-number-badge"
                  className="mb-2 px-3 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm sm:text-base font-mono font-semibold"
                >
                  座號 {currentDisplayedStudent.number}
                </span>
              )}

              {/* Big Student Name with animated roll */}
              <div 
                id="drawn-student-name"
                className={`font-black tracking-wide transition-all select-none ${
                  isTheaterMode 
                    ? 'text-5xl sm:text-7xl md:text-8xl text-white' 
                    : 'text-4xl sm:text-6xl md:text-7xl text-slate-800 dark:text-slate-100'
                } ${isRolling ? 'filter blur-[0.5px] opacity-90 scale-95' : 'scale-100'} ${
                  lastWinner && !isRolling ? 'text-indigo-600 dark:text-indigo-400 animate-in zoom-in-95' : ''
                }`}
              >
                {currentDisplayedStudent ? currentDisplayedStudent.name : '點擊抽籤'}
              </div>

              {lastWinner && !isRolling && (
                <div className="mt-4 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  <Award className="w-4 h-4" />
                  本次幸運兒
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 w-full">
              <button
                id="start-draw-button"
                type="button"
                disabled={isRolling || (!allowDuplicate && availablePool.length === 0)}
                onClick={startRolling}
                className={`px-8 sm:px-12 py-4 rounded-2xl font-bold text-base sm:text-lg shadow-lg flex items-center gap-3 transition-all cursor-pointer ${
                  isRolling
                    ? 'bg-amber-500 text-white opacity-80 cursor-wait'
                    : !allowDuplicate && availablePool.length === 0
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-105 active:scale-95 shadow-indigo-500/25'
                }`}
              >
                <Sparkles className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
                {isRolling 
                  ? '抽籤中...' 
                  : lastWinner 
                    ? '再抽一位學生' 
                    : '開始隨機抽籤'}
              </button>

              {!allowDuplicate && drawnRecords.length > 0 && (
                <button
                  id="reset-drawn-pool-btn"
                  type="button"
                  disabled={isRolling}
                  onClick={() => {
                    if (window.confirm('確定要重設已抽出名單，讓所有學生重新回到籤筒嗎？')) {
                      onClearDrawnRecords();
                      setLastWinner(null);
                      soundEffects.playClick();
                    }
                  }}
                  className="px-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors flex items-center gap-2"
                  title="清空已抽紀錄，恢復全部名單"
                >
                  <RotateCcw className="w-4 h-4" />
                  重設抽籤池
                </button>
              )}
            </div>

            {/* Pool exhausted alert if in no duplicate mode */}
            {!allowDuplicate && availablePool.length === 0 && students.length > 0 && (
              <div id="pool-exhausted-banner" className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div className="text-left">
                  <p className="font-semibold">名單中所有學生皆已抽出完畢！</p>
                  <p className="text-xs opacity-90">點選上方「重設抽籤池」可重新展開下一輪抽籤，或切換為「可重複抽取」模式。</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drawn History Section (Crucial for Teachers) */}
      <div 
        id="drawn-history-section"
        className={`p-5 rounded-2xl border ${
          isTheaterMode 
            ? 'bg-slate-900/80 border-slate-800 text-slate-200' 
            : 'bg-white border-slate-200/80 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">
              已抽出學生紀錄 ({drawnRecords.length})
            </h3>
            {!allowDuplicate && (
              <span className="text-xs text-slate-500">（不重複模式下，這些學生已不在待抽池中）</span>
            )}
          </div>
          {drawnRecords.length > 0 && (
            <button
              id="clear-history-button"
              onClick={() => {
                if (window.confirm('確定要清除目前的抽籤紀錄嗎？')) {
                  onClearDrawnRecords();
                }
              }}
              className="text-xs text-slate-500 hover:text-rose-600 transition-colors"
            >
              清除紀錄
            </button>
          )}
        </div>

        {drawnRecords.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">尚未有抽出紀錄，點擊「開始隨機抽籤」抽出第一位幸運學生！</p>
        ) : (
          <div id="drawn-records-chips" className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
            {drawnRecords.slice().reverse().map((record, index) => {
              const order = drawnRecords.length - index;
              return (
                <div
                  key={record.id}
                  id={`drawn-record-chip-${record.id}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 text-xs font-medium"
                >
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center justify-center">
                    {order}
                  </span>
                  <span className="text-slate-800 dark:text-slate-100 font-semibold">
                    {record.student.number ? `#${record.student.number} ` : ''}{record.student.name}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  {!allowDuplicate && (
                    <button
                      id={`return-to-pool-btn-${record.id}`}
                      onClick={() => onRemoveDrawnRecord(record.id)}
                      className="ml-1 text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline"
                      title="將此位學生放回待抽池"
                    >
                      放回
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
