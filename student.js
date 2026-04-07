// 
//  STUDENT APP
// 

let allScholarships = [];
let allOpportunities = [];

const collegeHelpResources = [
  { title: "California Student Aid Commission - Financial Aid Programs", url: "https://www.csac.ca.gov/financial-aid-programs" },
  { title: "Federal Student Aid - Types of Aid", url: "https://studentaid.gov/understand-aid/types" },
  { title: "Common App - First Year Students", url: "https://www.commonapp.org/apply/first-year-students" },
  { title: "University of California - How to Apply", url: "https://admission.universityofcalifornia.edu/how-to-apply/" },
  { title: "College Board - How to Begin College Applications", url: "https://bigfuture.collegeboard.org/plan-for-college/apply-to-college/college-applications-how-to-begin" },
  { title: "U.S. News - College Application Process", url: "https://www.usnews.com/education/best-colleges/articles/college-application-process" },
  { title: "Xello Resources - Guides ready to download", url: "https://help.xello.world/en-us/Content/Knowledge-Base/Xello-6-12/College-Planning/CA_Complete-Teacher-Eval.htm" },
  { title: "Xello College Planning Resources", url: "https://help.xello.world/en-us/Content/Knowledge-Base/Xello-6-12/College-Planning/KB_6-12_College-Planning.htm" },
  { title: "OnePrep: Your Ultimate SAT Site", url: "https://www.oneprep.xyz/" },
  { title: "College Admissions Hacks: A Field Guide", url: "https://docs.google.com/document/d/1OxLEGNu_7_v1kcZp4KCX13YF_GFzaM6oLvneZuAa1Ck/edit" },
  { title: "SAT + ACT Master Document!", url: "https://api.drived.space/uploads/drived/315/download/pdf/5a/k6/chchnk0ql.pdf" },
  { title: "Khan Academy: SAT Prep", url: "https://www.khanacademy.org/test-prep/digital-sat" },
];

function initStudentApp() {
  const buttons = document.querySelectorAll('#student-app .tab-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('aria-current');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-current', 'true');
      loadStudentSection(btn.dataset.tab);
    });
  });
  loadStudentSection('college');
  const firstTab = document.querySelector('#student-app [data-tab="college"]');
  firstTab.classList.add('active');
  firstTab.setAttribute('aria-current', 'true');
  checkScholarshipDeadlines();
  maybeShowStudentOnboarding();
  bindTablistKeyboard('#student-app');
}

function loadStudentSection(type) {
  if (typeof trackTabView === 'function') trackTabView('student', type);
  const content = document.getElementById('content');
  content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading...</p></div>';

  switch(type) {
    case 'college': renderCollegeHelp(); break;
    case 'opportunities': renderOpportunities(); break;
    case 'scholarships': renderScholarships(); break;
    case 'progress': renderProgress(); break;
    case 'sat': renderSATTracker(); break;
    case 'colleges': renderCollegeResearch(); break;
    case 'todo': renderTodoList(); break;
  }
}

// COLLEGE HELP //
function renderCollegeHelp() {
  const content = document.getElementById('content');
  const cards = collegeHelpResources.map(r => `
    <div class="resource-card">
      <div class="card-info">
        <h3>${r.title}</h3>
        <a href="${r.url}" target="_blank">Visit Resource</a>
      </div>
    </div>
  `).join('');

  content.innerHTML = `
    <div class="resource-card">
      <div class="card-info">
        <h3>Franklin High School Newspaper</h3>
        <p>Visit our school newspaper for the latest news, college help, and guides! (coming soon)</p>
        <a href="https://fhsbuzz.com/" target="_blank">Visit FHS Buzz</a>
      </div>
    </div>
    ${cards}
  `;
}

// OPPORTUNITIES //
function renderOpportunities() {
  fetch(RESOURCES_URL)
    .then(r => r.json())
    .then(data => {
      allOpportunities = data || [];
      const content = document.getElementById('content');
      content.innerHTML = `
        <p class="data-freshness-banner" role="status">Opportunities list last updated: <strong>${formatDataListUpdated(typeof OPPORTUNITIES_LIST_UPDATED !== 'undefined' ? OPPORTUNITIES_LIST_UPDATED : '')}</strong>. School staff maintain this sheet—refresh after updates.</p>
        <div class="search-container">
          <label class="sr-only" for="opp-search">Search opportunities</label>
          <input type="text" id="opp-search" class="search-input" placeholder="Search opportunities by name or category..." />
        </div>
        <div id="opp-results"></div>
      `;
      renderOppCards(allOpportunities);
      document.getElementById('opp-search').addEventListener('input', e => {
        const q = e.target.value.toLowerCase();
        renderOppCards(allOpportunities.filter(i => {
          const n = normalizeItem(i);
          return (getName(n) + getCategory(n)).toLowerCase().includes(q);
        }));
      });
    }).catch(() => {
      document.getElementById('content').innerHTML = '<p class="error-msg">Error loading opportunities.</p>';
    });
}

