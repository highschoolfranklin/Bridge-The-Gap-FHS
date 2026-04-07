// 
//  PARENT APP
// 

let linkedStudent = null;

async function initParentApp() {
  // Load linked student
  const { data: profile } = await supabase.from('profiles')
    .select('*').eq('id', currentProfile.linked_student_id).single();
  linkedStudent = profile;

  const buttons = document.querySelectorAll('#parent-app .tab-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('aria-current');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-current', 'true');
      loadParentSection(btn.dataset.tab);
    });
  });

  if (linkedStudent) {
    document.getElementById('parent-welcome').textContent =
      `Parent Dashboard — Viewing: ${linkedStudent.name}`;
  }

  loadParentSection('parent-overview');
  const firstTab = document.querySelector('#parent-app [data-tab="parent-overview"]');
  firstTab.classList.add('active');
  firstTab.setAttribute('aria-current', 'true');
  bindTablistKeyboard('#parent-app');
}

async function printParentSummary() {
  if (!linkedStudent) {
    showToast('No student linked to your account.', true);
    return;
  }
  await openStudentSummaryPrint(linkedStudent.id, {
    docTitle: 'Student progress summary (parent view)',
    subtitle: 'Read-only snapshot for your linked student.',
    studentName: linkedStudent.name,
    studentEmail: linkedStudent.email
  });
}

async function loadParentSection(type) {
  if (typeof trackTabView === 'function') trackTabView('parent', type);
  const content = document.getElementById('parent-content');
  content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading...</p></div>';

  if (!linkedStudent) {
    content.innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>No student linked.</h3><p>Your account isn\'t linked to a student. Please check your student code.</p></div>';
    return;
  }

  switch(type) {
    case 'parent-overview': await renderParentOverview(content); break;
    case 'parent-scholarships': await renderParentScholarships(content); break;
    case 'parent-sat': await renderParentSAT(content); break;
    case 'parent-colleges': await renderParentColleges(content); break;
    case 'parent-todo': await renderParentTodo(content); break;
    case 'parent-transcript': await renderParentTranscript(content); break;
  }
}

async function renderParentOverview(content) {
  const sid = linkedStudent.id;
  const [progressRes, satRes, scoresRes, todoRes] = await Promise.all([
    supabase.from('progress').select('*').eq('student_id', sid),
    supabase.from('sat_tracker').select('*').eq('student_id', sid).single(),
    supabase.from('sat_scores').select('*').eq('student_id', sid).order('created_at', { ascending: false }).limit(1),
    supabase.from('todos').select('*').eq('student_id', sid)
  ]);

  const progress = progressRes.data || [];
  const sat = satRes.data || {};
  const latestScore = scoresRes.data?.[0];
  const todos = todoRes.data || [];
  const doneTodos = todos.filter(t => t.completed).length;
  const finished = progress.filter(p => p.status === 'finished').length;
  const missed = progress.filter(p => p.status === 'deadline_missed').length;
  const inProgress = progress.filter(p => p.status === 'in_progress' || p.status === 'started').length;

  content.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">👁️ Overview — ${linkedStudent.name}</h2>
      <p class="section-desc">Here's a snapshot of your student's progress.</p>
    </div>

    <div class="overview-grid">
      <div class="overview-card green">
        <div class="overview-icon">💰</div>
        <div class="overview-stat">${finished}</div>
        <div class="overview-label">Tracked items completed</div>
      </div>
      <div class="overview-card yellow">
        <div class="overview-icon">🔵</div>
        <div class="overview-stat">${inProgress}</div>
        <div class="overview-label">In Progress</div>
      </div>
      <div class="overview-card red">
        <div class="overview-icon">❌</div>
        <div class="overview-stat">${missed}</div>
        <div class="overview-label">Deadlines Missed</div>
      </div>
      <div class="overview-card green">
        <div class="overview-icon">📝</div>
        <div class="overview-stat">${latestScore ? latestScore.score : 'N/A'}</div>
        <div class="overview-label">Latest SAT Practice Score</div>
      </div>
      <div class="overview-card yellow">
        <div class="overview-icon">💪</div>
        <div class="overview-stat">${sat.confidence ? sat.confidence.replace('_', ' ') : 'Not set'}</div>
        <div class="overview-label">SAT Confidence</div>
      </div>
      <div class="overview-card green">
        <div class="overview-icon">✅</div>
        <div class="overview-stat">${doneTodos} / ${todos.length}</div>
        <div class="overview-label">Tasks Completed</div>
      </div>
    </div>

    ${missed > 0 ? `
      <div class="alert-banner red-alert">
        ⚠️ Your student has missed ${missed} deadline(s). Check the Scholarship Progress tab for details.
      </div>
    ` : ''}

    ${!sat.sat_date ? `
      <div class="alert-banner yellow-alert">
        📅 Your student hasn't set their SAT date yet.
      </div>
    ` : ''}
  `;
}

async function renderParentScholarships(content) {
  const { data } = await supabase.from('progress')
    .select('*').eq('student_id', linkedStudent.id).order('created_at', { ascending: false });
  const items = data || [];

  const statusColors = { not_started:'#94a3b8', started:'#f59e0b', in_progress:'#3b82f6', finished:'#22c55e', deadline_missed:'#ef4444' };
  const statusLabels = { not_started:'🔲 Not Started', started:'🟡 Started', in_progress:'🔵 In Progress', finished:'✅ Finished', deadline_missed:'❌ Deadline Missed' };

  content.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">💰 Scholarship & Opportunity Progress</h2>
      <p class="section-desc">Read-only view of ${linkedStudent.name}'s tracker.</p>
    </div>
    ${items.length === 0 ? '<div class="empty-state"><div class="empty-icon">💰</div><h3>No items tracked yet.</h3></div>' : `
    <div class="progress-grid">
      ${items.map(item => `
        <div class="progress-card" style="border-left: 5px solid ${statusColors[item.status] || '#94a3b8'}">
          <span class="progress-type-badge">${item.type === 'scholarship' ? '💰' : '🌟'} ${item.type}</span>
          <h3>${item.title}</h3>
          ${item.deadline ? `<p class="deadline-text">📅 Deadline: ${item.deadline}</p>` : ''}
          <p><strong>Status:</strong> ${statusLabels[item.status] || item.status}</p>
        </div>
      `).join('')}
    </div>
    `}
  `;
}

