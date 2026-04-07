//
//  COUNSELOR APP
// 
async function initCounselorApp() {
  const buttons = document.querySelectorAll('#counselor-app .tab-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('aria-current');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-current', 'true');
      loadCounselorSection(btn.dataset.tab);
    });
  });
  loadCounselorSection('counselor-students');
  const firstTab = document.querySelector('#counselor-app [data-tab="counselor-students"]');
  firstTab.classList.add('active');
  firstTab.setAttribute('aria-current', 'true');
  bindTablistKeyboard('#counselor-app');
}

async function printCounselorRosterSummary() {
  if (!currentProfile) return;
  const { data: students } = await supabase.from('profiles')
    .select('id, name, email, grade_level, student_id')
    .eq('role', 'student')
    .eq('counselor_email', currentProfile.email);
  const { data: notifs } = await supabase.from('counselor_notifications')
    .select('*')
    .eq('counselor_email', currentProfile.email)
    .order('created_at', { ascending: false })
    .limit(40);

  const roster = students || [];
  const list = notifs || [];
  const counselorName = escapeHtml(currentProfile.name);
  const generated = new Date().toLocaleString();

  const rosterRows = roster.length
    ? roster.map(s => `<tr><td>${escapeHtml(s.name)}</td><td>${escapeHtml(s.email || '')}</td><td>${escapeHtml(s.grade_level || '—')}</td><td>${escapeHtml(s.student_id || '—')}</td></tr>`).join('')
    : '<tr><td colspan="4">No students have added your email yet.</td></tr>';

  const notifRows = list.length
    ? list.map(n => `<tr><td>${escapeHtml(n.student_name || '')}</td><td>${escapeHtml(n.type || '')}</td><td>${escapeHtml((n.message || '').slice(0, 200))}</td><td>${escapeHtml(new Date(n.created_at).toLocaleDateString())}</td></tr>`).join('')
    : '<tr><td colspan="4">No recent requests.</td></tr>';

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Counselor workspace summary</title>
<style>
body{font-family:system-ui,sans-serif;padding:1.5rem;max-width:900px;margin:0 auto;color:#1a1a1a;line-height:1.45;}
h1{color:#1e4a1e;font-size:1.25rem;}
table{width:100%;border-collapse:collapse;font-size:0.85rem;margin-top:0.5rem;}
th,td{border:1px solid #e5e7eb;padding:0.45rem 0.5rem;text-align:left;}
th{background:#f0f4f0;}
.meta{color:#666;font-size:0.9rem;margin-bottom:1rem;}
@media print { body { padding: 0.5rem; } }
</style></head><body>
<h1>Counselor workspace summary</h1>
<p class="meta"><strong>Counselor:</strong> ${counselorName}<br/><strong>Generated:</strong> ${escapeHtml(generated)}</p>
<h2>Students linked to you</h2>
<table><thead><tr><th>Name</th><th>Email</th><th>Grade</th><th>Student ID</th></tr></thead><tbody>${rosterRows}</tbody></table>
<h2>Recent notifications &amp; requests</h2>
<table><thead><tr><th>Student</th><th>Type</th><th>Message (excerpt)</th><th>Date</th></tr></thead><tbody>${notifRows}</tbody></table>
<p class="meta" style="margin-top:1.25rem;">Printed from The Hive — Franklin High School Resource Hub.</p>
</body></html>`;

  const w = window.open('', '_blank');
  if (!w) {
    showToast('Allow pop-ups to print your summary.', true);
    return;
  }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { try { w.print(); } catch (e) {} }, 300);
}

async function printCounselorStudentSummary(studentId, studentName) {
  await openStudentSummaryPrint(studentId, {
    docTitle: 'Student summary (counselor view)',
    subtitle: 'Read-only snapshot for your caseload.',
    studentName: studentName || undefined
  });
}

async function loadCounselorSection(type) {
  if (typeof trackTabView === 'function') trackTabView('counselor', type);
  const content = document.getElementById('counselor-content');
  content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading...</p></div>';
  switch(type) {
    case 'counselor-students': await renderCounselorStudents(content); break;
    case 'counselor-scholarships': await renderCounselorScholarships(content); break;
    case 'counselor-opportunities': await renderCounselorOpportunities(content); break;
    case 'counselor-resources': await renderCounselorResources(content); break;
    case 'counselor-transcript': await renderCounselorTranscript(content); break;
    case 'counselor-reminders': await renderCounselorReminders(content); break;
  }
}

//  MY STUDENTS //
async function renderCounselorStudents(content) {
  // Find students who listed this counselor
  const { data: notifications } = await supabase.from('counselor_notifications')
    .select('*').eq('counselor_email', currentProfile.email).order('created_at', { ascending: false });

  // Also find students who added this counselor
  const { data: students } = await supabase.from('profiles')
    .select('*').eq('role', 'student').eq('counselor_email', currentProfile.email);

  const studentList = students || [];
  const notifs = notifications || [];

  content.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">👥 My Students</h2>
    </div>

    ${notifs.length > 0 ? `
      <div class="card-form" style="margin-bottom:2rem">
        <h3>🔔 Pending Notifications</h3>
        ${notifs.map(n => `
          <div class="notif-item">
            <span class="notif-type">${n.type === 'meeting_request' ? '📅 Meeting Request' : '📨 LOR Request'}</span>
            <strong>${n.student_name}</strong> — ${n.message || ''}
            <span class="notif-date">${new Date(n.created_at).toLocaleDateString()}</span>
            <a href="mailto:${n.student_email}" class="track-btn">Reply</a>
          </div>
        `).join('')}
      </div>
    ` : ''}

    ${studentList.length === 0 ? `
      <div class="empty-state">
        <div class="empty-icon">👥</div>
        <h3>No students linked yet.</h3>
        <p>Students will be linked when they add your email as their counselor in the To-Do section.</p>
      </div>
    ` : `
      <div class="students-grid">
        ${studentList.map(s => `
          <div class="student-card card-form" onclick='viewStudentDetail(${JSON.stringify(s.id)}, ${JSON.stringify(s.name)})'>
            <div class="student-card-header">
              <span class="student-avatar">🎓</span>
              <div>
                <h3>${s.name}</h3>
                <p>${s.email}</p>
                <p>Grade: ${s.grade_level || 'N/A'} | ID: ${s.student_id || 'N/A'}</p>
              </div>
            </div>
            <button class="save-btn" style="margin-top:1rem">View Progress →</button>
          </div>
        `).join('')}
      </div>
    `}
  `;
}

async function viewStudentDetail(studentId, studentName) {
  const content = document.getElementById('counselor-content');
  const [progressRes, satRes, scoresRes, collegesRes, todosRes] = await Promise.all([
    supabase.from('progress').select('*').eq('student_id', studentId),
    supabase.from('sat_tracker').select('*').eq('student_id', studentId).maybeSingle(),
    supabase.from('sat_scores').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
    supabase.from('college_research').select('*').eq('student_id', studentId).order('rank', { ascending: true }),
    supabase.from('todos').select('*').eq('student_id', studentId)
  ]);

  const progress = progressRes.data || [];
  const sat = satRes.data || {};
  const scores = scoresRes.data || [];
  const colleges = collegesRes.data || [];
  const todos = todosRes.data || [];

  const statusCounts = {};
  progress.forEach(p => { statusCounts[p.status] = (statusCounts[p.status] || 0) + 1; });

  content.innerHTML = `
    <div class="counselor-detail-toolbar">
      <button type="button" class="back-btn" onclick="loadCounselorSection('counselor-students')">← Back to Students</button>
      <button type="button" class="save-btn" onclick='printCounselorStudentSummary(${JSON.stringify(studentId)}, ${JSON.stringify(studentName)})'>Print student summary</button>
    </div>
    <div class="section-header">
      <h2 class="section-title">📊 ${studentName}'s Dashboard</h2>
    </div>

    <div class="overview-grid">
      <div class="overview-card green"><div class="overview-icon">✅</div><div class="overview-stat">${statusCounts.finished || 0}</div><div class="overview-label">Tracked items completed</div></div>
      <div class="overview-card yellow"><div class="overview-icon">🔵</div><div class="overview-stat">${(statusCounts.started || 0) + (statusCounts.in_progress || 0)}</div><div class="overview-label">In Progress</div></div>
      <div class="overview-card red"><div class="overview-icon">❌</div><div class="overview-stat">${statusCounts.deadline_missed || 0}</div><div class="overview-label">Missed</div></div>
      <div class="overview-card green"><div class="overview-icon">📝</div><div class="overview-stat">${scores[0]?.score || 'N/A'}</div><div class="overview-label">Latest SAT Score</div></div>
      <div class="overview-card yellow"><div class="overview-icon">🎯</div><div class="overview-stat">${sat.goal_score || 'N/A'}</div><div class="overview-label">SAT Goal</div></div>
      <div class="overview-card green"><div class="overview-icon">🏛️</div><div class="overview-stat">${colleges.length}</div><div class="overview-label">Colleges Researched</div></div>
    </div>

    <!-- College Research with counselor comments -->
    ${colleges.length > 0 ? `
      <div class="card-form" style="margin-top:2rem">
        <h3>🏛️ College Research</h3>
        ${colleges.map(c => `
          <div class="college-card">
            <div class="college-card-header">
              <div><h3>${c.name}</h3>${c.location ? `<p>📍 ${c.location}</p>` : ''}</div>
              ${c.rank ? `<span class="rank-badge">#${c.rank}</span>` : ''}
            </div>
            ${c.notes ? `<p>${c.notes}</p>` : ''}
            <div class="counselor-comment-form">
              <textarea id="comment-${c.id}" class="auth-textarea" placeholder="Add your suggestion/comment..." style="height:60px">${c.counselor_comment || ''}</textarea>
              <button class="track-btn" onclick='saveCounselorComment(${JSON.stringify(c.id)}, ${JSON.stringify(c.name)})'>Save Comment</button>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <!-- Scholarship progress detail -->
    ${progress.length > 0 ? `
      <div class="card-form" style="margin-top:2rem">
        <h3>💰 Scholarship Tracker</h3>
        <div class="progress-grid">
          ${progress.map(item => `
            <div class="progress-card">
              <h3>${item.title}</h3>
              ${item.deadline ? `<p>📅 ${item.deadline}</p>` : ''}
              <p><strong>Status:</strong> ${item.status.replace(/_/g,' ')}</p>
              <p><small>Applicants with same scholarship: <span class="applicant-count" data-title="${item.title}">Loading...</span></small></p>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;

  // Load applicant counts
  const uniqueTitles = [...new Set(progress.map(p => p.title))];
  for (const title of uniqueTitles) {
    const { count } = await supabase.from('progress').select('*', { count: 'exact' }).eq('title', title);
    document.querySelectorAll(`[data-title="${title}"]`).forEach(el => {
      el.textContent = count || 0;
    });
  }
}

async function saveCounselorComment(collegeId, collegeName) {
  const comment = document.getElementById(`comment-${collegeId}`)?.value;
  await supabase.from('college_research').update({ counselor_comment: comment }).eq('id', collegeId);
  showToast(`Comment saved for ${collegeName}! 💬`);
}

// COUNSELOR SCHOLARSHIPS //
async function renderCounselorScholarships(content) {
  const { data: existing } = await supabase.from('counselor_scholarships')
    .select('*').order('created_at', { ascending: false });

  content.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">💰 Manage Scholarships</h2>
    </div>
    <div class="add-college-form card-form">
      <h3>➕ Add Scholarship</h3>
      <input type="text" id="cs-name" class="auth-input" placeholder="Scholarship Name" />
      <input type="text" id="cs-deadline" class="auth-input" placeholder="Deadline (e.g. March 15, 2026)" />
      <textarea id="cs-desc" class="auth-textarea" placeholder="Description"></textarea>
      <div class="form-row">
        <input type="text" id="cs-grade" class="auth-input" placeholder="Grade Level (e.g. 11, 12, All)" />
        <input type="text" id="cs-area" class="auth-input" placeholder="Area/Category" />
        <input type="url" id="cs-link" class="auth-input" placeholder="Link (optional)" />
      </div>
      <button class="save-btn" onclick="addCounselorScholarship()">Add Scholarship</button>
    </div>
    <div id="counselor-sch-list">
      ${(existing || []).map(s => `
        <div class="resource-card">
          <div class="card-info">
            <h3>${s.name}</h3>
            <p>${s.description || ''}</p>
            <ul>
              ${s.deadline ? `<li><strong>Deadline:</strong> ${s.deadline}</li>` : ''}
              ${s.grade_level ? `<li><strong>Grade:</strong> ${s.grade_level}</li>` : ''}
              ${s.area ? `<li><strong>Area:</strong> ${s.area}</li>` : ''}
            </ul>
            ${s.link ? `<a href="${s.link}" target="_blank">View</a>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

async function addCounselorScholarship() {
  const data = {
    name: document.getElementById('cs-name').value.trim(),
    deadline: document.getElementById('cs-deadline').value.trim(),
    description: document.getElementById('cs-desc').value.trim(),
    grade_level: document.getElementById('cs-grade').value.trim(),
    area: document.getElementById('cs-area').value.trim(),
    link: document.getElementById('cs-link').value.trim(),
    added_by: currentProfile.email,
    created_at: new Date().toISOString()
  };
  if (!data.name) { showToast('Enter a scholarship name.', true); return; }
  await supabase.from('counselor_scholarships').insert([data]);
  showToast('Scholarship added! 💰');
  renderCounselorScholarships(document.getElementById('counselor-content'));
}

// COUNSELOR OPPORTUNITIES //
async function renderCounselorOpportunities(content) {
  const { data: existing } = await supabase.from('counselor_opportunities')
    .select('*').order('created_at', { ascending: false });

  content.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">🌟 Manage Opportunities</h2>
    </div>
    <div class="add-college-form card-form">
      <h3>➕ Add Opportunity</h3>
      <input type="text" id="co-name" class="auth-input" placeholder="Opportunity Name" />
      <input type="text" id="co-date" class="auth-input" placeholder="Date / Deadline" />
      <textarea id="co-desc" class="auth-textarea" placeholder="Description"></textarea>
      <div class="form-row">
        <input type="text" id="co-grade" class="auth-input" placeholder="Grade Level" />
        <input type="text" id="co-category" class="auth-input" placeholder="Category (e.g. STEM, Arts)" />
        <input type="url" id="co-link" class="auth-input" placeholder="Link (optional)" />
      </div>
      <button class="save-btn" onclick="addCounselorOpportunity()">Add Opportunity</button>
    </div>
    <div>
      ${(existing || []).map(o => `
        <div class="resource-card">
          <div class="card-info">
            <h3>${o.name}</h3>
            <p>${o.description || ''}</p>
            <ul>
              ${o.date ? `<li><strong>Date:</strong> ${o.date}</li>` : ''}
              ${o.grade_level ? `<li><strong>Grade:</strong> ${o.grade_level}</li>` : ''}
              ${o.category ? `<li><strong>Category:</strong> ${o.category}</li>` : ''}
            </ul>
            ${o.link ? `<a href="${o.link}" target="_blank">View</a>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

async function addCounselorOpportunity() {
  const data = {
    name: document.getElementById('co-name').value.trim(),
    date: document.getElementById('co-date').value.trim(),
    description: document.getElementById('co-desc').value.trim(),
    grade_level: document.getElementById('co-grade').value.trim(),
    category: document.getElementById('co-category').value.trim(),
    link: document.getElementById('co-link').value.trim(),
    added_by: currentProfile.email,
    created_at: new Date().toISOString()
  };
  if (!data.name) { showToast('Enter a name.', true); return; }
  await supabase.from('counselor_opportunities').insert([data]);
  showToast('Opportunity added! 🌟');
  renderCounselorOpportunities(document.getElementById('counselor-content'));
}

// COUNSELOR RESOURCES //
async function renderCounselorResources(content) {
  content.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">📚 Add College Resources</h2>
    </div>
    <div class="add-college-form card-form">
      <h3>➕ Add Resource</h3>
      <input type="text" id="cr-title" class="auth-input" placeholder="Resource Title" />
      <input type="url" id="cr-url" class="auth-input" placeholder="URL" />
      <textarea id="cr-desc" class="auth-textarea" placeholder="Description (optional)"></textarea>
      <button class="save-btn" onclick="addCounselorResource()">Add Resource</button>
    </div>
  `;
}

async function addCounselorResource() {
  const data = {
    title: document.getElementById('cr-title').value.trim(),
    url: document.getElementById('cr-url').value.trim(),
    description: document.getElementById('cr-desc').value.trim(),
    added_by: currentProfile.email,
    created_at: new Date().toISOString()
  };
  if (!data.title || !data.url) { showToast('Enter title and URL.', true); return; }
  await supabase.from('counselor_resources').insert([data]);
  showToast('Resource added! 📚');
}

// TRANSCRIPT UPLOAD //
async function renderCounselorTranscript(content) {
  const { data: students } = await supabase.from('profiles')
    .select('id, name, email, student_id').eq('role', 'student').eq('counselor_email', currentProfile.email);

  content.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">📄 Upload Transcript</h2>
    </div>
    <div class="add-college-form card-form">
      <h3>Upload a student's transcript</h3>
      <select id="transcript-student" class="status-select">
        <option value="">Select student...</option>
        ${(students || []).map(s => `<option value="${s.id}">${s.name} (${s.email})</option>`).join('')}
      </select>
      <div class="file-upload-area" style="margin-top:1rem">
        <label>📎 Upload Transcript PDF:</label>
        <input type="file" id="transcript-file" accept=".pdf" class="file-input" />
      </div>
      <textarea id="transcript-notes" class="auth-textarea" placeholder="Notes (GPA, semester, etc.)"></textarea>
      <button class="save-btn" onclick="uploadTranscript()">Upload Transcript</button>
      <p id="transcript-status" class="auth-error"></p>
    </div>
  `;
}

async function uploadTranscript() {
  const studentId = document.getElementById('transcript-student').value;
  const file = document.getElementById('transcript-file').files[0];
  const notes = document.getElementById('transcript-notes').value;
  const statusEl = document.getElementById('transcript-status');

  if (!studentId || !file) { statusEl.textContent = 'Please select a student and file.'; return; }

  const fileName = `transcripts/${studentId}_${Date.now()}.pdf`;
  const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, file);
  if (uploadError) { statusEl.textContent = 'Upload failed: ' + uploadError.message; return; }

  const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);
  await supabase.from('transcripts').insert([{
    student_id: studentId,
    file_url: urlData.publicUrl,
    notes,
    counselor_email: currentProfile.email,
    uploaded_at: new Date().toISOString()
  }]);

  statusEl.style.color = '#2c632c';
  statusEl.textContent = 'Transcript uploaded successfully! ✅';
}

// COUNSELOR REMINDERS //
async function renderCounselorReminders(content) {
  const { data } = await supabase.from('counselor_notifications')
    .select('*').eq('counselor_email', currentProfile.email).order('created_at', { ascending: false });

  const notifs = data || [];
  content.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">🔔 Student Reminders & Requests</h2>
    </div>
    ${notifs.length === 0 ? '<div class="empty-state"><div class="empty-icon">🔔</div><h3>No reminders yet.</h3></div>' : ''}
    <div class="notif-list">
      ${notifs.map(n => `
        <div class="notif-item card-form" style="margin-bottom:1rem">
          <div class="notif-header">
            <span class="notif-type">${n.type === 'meeting_request' ? '📅 Meeting Request' : '📨 Request'}</span>
            <span class="notif-date">${new Date(n.created_at).toLocaleDateString()}</span>
          </div>
          <strong>${n.student_name}</strong> (${n.student_email})
          <p>${n.message || ''}</p>
          <a href="mailto:${n.student_email}" class="save-btn" style="display:inline-block">Reply via Email</a>
        </div>
      `).join('')}
    </div>
  `;
}
