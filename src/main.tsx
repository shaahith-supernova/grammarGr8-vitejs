import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BookOpen, User, CheckCircle2, AlertCircle, HelpCircle, LayoutDashboard, ShieldAlert } from 'lucide-react';

// --- APPLICATION STATE & MOCK DATABASE ---
const SAMPLE_LESSONS = [
  { id: 1, category: 'Sentence Basics', number: 1, title: 'Subjects and Predicates', explanation: 'The subject is who/what the sentence is about. The predicate tells what the subject does.', rule: 'Example: [The smart dog] (barked loudly).' },
  { id: 2, category: 'Present Simple Tense', number: 1, title: 'Third-Person Singular -S', explanation: 'Always add an -s or -es to the action word if the person doing it is a He, She, or It.', rule: 'Example: He walks. She fixes.' }
];

const SAMPLE_ACTIVITIES = [
  { id: 1, lessonId: 1, type: 'Multiple Choice', title: 'Find the Subject', instructions: 'Pick the complete subject of the sentence.', question: 'The enthusiastic teacher smiled at the Grade 8 class.', options: ['The enthusiastic teacher', 'smiled at', 'the Grade 8 class'], hint: 'Who is doing the smiling?', answer: 'The enthusiastic teacher', feedback: 'Excellent! "The enthusiastic teacher" is the subject performing the action.' },
  { id: 2, lessonId: 2, type: 'Fill in the Blank', title: 'Fix the Action Word', instructions: 'Type the correct form of the action word in brackets.', question: 'My clever best friend _______ (write) amazing stories.', hint: 'My best friend is a "he" or "she". Remember the regular rule!', answer: 'writes', feedback: 'Spot on! We add -s because "best friend" is singular third-person.' }
];