function renderOppCards(items) {
  const div = document.getElementById('opp-results');
  if (!div) return;
  if (!items.length) { div.innerHTML = '<p>No opportunities match your search.</p>'; return; }
  div.innerHTML = items.map((item, i) => {
    const n = normalizeItem(item);
    const name = getName(n);
    const status = n.Status || n.status || '';
    const notes = getNotes(n);
    const deadline = getDeadline(n);
    const category = getCategory(n);
    const link = getLink(n);
    return `
      <div class="resource-card">
        <div class="card-info">
          <h3>${name || `Opportunity #${i+1}`}</h3>
          ${notes ? `<p>${notes}</p>` : ''}
          <ul>
            ${status ? `<li><strong>Status:</strong> ${status}</li>` : ''}
            ${category ? `<li><strong>Category:</strong> ${category}</li>` : ''}
            ${deadline ? `<li><strong>Date:</strong> ${deadline}</li>` : ''}
          </ul>
          <div class="card-actions">
            ${link ? `<a href="${link}" target="_blank">Apply / Visit</a>` : ''}
            <button class="track-btn" onclick="addToProgress('opportunity', '${name.replace(/'/g,"\\'")}', '${deadline}', '${link}')">+ Track This</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// SCHOLARSHIPS //
function renderScholarships() {
  fetch(SCHOLARSHIPS_URL)
    .then(r => r.json())
    .then(data => {
      allScholarships = data || [];
      const content = document.getElementById('content');
      content.innerHTML = `
        <p class="data-freshness-banner" role="status">Scholarships list last updated: <strong>${formatDataListUpdated(typeof SCHOLARSHIPS_LIST_UPDATED !== 'undefined' ? SCHOLARSHIPS_LIST_UPDATED : '')}</strong>. School staff maintain this sheet—refresh after updates.</p>
        <div class="search-container">
          <label class="sr-only" for="sch-search">Search scholarships</label>
          <input type="text" id="sch-search" class="search-input" placeholder="Search scholarships by name..." />
        </div>
        <div id="sch-results"></div>
      `;
      renderSchCards(allScholarships);
      document.getElementById('sch-search').addEventListener('input', e => {
        const q = e.target.value.toLowerCase();
        renderSchCards(allScholarships.filter(i => getTitle(normalizeItem(i)).toLowerCase().includes(q)));
      });
    }).catch(() => {
      document.getElementById('content').innerHTML = '<p class="error-msg">Error loading scholarships.</p>';
    });
}

function renderSchCards(items) {
  const div = document.getElementById('sch-results');
  if (!div) return;
  if (!items.length) { div.innerHTML = '<p>No scholarships match your search.</p>'; return; }
  div.innerHTML = items.map(item => {
    const n = normalizeItem(item);
    const title = getTitle(n);
    const desc = getDescription(n);
    const link = getLink(n);
    const deadline = getDeadline(n);
    const status = n.Status || '';
    const area = n.Area || n.area || n.Category || n.category || '';
    const grade = n.Grade || n.grade || n['Grade Level'] || '';
    const emoji = n.Emoji || n.emoji || '';
    const image = n.Image || n.image || '';
    return `
      <div class="resource-card">
        ${image ? `<img class="resource-image" src="${image}" alt="${title}" onerror="this.style.display='none'"/>` : ''}
        <div class="card-emoji">${emoji}</div>
        <div class="card-info">
          <h3>${title}</h3>
          ${desc ? `<p>${desc}</p>` : ''}
          <ul>
            ${status ? `<li><strong>Status:</strong> ${status}</li>` : ''}
            ${area ? `<li><strong>Area:</strong> ${area}</li>` : ''}
            ${grade ? `<li><strong>Grade Level:</strong> ${grade}</li>` : ''}
            ${deadline ? `<li><strong>Deadline:</strong> ${deadline}</li>` : ''}
          </ul>
          <div class="card-actions">
            ${link ? `<a href="${link}" target="_blank">Apply / Visit</a>` : ''}
            <button class="track-btn" onclick="addToProgress('scholarship', '${title.replace(/'/g,"\\'")}', '${deadline}', '${link}')">+ Track This</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ADD TO PROGRESS //
async function addToProgress(type, title, deadline, link) {
  const { error } = await supabase.from('progress').insert([{
    student_id: currentUser.id,
    type,
    title,
    deadline,
    link,
    status: 'not_started',
    created_at: new Date().toISOString()
  }]);
  if (!error) {
    showToast(`"${title}" added to your Progress tracker! 🎯`);
  } else {
    showToast('Error adding to progress. Try again.', true);
  }
}

// PROGRESS TRACKER //
async function renderProgress() {
  const content = document.getElementById('content');
  const { data, error } = await supabase.from('progress')
    .select('*').eq('student_id', currentUser.id).order('created_at', { ascending: false });

  if (error) { content.innerHTML = '<p class="error-msg">Error loading progress.</p>'; return; }

  const items = data || [];
  const statusColors = {
    not_started: '#94a3b8',
    started: '#f59e0b',
    in_progress: '#3b82f6',
    finished: '#22c55e',
    deadline_missed: '#ef4444'
  };
  const statusLabels = {
    not_started: '🔲 Not Started',
    started: '🟡 Started',
    in_progress: '🔵 In Progress',
    finished: '✅ Finished',
    deadline_missed: '❌ Deadline Missed'
  };

  content.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">📊 My Progress</h2>
      <p class="section-desc">Track your scholarships and opportunities. Add items from the Scholarships or Opportunities tabs.</p>
    </div>
    ${items.length === 0 ? `
      <div class="empty-state">
        <div class="empty-icon">🎯</div>
        <h3>Nothing tracked yet!</h3>
        <p>Go to Scholarships or Opportunities and click <strong>"+ Track This"</strong> to start tracking.</p>
      </div>
    ` : `
      <div class="progress-grid">
        ${items.map(item => `
          <div class="progress-card" style="border-left: 5px solid ${statusColors[item.status] || '#94a3b8'}">
            <div class="progress-card-header">
              <span class="progress-type-badge">${item.type === 'scholarship' ? '💰' : '🌟'} ${item.type}</span>
              <button class="delete-btn" onclick="deleteProgress('${item.id}')">✕</button>
            </div>
            <h3>${item.title}</h3>
            ${item.deadline ? `<p class="deadline-text">📅 Deadline: ${item.deadline}</p>` : ''}
            <div class="status-update">
              <label>Status:</label>
              <select class="status-select" onchange="updateProgressStatus('${item.id}', this.value)">
                ${Object.entries(statusLabels).map(([val, label]) => 
                  `<option value="${val}" ${item.status === val ? 'selected' : ''}>${label}</option>`
                ).join('')}
              </select>
            </div>
            <div class="reminder-row">
              <label>Set Reminder:</label>
              <input type="date" class="reminder-date-input" value="${item.reminder_date || ''}" 
                onchange="setProgressReminder('${item.id}', this.value)" />
            </div>
            ${item.link ? `<a href="${item.link}" target="_blank" class="progress-link">${item.type === 'opportunity' ? 'View opportunity →' : 'View scholarship →'}</a>` : ''}
          </div>
        `).join('')}
      </div>
    `}
  `;
}

async function updateProgressStatus(id, status) {
  await supabase.from('progress').update({ status }).eq('id', id);
  showToast('Status updated! ✅');
}

async function setProgressReminder(id, date) {
  await supabase.from('progress').update({ reminder_date: date }).eq('id', id);
  showToast('Reminder set! 🔔');
}

async function deleteProgress(id) {
  if (!confirm('Remove this from your tracker?')) return;
  await supabase.from('progress').delete().eq('id', id);
  renderProgress();
}

// SAT TRACKER //
async function renderSATTracker() {
  const content = document.getElementById('content');
  const { data: satData } = await supabase.from('sat_tracker')
    .select('*').eq('student_id', currentUser.id).single();

  const { data: scores } = await supabase.from('sat_scores')
    .select('*').eq('student_id', currentUser.id).order('created_at', { ascending: true });

  const sat = satData || {};
  const scoreList = scores || [];

  let diff = 0;
  let daysLeft = '';
  let hoursLeft = '';
  if (sat.sat_date) {
    const now = new Date();
    const satDate = new Date(sat.sat_date);
    diff = satDate - now;
    if (diff > 0) {
      daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));
      hoursLeft = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    }
  }

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const satMonthName = sat.sat_date ? months[new Date(sat.sat_date).getMonth()] : '';

  content.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">📝 SAT Tracker</h2>
    </div>

    <div class="sat-grid">
      <!-- Countdown Card -->
      <div class="sat-card countdown-card">
        <h3>📅 My SAT Date</h3>
        <input type="date" id="sat-date-input" class="auth-input" value="${sat.sat_date || ''}" />
        <button class="save-btn" onclick="saveSATDate()">Save Date</button>
        ${sat.sat_date && diff > 0 ? `
          <div class="countdown-display">
            <span class="countdown-num">${daysLeft}</span> days and 
            <span class="countdown-num">${hoursLeft}</span> hours left for your
            <strong>${satMonthName} SAT</strong>
          </div>
        ` : sat.sat_date ? '<p class="past-date">SAT date has passed — update it!</p>' : '<p class="no-date">Set your SAT date above.</p>'}
      </div>

      <!-- Confidence Card -->
      <div class="sat-card">
        <h3>💪 Confidence Level</h3>
        <select id="confidence-select" class="status-select" onchange="saveConfidence(this.value)">
          <option value="" ${!sat.confidence ? 'selected' : ''}>Select your level...</option>
          <option value="very_low" ${sat.confidence === 'very_low' ? 'selected' : ''}>😰 Very Low — Need a lot of work</option>
          <option value="low" ${sat.confidence === 'low' ? 'selected' : ''}>😟 Low — Getting there</option>
          <option value="medium" ${sat.confidence === 'medium' ? 'selected' : ''}>😐 Medium — Feeling okay</option>
          <option value="high" ${sat.confidence === 'high' ? 'selected' : ''}>😊 High — Pretty confident</option>
          <option value="very_high" ${sat.confidence === 'very_high' ? 'selected' : ''}>🔥 Very High — Ready!</option>
        </select>
      </div>

      <!-- Goal Score Card -->
      <div class="sat-card">
        <h3>🎯 Score Goal</h3>
        <input type="number" id="sat-goal" class="auth-input" placeholder="e.g. 1400" value="${sat.goal_score || ''}" min="400" max="1600" />
        <button class="save-btn" onclick="saveSATGoal()">Save Goal</button>
        ${sat.goal_score ? `<p class="goal-display">Goal: <strong>${sat.goal_score}</strong> / 1600</p>` : ''}
      </div>

      <!-- Email Reminders Card -->
      <div class="sat-card">
        <h3>🔔 Email Reminders</h3>
        <p>Get reminders to study for your SAT.</p>
        <select id="reminder-freq" class="status-select">
          <option value="">How often?</option>
          <option value="daily" ${sat.reminder_freq === 'daily' ? 'selected' : ''}>Daily</option>
          <option value="weekly" ${sat.reminder_freq === 'weekly' ? 'selected' : ''}>Weekly</option>
          <option value="none" ${sat.reminder_freq === 'none' ? 'selected' : ''}>No reminders</option>
        </select>
        <input type="date" id="reminder-start" class="auth-input" placeholder="Start date" value="${sat.reminder_start || ''}" style="margin-top:0.5rem"/>
        <button class="save-btn" onclick="saveSATReminder()">Set Reminder</button>
      </div>
    </div>

    <!-- Practice Score Log -->
    <div class="score-log-section">
      <h3>📈 Practice Score Log</h3>
      <p>Log your highest practice test score each week to track progress.</p>
      <div class="score-input-row">
        <input type="number" id="new-score" class="auth-input" placeholder="Score (400–1600)" min="400" max="1600" style="width:200px" />
        <input type="date" id="score-date" class="auth-input" style="width:200px" />
        <button class="save-btn" onclick="logSATScore()">Log Score</button>
      </div>
      ${scoreList.length > 0 ? `
        <div class="score-chart-wrapper">
          <canvas id="score-chart" width="600" height="200"></canvas>
        </div>
        <div class="score-history">
          ${scoreList.map(s => `
            <div class="score-entry">
              <span class="score-val">${s.score}</span>
              <span class="score-date-label">${new Date(s.test_date || s.created_at).toLocaleDateString()}</span>
              <span class="score-delta ${s.score >= (sat.goal_score || 1600) ? 'goal-met' : ''}">
                ${s.score >= (sat.goal_score || 1600) ? '🎯 Goal Met!' : `${sat.goal_score ? sat.goal_score - s.score + ' pts to goal' : ''}`}
              </span>
            </div>
          `).join('')}
        </div>
      ` : '<p class="no-scores">No scores logged yet. Log your first practice test!</p>'}
    </div>
  `;

  // Draw simple chart //
  if (scoreList.length > 0) {
    setTimeout(() => drawScoreChart(scoreList, sat.goal_score), 100);
  }
}

function drawScoreChart(scores, goal) {
  const canvas = document.getElementById('score-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const pad = 40;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, w, h);

  const min = 400, max = 1600;
  const xs = scores.map((_, i) => pad + (i / Math.max(scores.length - 1, 1)) * (w - 2 * pad));
  const ys = scores.map(s => h - pad - ((s.score - min) / (max - min)) * (h - 2 * pad));

  // Goal line //
  if (goal) {
    const gy = h - pad - ((goal - min) / (max - min)) * (h - 2 * pad);
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pad, gy); ctx.lineTo(w - pad, gy); ctx.stroke();
    ctx.fillStyle = '#ffd700';
    ctx.font = '12px Poppins';
    ctx.fillText(`Goal: ${goal}`, w - pad - 60, gy - 5);
    ctx.setLineDash([]);
  }

  // Line //
  ctx.strokeStyle = '#2c632c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  xs.forEach((x, i) => i === 0 ? ctx.moveTo(x, ys[i]) : ctx.lineTo(x, ys[i]));
  ctx.stroke();

  // Dots //
  xs.forEach((x, i) => {
    ctx.fillStyle = '#2c632c';
    ctx.beginPath(); ctx.arc(x, ys[i], 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#333';
    ctx.font = '11px Poppins';
    ctx.fillText(scores[i].score, x - 15, ys[i] - 10);
  });
}

async function saveSATDate() {
  const date = document.getElementById('sat-date-input').value;
  await upsertSATTracker({ sat_date: date });
  showToast('SAT date saved! 📅');
  renderSATTracker();
}

async function saveConfidence(val) {
  await upsertSATTracker({ confidence: val });
  showToast('Confidence level saved! 💪');
}

async function saveSATGoal() {
  const goal = document.getElementById('sat-goal').value;
  await upsertSATTracker({ goal_score: parseInt(goal) });
  showToast('Score goal saved! 🎯');
  renderSATTracker();
}

async function saveSATReminder() {
  const freq = document.getElementById('reminder-freq').value;
  const start = document.getElementById('reminder-start').value;
  await upsertSATTracker({ reminder_freq: freq, reminder_start: start });
  showToast('Reminder preferences saved! 🔔');
}

async function logSATScore() {
  const score = parseInt(document.getElementById('new-score').value);
  const date = document.getElementById('score-date').value;
  if (!score || score < 400 || score > 1600) { showToast('Enter a valid score (400–1600).', true); return; }
  await supabase.from('sat_scores').insert([{
    student_id: currentUser.id, score, test_date: date || new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString()
  }]);
  showToast('Score logged! 📈');
  renderSATTracker();
}

async function upsertSATTracker(updates) {
  const { data } = await supabase.from('sat_tracker').select('id').eq('student_id', currentUser.id).single();
  if (data) {
    await supabase.from('sat_tracker').update(updates).eq('student_id', currentUser.id);
  } else {
    await supabase.from('sat_tracker').insert([{ student_id: currentUser.id, ...updates }]);
  }
}

// COLLEGE RESEARCH //
async function renderCollegeResearch() {
  const content = document.getElementById('content');
  const { data: colleges } = await supabase.from('college_research')
    .select('*').eq('student_id', currentUser.id).order('rank', { ascending: true });

  const list = colleges || [];

  content.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">🏛️ College Research</h2>
      <p class="section-desc">Add colleges you're interested in, rank them, and take notes.</p>
    </div>

    <div class="add-college-form card-form">
      <h3>➕ Add a College</h3>
      <div class="form-row">
        <input type="text" id="college-name" class="auth-input" placeholder="College Name" />
        <input type="text" id="college-location" class="auth-input" placeholder="Location (City, State)" />
      </div>
      <textarea id="college-notes" class="auth-textarea" placeholder="Notes: What do you like about it? Programs? Pros/cons?"></textarea>
      <div class="form-row">
        <select id="college-interest" class="status-select">
          <option value="">Interest level...</option>
          <option value="very_interested">⭐⭐⭐ Very Interested — Will Apply</option>
          <option value="interested">⭐⭐ Interested — Considering</option>
          <option value="maybe">⭐ Maybe — Still Researching</option>
          <option value="not_interested">❌ Not Interested</option>
        </select>
        <input type="number" id="college-rank" class="auth-input" placeholder="Rank (1 = top choice)" min="1" style="width:180px" />
      </div>
      <button class="save-btn" onclick="addCollege()">Add College</button>
    </div>

    <div id="college-list">
      ${list.length === 0 ? '<div class="empty-state"><div class="empty-icon">🏛️</div><h3>No colleges added yet!</h3><p>Add your first college above.</p></div>' : ''}
      ${list.map(c => renderCollegeCard(c)).join('')}
    </div>
  `;
}

function renderCollegeCard(c) {
  const interestLabels = {
    very_interested: '⭐⭐⭐ Will Apply',
    interested: '⭐⭐ Considering',
    maybe: '⭐ Maybe',
    not_interested: '❌ Not Interested'
  };
  return `
    <div class="college-card">
      <div class="college-card-header">
        <div>
          <h3>${c.name}</h3>
          ${c.location ? `<p class="college-location">📍 ${c.location}</p>` : ''}
        </div>
        <div class="college-card-actions">
          ${c.rank ? `<span class="rank-badge">#${c.rank}</span>` : ''}
          <button class="delete-btn" onclick="deleteCollege('${c.id}')">✕</button>
        </div>
      </div>
      ${c.notes ? `<div class="college-notes-display">${c.notes}</div>` : ''}
      <div class="college-meta">
        <select class="status-select" onchange="updateCollegeInterest('${c.id}', this.value)">
          <option value="">Set interest...</option>
          <option value="very_interested" ${c.interest === 'very_interested' ? 'selected' : ''}>⭐⭐⭐ Will Apply</option>
          <option value="interested" ${c.interest === 'interested' ? 'selected' : ''}>⭐⭐ Considering</option>
          <option value="maybe" ${c.interest === 'maybe' ? 'selected' : ''}>⭐ Maybe</option>
          <option value="not_interested" ${c.interest === 'not_interested' ? 'selected' : ''}>❌ Not Interested</option>
        </select>
        <span class="counselor-comment-area">
          ${c.counselor_comment ? `<div class="counselor-note">💬 Counselor: ${c.counselor_comment}</div>` : ''}
        </span>
      </div>
    </div>
  `;
}

async function addCollege() {
  const name = document.getElementById('college-name').value.trim();
  const location = document.getElementById('college-location').value.trim();
  const notes = document.getElementById('college-notes').value.trim();
  const interest = document.getElementById('college-interest').value;
  const rank = document.getElementById('college-rank').value;
  if (!name) { showToast('Please enter a college name.', true); return; }
  await supabase.from('college_research').insert([{
    student_id: currentUser.id, name, location, notes, interest,
    rank: rank ? parseInt(rank) : null, created_at: new Date().toISOString()
  }]);
  showToast(`${name} added! 🏛️`);
  renderCollegeResearch();
}

async function updateCollegeInterest(id, interest) {
  await supabase.from('college_research').update({ interest }).eq('id', id);
  showToast('Updated! ✅');
}

async function deleteCollege(id) {
  if (!confirm('Remove this college?')) return;
  await supabase.from('college_research').delete().eq('id', id);
  renderCollegeResearch();
}

// TO-DO LIST //
async function renderTodoList() {
  const content = document.getElementById('content');
  const { data: todos } = await supabase.from('todos')
    .select('*').eq('student_id', currentUser.id).order('created_at', { ascending: false });
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();

  const list = todos || [];

  content.innerHTML = `
    <div class="section-header">
      <h2 class="section-title">✅ To-Do List</h2>
    </div>

    <div class="todo-add-form card-form">
      <h3>➕ Add Task</h3>
      <input type="text" id="todo-title" class="auth-input" placeholder="Task (e.g. Write Common App essay, Email teacher for rec)" />
      <div class="form-row">
        <select id="todo-type" class="status-select">
          <option value="general">📝 General Task</option>
          <option value="essay">✍️ Essay</option>
          <option value="letter_rec">📨 Letter of Rec</option>
          <option value="counselor_meeting">📅 Counselor Meeting</option>
          <option value="application">📋 Application</option>
        </select>
        <input type="date" id="todo-due" class="auth-input" placeholder="Due date" />
      </div>
      <button class="save-btn" onclick="addTodo()">Add Task</button>
    </div>

    <!-- Letter of Rec Section -->
    <div class="lor-section card-form">
      <h3>📨 Send Letter of Rec Request</h3>
      <p>Upload your brag sheet and send a pre-written request email to your teacher or counselor.</p>
      <div class="form-row">
        <input type="email" id="lor-teacher-email" class="auth-input" placeholder="Teacher/Counselor Email" />
        <select id="lor-type" class="status-select" onchange="updateLORFields()">
          <option value="">Request type...</option>
          <option value="university">🏛️ University Application</option>
          <option value="scholarship">💰 Scholarship</option>
          <option value="program">🌟 Program/Opportunity</option>
        </select>
      </div>
      <div id="lor-extra-fields"></div>
      <div class="file-upload-area">
        <label for="brag-sheet">📎 Upload Brag Sheet (PDF):</label>
        <input type="file" id="brag-sheet" accept=".pdf" class="file-input" />
      </div>
      <button class="save-btn" onclick="sendLORRequest()">Send Request Email</button>
      <p id="lor-status" class="auth-error"></p>
    </div>

    <!-- Counselor Notification -->
    <div class="counselor-notify card-form">
      <h3>📅 Request Counselor Meeting</h3>
      <input type="text" id="counselor-email-notify" class="auth-input" placeholder="Counselor's Email" value="${profile?.counselor_email || ''}" />
      <textarea id="meeting-message" class="auth-textarea" placeholder="What do you need help with?"></textarea>
      <button class="save-btn" onclick="notifyCounselor()">Send Meeting Request</button>
    </div>

    <!-- Todo List -->
    <div class="todo-list" id="todo-list">
      ${list.length === 0 ? '<div class="empty-state"><div class="empty-icon">✅</div><h3>No tasks yet!</h3><p>Add your first task above.</p></div>' : ''}
      ${list.map(t => `
        <div class="todo-item ${t.completed ? 'todo-done' : ''}">
          <input type="checkbox" class="todo-check" ${t.completed ? 'checked' : ''} onchange="toggleTodo('${t.id}', this.checked)" />
          <div class="todo-content">
            <span class="todo-title-text">${t.title}</span>
            ${t.due_date ? `<span class="todo-due">📅 Due: ${t.due_date}</span>` : ''}
            <span class="todo-type-badge">${t.type || 'general'}</span>
          </div>
          <button class="delete-btn" onclick="deleteTodo('${t.id}')">✕</button>
        </div>
      `).join('')}
    </div>
  `;
}

function updateLORFields() {
  const type = document.getElementById('lor-type').value;
  const extra = document.getElementById('lor-extra-fields');
  if (type === 'university') {
    extra.innerHTML = `
      <input type="text" id="lor-uni-name" class="auth-input" placeholder="University Name" />
      <textarea id="lor-why" class="auth-textarea" placeholder="Why are you interested in this university? (used in the email)" style="margin-top:0.5rem"></textarea>
    `;
  } else if (type === 'scholarship') {
    extra.innerHTML = `<input type="text" id="lor-sch-name" class="auth-input" placeholder="Scholarship Name" />`;
  } else if (type === 'program') {
    extra.innerHTML = `<input type="text" id="lor-prog-name" class="auth-input" placeholder="Program/Opportunity Name" />`;
  } else {
    extra.innerHTML = '';
  }
}

async function sendLORRequest() {
  const teacherEmail = document.getElementById('lor-teacher-email').value.trim();
  const lorType = document.getElementById('lor-type').value;
  const statusEl = document.getElementById('lor-status');
  const file = document.getElementById('brag-sheet').files[0];

  if (!teacherEmail || !lorType) { statusEl.textContent = 'Please fill in all fields.'; return; }

  let subject = '', details = '';
  if (lorType === 'university') {
    const uni = document.getElementById('lor-uni-name')?.value || '';
    const why = document.getElementById('lor-why')?.value || '';
    subject = `Letter of Recommendation Request — ${uni}`;
    details = `I am applying to ${uni}. ${why}`;
  } else if (lorType === 'scholarship') {
    const sch = document.getElementById('lor-sch-name')?.value || '';
    subject = `Letter of Recommendation Request — ${sch} Scholarship`;
    details = `I am applying for the ${sch} scholarship.`;
  } else if (lorType === 'program') {
    const prog = document.getElementById('lor-prog-name')?.value || '';
    subject = `Letter of Recommendation Request — ${prog}`;
    details = `I am applying for ${prog}.`;
  }

  // Upload brag sheet if provided
  let bragSheetUrl = '';
  if (file) {
    const fileName = `bragsheets/${currentUser.id}_${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage.from('documents').upload(fileName, file);
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);
      bragSheetUrl = urlData.publicUrl;
    }
  }

  const templateParams = {
    to_email: teacherEmail,
    from_name: currentProfile.name,
    student_email: currentProfile.email,
    subject,
    details,
    brag_sheet_url: bragSheetUrl || 'Not provided',
    sender_email: SENDER_EMAIL
  };

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_LETTER, templateParams);
    statusEl.style.color = '#2c632c';
    statusEl.textContent = 'Request sent successfully! ✅';
  } catch (err) {
    statusEl.textContent = 'Failed to send. Check your connection.';
  }
}

