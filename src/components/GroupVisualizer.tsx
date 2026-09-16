import React, { useState } from 'react';
import { Student, StudentGroup, GroupingMode } from '../types';
import { soundEffects } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Users, 
  Shuffle, 
  Copy, 
  Check, 
  Download, 
  Crown, 
  Sparkles, 
  Printer, 
  Settings2, 
  ArrowRightLeft,
  Info,
  Layers
} from 'lucide-react';

interface GroupVisualizerProps {
  students: Student[];
  onOpenRosterTab: () => void;
}

// Preset color themes for groups
const GROUP_COLORS = [
  {
    bg: 'bg-indigo-50/70',
    border: 'border-indigo-200',
    text: 'text-indigo-950',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    avatarBg: 'bg-indigo-600 text-white',
    avatarText: 'text-indigo-600',
  },
  {
    bg: 'bg-emerald-50/70',
    border: 'border-emerald-200',
    text: 'text-emerald-950',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    avatarBg: 'bg-emerald-600 text-white',
    avatarText: 'text-emerald-600',
  },
  {
    bg: 'bg-amber-50/70',
    border: 'border-amber-200',
    text: 'text-amber-950',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    avatarBg: 'bg-amber-600 text-white',
    avatarText: 'text-amber-600',
  },
  {
    bg: 'bg-purple-50/70',
    border: 'border-purple-200',
    text: 'text-purple-950',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    avatarBg: 'bg-purple-600 text-white',
    avatarText: 'text-purple-600',
  },
  {
    bg: 'bg-rose-50/70',
    border: 'border-rose-200',
    text: 'text-rose-950',
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
    avatarBg: 'bg-rose-600 text-white',
    avatarText: 'text-rose-600',
  },
  {
    bg: 'bg-cyan-50/70',
    border: 'border-cyan-200',
    text: 'text-cyan-950',
    badge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    avatarBg: 'bg-cyan-600 text-white',
    avatarText: 'text-cyan-600',
  },
  {
    bg: 'bg-teal-50/70',
    border: 'border-teal-200',
    text: 'text-teal-950',
    badge: 'bg-teal-100 text-teal-800 border-teal-200',
    avatarBg: 'bg-teal-600 text-white',
    avatarText: 'text-teal-600',
  },
  {
    bg: 'bg-orange-50/70',
    border: 'border-orange-200',
    text: 'text-orange-950',
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    avatarBg: 'bg-orange-600 text-white',
    avatarText: 'text-orange-600',
  },
  {
    bg: 'bg-blue-50/70',
    border: 'border-blue-200',
    text: 'text-blue-950',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    avatarBg: 'bg-blue-600 text-white',
    avatarText: 'text-blue-600',
  },
  {
    bg: 'bg-fuchsia-50/70',
    border: 'border-fuchsia-200',
    text: 'text-fuchsia-950',
    badge: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
    avatarBg: 'bg-fuchsia-600 text-white',
    avatarText: 'text-fuchsia-600',
  },
];

const ANIMAL_THEMES = ['神龍組', '雄鷹組', '白虎組', '海豚組', '靈狐組', '飛獅組', '獵豹組', '靈猿組', '夜梟組', '巨鯨組', '麒麟組', '玄武組'];
const ELEMENT_THEMES = ['烈火組', '澄海組', '疾風組', '大地組', '雷霆組', '晨曦組', '星曜組', '玄冰組', '熾陽組', '翠竹組', '流雲組', '幽月組'];

