import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { BookOpen, CheckCircle2, AlertCircle, HelpCircle, LayoutDashboard, ShieldAlert, Lock, ArrowRight, RotateCcw, Award, UserPlus, Key, Download, Users } from 'lucide-react';

// --- INITIALIZE LIVE SUPABASE CONNECTION ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [currentTab, setCurrentTab] = useState('login');
  const [userRole, setUserRole] = useState('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Registration View States (Strictly restricted via Teacher Code)
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [regClassCode, setRegClassCode] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('student');

  // Database Collection Hooks
  const [lessons, setLessons] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [studentAttempts, setStudentAttempts] = useState<any[]>([]);
  
  // Live Teacher Dashboard Hooks
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [allAttempts, setAllAttempts] = useState<any[]>([]);
  
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

  // Load content structures dynamically
  useEffect(() => {
    if (currentTab !== 'login' && currentUser) {
      loadSystemData(currentUser);
    }
  }, [currentTab]);

  async function loadSystemData(userObj = currentUser) {
    if (!userObj) return;
    
    // Fetch lessons and activities
    const { data: less } = await supabase.from('lessons').select('*').order('id');
    const { data: acts } = await supabase.from('activities').select('*').order('question_number');
    
    if (less) setLessons(less);
    if (acts) setActivities(acts);

    // Load individual student progress metrics
    const { data: atts } = await supabase.from('attempts').select('*').eq('student_id', userObj.id);
    if (atts) setStudentAttempts(atts);
    
    // If user is a Teacher, pull classroom management arrays
    if (userObj.role === 'teacher') {
      const { data: profilesData } = await supabase.from('profiles').select('*').eq('role', 'student');
      const { data: classAttempts } = await supabase.from('attempts').select('*');
      if (profilesData) setAllStudents(profilesData);
      if (classAttempts) setAllAttempts(classAttempts);
    }
  }

  // STRICT LOGIN ONLY
  const handleLogin = async (targetRole: string) => {
    if (!username.trim() || !password.trim()) {
      return alert('Please enter both your username and password!');
    }
    
    setLoading(true);
    const internalEmail = username.trim().toLowerCase() + "@grammarup.com";

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: internalEmail,
      password: password,
    });

    if (signInError) {
      alert('Access Denied: Invalid credentials. Please ensure your teacher has authorized your profile account.');
      setLoading(false);
      return;
    }

    if (signInData?.user) {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', signInData.user.id).single();
      const resolvedUser = prof || { id: signInData.user.id, username: username, role: targetRole, display_name: username };
      
      setCurrentUser(resolvedUser);
      setUserRole(resolvedUser.role || targetRole);
      
      // Route immediately to respective view
      setCurrentTab(resolvedUser.role === 'teacher' ? 'teacher' : 'dashboard');
      await loadSystemData(resolvedUser);
    }
    setLoading(false);
  };

  // CONTROLLED REGISTRATION FLOW
  const handleAuthorizedRegistration = async () => {
    if (!regUsername.trim() || !regPassword.trim() || !regClassCode.trim()) {
      return alert('All setup authorization fields are mandatory!');
    }

    if (regClassCode.trim() !== 'G8GATE2026') {
      return alert('Authorization Failed: Incorrect Classroom Verification Code.');
    }

    setLoading(true);
    const internalEmail = regUsername.trim().toLowerCase() + "@grammarup.com";

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: internalEmail,
      password: regPassword,
    });

    if (signUpError) {
      alert("Registration System Blocked: " + signUpError.message);
      setLoading(false);
      return;
    }

    if (signUpData?.user) {
      // Create user table record row
      await supabase.from('profiles').insert({
        id: signUpData.user.id,
        username: regUsername.trim().toLowerCase(),
        display_name: regUsername.trim(),
        role: regRole,
        class_group: 'Grade 8 - Room A'
      });
      
      alert("Success! Account for \"" + regUsername + "\" is officially authorized and ready.");
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
      // Securely save attempt record to Cloud
      await supabase.from('attempts').insert({
        student_id: currentUser.id,
        lesson_id: selectedLesson.id,
        total_score: 50 // Grants 50 base XP on completion
      });
      // Sync local hook array
      await loadSystemData(currentUser);
    }
  };

  // PURE JAVASCRIPT CSV CLIENT-SIDE EXPORT ENGINE
  const exportProgressCSV = () => {
    if (allStudents.length === 0) return alert("No student progress data available to export.");
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Student ID,Username,Display Name,Class Group,Total Lessons Completed,Total Score XP\n";
    
    allStudents.forEach(student => {
      const matchAttempts = allAttempts.filter(att => att.student_id === student.id);
      const totalScore = matchAttempts.reduce((sum, att) => sum + (att.total_score || 0), 0);
      csvContent += student.id + "," + student.username + "," + student.display_name + "," + (student.class_group || 'Grade 8') + "," + matchAttempts.length + "," + totalScore + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "grammarup_student_progress.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeQuestion = lessonQuestions[currentQuestionIndex];

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl flex flex-col justify-between font-sans pb-20 rounded-t-2xl">
      
      {/* HEADER ROW BAR */}
      <header className="bg-indigo-600 text-white p-4 flex justify-between items-center rounded-b-2xl sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold tracking-tight">📝 GrammarUp! G8</h1>
        {currentTab !== 'login' && (
          <button onClick={() => { supabase.auth.signOut(); setCurrentTab('login'); setCurrentUser(null); }} className="text-xs bg-indigo-700 px-3 py-1.5 rounded-full hover:bg-indigo-800 transition">
            Log Out
          </button>
        )}
      </header>

      {/* CORE CANVAS WORKSPACE */}
      <main className="p-4 flex-grow">
        
        {/* WELCOME PORTAL CONTROLLERS */}
        {currentTab === 'login' && (
          <div className="py-4 space-y-5">
            <div className="text-center space-y-1">
              <div className="text-5xl">⚡</div>
              <h2 className="text-2xl font-extrabold text-slate-800">Grade 8 Portal</h2>
              <p className="text-xs text-slate-500">Perfecting English, one practice block at a time.</p>
            </div>

            {!isRegisterMode ? (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4 shadow-sm">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Grade 8 Username</label>
                  <input type="text" placeholder="e.g., mala" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Account Password</label>
                  <div className="relative">
                    <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 pl-9 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 bg-white" />
                    <Lock size={14} className="absolute left-3 top-4 text-slate-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button onClick={() => handleLogin('student')} disabled={loading} className="bg-indigo-600 text-white font-bold p-3 rounded-xl text-xs shadow-sm hover:bg-indigo-700 transition">
                    🧑‍🎓 Student Log In
                  </button>
                  <button onClick={() => handleLogin('teacher')} disabled={loading} className="bg-emerald-600 text-white font-bold p-3 rounded-xl text-xs shadow-sm hover:bg-emerald-700 transition">
                    👩‍🏫 Teacher Log In
                  </button>
                </div>

                <div className="text-center pt-3 border-t border-slate-200">
                  <button onClick={() => setIsRegisterMode(true)} className="text-xs text-slate-400 hover:text-indigo-600 transition font-medium">
                    ⚙️ Teacher/Authorized Setup Access
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-5 rounded-2xl border-2 border-dashed border-indigo-200 space-y-4">
                <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs bg-indigo-50 p-2.5 rounded-xl">
                  <Key size={14} /> Controlled Account Configuration Frame
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Teacher Classroom Code</label>
                  <input type="password" placeholder="Enter security verification key..." value={regClassCode} onChange={(e) => setRegClassCode(e.target.value)} className="w-full p-3 rounded-xl border border-indigo-200 text-sm bg-white font-mono text-indigo-700" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">New Custom Username</label>
                  <input type="text" placeholder="e.g., mala" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 text-sm bg-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Desired Password</label>
                  <input type="password" placeholder="Minimum 6 characters" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 text-sm bg-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Assigned Account Role</label>
                  <select value={regRole} onChange={(e: any) => setRegRole(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white font-medium text-slate-700">
                    <option value="student">Student Account (Learner Path)</option>
                    <option value="teacher">Teacher Account (Admin Access)</option>
                  </select>
                </div>
                <div className="space-y-2 pt-2">
                  <button onClick={handleAuthorizedRegistration} disabled={loading} className="w-full bg-indigo-600 text-white font-bold p-3 rounded-xl text-xs hover:bg-indigo-700 transition flex justify-center items-center gap-1">
                    <UserPlus size={14} /> Complete Secure Creation
                  </button>
                  <button onClick={() => setIsRegisterMode(false)} className="w-full bg-slate-200 text-slate-700 font-bold p-2.5 rounded-xl text-xs hover:bg-slate-300 transition">
                    ← Return to Login Display
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* COMPACT STUDENT DASHBOARD */}
        {currentTab === 'dashboard' && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-5 rounded-2xl text-white shadow-sm">
              <p className="text-xs opacity-80 font-medium">STUDENT ACTIVITY FRAME</p>
              <h3 className="text-xl font-bold mt-0.5">Hello, {currentUser?.display_name || username}! 👋</h3>
              <div className="mt-4 bg-white/20 h-2 rounded-full overflow-hidden">
                <div className="bg-white h-full w-3/5 rounded-full"></div>
              </div>
              <p className="text-xs mt-2 opacity-90 font-medium">
                Accumulated Score Metrics: {studentAttempts.reduce((sum, current) => sum + (current.total_score || 0), 0)} Total XP
              </p>
            </div>

            <h4 className="font-bold text-slate-800 text-sm">Earned Mastery Badges</h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl"><span className="text-2xl">🔥</span><p className="text-[10px] font-bold text-amber-800 mt-1">First Step</p></div>
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl"><span className="text-2xl">🎯</span><p className="text-[10px] font-bold text-indigo-800 mt-1">Consistency</p></div>
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl"><span className="text-2xl">⚡</span><p className="text-[10px] font-bold text-emerald-800 mt-1">Syntax Pro</p></div>
            </div>

            <button onClick={() => setCurrentTab('lessons')} className="w-full bg-indigo-600 text-white font-bold p-4 rounded-xl shadow-md flex justify-center items-center gap-2 hover:bg-indigo-700 transition text-sm">
              <BookOpen size={18} /> Open Interactive Lessons Path
            </button>
          </div>
        )}

        {/* GRAMMAR PRACTICE PATH SELECTION MENU */}
        {currentTab === 'lessons' && !selectedLesson && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800">Grade 8 English Practice Roadmap</h3>
            {lessons.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Syncing with direct database arrays...</p>
            ) : (
              lessons.map((lesson) => (
                <div key={lesson.id} onClick={() => openLesson(lesson)} className="p-4 bg-white border-2 border-slate-100 hover:border-indigo-200 rounded-2xl shadow-sm cursor-pointer transition flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-500">Unit Block #{lesson.lesson_number}</span>
                    <h4 className="font-bold text-slate-800 text-sm mt-0.5">{lesson.title}</h4>
                  </div>
                  <span className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl text-xs font-bold">Start Practice</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* ACTIVE LESSON ENGINE */}
        {currentTab === 'lessons' && selectedLesson && (
          <div className="space-y-4">
            <button onClick={() => { setSelectedLesson(null); }} className="text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1.5 rounded-lg">
              ← Return to Units Layout
            </button>
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <h3 className="text-base font-bold text-slate-800">{selectedLesson.title}</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{selectedLesson.short_explanation}</p>
              {selectedLesson.grammar_rule && (
                <div className="mt-2 bg-indigo-50 border-l-4 border-indigo-500 p-2 text-xs text-indigo-900 font-mono italic rounded-r-lg">
                  💡 Grammatical Rule Structure: {selectedLesson.grammar_rule}
                </div>
              )}
            </div>

            {/* PROGRESS BAR INDICATOR */}
            {!lessonFinished && lessonQuestions.length > 0 && (
              <div className="bg-slate-100 rounded-full h-2 overflow-hidden flex">
                {lessonQuestions.map((_, idx) => (
                  <div key={idx} className={"h-full flex-grow border-r border-white last:border-0 transition-colors " + (idx <= currentQuestionIndex ? 'bg-indigo-600' : 'bg-slate-200')} />
                ))}
              </div>
            )}

            {!lessonFinished ? (
              activeQuestion ? (
                <div className="bg-white border-2 border-slate-100 p-4 rounded-2xl space-y-4 shadow-sm">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                      Question {currentQuestionIndex + 1} of {lessonQuestions.length}
                    </span>
                    <button onClick={() => setShowHint(!showHint)} className="text-xs text-indigo-600 flex items-center gap-1 font-semibold">
                      <HelpCircle size={14} /> {showHint ? "Hide Suggestion" : "Need Hint?"}
                    </button>
                  </div>

                  {showHint && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs shadow-sm">
                      💡 <strong>Hint:</strong> {activeQuestion.hint}
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-xs text-slate-400 font-medium italic">{activeQuestion.instructions}</p>
                    <p className="text-sm font-bold text-slate-800 bg-slate-50 p-3 rounded-xl leading-relaxed">{activeQuestion.question}</p>
                  </div>

                  {/* CHOOSE UI DYNAMICALLY BY ACTIVITY TYPE */}
                  {activeQuestion.options && activeQuestion.options.length > 0 ? (
                    <div className="space-y-2">
                      {activeQuestion.options.map((option: string) => (
                        <button key={option} disabled={checked} onClick={() => { setUserAnswer(option); verifyAnswer(option); }} className={"w-full text-left p-3 rounded-xl text-xs font-medium border transition " + (userAnswer === option ? (isCorrect ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold' : 'bg-rose-50 border-rose-500 text-rose-800 font-bold') : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700')}>
                          {option}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <input type="text" placeholder="Type corresponding syntax word..." disabled={checked} value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                      {!checked && (
                        <button onClick={() => verifyAnswer(userAnswer)} className="w-full bg-indigo-600 text-white font-bold p-3 rounded-xl text-xs hover:bg-indigo-700 transition">Submit Answer</button>
                      )}
                    </div>
                  )}

                  {checked && (
                    <div className={"p-4 rounded-xl border space-y-3 " + (isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900')}>
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        {isCorrect ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertCircle size={16} className="text-rose-600" />}
                        {isCorrect ? "Great job! ✨" : "Almost there! Look at it once more. ❤️"}
                      </div>
                      <p className="text-xs leading-relaxed opacity-95">
                        {isCorrect ? activeQuestion.explanation : "Double-check the grammar rule box above and try again!"}
                      </p>
                      <div className="pt-1">
                        {isCorrect ? (
                          <button onClick={advanceToNextQuestion} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-3 rounded-xl text-xs transition shadow-sm flex justify-center items-center gap-1">
                            {currentQuestionIndex < lessonQuestions.length - 1 ? "Next Question" : "Finish Lesson"} <ArrowRight size={14} />
                          </button>
                        ) : (
                          <button onClick={resetQuestionState} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold p-3 rounded-xl text-xs transition shadow-sm flex justify-center items-center gap-1">
                            <RotateCcw size={14} /> Try Question Again
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic p-4 text-center">No exercises populated here yet.</p>
              )
            ) : (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-100 rounded-2xl p-6 text-center space-y-4 shadow-sm">
                <div className="inline-flex p-3 bg-indigo-100 rounded-full text-indigo-600 text-3xl justify-center items-center">
                  <Award size={36} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-slate-800">Unit Complete! 🎉</h4>
                  <p className="text-xs text-slate-500">You completed the interactive grammar exercises.</p>
                </div>
                <div className="bg-white p-3 rounded-xl border font-bold text-xs text-indigo-700">
                  + 50 Practice Points Added to Dashboard
                </div>
                <button onClick={() => setSelectedLesson(null)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold p-3 rounded-xl transition">
                  Return to Main Path
                </button>
              </div>
            )}
          </div>
        )}

        {/* LIVE TEACHER ANALYTICS DASHBOARD */}
        {currentTab === 'teacher' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} />
                <h3 className="text-xs font-bold">Teacher Workspace Portal</h3>
              </div>
              <button onClick={exportProgressCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition shadow-sm">
                <Download size={12} /> Export CSV
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
              <div className="flex items-center gap-1 text-slate-700 font-bold text-xs">
                <Users size={14} /> Active Class Progress Tracking ({allStudents.length} Students)
              </div>

              {allStudents.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No registered student accounts found.</p>
              ) : (
                <div className="space-y-2.5">
                  {allStudents.map(student => {
                    const matchAttempts = allAttempts.filter(att => att.student_id === student.id);
                    const totalScore = matchAttempts.reduce((sum, att) => sum + (att.total_score || 0), 0);
                    
                    return (
                      <div key={student.id} className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="text-xs font-bold text-slate-800">{student.display_name}</h5>
                            <p className="text-[10px] text-slate-400 font-mono">@{student.username}</p>
                          </div>
                          <span className="bg-slate-100 text-slate-600 font-bold text-[9px] px-2 py-0.5 rounded-md">
                            {student.class_group || 'Grade 8'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 border-t pt-2 text-[10px] text-slate-500 font-medium">
                          <div>📚 Completed: <span className="text-slate-800 font-bold">{matchAttempts.length} Units</span></div>
                          <div className="text-right">🏆 Total Score: <span className="text-indigo-600 font-bold">{totalScore} XP</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MOBILE LOWER DOCK NAVIGATION TRACK */}
      {currentTab !== 'login' && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-100 py-2.5 px-6 flex justify-around items-center rounded-t-2xl shadow-xl z-20">
          <button onClick={() => userRole === 'student' ? setCurrentTab('dashboard') : setCurrentTab('teacher')} className={"flex flex-col items-center gap-1 text-[10px] font-bold " + (currentTab === 'dashboard' || currentTab === 'teacher' ? 'text-indigo-600' : 'text-slate-400')}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button onClick={() => setCurrentTab('lessons')} className={"flex flex-col items-center gap-1 text-[10px] font-bold " + (currentTab === 'lessons' ? 'text-indigo-600' : 'text-slate-400')}>
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