async function notifyCounselor() {
  const email = document.getElementById('counselor-email-notify').value.trim();
  const message = document.getElementById('meeting-message').value.trim();
  if (!email) { showToast('Please enter counselor email.', true); return; }
  
  // Save counselor email to profile //
  await supabase.from('profiles').update({ counselor_email: email }).eq('id', currentUser.id);
  
  // Save notification in DB for counselor to see //
  await supabase.from('counselor_notifications').insert([{
    student_id: currentUser.id,
    student_name: currentProfile.name,
    student_email: currentProfile.email,
    counselor_email: email,
    message,
    type: 'meeting_request',
    created_at: new Date().toISOString()
  }]);
  showToast('Meeting request sent to counselor! 📅');
}

async function addTodo() {
  const title = document.getElementById('todo-title').value.trim();
  const type = document.getElementById('todo-type').value;
  const due = document.getElementById('todo-due').value;
  if (!title) { showToast('Please enter a task.', true); return; }
  await supabase.from('todos').insert([{
    student_id: currentUser.id, title, type, due_date: due || null,
    completed: false, created_at: new Date().toISOString()
  }]);
  showToast('Task added! ✅');
  renderTodoList();
}

async function toggleTodo(id, completed) {
  await supabase.from('todos').update({ completed }).eq('id', id);
}

