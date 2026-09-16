export interface Student {
  id: string;
  name: string;
  number?: string;
}

export interface DrawRecord {
  id: string;
  student: Student;
  timestamp: number;
}

export interface StudentGroup {
  id: string;
  name: string;
  color: {
    bg: string;
    border: string;
    text: string;
    badge: string;
    avatarBg: string;
    avatarText: string;
  };
  members: Student[];
  leaderId?: string;
}

export type GroupingMode = 'by_member_count' | 'by_group_count';
