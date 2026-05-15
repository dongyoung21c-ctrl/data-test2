export interface Student {
  id: string;
  name: string;
  avatar: string;
  stats: {
    achievement: number;
    avgTime: string;
    completionRate: number;
    repetition: number;
    qnaCount: number;
    community: '매우 높음' | '높음' | '보통' | '낮음' | '매우 낮음';
  };
  logs: string[];
}

export type QuadrantType = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface Strategy {
  id: string;
  studentId: string;
  studentName: string;
  quadrant: QuadrantType;
  strategy: string;
  userId: string;
  userName: string;
  userSchool: string;
  createdAt: any;
}

export interface UserProfile {
  name: string;
  school: string;
}
