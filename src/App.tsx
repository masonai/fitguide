import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  History, 
  Dumbbell, 
  Calendar, 
  ChevronRight, 
  Trash2, 
  Sparkles,
  Save,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import ReactMarkdown from 'react-markdown';

import { Workout, Exercise, ExerciseCategory, Set } from './types';
import { getWorkoutRecommendation } from './lib/gemini';
import { cn } from './lib/utils';

const CATEGORIES: ExerciseCategory[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Other'];

export default function App() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'log' | 'history' | 'stats'>('log');

  // New Workout State
  const [newWorkout, setNewWorkout] = useState<Partial<Workout>>({
    date: new Date().toISOString(),
    exercises: [],
    notes: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('fitguide_workouts');
    if (saved) {
      try {
        setWorkouts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse workouts", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fitguide_workouts', JSON.stringify(workouts));
  }, [workouts]);

  const handleAddExercise = () => {
    const exercise: Exercise = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      category: 'Chest',
      sets: [{ reps: 0, weight: 0 }]
    };
    setNewWorkout(prev => ({
      ...prev,
      exercises: [...(prev.exercises || []), exercise]
    }));
  };

  const handleUpdateExercise = (id: string, updates: Partial<Exercise>) => {
    setNewWorkout(prev => ({
      ...prev,
      exercises: prev.exercises?.map(ex => ex.id === id ? { ...ex, ...updates } : ex)
    }));
  };

  const handleAddSet = (exerciseId: string) => {
    setNewWorkout(prev => ({
      ...prev,
      exercises: prev.exercises?.map(ex => 
        ex.id === exerciseId 
          ? { ...ex, sets: [...ex.sets, { reps: 0, weight: 0 }] } 
          : ex
      )
    }));
  };

  const handleUpdateSet = (exerciseId: string, setIndex: number, updates: Partial<Set>) => {
    setNewWorkout(prev => ({
      ...prev,
      exercises: prev.exercises?.map(ex => 
        ex.id === exerciseId 
          ? { 
              ...ex, 
              sets: ex.sets.map((s, i) => i === setIndex ? { ...s, ...updates } : s) 
            } 
          : ex
      )
    }));
  };

  const handleRemoveExercise = (id: string) => {
    setNewWorkout(prev => ({
      ...prev,
      exercises: prev.exercises?.filter(ex => ex.id !== id)
    }));
  };

  const handleSaveWorkout = () => {
    if (!newWorkout.exercises?.length) return;
    
    const workout: Workout = {
      id: Math.random().toString(36).substr(2, 9),
      date: newWorkout.date || new Date().toISOString(),
      exercises: newWorkout.exercises as Exercise[],
      notes: newWorkout.notes
    };

    setWorkouts(prev => [workout, ...prev]);
    setNewWorkout({ date: new Date().toISOString(), exercises: [], notes: '' });
    setIsAdding(false);
    setActiveTab('history');
  };

  const generateRecommendation = async () => {
    setIsGenerating(true);
    try {
      const rec = await getWorkoutRecommendation(workouts);
      setRecommendation(rec);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getChartData = () => {
    return workouts.slice().reverse().map(w => ({
      date: format(new Date(w.date), 'MM/dd'),
      volume: w.exercises.reduce((acc, ex) => 
        acc + ex.sets.reduce((sAcc, s) => sAcc + (s.reps * s.weight), 0), 0
      )
    }));
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-neutral-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">FitGuide</h1>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            기록하기
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 pb-24">
        {/* AI Recommendation Section */}
        <section className="mb-10">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl overflow-hidden relative">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-200" />
                  <h2 className="text-lg font-semibold">AI 맞춤 운동 추천</h2>
                </div>
                <button 
                  onClick={generateRecommendation}
                  disabled={isGenerating}
                  className="bg-white/20 hover:bg-white/30 disabled:opacity-50 px-3 py-1.5 rounded-full text-xs font-medium transition-colors backdrop-blur-sm"
                >
                  {isGenerating ? '분석 중...' : '추천받기'}
                </button>
              </div>
              
              {recommendation ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/10 rounded-2xl p-4 text-sm leading-relaxed backdrop-blur-sm border border-white/10 prose prose-invert prose-sm max-w-none"
                >
                  <ReactMarkdown>{recommendation}</ReactMarkdown>
                </motion.div>
              ) : (
                <p className="text-indigo-100 text-sm">
                  최근 운동 기록을 분석하여 오늘 가장 효율적인 운동 루틴을 추천해 드립니다.
                </p>
              )}
            </div>
            {/* Decorative circles */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -left-10 -top-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl" />
          </div>
        </section>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-neutral-200/50 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('log')}
            className={cn(
              "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
              activeTab === 'log' ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            대시보드
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
              activeTab === 'history' ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            기록
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={cn(
              "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
              activeTab === 'stats' ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            통계
          </button>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'log' && (
            <motion.div 
              key="log"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm">
                  <p className="text-neutral-500 text-xs font-medium mb-1">총 운동 횟수</p>
                  <p className="text-2xl font-bold">{workouts.length}회</p>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm">
                  <p className="text-neutral-500 text-xs font-medium mb-1">이번 주 운동</p>
                  <p className="text-2xl font-bold">
                    {workouts.filter(w => {
                      const d = new Date(w.date);
                      const now = new Date();
                      return d > new Date(now.setDate(now.getDate() - 7));
                    }).length}회
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600" />
                  최근 운동
                </h3>
                {workouts.length > 0 ? (
                  <div className="space-y-4">
                    {workouts.slice(0, 3).map(workout => (
                      <div key={workout.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-2xl">
                        <div>
                          <p className="font-medium text-sm">
                            {workout.exercises.map(e => e.name).join(', ').slice(0, 30)}
                            {workout.exercises.map(e => e.name).join(', ').length > 30 ? '...' : ''}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {format(new Date(workout.date), 'PPP', { locale: ko })}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-300" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-neutral-400 text-sm italic">
                    아직 기록된 운동이 없습니다.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {workouts.map(workout => (
                <div key={workout.id} className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">
                        {format(new Date(workout.date), 'MMMM d일 (E)', { locale: ko })}
                      </h3>
                      <p className="text-xs text-neutral-500">{format(new Date(workout.date), 'p')}</p>
                    </div>
                    <button 
                      onClick={() => setWorkouts(prev => prev.filter(w => w.id !== workout.id))}
                      className="text-neutral-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {workout.exercises.map(ex => (
                      <div key={ex.id} className="border-l-2 border-indigo-100 pl-4 py-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{ex.category}</span>
                          <span className="font-semibold text-sm">{ex.name}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {ex.sets.map((set, idx) => (
                            <span key={idx} className="text-xs bg-neutral-100 px-2 py-1 rounded-lg text-neutral-600">
                              {set.weight}kg × {set.reps}회
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {workout.notes && (
                    <div className="mt-4 pt-4 border-t border-neutral-100 text-sm text-neutral-600 italic">
                      "{workout.notes}"
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div 
              key="stats"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
                <h3 className="font-semibold mb-6">총 볼륨 트렌드 (kg)</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#999' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#999' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="volume" 
                        stroke="#4f46e5" 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: '#4f46e5', strokeWidth: 0 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add Workout Modal */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-2xl h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-[32px] sm:rounded-[32px] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between shrink-0">
                <h2 className="text-xl font-bold">새 운동 기록</h2>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Workout Info */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">날짜</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input 
                        type="datetime-local" 
                        value={newWorkout.date?.slice(0, 16)}
                        onChange={(e) => setNewWorkout(prev => ({ ...prev, date: new Date(e.target.value).toISOString() }))}
                        className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Exercises */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-neutral-400 uppercase">운동 목록</label>
                    <button 
                      onClick={handleAddExercise}
                      className="text-indigo-600 text-sm font-bold flex items-center gap-1 hover:text-indigo-700"
                    >
                      <Plus className="w-4 h-4" />
                      추가
                    </button>
                  </div>

                  {newWorkout.exercises?.map((ex, exIdx) => (
                    <div key={ex.id} className="bg-neutral-50 p-5 rounded-3xl border border-neutral-200 space-y-4 relative group">
                      <button 
                        onClick={() => handleRemoveExercise(ex.id)}
                        className="absolute top-4 right-4 text-neutral-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">운동 이름</label>
                          <input 
                            placeholder="예: 벤치 프레스"
                            value={ex.name}
                            onChange={(e) => handleUpdateExercise(ex.id, { name: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">부위</label>
                          <select 
                            value={ex.category}
                            onChange={(e) => handleUpdateExercise(ex.id, { category: e.target.value as ExerciseCategory })}
                            className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                          >
                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-4 px-2">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase">세트</span>
                          <span className="text-[10px] font-bold text-neutral-400 uppercase">무게 (kg)</span>
                          <span className="text-[10px] font-bold text-neutral-400 uppercase">횟수</span>
                        </div>
                        {ex.sets.map((set, setIdx) => (
                          <div key={setIdx} className="grid grid-cols-3 gap-4 items-center">
                            <div className="bg-white border border-neutral-200 rounded-xl py-2 text-center text-sm font-medium text-neutral-500">
                              {setIdx + 1}
                            </div>
                            <input 
                              type="number"
                              value={set.weight || ''}
                              onChange={(e) => handleUpdateSet(ex.id, setIdx, { weight: Number(e.target.value) })}
                              className="w-full px-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                            />
                            <input 
                              type="number"
                              value={set.reps || ''}
                              onChange={(e) => handleUpdateSet(ex.id, setIdx, { reps: Number(e.target.value) })}
                              className="w-full px-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                            />
                          </div>
                        ))}
                        <button 
                          onClick={() => handleAddSet(ex.id)}
                          className="w-full py-2 border-2 border-dashed border-neutral-200 rounded-xl text-xs font-bold text-neutral-400 hover:border-indigo-200 hover:text-indigo-400 transition-all"
                        >
                          + 세트 추가
                        </button>
                      </div>
                    </div>
                  ))}

                  {(!newWorkout.exercises || newWorkout.exercises.length === 0) && (
                    <div 
                      onClick={handleAddExercise}
                      className="border-2 border-dashed border-neutral-200 rounded-[32px] py-12 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/30 transition-all"
                    >
                      <div className="bg-neutral-100 p-3 rounded-full text-neutral-400">
                        <Plus className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium text-neutral-400">첫 번째 운동을 추가하세요</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">메모</label>
                  <textarea 
                    placeholder="오늘 운동은 어땠나요?"
                    value={newWorkout.notes}
                    onChange={(e) => setNewWorkout(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px] resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-neutral-100 shrink-0">
                <button 
                  onClick={handleSaveWorkout}
                  disabled={!newWorkout.exercises?.length}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  기록 저장하기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
