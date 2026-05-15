/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User, Clock, BarChart2, MessageSquare, BookOpen, 
  CheckCircle, AlertCircle, Users, Send, LogIn, School, 
  ChevronRight, BrainCircuit, Sparkles, Filter, Database,
  TrendingUp, Activity, Target
} from 'lucide-react';
import { 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  serverTimestamp, 
  query, 
  orderBy,
  doc,
  getDocFromServer
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

import { auth, db, APP_ID } from './services/firebase';
import { cn } from './lib/utils';
import { Student, QuadrantType, Strategy } from './types';

// --- Constants & Mock Data ---
const STUDENTS: Student[] = [
  {
    id: 's2',
    name: '이은지',
    avatar: 'EJ',
    stats: { achievement: 92, avgTime: '2m 10s', completionRate: 100, repetition: 3.5, qnaCount: 12, community: '매우 높음' },
    logs: [
      "AI 튜터와 심화 개념에 대해 15분 이상 대화함.",
      "학급 커뮤니티에서 동료 배움 활동을 주도함.",
      "형성평가 오답에 대해 스스로 메타 인지적 피드백을 기록함."
    ]
  },
  {
    id: 's3',
    name: '박현우',
    avatar: 'HW',
    stats: { achievement: 45, avgTime: '3m 40s', completionRate: 85, repetition: 4.2, qnaCount: 8, community: '보통' },
    logs: [
      "접속 시간은 길지만 실제 학습 액션으로 이어지지 않는 구간이 많음.",
      "기초 계산 원리 영상을 3회 이상 반복 시청 중.",
      "질문의 대부분이 절차적 도움 요청에 집중되어 있음."
    ]
  },
  {
    id: 's5',
    name: '강서윤',
    avatar: 'SY',
    stats: { achievement: 95, avgTime: '1m 20s', completionRate: 100, repetition: 1.5, qnaCount: 1, community: '매우 낮음' },
    logs: [
      "독자적인 학습 경로를 선호하며 고속 학습을 수행 중.",
      "협력 필기 도구에 참여하지 않고 본인 과제만 완수함.",
      "교사의 피드백 없이도 상위 성취를 유지하고 있음."
    ]
  },
  {
    id: 's8',
    name: '임소희',
    avatar: 'SH',
    stats: { achievement: 25, avgTime: '15s', completionRate: 30, repetition: 1.0, qnaCount: 0, community: '매우 낮음' },
    logs: [
      "문항 분석 결과 1초 미만 응답(찍기) 비율이 70% 이상.",
      "최근 일주일간 과제 제출 전 이탈 빈도가 급증함.",
      "학습 동기 저하로 인한 극심한 학습 부진 및 무기력 의심."
    ]
  },
  {
    id: 's6',
    name: '정민준',
    avatar: 'MJ',
    stats: { achievement: 85, avgTime: '2m 40s', completionRate: 100, repetition: 4.0, qnaCount: 9, community: '높음' },
    logs: [
      "모둠 프로젝트 시나리오에서 리더십 행동 로그가 수집됨.",
      "심화 도전 과제 수락률이 학급 내 상위 5%.",
      "실패 후 재시도 간격이 짧고 목표 지향적 태도를 보임."
    ]
  },
  {
    id: 's1',
    name: '김민수',
    avatar: 'MS',
    stats: { achievement: 88, avgTime: '45s', completionRate: 95, repetition: 1.1, qnaCount: 0, community: '낮음' },
    logs: [
      "최소한의 노력으로 고득점을 획득하는 '효율 중심' 패턴.",
      "선택적 심화 개념 읽기를 반복적으로 건너뜀.",
      "개인 성취는 높으나 학급 내 상호작용 의지가 부족함."
    ]
  },
  {
    id: 's7',
    name: '윤도현',
    avatar: 'DH',
    stats: { achievement: 52, avgTime: '4m 15s', completionRate: 90, repetition: 5.5, qnaCount: 15, community: '높음' },
    logs: [
      "학습 의욕은 높으나 핵심 원리 파악에 시간이 오래 걸림.",
      "문항 풀이 시 오답 발생 시 해설 및 유사 유형 무한 반복중.",
      "질문의 양은 많으나 구체적이지 않고 막연한 도움 요청이 많음."
    ]
  },
  {
    id: 's4',
    name: '최지아',
    avatar: 'JA',
    stats: { achievement: 32, avgTime: '25s', completionRate: 45, repetition: 1.2, qnaCount: 2, community: '낮음' },
    logs: [
      "학습 초기 이탈률이 매우 높으며 과제 제출 기한을 자주 넘김.",
      "영상 시청 로그가 10초 미만으로 대부분 스킵 처리됨.",
      "최근 수업 참여 로그가 불규칙하며 정서적 케어가 필요한 상태."
    ]
  },
  {
    id: 's9',
    name: '한승우',
    avatar: 'SW',
    stats: { achievement: 98, avgTime: '2m 30s', completionRate: 100, repetition: 2.1, qnaCount: 18, community: '매우 높음' },
    logs: [
      "AI 튜터와 함께 고난도 창의 융합 문제를 탐구함.",
      "학급 토론 채널에서 정교한 논리로 급우들의 신뢰가 높음.",
      "자기 주도적 학습 설계 능력이 뛰어나며 심화 주제를 발굴함."
    ]
  },
  {
    id: 's10',
    name: '조예린',
    avatar: 'YR',
    stats: { achievement: 94, avgTime: '55s', completionRate: 100, repetition: 1.0, qnaCount: 0, community: '매우 낮음' },
    logs: [
      "학습 속도가 매우 빨라 다른 학생들보다 2배 빠른 진도를 보임.",
      "혼자 과제를 완수하며 커뮤니티 활동에 일절 반응하지 않음.",
      "교사나 친구의 도움 없이 독자적으로 성취를 달성함."
    ]
  },
  {
    id: 's11',
    name: '오지훈',
    avatar: 'JH',
    stats: { achievement: 48, avgTime: '3m 50s', completionRate: 88, repetition: 4.8, qnaCount: 10, community: '보통' },
    logs: [
      "학습에 투자하는 시간은 많으나 효율이 떨어지는 '성실한 부진' 패턴.",
      "오답 노트 사용 빈도는 높지만 동일한 실수를 반복함.",
      "개념 이해를 위한 보조 영상 시청 시간이 매우 긺."
    ]
  },
  {
    id: 's12',
    name: '서하은',
    avatar: 'HE',
    stats: { achievement: 28, avgTime: '18s', completionRate: 25, repetition: 1.1, qnaCount: 1, community: '낮음' },
    logs: [
      "최근 2주간 접속 로그가 0건이며 학습 공백이 심각함.",
      "접속 시에도 문항을 읽지 않고 바로 제출하는 성향이 강함.",
      "기초 학력 미달 및 학습 무기력증에 대한 밀착 상담 필요."
    ]
  },
  {
    id: 's13',
    name: '백준호',
    avatar: 'JH',
    stats: { achievement: 91, avgTime: '2m 45s', completionRate: 100, repetition: 3.2, qnaCount: 14, community: '높음' },
    logs: [
      "모둠 활동 시 적극적으로 자료를 공유하고 피어 피드백을 제공함.",
      "학습 과정에서 발생하는 도전을 즐기며 끈기 있게 문제 해결.",
      "교과 외 심화 활동에 높은 관심을 보이며 프로젝트 리더로 활동."
    ]
  },
  {
    id: 's14',
    name: '권다은',
    avatar: 'DE',
    stats: { achievement: 90, avgTime: '1m 10s', completionRate: 98, repetition: 1.6, qnaCount: 2, community: '낮음' },
    logs: [
      "개인적인 목표 달성에 집중하며 타인과의 상호작용은 최소화함.",
      "학습 결과물은 완벽하지만 과정에서의 소통이 부족한 편.",
      "디지털 도구 활용 능력이 뛰어나며 자기 관리 역량이 우수함."
    ]
  },
  {
    id: 's15',
    name: '장지훈',
    avatar: 'JH',
    stats: { achievement: 42, avgTime: '4m 20s', completionRate: 82, repetition: 6.0, qnaCount: 20, community: '매우 높음' },
    logs: [
      "모르는 것을 부끄러워하지 않고 AI와 친구들에게 끊임없이 질문함.",
      "반복 시청 및 반복 풀이 횟수가 학급 내에서 가장 많음.",
      "노력에 비해 성취 상승 곡선이 완만하여 전략적 접근 필요."
    ]
  },
  {
    id: 's16',
    name: '송미래',
    avatar: 'MR',
    stats: { achievement: 22, avgTime: '10s', completionRate: 20, repetition: 1.0, qnaCount: 0, community: '매우 낮음' },
    logs: [
      "학습 플랫폼 로그인 후 1분 이내 로그아웃 비율이 90%.",
      "필수 제출물 누락이 습관화되어 있으며 무응답 비율이 높음.",
      "학습 흥미 유발을 위한 게이미피케이션 요소 등 특별 처방 필요."
    ]
  }
];

const QUADRANTS: Record<QuadrantType, { name: string; color: string; bullets: string[]; border: string; accent: string }> = {
  Q1: { 
    name: '고성취 · 고참여', 
    bullets: ['심화 및 확장 과제 제공', '주도적 프로젝트 리더십'],
    color: 'text-[#00AEEF]',
    border: 'border-[#00AEEF]',
    accent: 'bg-[#E6F7FE]'
  },
  Q2: { 
    name: '고성취 · 저참여', 
    bullets: ['도전감 및 의미 강화', '동료 튜터(Tutor) 역할 부여'],
    color: 'text-[#F58220]',
    border: 'border-[#F58220]',
    accent: 'bg-[#FFF6ED]'
  },
  Q3: { 
    name: '저성취 · 고참여', 
    bullets: ['기초 개념 보강 피드백', '작은 성공 경험 설계'],
    color: 'text-[#4460F1]',
    border: 'border-[#4460F1]',
    accent: 'bg-[#F1F4FF]'
  },
  Q4: { 
    name: '저성취 · 저참여', 
    bullets: ['관계 및 정서적 지원', '학습 진입 장벽 낮추기'],
    color: 'text-[#7A869A]',
    border: 'border-[#7A869A]',
    accent: 'bg-[#F4F5F7]'
  }
};

// --- Components ---

const StatCard = ({ icon: Icon, label, value, sub }: { icon: any, label: string, value: string | number, sub?: string }) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
    <div className="flex items-center gap-2 mb-3">
      <div className="p-2 rounded-lg bg-slate-50 text-slate-500">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-tight">{label}</span>
    </div>
    <div>
      <div className="text-2xl font-display font-bold text-slate-900">{value}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  </div>
);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  const [appState, setAppState] = useState<'login' | 'main'>('login');
  const [trainee, setTrainee] = useState({ name: '', school: '' });
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student>(STUDENTS[0]);
  const [selectedQuadrant, setSelectedQuadrant] = useState<QuadrantType | null>(null);
  const [strategyText, setStrategyText] = useState('');
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (submitStatus !== 'idle') {
      const timer = setTimeout(() => setSubmitStatus('idle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [submitStatus]);

  useEffect(() => {
    // @ts-ignore
    const initAuth = async () => {
      try {
        const initialToken = (window as any).__initial_auth_token;
        if (initialToken) {
          await signInWithCustomToken(auth, initialToken);
        } else {
          // Only attempt anonymous sign-in if no token is present and we're not already signing in
          try {
            await signInAnonymously(auth);
          } catch (anonErr: any) {
            if (anonErr.code === 'auth/admin-restricted-operation') {
              console.warn("Anonymous authentication is disabled in Firebase console. Please enable it or sign in via Google.");
            } else {
              throw anonErr;
            }
          }
        }
      } catch (err) {
        console.error("Auth Fail:", err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    // Validate connection
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (e) {
        // Expected if permission denied or doc doesn't exist, just testing connectivity
      }
    };
    testConnection();

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!APP_ID) return;

    // Unified Archive: listen to all strategies for this app instance
    const strategiesRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'strategies');
    
    const unsubscribe = onSnapshot(strategiesRef, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Strategy));
      // Local sort with null check for pending server timestamps
      setStrategies(data.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
        return timeB - timeA;
      }));
    }, (error) => {
      const path = `artifacts/${APP_ID}/public/data/strategies`;
      console.error(`Firestore List Error on path [${path}]:`, error);
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [APP_ID]);

  const handleSubmit = async () => {
    if (!selectedQuadrant || !strategyText.trim()) return;
    setIsSubmitting(true);
    const path = `artifacts/${APP_ID}/public/data/strategies`;
    
    try {
      const strategiesRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'strategies');
      await addDoc(strategiesRef, {
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        quadrant: selectedQuadrant,
        strategy: strategyText,
        userId: user?.uid || `guest-${trainee.name}`,
        userName: trainee.name || '익명 선생님',
        userSchool: trainee.school || '소속 미설정',
        createdAt: serverTimestamp()
      });
      setStrategyText('');
      setSelectedQuadrant(null);
      setSubmitStatus('success');
    } catch (err) {
      console.error("Strategy Save Error:", err);
      setSubmitStatus('error');
      handleFirestoreError(err, OperationType.CREATE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  const radarData = [
    { subject: '성취도', A: selectedStudent.stats.achievement, full: 100 },
    { subject: '참여도', A: selectedStudent.stats.completionRate, full: 100 },
    { subject: '상호작용', A: selectedStudent.stats.qnaCount * 8 > 100 ? 100 : selectedStudent.stats.qnaCount * 8, full: 100 },
    { subject: '끈기', A: selectedStudent.stats.repetition * 20 > 100 ? 100 : selectedStudent.stats.repetition * 20, full: 100 },
    { subject: '속도', A: parseInt(selectedStudent.stats.avgTime) > 120 ? 100 : 40, full: 100 },
  ];

  if (appState === 'login') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white max-w-lg w-full rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-12 overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-violet-500 to-indigo-500" />
          
          <div className="flex flex-col items-center text-center mb-10">
            <div className="bg-blue-600 p-5 rounded-3xl mb-6 shadow-xl shadow-blue-200/50">
              <BrainCircuit className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold text-slate-900 mb-3">학습데이터 분석기</h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              학습 로그 데이터를 기반으로<br />
              맞춤형 학습 처방을 설계하는 실습 대시보드입니다.
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); setAppState('main'); }} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-slate-400">
                  <School className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="소속 학교 입력"
                  value={trainee.school}
                  onChange={(e) => setTrainee({...trainee, school: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-medium"
                />
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="선생님 성함 입력"
                  value={trainee.name}
                  onChange={(e) => setTrainee({...trainee, name: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-medium"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={!trainee.name || !trainee.school}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-lg hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all mt-6 flex justify-center items-center gap-3 shadow-xl shadow-slate-900/10 active:scale-95"
            >
              커리큘럼 설계 시작
              <ChevronRight className="w-5 h-5" />
            </button>
          </form>
          
          <div className="mt-10 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            <Database className="w-3 h-3" />
            Powered by AI Edu Analytics
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-2.5 rounded-xl shadow-lg shadow-slate-200">
            <BrainCircuit className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-slate-900 tracking-tight">학습데이터 분석기</h1>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Live Classroom Sync</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-bold text-slate-800">{trainee.name} 선생님</span>
            <span className="text-[10px] text-slate-400 font-medium">{trainee.school}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold">
            {trainee.name.slice(0,1)}
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-8 grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left: Student Selector & Stats (4 columns) */}
        <div className="xl:col-span-4 space-y-8">
          
          {/* Selector */}
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                학급 명렬표
              </h2>
              <div className="p-1 px-2 rounded-md bg-slate-50 text-[10px] font-bold text-slate-400 border border-slate-100">
                TOTAL {STUDENTS.length}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {STUDENTS.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedStudent(s); setSelectedQuadrant(null); setStrategyText(''); }}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all active:scale-95",
                    selectedStudent.id === s.id 
                      ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200" 
                      : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm",
                    selectedStudent.id === s.id ? "bg-white/20" : "bg-slate-50"
                  )}>
                    {s.avatar}
                  </div>
                  <span className="text-xs font-bold">{s.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Individual Dashboard */}
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Sparkles className="w-24 h-24" />
            </div>
            
            <div className="flex items-center gap-5 mb-8">
              <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center text-white text-3xl font-display font-bold shadow-xl shadow-blue-200">
                {selectedStudent.avatar}
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider mb-2">
                  <Activity className="w-3 h-3" /> Monitoring
                </div>
                <h2 className="text-2xl font-display font-bold text-slate-900">{selectedStudent.name} 학생</h2>
                <div className="text-xs font-medium text-slate-400 mt-1">학습 로그 고유 ID: {selectedStudent.id}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <StatCard label="형성평가" value={`${selectedStudent.stats.achievement}%`} icon={Target} sub="최근 5개 단원 평균" />
              <StatCard label="진도율" value={`${selectedStudent.stats.completionRate}%`} icon={TrendingUp} sub="학기 단위 누적" />
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">역량 포트폴리오</h3>
                  <div className="text-[10px] text-blue-500 font-bold hover:underline cursor-pointer">상세 데이터</div>
                </div>
                <div className="h-64 w-full bg-slate-50 rounded-2xl flex items-center justify-center p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#CBD5E1" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} />
                      <Radar
                        name={selectedStudent.name}
                        dataKey="A"
                        stroke="#2563EB"
                        fill="#2563EB"
                        fillOpacity={0.6}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">AI 행동 교정 로그</h3>
                <div className="space-y-3">
                  {selectedStudent.logs.map((log, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-blue-200 transition-colors"
                    >
                      <div className="flex gap-3">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 group-hover:scale-150 transition-transform" />
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">{log}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right: Analysis & Collaboration (8 columns) */}
        <div className="xl:col-span-8 space-y-8">
          
          {/* Analysis View */}
          <section className="bg-white rounded-3xl p-10 shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">1</div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">성취도 × 참여도 매트릭스</h2>
                  <p className="text-slate-500 text-sm">학습 인지 영역(성취)과 정의적 영역(참여)을 결합하여 학생을 분류하세요.</p>
                </div>
              </div>
              
              <div className="bg-slate-100 p-1.5 rounded-xl flex gap-1 border border-slate-200">
                <button className="px-4 py-2 rounded-lg bg-white shadow-sm text-xs font-bold text-slate-900">분류 모드</button>
              </div>
            </div>

            {/* Matrix UI - Fixed Layout to match image (Q2 Q1 / Q4 Q3) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-14 relative p-1">
              {/* Axis Labels */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-200 -translate-x-1/2 z-0" />
              
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 text-xs font-bold text-slate-400">성취도 고</div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-8 text-xs font-bold text-slate-400">성취도 저</div>
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 -rotate-90 text-xs font-bold text-slate-400">참여도 저</div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 rotate-90 text-xs font-bold text-slate-400">참여도 고</div>

              {(['Q2', 'Q1', 'Q4', 'Q3'] as const).map((key) => {
                const info = QUADRANTS[key];
                const isSelected = selectedQuadrant === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedQuadrant(key)}
                    className={cn(
                      "flex flex-col p-6 rounded-2xl border-2 text-left transition-all relative z-10 min-h-[180px]",
                      isSelected 
                        ? `${info.border} ${info.accent} shadow-inner` 
                        : "bg-white border-slate-100 hover:border-slate-200"
                    )}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm",
                        isSelected ? `${info.border} bg-white ${info.color}` : "border-slate-100 text-slate-300"
                      )}>
                        {key}
                      </div>
                      {isSelected && <CheckCircle className={cn("w-6 h-6", info.color)} />}
                    </div>

                    <h3 className={cn("text-lg font-bold mb-3", info.color)}>
                      {info.name}
                    </h3>
                  </button>
                );
              })}
            </div>

            {/* Input Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">2</div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">맞춤형 지원 전략 수립</h2>
                  <p className="text-slate-500 text-sm">선택한 유형에 따라 이 학생에게 필요한 지도 방안을 작성해주세요.</p>
                </div>
              </div>
              
              <div className="relative">
                <textarea
                  value={strategyText}
                  onChange={(e) => setStrategyText(e.target.value)}
                  placeholder={selectedQuadrant ? `'${QUADRANTS[selectedQuadrant].name}' 학생을 위한 구체적인 지도 방안을 작성해 주세요.` : "먼저 위에서 매트릭스 사분면을 선택해주세요."}
                  disabled={!selectedQuadrant}
                  className="w-full min-h-[160px] p-6 rounded-2xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium leading-relaxed resize-none disabled:cursor-not-allowed"
                />
                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedQuadrant || !strategyText.trim() || isSubmitting}
                    className={cn(
                      "flex items-center gap-2 px-8 py-4 text-white rounded-xl font-bold text-md transition-all shadow-lg active:scale-95",
                      submitStatus === 'success' ? "bg-green-500" : 
                      submitStatus === 'error' ? "bg-red-500" : "bg-[#BFCDE0] hover:bg-blue-600 disabled:bg-[#DCE1EA]"
                    )}
                  >
                    {submitStatus === 'success' ? <CheckCircle className="w-5 h-5" /> : <Send className="w-4 h-4" />}
                    {isSubmitting ? '전략 공유 중...' : 
                     submitStatus === 'success' ? '공유 완료!' : 
                     submitStatus === 'error' ? '오류 발생' : '전략 공유하기'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Collaborative Archive - Styled like the image */}
          <section className="bg-white rounded-3xl p-10 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <Users className="w-6 h-6 text-blue-600" />
                동료 선생님들의 분석 및 전략
              </h2>
              <div className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1.5 rounded-full">
                {strategies.length}개의 의견
              </div>
            </div>

            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {strategies.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100"
                  >
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                    <p className="text-slate-400 font-bold">아직 작성된 전략이 없습니다.</p>
                  </motion.div>
                ) : (
                  strategies.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 rounded-2xl bg-[#F8FAFC] border border-slate-100 shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#E6F0FE] text-blue-600 flex items-center justify-center font-bold text-sm">
                            {item.studentName?.slice(0, 1) || '학'}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800">
                              <span className="text-blue-600">[{item.studentName}]</span> 대상 분석
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">
                              {item.userName} 선생님 ({item.userSchool})
                            </div>
                          </div>
                        </div>
                        <div className={cn(
                          "px-4 py-1.5 rounded-full border text-[11px] font-bold",
                          QUADRANTS[item.quadrant]?.accent, QUADRANTS[item.quadrant]?.color, QUADRANTS[item.quadrant]?.border
                        )}>
                          {QUADRANTS[item.quadrant]?.name}
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-slate-200/50">
                        <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                          {item.strategy}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </main>
      
      {/* Footer Info */}
      <footer className="max-w-[1400px] mx-auto px-8 py-10 border-t border-slate-200 mt-20 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <BrainCircuit className="text-slate-300 w-8 h-8" />
          <div className="text-left">
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">학습데이터 분석기 V 2.4.0</div>
            <div className="text-xs font-medium text-slate-400">© 2026 Educational Data Intelligence Lab.</div>
          </div>
        </div>
        <div className="flex gap-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
          <a href="#" className="hover:text-slate-900 transition-colors">Documentation</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Security Audit</a>
        </div>
      </footer>
    </div>
  );
}
