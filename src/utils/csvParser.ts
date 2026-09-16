import { Student } from '../types';

export function parseStudentsFromText(text: string): Student[] {
  if (!text || !text.trim()) return [];

  // Split by newlines or carriage returns
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const students: Student[] = [];

  // Common header words to skip
  const headerKeywords = ['姓名', 'name', 'student', '座號', '學號', '編號', 'no', 'number', 'id'];

  lines.forEach((line, index) => {
    // If it's the very first line and looks like a header, skip it
    if (index === 0) {
      const lower = line.toLowerCase();
      const isHeader = headerKeywords.some(kw => lower.includes(kw)) && lines.length > 1;
      if (isHeader) return;
    }

    // Parse CSV line taking commas, tabs, semicolons into account
    // If comma separated:
    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t');
    } else if (line.includes(',')) {
      parts = line.split(',');
    } else if (line.includes(';')) {
      parts = line.split(';');
    } else {
      // Space separated or single name (e.g. "01 王小明" or "王小明")
      const match = line.match(/^(\d+)[.、\s\t]+(.+)$/);
      if (match) {
        parts = [match[1], match[2]];
      } else {
        parts = [line];
      }
    }

    // Clean up parts (remove surrounding quotes)
    const cleaned = parts.map(p => p.trim().replace(/^["']|["']$/g, '')).filter(Boolean);

    if (cleaned.length === 0) return;

    let number: string | undefined = undefined;
    let name = '';

    if (cleaned.length === 1) {
      // Check if it's "01 王小明"
      const match = cleaned[0].match(/^(\d+)[.、\s\t]+(.+)$/);
      if (match) {
        number = match[1];
        name = match[2].trim();
      } else {
        name = cleaned[0];
      }
    } else {
      // Multiple columns, e.g. [ "1", "王小明" ] or [ "王小明", "1" ]
      const firstIsNum = /^\d+$/.test(cleaned[0]);
      const secondIsNum = /^\d+$/.test(cleaned[1]);

      if (firstIsNum) {
        number = cleaned[0];
        name = cleaned[1];
      } else if (secondIsNum) {
        name = cleaned[0];
        number = cleaned[1];
      } else {
        // Just pick first non-empty as name, or combine
        name = cleaned[0];
      }
    }

    if (name) {
      students.push({
        id: `student_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${index}`,
        name,
        number,
      });
    }
  });

  return students;
}

// Sample classroom data for quick start / demo
export const SAMPLE_STUDENTS: Omit<Student, 'id'>[] = [
  { number: '01', name: '陳小明' },
  { number: '02', name: '林雅婷' },
  { number: '03', name: '黃冠宇' },
  { number: '04', name: '張心怡' },
  { number: '05', name: '李承翰' },
  { number: '06', name: '王詩涵' },
  { number: '07', name: '吳政憲' },
  { number: '08', name: '劉又嘉' },
  { number: '09', name: '蔡欣妤' },
  { number: '10', name: '楊俊傑' },
  { number: '11', name: '許家瑋' },
  { number: '12', name: '鄭惠芬' },
  { number: '13', name: '謝宗翰' },
  { number: '14', name: '洪子萱' },
  { number: '15', name: '邱柏廷' },
  { number: '16', name: '曾郁婷' },
  { number: '17', name: '廖偉誠' },
  { number: '18', name: '賴宛君' },
  { number: '19', name: '徐志豪' },
  { number: '20', name: '周佳蓉' },
  { number: '21', name: '葉承峰' },
  { number: '22', name: '蘇怡潔' },
  { number: '23', name: '莊哲宇' },
  { number: '24', name: '江品萱' },
  { number: '25', name: '何彥霆' },
  { number: '26', name: '蕭佩雯' },
  { number: '27', name: '羅以安' },
  { number: '28', name: '高健智' },
  { number: '29', name: '潘郁馨' },
  { number: '30', name: '彭聖凱' },
];

// Sample classroom datasets for "模擬名單" feature
export interface SamplePreset {
  id: string;
  title: string;
  description: string;
  size: number;
  data: Omit<Student, 'id'>[];
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'elementary_standard',
    title: '三年二班完整名冊（30人）',
    description: '標準常態班級名冊，包含 01~30 號完整座號與姓名，適合完整體驗抽籤與分組。',
    size: 30,
    data: SAMPLE_STUDENTS,
  },
  {
    id: 'activity_group',
    title: '社團活動小組（16人）',
    description: '中型課外活動名單，適合快速測試 4 人一組或雙人對抗分組。',
    size: 16,
    data: [
      { number: '01', name: '林子晴' },
      { number: '02', name: '張凱文' },
      { number: '03', name: '陳思妤' },
      { number: '04', name: '黃柏睿' },
      { number: '05', name: '李佳穎' },
      { number: '06', name: '王俊傑' },
      { number: '07', name: '吳孟儒' },
      { number: '08', name: '劉恩齊' },
      { number: '09', name: '蔡羽彤' },
      { number: '10', name: '楊晨希' },
      { number: '11', name: '許庭瑋' },
      { number: '12', name: '鄭宇哲' },
      { number: '13', name: '謝品妍' },
      { number: '14', name: '洪聖祐' },
      { number: '15', name: '邱依婷' },
      { number: '16', name: '曾家豪' },
    ],
  },
  {
    id: 'duplicate_test',
    title: '含重複姓名測試名冊（24人，含重複）',
    description: '內含同名「陳小明」、「林雅婷」、「王詩涵」等重複資料，可立即測試「重複標記與一鍵清理」功能。',
    size: 24,
    data: [
      { number: '01', name: '陳小明' },
      { number: '02', name: '林雅婷' },
      { number: '03', name: '黃冠宇' },
      { number: '04', name: '陳小明' }, // duplicate
      { number: '05', name: '李承翰' },
      { number: '06', name: '王詩涵' },
      { number: '07', name: '吳政憲' },
      { number: '08', name: '林雅婷' }, // duplicate
      { number: '09', name: '蔡欣妤' },
      { number: '10', name: '楊俊傑' },
      { number: '11', name: '王詩涵' }, // duplicate
      { number: '12', name: '鄭惠芬' },
      { number: '13', name: '謝宗翰' },
      { number: '14', name: '洪子萱' },
      { number: '15', name: '邱柏廷' },
      { number: '16', name: '曾郁婷' },
      { number: '17', name: '廖偉誠' },
      { number: '18', name: '陳小明' }, // duplicate (3rd time)
      { number: '19', name: '徐志豪' },
      { number: '20', name: '周佳蓉' },
      { number: '21', name: '葉承峰' },
      { number: '22', name: '蘇怡潔' },
      { number: '23', name: '莊哲宇' },
      { number: '24', name: '江品萱' },
    ],
  },
  {
    id: 'quick_demo',
    title: '迷你快問快答組（8人）',
    description: '僅 8 位同學的迷你名單，幾秒鐘即可快速輪完一輪不重複抽籤。',
    size: 8,
    data: [
      { number: '01', name: '方語晨' },
      { number: '02', name: '杜宥騰' },
      { number: '03', name: '沈怡君' },
      { number: '04', name: '柯博文' },
      { number: '05', name: '范家瑜' },
      { number: '06', name: '溫宗翰' },
      { number: '07', name: '游舒涵' },
      { number: '08', name: '韓宇凡' },
    ],
  },
];

export function generateSampleStudents(presetId?: string): Student[] {
  const preset = SAMPLE_PRESETS.find(p => p.id === presetId) || SAMPLE_PRESETS[0];
  return preset.data.map((s, idx) => ({
    id: `student_sample_${preset.id}_${idx + 1}_${Math.random().toString(36).substring(2, 6)}`,
    name: s.name,
    number: s.number,
  }));
}