async function deleteTodo(id) {
  await supabase.from('todos').delete().eq('id', id);
  renderTodoList();
}

// DEADLINE CHECK (auto email) //
async function checkScholarshipDeadlines() {
  const { data } = await supabase.from('progress')
    .select('*').eq('student_id', currentUser.id).neq('status', 'finished');
  if (!data) return;
  const today = new Date();
  data.forEach(item => {
    if (!item.deadline) return;
    const deadline = new Date(item.deadline);
    const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 7 && daysLeft > 0 && (item.status === 'started' || item.status === 'in_progress')) {
      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_REMINDER, {
        to_email: currentProfile.email,
        student_name: currentProfile.name,
        item_title: item.title,
        days_left: daysLeft,
        deadline: item.deadline,
        status: item.status
      });
    }
  });
}

// HELPERS //
function normalizeItem(item) {
  const n = {};
  Object.keys(item).forEach(k => { n[k.trim()] = typeof item[k] === 'string' ? item[k].trim() : item[k]; });
  return n;
}
function getTitle(i) { return i.Title || i.title || i.Name || i.name || i.Task || 'Untitled'; }
function getName(i) { return i.name || i.Name || i.title || i.Title || i.Task || i.task || ''; }
function getDescription(i) { return i.Desc || i.description || i.Notes || i.Description || ''; }
function getNotes(i) { return i.Notes || i.notes || i.Description || i.description || ''; }
function getLink(i) { return i.Link || i.link || i.URL || i.url || ''; }
function getDeadline(i) { return i.Deadline || i.deadline || i['Due date'] || i.DueDate || i.Date || ''; }
function getCategory(i) { return i.Category || i.category || i.Area || i.area || ''; }