export const GroupVisualizer: React.FC<GroupVisualizerProps> = ({
  students,
  onOpenRosterTab,
}) => {
  const [groupingMode, setGroupingMode] = useState<GroupingMode>('by_member_count');
  const [memberCountPerGroup, setMemberCountPerGroup] = useState<number>(4);
  const [totalGroupCount, setTotalGroupCount] = useState<number>(5);
  const [balanceRemainder, setBalanceRemainder] = useState<boolean>(true);
  const [assignLeader, setAssignLeader] = useState<boolean>(true);
  const [namingStyle, setNamingStyle] = useState<'number' | 'animal' | 'element'>('number');
  
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [moveStudentModal, setMoveStudentModal] = useState<{ student: Student; sourceGroupId: string } | null>(null);

  // Calculate preview details
  const total = students.length;
  let targetGroupCount = 0;
  if (groupingMode === 'by_member_count') {
    const size = Math.max(1, memberCountPerGroup);
    targetGroupCount = balanceRemainder 
      ? Math.ceil(total / size) 
      : Math.floor(total / size) + (total % size > 0 ? 1 : 0);
  } else {
    targetGroupCount = Math.max(1, Math.min(totalGroupCount, total || 1));
  }

  const getGroupName = (idx: number) => {
    if (namingStyle === 'animal') {
      return ANIMAL_THEMES[idx % ANIMAL_THEMES.length] || `第 ${idx + 1} 組`;
    }
    if (namingStyle === 'element') {
      return ELEMENT_THEMES[idx % ELEMENT_THEMES.length] || `第 ${idx + 1} 組`;
    }
    return `第 ${idx + 1} 組`;
  };

  const handleStartGrouping = () => {
    if (students.length === 0) {
      alert('請先在學生名單中加入學生！');
      return;
    }

    setIsShuffling(true);
    soundEffects.playShuffle();

    setTimeout(() => {
      // Fisher-Yates shuffle of students
      const shuffled = [...students];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      let numGroups = 1;
      if (groupingMode === 'by_member_count') {
        const size = Math.max(1, memberCountPerGroup);
        if (balanceRemainder) {
          numGroups = Math.max(1, Math.ceil(shuffled.length / size));
        } else {
          numGroups = Math.max(1, Math.ceil(shuffled.length / size));
        }
      } else {
        numGroups = Math.max(1, Math.min(totalGroupCount, shuffled.length));
      }

      // Initialize groups
      const resultGroups: StudentGroup[] = Array.from({ length: numGroups }, (_, i) => ({
        id: `group_${i + 1}_${Date.now()}`,
        name: getGroupName(i),
        color: GROUP_COLORS[i % GROUP_COLORS.length],
        members: [],
      }));

      // Distribute students
      if (groupingMode === 'by_member_count' && !balanceRemainder) {
        // Strict chunking: fill up each group to size, leftover goes to last
        const size = memberCountPerGroup;
        let currGroupIdx = 0;
        shuffled.forEach((student) => {
          if (resultGroups[currGroupIdx].members.length >= size && currGroupIdx < numGroups - 1) {
            currGroupIdx++;
          }
          resultGroups[currGroupIdx].members.push(student);
        });
      } else {
        // Balanced round-robin distribution for even distribution
        shuffled.forEach((student, idx) => {
          const targetGroup = idx % numGroups;
          resultGroups[targetGroup].members.push(student);
        });
      }

      // Assign leader if requested
      if (assignLeader) {
        resultGroups.forEach(grp => {
          if (grp.members.length > 0) {
            const randLeaderIdx = Math.floor(Math.random() * grp.members.length);
            grp.leaderId = grp.members[randLeaderIdx].id;
          }
        });
      }

      setGroups(resultGroups);
      setIsShuffling(false);
      soundEffects.playFanfare();

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore
      }
    }, 450);
  };

  const handleCopyResults = () => {
    if (groups.length === 0) return;

    let text = `【班級分組名單】（共 ${students.length} 人，分成 ${groups.length} 組）\n\n`;
    groups.forEach((grp) => {
      const leader = grp.members.find(m => m.id === grp.leaderId);
      const membersText = grp.members.map(m => {
        const isL = m.id === grp.leaderId ? ' ⭐(組長)' : '';
        const num = m.number ? `[${m.number}]` : '';
        return `${num}${m.name}${isL}`;
      }).join('、');

      text += `${grp.name} (${grp.members.length}人)：\n${membersText}\n\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    soundEffects.playClick();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleExportCSV = () => {
    if (groups.length === 0) return;
    let csv = '組別,是否為組長,座號,學生姓名\n';
    groups.forEach((grp) => {
      grp.members.forEach((m) => {
        const isLeader = m.id === grp.leaderId ? '是' : '否';
        csv += `"${grp.name}","${isLeader}","${m.number || ''}","${m.name}"\n`;
      });
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `分組結果_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleLeader = (groupId: string, studentId: string) => {
    setGroups(groups.map(grp => {
      if (grp.id === groupId) {
        return {
          ...grp,
          leaderId: grp.leaderId === studentId ? undefined : studentId,
        };
      }
      return grp;
    }));
    soundEffects.playClick();
  };

  const handleMoveStudent = (targetGroupId: string) => {
    if (!moveStudentModal) return;
    const { student, sourceGroupId } = moveStudentModal;
    if (sourceGroupId === targetGroupId) {
      setMoveStudentModal(null);
      return;
    }

    setGroups(groups.map(grp => {
      if (grp.id === sourceGroupId) {
        return {
          ...grp,
          members: grp.members.filter(m => m.id !== student.id),
          leaderId: grp.leaderId === student.id ? undefined : grp.leaderId,
        };
      }
      if (grp.id === targetGroupId) {
        return {
          ...grp,
          members: [...grp.members, student],
        };
      }
      return grp;
    }));

    soundEffects.playClick();
    setMoveStudentModal(null);
  };

  return (
    <div id="group-visualizer-section" className="space-y-6">
      {/* Configuration Box */}
      <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">自動分組設定</h2>
              <p className="text-xs text-slate-500">
                可依「每組人數」或「指定組數」自由設定，並視覺化呈現小組分配
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 flex items-center gap-2">
            <span>學生總數：</span>
            <span className="font-bold text-slate-800">{total} 人</span>
          </div>
        </div>

        {/* Grouping Settings Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 text-xs sm:text-sm">
          {/* Mode Selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-indigo-600" />
              分組方式
            </label>
            <div className="flex rounded-lg border border-slate-200 bg-white p-1">
              <button
                type="button"
                id="group-mode-by-members-btn"
                onClick={() => setGroupingMode('by_member_count')}
                className={`flex-1 py-1.5 rounded-md font-medium text-xs transition-all ${
                  groupingMode === 'by_member_count'
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                每組人數
              </button>
              <button
                type="button"
                id="group-mode-by-groups-btn"
                onClick={() => setGroupingMode('by_group_count')}
                className={`flex-1 py-1.5 rounded-md font-medium text-xs transition-all ${
                  groupingMode === 'by_group_count'
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                指定組數
              </button>
            </div>
          </div>

          {/* Size / Count Input */}
          <div>
            {groupingMode === 'by_member_count' ? (
              <div>
                <label htmlFor="member-count-input" className="block font-semibold text-slate-700 mb-1.5">
                  每組幾人？
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="member-count-input"
                    type="number"
                    min={1}
                    max={Math.max(1, total)}
                    value={memberCountPerGroup}
                    onChange={(e) => setMemberCountPerGroup(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-slate-500 shrink-0 font-medium">人/組</span>
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="group-count-input" className="block font-semibold text-slate-700 mb-1.5">
                  要分成幾組？
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="group-count-input"
                    type="number"
                    min={1}
                    max={Math.max(1, total)}
                    value={totalGroupCount}
                    onChange={(e) => setTotalGroupCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-slate-500 shrink-0 font-medium">組</span>
                </div>
              </div>
            )}
          </div>

          {/* Group Naming Theme */}
          <div>
            <label htmlFor="group-naming-style-select" className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              組別名稱風格
            </label>
            <select
              id="group-naming-style-select"
              value={namingStyle}
              onChange={(e) => setNamingStyle(e.target.value as 'number' | 'animal' | 'element')}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm focus:outline-none"
            >
              <option value="number">標準編號（第 1 組、第 2 組...）</option>
              <option value="animal">動物神獸（神龍組、白虎組、靈狐組...）</option>
              <option value="element">自然元素（烈火組、澄海組、疾風組...）</option>
            </select>
          </div>
        </div>

        {/* Secondary Options */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                id="assign-leader-checkbox"
                type="checkbox"
                checked={assignLeader}
                onChange={(e) => setAssignLeader(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span className="font-medium text-slate-700 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                自動隨機指定小組長
              </span>
            </label>

            {groupingMode === 'by_member_count' && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="balance-remainder-checkbox"
                  type="checkbox"
                  checked={balanceRemainder}
                  onChange={(e) => setBalanceRemainder(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-700">
                  平均分散多餘人數（避免孤立小組）
                </span>
              </label>
            )}
          </div>

          <div className="text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span>預估分組：約可分成 <strong className="text-indigo-600">{targetGroupCount}</strong> 組</span>
          </div>
        </div>

        {/* Action button */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            id="start-grouping-btn"
            type="button"
            disabled={isShuffling || total === 0}
            onClick={handleStartGrouping}
            className={`px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base shadow-md flex items-center gap-2.5 transition-all cursor-pointer ${
              total === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-teal-600 hover:bg-teal-500 text-white hover:scale-105 active:scale-95 shadow-teal-600/20'
            }`}
          >
            <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
            {isShuffling ? '智慧隨機分配中...' : groups.length > 0 ? '重新隨機分組' : '開始自動分組'}
          </button>
        </div>
      </div>

      {/* Visual Groups Display Area */}
      {groups.length > 0 && (
        <div id="visualized-groups-container" className="space-y-4">
          {/* Top Bar for Results */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800">
                分組結果總覽
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                共 {groups.length} 組 / {students.length} 人
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                （點擊皇冠可變更組長，點擊換組圖標可微調成員）
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="copy-groups-text-btn"
                onClick={handleCopyResults}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors cursor-pointer"
                title="複製適合貼到 LINE 或 Google Classroom 的文字名冊"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '已複製名單！' : '複製名單文字'}
              </button>
              <button
                id="export-groups-csv-btn"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors cursor-pointer"
                title="匯出為 CSV 試算表"
              >
                <Download className="w-3.5 h-3.5" />
                匯出 CSV
              </button>
              <button
                id="print-groups-btn"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors cursor-pointer"
                title="列印或另存 PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                列印名單
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div id="group-cards-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {groups.map((group) => {
              return (
                <div
                  key={group.id}
                  id={`group-card-${group.id}`}
                  className={`rounded-2xl border ${group.color.border} ${group.color.bg} shadow-xs p-4 flex flex-col justify-between transition-all hover:shadow-md`}
                >
                  {/* Group Header */}
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${group.color.avatarBg}`} />
                        <h3 className={`font-bold text-base ${group.color.text}`}>
                          {group.name}
                        </h3>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${group.color.badge}`}>
                        {group.members.length} 人
                      </span>
                    </div>

                    {/* Member List */}
                    <div className="space-y-2">
                      {group.members.map((member) => {
                        const isLeader = member.id === group.leaderId;
                        return (
                          <div
                            key={member.id}
                            id={`group-member-${member.id}`}
                            className={`p-2 rounded-xl bg-white/95 border transition-all flex items-center justify-between text-xs ${
                              isLeader 
                                ? 'border-amber-300 ring-2 ring-amber-400/20 shadow-xs' 
                                : 'border-slate-200/70 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-1">
                              {/* Seat number */}
                              <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-500 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                                {member.number || '•'}
                              </span>
                              <span className="font-semibold text-slate-800 truncate">
                                {member.name}
                              </span>
                              {isLeader && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                                  <Crown className="w-2.5 h-2.5 text-amber-600" />
                                  組長
                                </span>
                              )}
                            </div>

                            {/* Quick adjust tools */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                id={`set-leader-btn-${member.id}`}
                                type="button"
                                onClick={() => handleToggleLeader(group.id, member.id)}
                                className={`p-1 rounded hover:bg-slate-100 transition-colors ${
                                  isLeader ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'
                                }`}
                                title={isLeader ? '取消組長身份' : '設為此組組長'}
                              >
                                <Crown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`move-student-btn-${member.id}`}
                                type="button"
                                onClick={() => setMoveStudentModal({ student: member, sourceGroupId: group.id })}
                                className="p-1 rounded text-slate-300 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                                title="換到其他組別"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State when no groups formed yet */}
      {groups.length === 0 && students.length > 0 && (
        <div id="groups-empty-state" className="p-10 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-700">準備好進行班級分組了嗎？</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            設定每組人數或組數後，點選上方「開始自動分組」按鈕，系統將以純隨機演算法將 {students.length} 位學生分配至各組。
          </p>
        </div>
      )}

      {/* Move Student Modal */}
      {moveStudentModal && (
        <div 
          id="move-student-modal-backdrop"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div 
            id="move-student-modal"
            className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95"
          >
            <div>
              <h3 className="font-bold text-base text-slate-800">調整學生組別</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                將 <strong>{moveStudentModal.student.name}</strong> 調動至哪一個小組？
              </p>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {groups.map((grp) => {
                const isCurrent = grp.id === moveStudentModal.sourceGroupId;
                return (
                  <button
                    key={grp.id}
                    id={`target-group-option-${grp.id}`}
                    disabled={isCurrent}
                    onClick={() => handleMoveStudent(grp.id)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-medium flex items-center justify-between border transition-all ${
                      isCurrent 
                        ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
                        : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700'
                    }`}
                  >
                    <span>{grp.name} ({grp.members.length}人)</span>
                    {isCurrent && <span className="text-[10px] text-slate-400">目前所在組</span>}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                id="cancel-move-student-btn"
                type="button"
                onClick={() => setMoveStudentModal(null)}
                className="px-4 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
