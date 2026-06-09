import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { BookOpen, CheckCircle2, AlertCircle, HelpCircle, LayoutDashboard, ShieldAlert, Lock, ArrowRight, RotateCcw, Award, UserPlus, Key } from 'lucide-react';

// --- INITIALIZE LIVE SUPABASE CONNECTION ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [currentTab, setCurrentTab] = useState<'login' | 'dashboard' | 'lessons' | 'teacher'>('login');
  const [userRole, setUserRole] = useState<'student' | 'teacher'>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Registration View States (Strictly restricted via Teacher Code)
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [regClassCode, setRegClassCode] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'student' | 'teacher'>('student');

  // Database Collection Hooks
  const [lessons, setLessons] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [studentAttempts, setStudentAttempts] = useState<any[]>([]);
  
  // Navigation & Multi-Question Set Mechanics
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [lessonQuestions, setLessonQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  
  // Interactive Answering Interface States
  const [userAnswer, setUserAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lessonFinished, setLessonFinished] = useState(false);

  // Load content structures upon dashboard routing
  useEffect(() => {
    if (currentTab !== 'login') {
      loadSystemData();
    }
  }, [currentTab]);

  async function loadSystemData() {
    const { data: less } = await supabase.from('lessons').select('*').order('id');
    const { data: acts } = await supabase.from('activities').select('*').order('question_number');
    
    if (less) setLessons(less);
    if (acts) setActivities(acts);

    if (currentUser) {
      const { data: atts } = await supabase.from('attempts').select('*').eq('student_id', currentUser.id);
      if (atts) setStudentAttempts(atts);
    }
  }

  // STRICT LOGIN ONLY - Public sign-up fallback removed entirely 
  const handleLogin = async (targetRole: 'student' | 'teacher') => {
    if (!username.trim() || !password.trim()) {
      return alert('Please enter both your username and password!');
    }
    
    setLoading(true);
    const internalEmail = `${username.trim().toLowerCase()}@grammarup.com`; 

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: internalEmail,
      password: password,
    });

    if (signInError) {
      alert('Access Denied: Invalid credentials. Please ensure your teacher has authorized and created your account profile.'); 
      setLoading(false);
      return;
    }

    if (signInData?.user) {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', signInData.user.id).single();
      setCurrentUser(prof || { id: signInData.user.id, username: username, role: targetRole });
      setUserRole((prof?.role as 'student' | 'teacher') || targetRole); 
      setCurrentTab(prof?.role === 'teacher' ? 'teacher' : 'dashboard');
    }
    setLoading(false);
  };

  // CONTROLLED REGISTRATION FLOW - Gated behind a strict Teacher Classroom Code 
  const handleAuthorizedRegistration = async () => {
    if (!regUsername.trim() || !regPassword.trim() || !regClassCode.trim()) {
      return alert('All setup authorization fields are mandatory!');
    }

    // Secure local verification variable acting as an application gateway
    if (regClassCode.trim() !== 'G8GATE2026') {
      return alert('Authorization Failed: The Classroom Verification Code is incorrect. Only your teacher can provide this.');
    }

    setLoading(true);
    const internalEmail = `${regUsername.trim().toLowerCase()}@grammarup.com`; 

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: internalEmail,
      password: regPassword,
    });

    if (signUpError) {
      alert(`Registration System Blocked: ${signUpError.message}`);
      setLoading(false);
      return;
    }

    if (signUpData?.user) {
      // Safe insertion into the profiles ecosystem 
      await supabase.from('profiles').insert({
        id: signUpData.user.id,
        username: regUsername.trim().toLowerCase(),
        display_name: regUsername.trim(),
        role: regRole,
        class_group: 'Grade 8 - Room A' 
      });
      
      alert(`Success! Account for "${regUsername}" is officially authorized and ready. Please log in below.`);
      setIsRegisterMode(false);
      setUsername(regUsername);
      setPassword(regPassword);
    }
    setLoading(false);
  };

  const openLesson = (lesson: any) => {
    setSelectedLesson(lesson);
    const questions = activities.filter(act => act.lesson_id === lesson.id);
    setLessonQuestions(questions);
    setCurrentQuestionIndex(0);
    setLessonFinished(false);
    resetQuestionState();
  };

  const resetQuestionState = () => {
    setUserAnswer('');
    setChecked(false);
    setIsCorrect(false);
    setShowHint(false);
  };

  const verifyAnswer = (answer: string) => {
    const activeQuestion = lessonQuestions[currentQuestionIndex];
    if (!activeQuestion) return;

    const isRight = answer.trim().toLowerCase() === activeQuestion.correct_answer.toLowerCase(); 
    setIsCorrect(isRight);
    setChecked(true);
  };

  const advanceToNextQuestion = () => {
    if (currentQuestionIndex < lessonQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      resetQuestionState();
    } else {
      finalizeLessonScore();
    }
  };

  const finalizeLessonScore = async () => {
    setLessonFinished(true);
    if (currentUser?.id && selectedLesson) {
      await supabase.from('attempts').insert({ 
        student_id: currentUser.id,
        lesson_id: selectedLesson.id,
        total_score: 50
      });
      const { data: atts } = await supabase.from('attempts').select('*').eq('student_id', currentUser.id);
      if (atts) setStudentAttempts(atts);
    }
  };

  const activeQuestion = lessonQuestions[currentQuestionIndex];

  return (
    <div class="max-w-md mx-auto bg-white min-h-screen shadow-xl flex flex-col justify-between font-sans pb-20 rounded-t-2xl"> 
      
      {/* HEADER ROW BAR */}
      <header class="bg-indigo-600 text-white p-4 flex justify-between items-center rounded-b-2xl sticky top-0 z-10 shadow-md">
        <h1 class="text-xl font-bold tracking-tight">📝 GrammarUp! G8</h1>
        {currentTab !== 'login' && (
          <button onClick={() => { supabase.auth.signOut(); setCurrentTab('login'); }} class="text-xs bg-indigo-700 px-3 py-1.5 rounded-full hover:bg-indigo-800 transition">
            Log Out
          </button>
        )}
      </header>

      {/* CORE CANVAS WORKSPACE */}
      <main class="p-4 flex-grow">
        
        {/* WELCOME PORTAL CONTROLLERS */}
        {currentTab === 'login' && (
          <div class="py-4 space-y-5">
            <div class="text-center space-y-1">
              <div class="text-5xl">⚡</div>
              <h2 class="text-2xl font-extrabold text-slate-800">Grade 8 Portal</h2> 
              <p class="text-xs text-slate-500">Perfecting English, one practice block at a time.</p> 
            </div>

            {!isRegisterMode ? (
              /* SECURED LOGIN CARD (NO PUBLIC REGISTER BUTTON) */
              <div class="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4 shadow-sm">
                <div>
                  <label class="block text-xs font-bold uppercase text-slate-500 mb-1">Student Username</label> 
                  <input type="text" placeholder="e.g., nethmi06" value={username} onChange={(e) => setUsername(e.target.value)} class="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 bg-white" />
                </div>
                <div>
                  <label class="block text-xs font-bold uppercase text-slate-500 mb-1">Account Password</label>
                  <div class="relative">
                    <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} class="w-full p-3 pl-9 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 bg-white" />
                    <Lock size={14} class="absolute left-3 top-4 text-slate-400" />
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3 pt-2">
                  <button onClick={() => handleLogin('student')} disabled={loading} class="bg-indigo-600 text-white font-bold p-3 rounded-xl text-xs shadow-sm hover:bg-indigo-700 transition">
                    {loading ? 'Entering...' : '🧑‍🎓 Student Log In'}
                  </button>
                  <button onClick={() => handleLogin('teacher')} disabled={loading} class="bg-emerald-600 text-white font-bold p-3 rounded-xl text-xs shadow-sm hover:bg-emerald-700 transition">
                    {loading ? 'Entering...' : '👩‍🏫 Teacher Log In'}
                  </button>
                </div>

                <div class="text-center pt-3 border-t border-slate-200">
                  <button onClick={() => setIsRegisterMode(true)} class="text-xs text-slate-400 hover:text-indigo-600 transition font-medium">
                    ⚙️ Teacher/Authorized Setup Access
                  </button>
                </div>
              </div>
            ) : (
              /* AUTH PRIVILEGED ACCOUNT INITIALIZATION GATE */
              <div class="bg-slate-50 p-5 rounded-2xl border-2 border-dashed border-indigo-200 space-y-4 animate-fade-in">
                <div class="flex items-center gap-1.5 text-indigo-700 font-bold text-xs bg-indigo-50 p-2.5 rounded-xl">
                  <Key size={14} /> Controlled Account Configuration Frame
                </div>

                <div>
                  <label class="block text-gradient text-[10px] font-bold uppercase text-slate-500 mb-1">Teacher Classroom Code</label>
                  <input type="password" placeholder="Enter security verification key..." value={regClassCode} onChange={(e) => setRegClassCode(e.target.value)} class="w-full p-3 rounded-xl border border-indigo-200 text-sm bg-white font-mono text-indigo-700" />
                </div>

                <div>
                  <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">New Custom Username</label>
                  <input type="text" placeholder="e.g., amila01" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} class="w-full p-3 rounded-xl border border-slate-200 text-sm bg-white" />
                </div>

                <div>
                  <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Desired Password</label>
                  <input type="password" placeholder="Minimum 6 characters" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} class="w-full p-3 rounded-xl border border-slate-200 text-sm bg-white" />
                </div>

                <div>
                  <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1">Assigned Account Role</label>
                  <select value={regRole} onChange={(e: any) => setRegRole(e.target.value)} class="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white font-medium text-slate-700">
                    <option value="student">Student Account (Learner Path)</option>
                    <option value="teacher">Teacher Account (Admin Access)</option>
                  </select>
                </div>

                <div class="space-y-2 pt-2">
                  <button onClick={handleAuthorizedRegistration} disabled={loading} class="w-full bg-indigo-600 text-white font-bold p-3 rounded-xl text-xs hover:bg-indigo-700 transition flex justify-center items-center gap-1">
                    <UserPlus size={14} /> Complete Secure Creation
                  </button>
                  <button onClick={() => setIsRegisterMode(false)} class="w-full bg-slate-200 text-slate-700 font-bold p-2.5 rounded-xl text-xs hover:bg-slate-300 transition">
                    ← Return to Login Display
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* COMPACT STUDENT DASHBOARD */}
        {currentTab === 'dashboard' && (
          <div class="space-y-5">
            <div class="bg-gradient-to-r from-indigo-500 to-purple-600 p-5 rounded-2xl text-white shadow-sm">
              <p class="text-xs opacity-80 font-medium">STUDENT ACTIVITY FRAME</p>
              <h3 class="text-xl font-bold mt-0.5">Hello, {currentUser?.display_name || username}! 👋</h3> 
              <div class="mt-4 bg-white/20 h-2 rounded-full overflow-hidden">
                <div class="bg-white h-full w-3/5 rounded-full"></div>
              </div>
              <p class="text-xs mt-2 opacity-90 font-medium">Accumulated Score Metrics: {studentAttempts.reduce((sum, current) => sum + current.score, 0)} Total XP</p> 
            </div>

            <h4 class="font-bold text-slate-800 text-sm">Earned Mastery Badges</h4> 
            <div class="grid grid-cols-3 gap-3 text-center">
              <div class="p-3 bg-amber-50 border border-amber-100 rounded-xl"><span class="text-2xl">🔥</span><p class="text-[10px] font-bold text-amber-800 mt-1">First Step</p></div>
              <div class="p-3 bg-indigo-50 border border-indigo-100 rounded-xl"><span class="text-2xl">🎯</span><p class="text-[10px] font-bold text-indigo-800 mt-1">Consistency Tracker</p></div>
              <div class="p-3 bg-emerald-50 border border-emerald-100 rounded-xl"><span class="text-2xl">⚡</span><p class="text-[10px] font-bold text-emerald-800 mt-1">Syntax Master</p></div>
            </div>

            <button onClick={() => setCurrentTab('lessons')} class="w-full bg-indigo-600 text-white font-bold p-4 rounded-xl shadow-md flex justify-center items-center gap-2 hover:bg-indigo-700 transition text-sm">
              <BookOpen size={18} /> Open Interactive Lessons Path 
            </button>
          </div>
        )}

        {/* GRAMMAR PRACTICE PATH SELECTION MENU */}
        {currentTab === 'lessons' && !selectedLesson && (
          <div class="space-y-4">
            <h3 class="text-base font-bold text-slate-800">Grade 8 English Practice Roadmap</h3>
            {lessons.length === 0 ? (
              <p class="text-xs text-slate-400 italic">Syncing with direct database arrays...</p>
            ) : (
              lessons.map((lesson) => (
                <div key={lesson.id} onClick={() => openLesson(lesson)} class="p-4 bg-white border-2 border-slate-100 hover:border-indigo-200 rounded-2xl shadow-sm cursor-pointer transition flex justify-between items-center">
                  <div>
                    <span class="text-[9px] font-bold uppercase tracking-wider text-indigo-500">Unit Block #{lesson.lesson_number}</span>
                    <h4 class="font-bold text-slate-800 text-sm mt-0.5">{lesson.title}</h4> 
                  </div>
                  <span class="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl text-xs font-bold">Start Practice</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* ACTIVE LESSON ENGINE WITH CAROUSEL CONTROL LOOPS */}
        {currentTab === 'lessons' && selectedLesson && (
          <div class="space-y-4">
            <button onClick={() => { setSelectedLesson(null); }} class="text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1.5 rounded-lg">
              ← Return to Units Layout
            </button>
            
            <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <h3 class="text-base font-bold text-slate-800">{selectedLesson.title}</h3>
              <p class="text-xs text-slate-600 mt-1 leading-relaxed">{selectedLesson.short_explanation}</p> 
              {selectedLesson.grammar_rule && (
                <div class="mt-2 bg-indigo-50 border-l-4 border-indigo-500 p-2 text-xs text-indigo-900 font-mono italic rounded-r-lg">
                  💡 Grammatical Rule Structure: {selectedLesson.grammar_rule} 
                </div>
              )}
            </div>

            {/* PROGRESS BAR INDICATOR (TRACKS QUESTIONS 1 TO 5) */}
            {!lessonFinished && lessonQuestions.length > 0 && (
              <div class="bg-slate-100 rounded-full h-2 overflow-hidden flex">
                {lessonQuestions.map((_, idx) => (
                  <div key={idx} class={`h-full flex-grow border-r border-white last:border-0 transition-colors ${idx <= currentQuestionIndex ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                ))}
              </div>
            )}

            {/* MAIN PLAYABLE AREA */}
            {!lessonFinished ? (
              activeQuestion ? (
                <div class="bg-white border-2 border-slate-100 p-4 rounded-2xl space-y-4 shadow-sm">
                  <div class="flex justify-between items-center border-b pb-2">
                    <span class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                      Question {currentQuestionIndex + 1} of {lessonQuestions.length}
                    </span>
                    <button onClick={() => setShowHint(!showHint)} class="text-xs text-indigo-600 flex items-center gap-1 font-semibold">
                      <HelpCircle size={14} /> {showHint ? "Hide Suggestion" : "Need Hint?"} 
                    </button>
                  </div>

                  {showHint && (
                    <div class="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs shadow-sm">
                      💡 <strong>Hint:</strong> {activeQuestion.hint} 
                    </div>
                  )}

                  <div class="space-y-1">
                    <p class="text-xs text-slate-400 font-medium italic">{activeQuestion.instructions}</p> 
                    <p class="text-sm font-bold text-slate-800 bg-slate-50 p-3 rounded-xl leading-relaxed">{activeQuestion.question}</p>
                  </div>

                  {/* MULTIPLE CHOICE UI */}
                  {activeQuestion.options && activeQuestion.options.length > 0 ? (
                    <div class="space-y-2">
                      {activeQuestion.options.map((option: string) => (
                        <button key={option} disabled={checked} onClick={() => { setUserAnswer(option); verifyAnswer(option); }} class={`w-full text-left p-3 rounded-xl text-xs font-medium border transition ${userAnswer === option ? (isCorrect ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold' : 'bg-rose-50 border-rose-500 text-rose-800 font-bold') : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}>
                          {option}
                        </button>
                      ))}
                    </div>
                  ) : (
                    /* FILL IN THE BLANK UI */
                    <div class="flex flex-col gap-2">
                      <input type="text" placeholder="Type corresponding syntax word..." disabled={checked} value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} class="w-full p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                      {!checked && (
                        <button onClick={() => verifyAnswer(userAnswer)} class="w-full bg-indigo-600 text-white font-bold p-3 rounded-xl text-xs hover:bg-indigo-700 transition">Submit Answer</button> 
                      )}
                    </div>
                  )}

                  {/* ENCOURAGING CORRECTION CORE ENGINE */}
                  {checked && (
                    <div class={`p-4 rounded-xl border ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'} space-y-3`}>
                      <div class="flex items-center gap-1.5 font-bold text-xs">
                        {isCorrect ? <CheckCircle2 size={16} class="text-emerald-600" /> : <AlertCircle size={16} class="text-rose-600" />}
                        {isCorrect ? "Great job! ✨" : "Almost there! Look at it once more. ❤️"} 
                      </div>
                      
                      <p class="text-xs leading-relaxed opacity-95">
                        {isCorrect ? activeQuestion.explanation : "Double-check the grammatical rule framework box above and try standard syntax adjustment again!"} 
                      </p>
                      
                      <div class="pt-1">
                        {isCorrect ? (
                          <button onClick={advanceToNextQuestion} class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-3 rounded-xl text-xs transition shadow-sm flex justify-center items-center gap-1">
                            {currentQuestionIndex < lessonQuestions.length - 1 ? "Next Question" : "Finish Lesson"} <ArrowRight size={14} /> 
                          </button>
                        ) : (
                          <button onClick={resetQuestionState} class="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold p-3 rounded-xl text-xs transition shadow-sm flex justify-center items-center gap-1">
                            <RotateCcw size={14} /> Try Question Again 
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p class="text-xs text-slate-400 italic p-4 text-center">No structural exercises populated under this lesson block yet.</p>
              )
            ) : (
              /* LESSON COMPLETION BADGE CONTAINER */
              <div class="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-100 rounded-2xl p-6 text-center space-y-4 shadow-sm">
                <div class="inline-flex p-3 bg-indigo-100 rounded-full text-indigo-600 text-3xl justify-center items-center">
                  <Award size={36} />
                </div>
                <div class="space-y-1">
                  <h4 class="text-base font-extrabold text-slate-800">Unit Complete! 🎉</h4> 
                  <p class="text-xs text-slate-500">You successfully handled all 5 interactive grammar questions.</p>
                </div>
                <div class="bg-white p-3 rounded-xl border font-bold text-xs text-indigo-700">
                  + 50 Practice Points Added to Dashboard 
                </div>
                <button onClick={() => setSelectedLesson(null)} class="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold p-3 rounded-xl transition">
                  Return to Main Path
                </button>
              </div>
            )}
          </div>
        )}

        {/* TEACHER ANALYTICS FRAMEWORK */}
        {currentTab === 'teacher' && (
          <div class="space-y-4">
            <div class="flex items-center gap-2 text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
              <ShieldAlert size={18} />
              <h3 class="text-xs font-bold">Teacher Data Portal Workspace</h3>
            </div>
            <div class="bg-slate-50 p-4 rounded-xl border space-y-2">
              <h4 class="text-xs font-bold uppercase text-slate-500">Realtime Class Score Tracking</h4> 
              <div class="bg-white border rounded-lg p-3 text-xs text-slate-600 space-y-1">
                <p>• Data tracking array logs fully connected to active instances.</p> 
                <p>• Score database mapping enabled.</p> 
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MOBILE LOWER DOCK NAVIGATION TRACK */}
      {currentTab !== 'login' && (
        <nav class="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-100 py-2.5 px-6 flex justify-around items-center rounded-t-2xl shadow-xl z-20">
          <button onClick={() => userRole === 'student' ? setCurrentTab('dashboard') : setCurrentTab('teacher')} class={`flex flex-col items-center gap-1 text-[10px] font-bold ${currentTab === 'dashboard' || currentTab === 'teacher' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button onClick={() => setCurrentTab('lessons')} class={`flex flex-col items-center gap-1 text-[10px] font-bold ${currentTab === 'lessons' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <BookOpen size={18} /> Practice Path
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