import React, { useState, useMemo } from 'react';
import { Student } from '../types';
import { 
  parseStudentsFromText, 
  generateSampleStudents, 
  SAMPLE_PRESETS 
} from '../utils/csvParser';
import { soundEffects } from '../utils/audio';
import { 
  Upload, 
  FileText, 
  UserPlus, 
  Trash2, 
  Sparkles, 
  Users, 
  Search, 
  CheckCircle2, 
  X, 
  Download,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';

interface StudentManagerProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  onClearDrawnHistory?: () => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({
  students,
  onUpdateStudents,
  onClearDrawnHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'upload' | 'paste' | 'simulation'>('list');
  const [pastedText, setPastedText] = useState('');
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showFeedback = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Compute duplicate names across the entire student roster
  const duplicateInfo = useMemo(() => {
    const nameCountMap = new Map<string, number>();
    students.forEach((s) => {
      const trimmed = s.name.trim();
      nameCountMap.set(trimmed, (nameCountMap.get(trimmed) || 0) + 1);
    });

    const duplicateNamesSet = new Set<string>();
    nameCountMap.forEach((count, name) => {
      if (count > 1) {
        duplicateNamesSet.add(name);
      }
    });

    // Count how many redundant entries exist
    let redundantCount = 0;
    nameCountMap.forEach((count) => {
      if (count > 1) {
        redundantCount += count - 1;
      }
    });

    return {
      duplicateNamesSet,
      hasDuplicates: duplicateNamesSet.size > 0,
      redundantCount,
      uniqueCount: nameCountMap.size,
    };
  }, [students]);

  // Remove duplicate entries (keeps the first occurrence)
  const handleRemoveDuplicates = () => {
    if (!duplicateInfo.hasDuplicates) return;
    const seenNames = new Set<string>();
    const deduplicated: Student[] = [];

    students.forEach((s) => {
      const trimmed = s.name.trim();
      if (!seenNames.has(trimmed)) {
        seenNames.add(trimmed);
        deduplicated.push(s);
      }
    });

    const removedCount = students.length - deduplicated.length;
    onUpdateStudents(deduplicated);
    soundEffects.playClick();
    showFeedback(`已成功移除 ${removedCount} 筆重複學生資料！現在名單皆為不重複學生。`, 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = parseStudentsFromText(content);
        if (parsed.length > 0) {
          onUpdateStudents(parsed);
          onClearDrawnHistory?.();
          soundEffects.playFanfare();
          
          // Check if parsed list contains duplicates
          const seen = new Set<string>();
          let dupFound = false;
          for (const s of parsed) {
            if (seen.has(s.name.trim())) {
              dupFound = true;
              break;
            }
            seen.add(s.name.trim());
          }

          if (dupFound) {
            showFeedback(`成功匯入 ${parsed.length} 位學生！偵測到部分重複姓名，已在預覽標記。`, 'warning');
          } else {
            showFeedback(`成功匯入 ${parsed.length} 位學生名單！`, 'success');
          }
          setActiveTab('list');
        } else {
          showFeedback('無法從檔案中解析出學生姓名，請檢查檔案格式。', 'warning');
        }
      }
    };
    reader.readAsText(file, 'utf-8');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    const parsed = parseStudentsFromText(pastedText);
    if (parsed.length > 0) {
      onUpdateStudents(parsed);
      onClearDrawnHistory?.();
      soundEffects.playFanfare();

      const seen = new Set<string>();
      let dupFound = false;
      for (const s of parsed) {
        if (seen.has(s.name.trim())) {
          dupFound = true;
          break;
        }
        seen.add(s.name.trim());
      }

      if (dupFound) {
        showFeedback(`成功匯入 ${parsed.length} 位學生！偵測到重複姓名，已在預覽標記。`, 'warning');
      } else {
        showFeedback(`成功解析匯入 ${parsed.length} 位學生！`, 'success');
      }
      setPastedText('');
      setActiveTab('list');
    } else {
      showFeedback('未識別出學生姓名，請一行輸入一個姓名。', 'warning');
    }
  };

  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const trimmed = newName.trim();
    const newStudent: Student = {
      id: `student_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      number: newNumber.trim() || undefined,
    };

    onUpdateStudents([...students, newStudent]);
    soundEffects.playClick();
    setNewName('');
    setNewNumber('');
    showFeedback(`已新增學生：${newStudent.name}`);
  };

  const handleDeleteStudent = (id: string) => {
    const target = students.find(s => s.id === id);
    onUpdateStudents(students.filter(s => s.id !== id));
    soundEffects.playClick();
    if (target) {
      showFeedback(`已移除：${target.name}`, 'info');
    }
  };

  const handleClearAll = () => {
    if (students.length === 0) return;
    if (window.confirm('確定要清空目前所有的學生名單嗎？此操作無法撤銷。')) {
      onUpdateStudents([]);
      onClearDrawnHistory?.();
      soundEffects.playClick();
      showFeedback('已清空學生名單', 'info');
    }
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = SAMPLE_PRESETS.find(p => p.id === presetId);
    const sample = generateSampleStudents(presetId);
    onUpdateStudents(sample);
    onClearDrawnHistory?.();
    soundEffects.playFanfare();
    showFeedback(`已載入模擬名單「${preset?.title || '示範名單'}」！`, 'success');
    setActiveTab('list');
  };

  const handleExportCSV = () => {
    if (students.length === 0) return;
    const header = '座號,姓名\n';
    const rows = students.map((s, idx) => `${s.number || idx + 1},${s.name}`).join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `學生名單_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.number && s.number.includes(searchQuery))
  );

  return (
    <div id="student-manager-root" className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Feedback banner */}
      {feedback && (
        <div 
          id="manager-feedback-banner" 
          className={`px-4 py-2.5 text-sm flex items-center justify-between transition-all border-b ${
            feedback.type === 'warning' 
              ? 'bg-amber-50 border-amber-200 text-amber-900' 
              : feedback.type === 'info'
              ? 'bg-slate-100 border-slate-200 text-slate-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <span className="flex items-center gap-2">
            {feedback.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            {feedback.text}
          </span>
          <button 
            id="dismiss-feedback-btn"
            onClick={() => setFeedback(null)} 
            className="text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header with Navigation & Quick Actions */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800">學生名單管理</h2>
              <span id="student-count-badge" className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700">
                共 {students.length} 人
              </span>
              {duplicateInfo.hasDuplicates && (
                <span id="duplicate-warning-badge" className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 flex items-center gap-1 border border-amber-200">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  {duplicateInfo.redundantCount} 筆重複
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">支援模擬名單、CSV 上傳、貼上文字與重複姓名一鍵排查</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
          <button
            id="tab-view-list-btn"
            onClick={() => setActiveTab('list')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'list' 
                ? 'bg-white text-slate-800 shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            名單檢視 ({students.length})
          </button>
          <button
            id="tab-simulation-btn"
            onClick={() => setActiveTab('simulation')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'simulation' 
                ? 'bg-white text-indigo-700 shadow-xs font-semibold' 
                : 'text-indigo-600 hover:text-indigo-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            模擬名單
          </button>
          <button
            id="tab-upload-csv-btn"
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'upload' 
                ? 'bg-white text-slate-800 shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            上傳 CSV
          </button>
          <button
            id="tab-paste-text-btn"
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'paste' 
                ? 'bg-white text-slate-800 shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            貼上名單
          </button>
        </div>
      </div>

      {/* Content Body based on tab */}
      <div className="p-4 sm:p-6">
        {/* TAB 1: LIST VIEW */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            {/* Duplicate Detection Alert Banner with One-Click Removal */}
            {duplicateInfo.hasDuplicates && (
              <div 
                id="duplicate-alert-banner"
                className="p-3.5 sm:p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-0.5 sm:mt-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-amber-900">
                        偵測到 {duplicateInfo.duplicateNamesSet.size} 個重複姓名（共 {duplicateInfo.redundantCount} 筆贅餘資料）
                      </h4>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-200/80 font-medium text-amber-800">
                        需留意
                      </span>
                    </div>
                    <p className="text-xs text-amber-700 mt-1">
                      重複的姓名已在下方預覽標示為橘色醒目背景。點擊右側按鈕可一鍵為您保留首筆並清除多餘重複項目。
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {Array.from(duplicateInfo.duplicateNamesSet).map((name) => (
                        <span 
                          key={name}
                          className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-200 text-amber-900 border border-amber-300"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    id="remove-duplicates-btn"
                    onClick={handleRemoveDuplicates}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
                    title="一鍵清除重複姓名，只保留第一筆"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    一鍵清除所有重複姓名
                  </button>
                </div>
              </div>
            )}

            {/* Top Toolbar: Search + Quick Add + Sample Demo */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="student-search-input"
                  type="text"
                  placeholder="搜尋姓名或座號..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')} 
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="quick-simulation-btn"
                  onClick={() => setActiveTab('simulation')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/70 transition-colors cursor-pointer"
                  title="查看或載入各種情境的模擬名單"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  模擬名單範本
                </button>

                {students.length === 0 ? (
                  <button
                    id="load-sample-btn-primary"
                    onClick={() => handleLoadPreset('elementary_standard')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    載入 30 人標準名單
                  </button>
                ) : (
                  <>
                    <button
                      id="export-csv-btn"
                      onClick={handleExportCSV}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                      title="下載目前名單成 CSV 檔案"
                    >
                      <Download className="w-3.5 h-3.5" />
                      匯出名單 CSV
                    </button>
                    <button
                      id="clear-all-students-btn"
                      onClick={handleClearAll}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      清空名單
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Manual Single Student Add Form */}
            <form onSubmit={handleAddSingleStudent} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                快速新增單一學生：
              </span>
              <input
                id="single-student-number-input"
                type="text"
                placeholder="座號 (選填)"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                className="w-24 px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <input
                id="single-student-name-input"
                type="text"
                placeholder="學生姓名 (必填)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 min-w-[140px] px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
              <button
                id="submit-single-student-btn"
                type="submit"
                className="px-3 py-1 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                加入
              </button>
            </form>

            {/* Students Grid / Empty State */}
            {students.length === 0 ? (
              <div id="empty-roster-state" className="py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-slate-700">目前尚無學生名單</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  您可以點選「模擬名單」快速載入範本體驗抽籤與分組，也可點選「上傳 CSV」或「貼上名單」匯入真實班級名冊。
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <button
                    id="empty-load-sample-btn"
                    onClick={() => setActiveTab('simulation')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    探索模擬名單（快速體驗）
                  </button>
                  <button
                    id="empty-switch-upload-btn"
                    onClick={() => setActiveTab('upload')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-white transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    上傳名單檔案
                  </button>
                </div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                找不到符合「{searchQuery}」的學生
              </div>
            ) : (
              <div id="students-roster-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[400px] overflow-y-auto pr-1">
                {filteredStudents.map((student, idx) => {
                  const isDup = duplicateInfo.duplicateNamesSet.has(student.name.trim());
                  return (
                    <div
                      key={student.id}
                      id={`student-card-${student.id}`}
                      className={`group relative flex items-center justify-between p-2.5 rounded-lg border transition-all text-xs ${
                        isDup
                          ? 'border-amber-300 bg-amber-50/70 hover:bg-amber-100/70 text-amber-900 shadow-xs ring-1 ring-amber-300/60'
                          : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <span 
                          className={`shrink-0 w-6 h-6 rounded-md font-mono text-[11px] font-semibold flex items-center justify-center ${
                            isDup 
                              ? 'bg-amber-200 text-amber-900 font-bold' 
                              : 'bg-slate-100 group-hover:bg-indigo-100 group-hover:text-indigo-700 text-slate-600'
                          }`}
                        >
                          {student.number || (idx + 1).toString().padStart(2, '0')}
                        </span>
                        <div className="min-w-0 flex flex-col">
                          <span className={`truncate font-medium ${isDup ? 'text-amber-950 font-bold' : 'group-hover:text-indigo-900'}`}>
                            {student.name}
                          </span>
                          {isDup && (
                            <span className="text-[10px] text-amber-700 flex items-center gap-0.5 font-normal">
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                              姓名重複
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        id={`delete-student-${student.id}`}
                        onClick={() => handleDeleteStudent(student.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 rounded transition-opacity cursor-pointer"
                        title={`移除 ${student.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SIMULATION (模擬名單功能) */}
        {activeTab === 'simulation' && (
          <div className="space-y-4">
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-900 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-indigo-950">
                  為什麼需要「模擬名單」？
                </h3>
                <p className="mt-1 text-indigo-800 leading-relaxed">
                  讓老師無需在上課前手動整理名單，一鍵即可載入設計好的虛擬班級數據。您可以挑選標準班級體驗隨機抽籤與分組，也能載入「含重複姓名」的名單測試一鍵去重！
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {SAMPLE_PRESETS.map((preset) => {
                const isDuplicateTest = preset.id === 'duplicate_test';
                return (
                  <div
                    key={preset.id}
                    id={`preset-card-${preset.id}`}
                    className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/10 transition-all flex flex-col justify-between gap-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                          {isDuplicateTest ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Layers className="w-4 h-4 text-indigo-600" />
                          )}
                          {preset.title}
                        </h4>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                          isDuplicateTest 
                            ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                            : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {preset.size} 人
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {isDuplicateTest ? '含同名多筆資料' : '全體學生不重複'}
                      </span>
                      <button
                        id={`load-preset-btn-${preset.id}`}
                        onClick={() => handleLoadPreset(preset.id)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg text-white shadow-xs transition-all cursor-pointer ${
                          isDuplicateTest
                            ? 'bg-amber-600 hover:bg-amber-700'
                            : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                      >
                        載入此模擬名單
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: UPLOAD CSV */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/20 hover:bg-indigo-50/40 rounded-2xl p-8 text-center cursor-pointer transition-all"
            >
              <input
                ref={fileInputRef}
                id="csv-file-input"
                type="file"
                accept=".csv, .txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">點擊選擇 CSV 或 TXT 檔案，或拖曳至此處</p>
              <p className="text-xs text-slate-500 mt-1">
                支援格式：每行包含「座號, 姓名」或單純「姓名」欄位
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-xs text-indigo-700 font-medium">
                檔案格式示範：01,陳小明 或 陳小明
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-700">CSV 檔案格式說明：</p>
              <p>• 系統會自動過濾第一行的標題（如「座號,姓名」）。</p>
              <p>• 支援常見的分隔符號（逗號、Tab、空格）。</p>
              <p>• 若檔案包含 Excel 繁體中文名單，儲存為 CSV (UTF-8) 即可無縫解析。</p>
              <p>• 匯入後若發現有重複姓名，系統會自動在名單檢視中提示並提供一鍵去重功能。</p>
            </div>
          </div>
        )}

        {/* TAB 4: PASTE TEXT */}
        {activeTab === 'paste' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="paste-names-textarea" className="block text-xs font-semibold text-slate-700 mb-1.5">
                直接貼上學生名單（一行一個學生，或以空格/逗號分隔）：
              </label>
              <textarea
                id="paste-names-textarea"
                rows={7}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="例如：&#10;01 陳小明&#10;02 林雅婷&#10;03 黃冠宇&#10;張心怡&#10;李承翰"
                className="w-full p-3 text-sm rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                預估偵測到約 {pastedText.split(/\r?\n/).filter(l => l.trim()).length} 行文字
              </span>
              <div className="flex items-center gap-2">
                <button
                  id="paste-clear-btn"
                  onClick={() => setPastedText('')}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  清除
                </button>
                <button
                  id="paste-import-btn"
                  onClick={handlePasteSubmit}
                  disabled={!pastedText.trim()}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
                >
                  解析並匯入
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
