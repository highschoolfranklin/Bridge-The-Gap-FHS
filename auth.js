// Initialize Supabase //
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Initialize EmailJS //
emailjs.init(EMAILJS_PUBLIC_KEY);

let currentUser = null;
let currentProfile = null;
let selectedRole = null;

// Auth Tab Switch //
function switchAuthTab(tab, e) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));

  if (e) e.currentTarget.classList.add('active');

  document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
  document.getElementById('signup-form').classList.toggle('hidden', tab !== 'signup');
}

// Role Selection //
function selectRole(role) {
  selectedRole = role;
  document.querySelectorAll('.role-option').forEach(o => o.classList.remove('active'));
  document.querySelector(`[data-role="${role}"]`).classList.add('active');
  document.querySelectorAll('.role-fields').forEach(f => f.classList.add('hidden'));
  document.getElementById(`${role}-fields`).classList.remove('hidden');
}

// Generate Student Code //
function generateStudentCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Sign Up //
async function handleSignup() {
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const name = document.getElementById('signup-name').value.trim();
  const errorEl = document.getElementById('signup-error');

  if (!email || !password || !name || !selectedRole) {
    errorEl.textContent = 'Please fill in all fields and select a role.';
    return;
  }

  if (password.length < 6) {
    errorEl.textContent = 'Password must be at least 6 characters.';
    return;
  }

  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    const userId = data.user.id;
    let profileData = { id: userId, email, name, role: selectedRole };

    if (selectedRole === 'student') {
      const studentId = document.getElementById('student-id').value.trim();
      const grade = document.getElementById('grade-level').value.trim();
      if (!studentId) { errorEl.textContent = 'Please enter your Student ID.'; return; }
      const studentCode = generateStudentCode();
      profileData = { ...profileData, student_id: studentId, grade_level: grade, student_code: studentCode };
    }

    if (selectedRole === 'parent') {
      const studentCode = document.getElementById('parent-student-code').value.trim().toUpperCase();
      if (!studentCode) { errorEl.textContent = 'Please enter your student\'s code.'; return; }
      // Find the student by code
      const { data: studentProfile, error: findError } = await supabase
        .from('profiles').select('id').eq('student_code', studentCode).single();
      if (findError || !studentProfile) {
        errorEl.textContent = 'Student code not found. Ask your student for their code.';
        return;
      }
      profileData = { ...profileData, linked_student_id: studentProfile.id };
    }

    if (selectedRole === 'counselor') {
      const dept = document.getElementById('counselor-dept').value.trim();
      profileData = { ...profileData, department: dept };
    }

    const { error: profileError } = await supabase.from('profiles').insert([profileData]);
    if (profileError) throw profileError;

    errorEl.style.color = '#2c632c';
    errorEl.textContent = 'Account created! Signing you in...';
    setTimeout(() => handleLogin(email, password), 1000);
  } catch (err) {
    errorEl.textContent = err.message || 'Signup failed. Please try again.';
  }
}

// Login //
async function handleLogin(emailOverride, passwordOverride) {
  const email = emailOverride || document.getElementById('login-email').value.trim();
  const password = passwordOverride || document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    currentUser = data.user;
    await loadProfile(currentUser.id);
  } catch (err) {
    if (errorEl) errorEl.textContent = err.message || 'Login failed.';
  }
}

// Load Profile & Route //
async function loadProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) {
    console.error('Profile not found:', error);
    return;
  }
  currentProfile = data;
  routeToApp(data.role);
}

// Route to correct dashboard //
function routeToApp(role) {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  if (role === 'student') {
    document.getElementById('student-app').classList.remove('hidden');
    document.getElementById('student-welcome').textContent = `Welcome, ${currentProfile.name} 👋`;
    document.getElementById('student-code-display').textContent = `Your Code: ${currentProfile.student_code}`;
    initStudentApp();
  } else if (role === 'parent') {
    document.getElementById('parent-app').classList.remove('hidden');
    document.getElementById('parent-welcome').textContent = `Parent Dashboard — ${currentProfile.name}`;
    initParentApp();
  } else if (role === 'counselor') {
    document.getElementById('counselor-app').classList.remove('hidden');
    document.getElementById('counselor-welcome').textContent = `Counselor Dashboard — ${currentProfile.name}`;
    initCounselorApp();
  }
}

// Sign Out //
async function signOut() {
  await supabase.auth.signOut();
  currentUser = null;
  currentProfile = null;
  location.reload();
}

// Check session on load//
window.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    currentUser = session.user;
    await loadProfile(currentUser.id);
  }
});
