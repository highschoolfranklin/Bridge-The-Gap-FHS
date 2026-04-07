// Initialize Supabase //
var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

  const loginErr = document.getElementById('login-error');
  const signupErr = document.getElementById('signup-error');
  if (loginErr) { loginErr.textContent = ''; loginErr.style.color = ''; }
  if (signupErr) { signupErr.textContent = ''; signupErr.style.color = ''; }
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
  errorEl.style.color = '';

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
  if (errorEl) errorEl.style.color = '';

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
  const errBanner = document.getElementById('auth-profile-error');
  if (errBanner) errBanner.classList.add('hidden');

  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) {
    console.error('Profile not found:', error);
    document.getElementById('app').classList.add('hidden');
    document.getElementById('auth-screen').classList.remove('hidden');
    if (errBanner) errBanner.classList.remove('hidden');
    return;
  }
  currentProfile = data;
  routeToApp(data.role);
}

async function handleAuthProfileErrorSignOut() {
  await supabase.auth.signOut();
  currentUser = null;
  currentProfile = null;
  location.reload();
}

function openPrivacyModal() {
  const m = document.getElementById('privacy-modal');
  if (!m) return;
  m.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closePrivacyModal() {
  const m = document.getElementById('privacy-modal');
  if (!m) return;
  m.classList.add('hidden');
  document.body.style.overflow = '';
}

function bindTablistKeyboard(rootSelector) {
  const root = document.querySelector(rootSelector);
  if (!root) return;
  const tablist = root.querySelector('[role="tablist"]');
  if (!tablist) return;
  tablist.addEventListener('keydown', (e) => {
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    if (!tabs.length) return;
    let idx = tabs.indexOf(document.activeElement);
    if (idx < 0) {
      idx = tabs.findIndex(t => t.getAttribute('aria-current') === 'true');
      if (idx < 0) return;
    }
    let next = idx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      next = (idx + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      next = (idx - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      next = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      next = tabs.length - 1;
    } else {
      return;
    }
    tabs[next].focus();
    tabs[next].click();
  });
}

// Route to correct dashboard //
function routeToApp(role) {
  document.getElementById('auth-profile-error')?.classList.add('hidden');
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  ['student-app', 'parent-app', 'counselor-app'].forEach((id) => {
    document.getElementById(id)?.classList.add('hidden');
  });

  if (role === 'student') {
    document.getElementById('student-app').classList.remove('hidden');
    document.getElementById('student-welcome').textContent = `Welcome, ${currentProfile.name} 👋`;
    const codeEl = document.getElementById('student-code-display');
    const code = currentProfile.student_code;
    codeEl.textContent = code ? `Your Code: ${code}` : '';
    codeEl.classList.toggle('hidden', !code);
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
  const pilot = document.getElementById('pilot-mail-link');
  if (pilot && typeof PILOT_CONTACT_EMAIL !== 'undefined') {
    pilot.href = `mailto:${PILOT_CONTACT_EMAIL}?subject=${encodeURIComponent('The Hive — school pilot interest')}`;
  }

  document.getElementById('privacy-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'privacy-modal') closePrivacyModal();
  });

  document.getElementById('student-onboarding')?.addEventListener('click', (e) => {
    if (e.target.id === 'student-onboarding' && typeof dismissStudentOnboarding === 'function') dismissStudentOnboarding();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closePrivacyModal();
    if (typeof dismissStudentOnboarding === 'function') {
      const ob = document.getElementById('student-onboarding');
      if (ob && !ob.classList.contains('hidden')) dismissStudentOnboarding();
    }
  });

  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    currentUser = session.user;
    await loadProfile(currentUser.id);
  }
});