function App() {
  const [currentTab, setCurrentTab] = useState<'login' | 'dashboard' | 'lessons' | 'teacher'>('login');
  const [userRole, setUserRole] = useState<'student' | 'teacher'>('student');
  const [username, setUsername] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  
  // Activity Engine State
  const [userAnswer, setUserAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Simple Mock Login Logic
  const handleLogin = (role: 'student' | 'teacher') => {
    if (!username.trim()) return alert('Please type a username!');
    setUserRole(role);
    setCurrentTab(role === 'teacher' ? 'teacher' : 'dashboard');
  };

  const submitAnswer = (answer: string) => {
    const isRight = answer.trim().toLowerCase() === selectedActivity.answer.toLowerCase();
    setIsCorrect(isRight);
    setChecked(true);
  };

  return (
    <div class="max-w-md mx-auto bg-white min-h-screen shadow-xl flex flex-col justify-between font-sans pb-20">
      
      {/* HEADER BAR */}
      <header class="bg-indigo-600 text-white p-4 flex justify-between items-center rounded-b-2xl sticky top-0 z-10 shadow-md">
        <h1 class="text-xl font-bold tracking-tight">📝 GrammarUp! G8</h1>
        {currentTab !== 'login' && (
          <button onClick={() => setCurrentTab('login')} class="text-xs bg-indigo-700 px-3 py-1.5 rounded-full hover:bg-indigo-800 transition">
            Log Out
          </button>
        )}
      </header>

      {/* MAIN BODY AREA */}
      <main class="p-4 flex-grow">
        
        {/* LOGIN SCREEN */}
        {currentTab === 'login' && (
          <div class="py-8 space-y-6">
            <div class="text-center space-y-2">
              <div class="text-5xl">✨</div>
              <h2 class="text-2xl font-extrabold text-slate-800">Welcome Back!</h2>
              <p class="text-sm text-slate-500">Ready to level up your English skills?</p>
            </div>
            <div class="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
              <div>
                <label class="block text-xs font-bold uppercase text-slate-500 mb-1">Grammar Username</label>
                <input type="text" placeholder="e.g., student001" value={username} onChange={(e) => setUsername(e.target.value)} class="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
              </div>
              <div class="grid grid-cols-2 gap-3 pt-2">
                <button onClick={() => handleLogin('student')} class="bg-indigo-600 text-white font-bold p-3 rounded-xl text-sm shadow-sm hover:bg-indigo-700 transition">
                  🧑‍🎓 Student Log In
                </button>
                <button onClick={() => handleLogin('teacher')} class="bg-emerald-600 text-white font-bold p-3 rounded-xl text-sm shadow-sm hover:bg-emerald-700 transition">
                  👩‍🏫 Teacher Log In
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STUDENT DASHBOARD */}
        {currentTab === 'dashboard' && (
          <div class="space-y-5">
            <div class="bg-gradient-to-r from-indigo-500 to-purple-600 p-5 rounded-2xl text-white shadow-sm">
              <p class="text-xs opacity-80 font-medium">STUDENT PROFILE</p>
              <h3 class="text-xl font-bold mt-0.5">Hi, {username}! 👋</h3>
              <div class="mt-4 bg-white/20 h-2 rounded-full overflow-hidden">
                <div class="bg-white h-full w-1/3 rounded-full"></div>
              </div>
              <p class="text-xs mt-2 opacity-90 font-medium">Month 1 Progress: 33% Completed</p>
            </div>

            <h4 class="font-bold text-slate-800 text-base">Your Active Badges</h4>
            <div class="grid grid-cols-3 gap-3 text-center">
              <div class="p-3 bg-amber-50 border border-amber-100 rounded-xl"><span class="text-2xl">🔥</span><p class="text-[10px] font-bold text-amber-800 mt-1">First Step</p></div>
              <div class="p-3 bg-slate-100 opacity-40 rounded-xl"><span class="text-2xl">🎯</span><p class="text-[10px] font-medium text-slate-500 mt-1">Locked</p></div>
              <div class="p-3 bg-slate-100 opacity-40 rounded-xl"><span class="text-2xl">👑</span><p class="text-[10px] font-medium text-slate-500 mt-1">Locked</p></div>
            </div>

            <button onClick={() => setCurrentTab('lessons')} class="w-full bg-indigo-600 text-white font-bold p-4 rounded-xl shadow-md flex justify-center items-center gap-2 hover:bg-indigo-700 transition">
              <BookOpen size={18} /> Start Learning Right Now
            </button>
          </div>
        )}

        {/* LESSONS LIST & INTERACTIVE ACTIVITY LOOP */}
        {currentTab === 'lessons' && !selectedLesson && (
          <div class="space-y-4">
            <h3 class="text-lg font-bold text-slate-800">Your Grade 8 Grammar Path</h3>
            {SAMPLE_LESSONS.map((lesson) => (
              <div key={lesson.id} onClick={() => { setSelectedLesson(lesson); setSelectedActivity(SAMPLE_ACTIVITIES.find(a => a.lessonId === lesson.id)); setChecked(false); setShowHint(false); setUserAnswer(''); }} class="p-4 bg-white border-2 border-slate-100 hover:border-indigo-200 rounded-2xl shadow-sm cursor-pointer transition flex justify-between items-center">
                <div>
                  <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-500">{lesson.category}</span>
                  <h4 class="font-bold text-slate-800 text-sm mt-0.5">Lesson {lesson.number}: {lesson.title}</h4>
                </div>
                <span class="bg-indigo-50 text-indigo-600 p-2 rounded-xl text-xs font-bold">👉 Go</span>
              </div>
            ))}
          </div>
        )}

        {/* ACTIVE LESSON VIEW WITH INTERACTIVE ACTIVITY SYSTEM */}
        {currentTab === 'lessons' && selectedLesson && (
          <div class="space-y-4">
            <button onClick={() => { setSelectedLesson(null); setSelectedActivity(null); }} class="text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1.5 rounded-lg">
              ← Back to All Lessons
            </button>
            
            <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span class="text-[10px] font-bold text-indigo-500 uppercase">{selectedLesson.category}</span>
              <h3 class="text-base font-bold text-slate-800 mt-0.5">{selectedLesson.title}</h3>
              <p class="text-xs text-slate-600 mt-2 leading-relaxed">{selectedLesson.explanation}</p>
              <div class="mt-2 bg-indigo-50 border-l-4 border-indigo-500 p-2 text-xs text-indigo-800 font-mono italic rounded-r-lg">
                {selectedLesson.rule}
              </div>
            </div>

            {selectedActivity && (
              <div class="bg-white border-2 border-slate-100 p-4 rounded-2xl space-y-4 shadow-sm">
                <div class="flex justify-between items-center border-b pb-2">
                  <span class="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">{selectedActivity.type} Activity</span>
                  <button onClick={() => setShowHint(!showHint)} class="text-xs text-indigo-600 flex items-center gap-1 font-semibold">
                    <HelpCircle size={14} /> {showHint ? "Hide Hint" : "Need a Hint?"}
                  </button>
                </div>

                {showHint && (
                  <div class="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs">
                    💡 <strong>Hint:</strong> {selectedActivity.hint}
                  </div>
                )}

                <div class="space-y-2">
                  <p class="text-xs text-slate-500 italic">{selectedActivity.instructions}</p>
                  <p class="text-sm font-bold text-slate-800 bg-slate-50 p-3 rounded-xl">{selectedActivity.question}</p>
                </div>

                {/* ACTIVITY INPUT OPTIONS */}
                {selectedActivity.type === 'Multiple Choice' ? (
                  <div class="space-y-2">
                    {selectedActivity.options.map((opt: string) => (
                      <button key={opt} disabled={checked} onClick={() => { setUserAnswer(opt); submitAnswer(opt); }} class={`w-full text-left p-3 rounded-xl text-xs font-medium border transition ${userAnswer === opt ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div class="flex gap-2">
                    <input type="text" placeholder="Type answer here..." disabled={checked} value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} class="flex-grow p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                    <button disabled={checked} onClick={() => submitAnswer(userAnswer)} class="bg-indigo-600 text-white font-bold px-4 rounded-xl text-xs hover:bg-indigo-700 transition">Submit</button>
                  </div>
                )}

                {/* FRIENDLY ENCOURAGING CORRECTION ENGINE */}
                {checked && (
                  <div class={`p-4 rounded-xl border ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'} space-y-1.5`}>
                    <div class="flex items-center gap-1.5 font-bold text-sm">
                      {isCorrect ? <CheckCircle2 size={16} class="text-emerald-600" /> : <AlertCircle size={16} class="text-rose-600" />}
                      {isCorrect ? "Great job! ✨" : "Almost there! Look at it once more. ❤️"}
                    </div>
                    <p class="text-xs leading-relaxed">{selectedActivity.feedback}</p>
                    <p class="text-[10px] font-mono mt-1 opacity-80">Explanation: {selectedActivity.explanation}</p>
                    {!isCorrect && (
                      <button onClick={() => { setChecked(false); setUserAnswer(''); setShowHint(false); }} class="mt-2 text-xs font-bold text-indigo-600 underline block">Try Again</button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TEACHER DASHBOARD */}
        {currentTab === 'teacher' && (
          <div class="space-y-4">
            <div class="flex items-center gap-2 text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
              <ShieldAlert size={18} />
              <h3 class="text-sm font-bold">Teacher Workspace Dashboard</h3>
            </div>
            
            <div class="bg-slate-50 p-4 rounded-xl border space-y-3">
              <h4 class="text-xs font-bold uppercase text-slate-500">Student Progress Matrix</h4>
              <div class="space-y-2">
                <div class="flex justify-between items-center text-xs bg-white p-2.5 rounded-lg border">
                  <div>
                    <span class="font-bold text-slate-800">nethmi06</span>
                    <span class="text-[10px] text-slate-400 block">Class Group A</span>
                  </div>
                  <span class="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">85% Score</span>
                </div>
                <div class="flex justify-between items-center text-xs bg-white p-2.5 rounded-lg border">
                  <div>
                    <span class="font-bold text-slate-800">amila01</span>
                    <span class="text-[10px] text-slate-400 block">Class Group A</span>
                  </div>
                  <span class="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">62% Score</span>
                </div>
              </div>
            </div>

            <div class="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50">
              <p class="text-xs font-medium text-slate-500">Bulk CSV Class Import feature can be configured here in Phase 2.</p>
            </div>
          </div>
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION TRACK */}
      {currentTab !== 'login' && (
        <nav class="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-100 py-2.5 px-6 flex justify-around items-center rounded-t-2xl shadow-xl z-20">
          <button onClick={() => userRole === 'student' ? setCurrentTab('dashboard') : setCurrentTab('teacher')} class={`flex flex-col items-center gap-1 text-[10px] font-bold ${currentTab === 'dashboard' || currentTab === 'teacher' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button onClick={() => setCurrentTab('lessons')} class={`flex flex-col items-center gap-1 text-[10px] font-bold ${currentTab === 'lessons' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <BookOpen size={20} /> Practice Path
          </button>
        </nav>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);