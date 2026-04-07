// Privacy-first tab analytics: counts stored locally; optional Supabase row if `analytics_events` exists.
const HIVE_ANALYTICS_KEY = 'hive_tab_views_v1';

function trackTabView(app, tabId) {
  try {
    const raw = localStorage.getItem(HIVE_ANALYTICS_KEY);
    const data = raw ? JSON.parse(raw) : { counts: {} };
    const key = `${app}:${tabId}`;
    data.counts[key] = (data.counts[key] || 0) + 1;
    data.updatedAt = new Date().toISOString();
    localStorage.setItem(HIVE_ANALYTICS_KEY, JSON.stringify(data));
  } catch (e) {
    /* ignore quota / private mode */
  }

  if (typeof supabase !== 'undefined' && typeof currentUser !== 'undefined' && currentUser && currentUser.id) {
    supabase
      .from('analytics_events')
      .insert({
        user_id: currentUser.id,
        event_name: 'tab_view',
        meta: { app, tab: tabId }
      })
      .then(() => {})
      .catch(() => {});
  }
}