function showToast(msg, isError = false) {
  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'toast-error' : 'toast-success'}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('toast-show'), 10);
  setTimeout(() => { toast.classList.remove('toast-show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

function formatDataListUpdated(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function maybeShowStudentOnboarding() {
  if (!currentUser) return;
  if (localStorage.getItem(`hive_onboarding_done_${currentUser.id}`)) return;
  const m = document.getElementById('student-onboarding');
  if (!m) return;
  m.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function dismissStudentOnboarding() {
  const m = document.getElementById('student-onboarding');
  if (m) m.classList.add('hidden');
  document.body.style.overflow = '';
  if (currentUser) localStorage.setItem(`hive_onboarding_done_${currentUser.id}`, '1');
}

async function openStudentSummaryPrint(studentId, options) {
  const opts = options || {};
  let displayName = opts.studentName;
  let displayEmail = opts.studentEmail;
  if (!displayName || !displayEmail) {
    const { data: prof } = await supabase.from('profiles').select('name, email').eq('id', studentId).single();
    if (prof) {
      displayName = displayName || prof.name;
      displayEmail = displayEmail || prof.email;
    }
  }

  const docTitle = opts.docTitle || 'Student summary';
  const subtitle = opts.subtitle || '';

  const [progressRes, satRes, scoresRes, collegesRes, todosRes] = await Promise.all([
    supabase.from('progress').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
    supabase.from('sat_tracker').select('*').eq('student_id', studentId).maybeSingle(),
    supabase.from('sat_scores').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
    supabase.from('college_research').select('*').eq('student_id', studentId).order('rank', { ascending: true }),
    supabase.from('todos').select('*').eq('student_id', studentId).order('created_at', { ascending: false })
  ]);

  const progress = progressRes.data || [];
  const sat = satRes.data || {};
  const scores = scoresRes.data || [];
  const colleges = collegesRes.data || [];
  const todos = todosRes.data || [];

  const statusLabels = {
    not_started: 'Not started',
    started: 'Started',
    in_progress: 'In progress',
    finished: 'Finished',
    deadline_missed: 'Deadline missed'
  };

  const name = escapeHtml(displayName || 'Student');
  const email = escapeHtml(displayEmail || '');
  const generated = new Date().toLocaleString();

  const progressRows = progress.length
    ? progress.map(p => `<tr><td>${escapeHtml(p.title)}</td><td>${escapeHtml(p.type || '')}</td><td>${escapeHtml(statusLabels[p.status] || p.status || '')}</td><td>${escapeHtml(p.deadline || '—')}</td></tr>`).join('')
    : '<tr><td colspan="4">No tracked items yet.</td></tr>';

  const scoreRows = scores.length
    ? scores.map(s => `<tr><td>${escapeHtml(String(s.score))}</td><td>${escapeHtml(new Date(s.test_date || s.created_at).toLocaleDateString())}</td></tr>`).join('')
    : '<tr><td colspan="2">No practice scores logged.</td></tr>';

  const collegeRows = colleges.length
    ? colleges.map(c => `<tr><td>${escapeHtml(c.name)}</td><td>${escapeHtml(c.location || '—')}</td><td>${escapeHtml(c.interest || '—')}</td><td>${escapeHtml(c.rank != null ? String(c.rank) : '—')}</td></tr>`).join('')
    : '<tr><td colspan="4">No colleges added yet.</td></tr>';

  const todoRows = todos.length
    ? todos.map(t => `<tr><td>${escapeHtml(t.title)}</td><td>${t.completed ? 'Done' : 'Open'}</td><td>${escapeHtml(t.due_date || '—')}</td></tr>`).join('')
    : '<tr><td colspan="3">No tasks yet.</td></tr>';

  const subtitleHtml = subtitle ? `<p class="meta">${escapeHtml(subtitle)}</p>` : '';

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>${escapeHtml(docTitle)} — ${name}</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;padding:1.5rem;max-width:900px;margin:0 auto;color:#1a1a1a;line-height:1.5;}
h1{color:#1e4a1e;font-size:1.35rem;} h2{font-size:1.05rem;margin-top:1.25rem;color:#2c632c;border-bottom:1px solid #e5e7eb;padding-bottom:0.25rem;}
table{width:100%;border-collapse:collapse;font-size:0.88rem;margin-top:0.5rem;}
th,td{border:1px solid #e5e7eb;padding:0.45rem 0.5rem;text-align:left;}
th{background:#f0f4f0;}
.meta{color:#666;font-size:0.9rem;margin-bottom:1rem;}
@media print { body{padding:0.5rem;} h1{font-size:1.2rem;} }
</style></head><body>
<h1>${escapeHtml(docTitle)}</h1>
${subtitleHtml}
<p class="meta"><strong>Student:</strong> ${name}<br/><strong>Email:</strong> ${email}<br/><strong>Generated:</strong> ${escapeHtml(generated)}</p>

<h2>SAT</h2>
<p>Test date: ${escapeHtml(sat.sat_date || 'Not set')} · Goal score: ${sat.goal_score != null ? escapeHtml(String(sat.goal_score)) : 'Not set'} · Confidence: ${escapeHtml((sat.confidence || 'Not set').replace(/_/g, ' '))}</p>

<h2>Tracked scholarships &amp; opportunities</h2>
<table><thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Deadline</th></tr></thead><tbody>${progressRows}</tbody></table>

<h2>College list</h2>
<table><thead><tr><th>School</th><th>Location</th><th>Interest</th><th>Rank</th></tr></thead><tbody>${collegeRows}</tbody></table>

<h2>Practice scores</h2>
<table><thead><tr><th>Score</th><th>Date</th></tr></thead><tbody>${scoreRows}</tbody></table>

<h2>To-do list</h2>
<table><thead><tr><th>Task</th><th>Status</th><th>Due</th></tr></thead><tbody>${todoRows}</tbody></table>

<p class="meta" style="margin-top:1.5rem;">Printed from The Hive — Franklin High School Resource Hub.</p>
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

async function printMeetingSummary() {
  if (!currentUser || !currentProfile) return;
  await openStudentSummaryPrint(currentUser.id, {
    docTitle: 'Counselor meeting summary',
    studentName: currentProfile.name,
    studentEmail: currentProfile.email
  });
}