async function renderParentSAT(content) {
  const { data: sat } = await supabase.from('sat_tracker').select('*').eq('student_id', linkedStudent.id).single();
  const { data: scores } = await supabase.from('sat_scores').select('*').eq('student_id', linkedStudent.id).order('created_at', { ascending: true });
  const s = sat || {};
  const scoreList = scores || [];
  const latest = scoreList[scoreList.length - 1];

  content.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">📝 SAT Progress — ${linkedStudent.name}</h2>
    </div>
    <div class="sat-grid">
      <div class="sat-card">
        <h3>📅 SAT Date</h3>
        <p class="big-value">${s.sat_date || 'Not set'}</p>
      </div>
      <div class="sat-card">
        <h3>🎯 Score Goal</h3>
        <p class="big-value">${s.goal_score || 'Not set'}</p>
      </div>
      <div class="sat-card">
        <h3>💪 Confidence</h3>
        <p class="big-value">${s.confidence ? s.confidence.replace(/_/g,' ') : 'Not set'}</p>
      </div>
      <div class="sat-card">
        <h3>📈 Latest Score</h3>
        <p class="big-value">${latest ? latest.score : 'No scores yet'}</p>
        ${s.goal_score && latest ? `<p>${s.goal_score - latest.score > 0 ? s.goal_score - latest.score + ' pts to goal' : '🎯 Goal Met!'}</p>` : ''}
      </div>
    </div>
    ${scoreList.length > 0 ? `
      <div class="score-log-section">
        <h3>Score History</h3>
        <div class="score-history">
          ${scoreList.map(s => `
            <div class="score-entry">
              <span class="score-val">${s.score}</span>
              <span class="score-date-label">${new Date(s.test_date || s.created_at).toLocaleDateString()}</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;
}

async function renderParentColleges(content) {
  const { data } = await supabase.from('college_research')
    .select('*').eq('student_id', linkedStudent.id).order('rank', { ascending: true });
  const colleges = data || [];

  const interestLabels = { very_interested:'⭐⭐⭐ Will Apply', interested:'⭐⭐ Considering', maybe:'⭐ Maybe', not_interested:'❌ Not Interested' };

  content.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">🏛️ College Research — ${linkedStudent.name}</h2>
    </div>
    ${colleges.length === 0 ? '<div class="empty-state"><div class="empty-icon">🏛️</div><h3>No colleges added yet.</h3></div>' : `
    <div id="college-list">
      ${colleges.map(c => `
        <div class="college-card">
          <div class="college-card-header">
            <div>
              <h3>${c.name}</h3>
              ${c.location ? `<p class="college-location">📍 ${c.location}</p>` : ''}
            </div>
            ${c.rank ? `<span class="rank-badge">#${c.rank}</span>` : ''}
          </div>
          ${c.notes ? `<div class="college-notes-display">${c.notes}</div>` : ''}
          <div class="college-meta">
            <span>${interestLabels[c.interest] || 'Interest not set'}</span>
          </div>
        </div>
      `).join('')}
    </div>
    `}
  `;
}

async function renderParentTodo(content) {
  const { data } = await supabase.from('todos')
    .select('*').eq('student_id', linkedStudent.id).order('created_at', { ascending: false });
  const todos = data || [];

  content.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">✅ To-Do List — ${linkedStudent.name}</h2>
      <p class="section-desc">Read-only view of your student's tasks.</p>
    </div>
    ${todos.length === 0 ? '<div class="empty-state"><div class="empty-icon">✅</div><h3>No tasks yet.</h3></div>' : `
    <div class="todo-list">
      ${todos.map(t => `
        <div class="todo-item ${t.completed ? 'todo-done' : ''}">
          <span class="todo-check-icon">${t.completed ? '✅' : '⬜'}</span>
          <div class="todo-content">
            <span class="todo-title-text">${t.title}</span>
            ${t.due_date ? `<span class="todo-due">📅 ${t.due_date}</span>` : ''}
            <span class="todo-type-badge">${t.type || 'general'}</span>
          </div>
        </div>
      `).join('')}
    </div>
    `}
  `;
}

async function renderParentTranscript(content) {
  const { data } = await supabase.from('transcripts')
    .select('*').eq('student_id', linkedStudent.id).order('uploaded_at', { ascending: false }).limit(1);
  const transcript = data?.[0];

  content.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">📄 Transcript — ${linkedStudent.name}</h2>
      <p class="section-desc">Uploaded by your student's counselor.</p>
    </div>
    ${transcript ? `
      <div class="transcript-card card-form">
        <p>📅 Uploaded: ${new Date(transcript.uploaded_at).toLocaleDateString()}</p>
        <p>📝 Notes: ${transcript.notes || 'None'}</p>
        <a href="${transcript.file_url}" target="_blank" class="save-btn" style="display:inline-block;margin-top:1rem">View Transcript PDF</a>
      </div>
    ` : '<div class="empty-state"><div class="empty-icon">📄</div><h3>No transcript uploaded yet.</h3><p>Your student\'s counselor will upload it here.</p></div>'}
  `;
}
