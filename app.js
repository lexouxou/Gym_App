/**
 * IronTrack - Suivi de musculation minimaliste & mobile-first
 * Stockage 100% local (localStorage) & mode hors-ligne
 */

// --- 1. DONNÉES PAR DÉFAUT (Cahier des charges utilisateur) ---
// --- 1. DONNÉES PAR DÉFAUT (Cahier des charges mis à jour) ---
const DEFAULT_EXERCISES = [
  // Échauffement intelligent (Tronc & Chaîne postérieure)
  {
    id: 'gainage',
    name: 'Gainage',
    category: 'Échauffement intelligent',
    unit: 'min',
    defaultWeight: 0,
    defaultReps: '2 min',
    isDuration: true,
    note: 'Verrouillage du tronc'
  },
  {
    id: 'banc_lombaires',
    name: 'Banc à lombaires',
    category: 'Échauffement intelligent',
    unit: 'reps',
    defaultWeight: 0,
    defaultReps: '3 × 15 reps',
    isDuration: false,
    note: 'Chaîne postérieure'
  },
  // Tirage (Dos)
  {
    id: 'lat_pulldown',
    name: 'Lat pulldown',
    category: 'Tirage (Dos)',
    unit: 'kg',
    defaultWeight: 30,
    defaultReps: 'Pyramide 25→30→35',
    isDuration: false,
    note: 'Pyramide (25 -> 30 -> 35 kg)'
  },
  {
    id: 'low_rows',
    name: 'Low rows',
    category: 'Tirage (Dos)',
    unit: 'kg',
    defaultWeight: 35,
    defaultReps: '10 reps',
    isDuration: false
  },
  // Poussées (Buste & Épaules)
  {
    id: 'chest_press',
    name: 'Chest Press',
    category: 'Poussées (Buste & Épaules)',
    unit: 'kg',
    defaultWeight: 35,
    defaultReps: '10 reps',
    isDuration: false
  },
  {
    id: 'shoulder_press',
    name: 'Shoulder Press',
    category: 'Poussées (Buste & Épaules)',
    unit: 'kg',
    defaultWeight: 12.5,
    defaultReps: '10 reps',
    isDuration: false,
    note: 'Objectif 10 -> 15 kg'
  },
  {
    id: 'elevations_laterales',
    name: 'Élévations latérales',
    category: 'Poussées (Buste & Épaules)',
    unit: 'kg',
    defaultWeight: 4,
    defaultReps: '12 reps',
    isDuration: false
  },
  // Bras & Abdos (Isolation)
  {
    id: 'curl_biceps',
    name: 'Curl biceps',
    category: 'Bras & Abdos',
    unit: 'kg',
    defaultWeight: 8,
    defaultReps: '10 reps',
    isDuration: false
  },
  {
    id: 'curl_inverse',
    name: 'Curl inversé',
    category: 'Bras & Abdos',
    unit: 'kg',
    defaultWeight: 4,
    defaultReps: '12 reps',
    isDuration: false
  },
  {
    id: 'machine_crunches',
    name: 'Machine crunches',
    category: 'Bras & Abdos',
    unit: 'kg',
    defaultWeight: 25,
    defaultReps: '15 reps',
    isDuration: false
  }
];

// --- 2. ÉTAT GLOBAL DE L'APPLICATION ---
const STORAGE_KEY_EXERCISES = 'irontrack_exercises_v2';
const STORAGE_KEY_SESSIONS = 'irontrack_sessions_v1';

let appState = {
  exercises: [],
  sessions: [], // [{ id, date, dateFormatted, records: { [exId]: { weight, reps, done } } }]
  currentDate: getTodayDateString(),
  activeTab: 'workout', // 'workout' | 'history' | 'settings'
};

// --- 3. INITIALISATION ---
document.addEventListener('DOMContentLoaded', () => {
  initStorage();
  initDateInput();
  initNavigation();
  initRestTimer();
  initEventListeners();
  renderWorkoutView();
  renderHistoryView();
});

function initStorage() {
  const savedExercisesV2 = localStorage.getItem(STORAGE_KEY_EXERCISES);
  if (savedExercisesV2) {
    try {
      appState.exercises = JSON.parse(savedExercisesV2);
    } catch (e) {
      appState.exercises = [...DEFAULT_EXERCISES];
    }
  } else {
    // Migration depuis v1 si existant (conserve les éventuels exos personnalisés créés par l'utilisateur)
    const oldExercisesStr = localStorage.getItem('irontrack_exercises_v1');
    if (oldExercisesStr) {
      try {
        const oldExercises = JSON.parse(oldExercisesStr);
        const customExos = oldExercises.filter(e => e.id && e.id.startsWith('custom_'));
        appState.exercises = [...DEFAULT_EXERCISES, ...customExos];
      } catch (e) {
        appState.exercises = [...DEFAULT_EXERCISES];
      }
    } else {
      appState.exercises = [...DEFAULT_EXERCISES];
    }
    saveExercises();
  }

  const savedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
  if (savedSessions) {
    try {
      appState.sessions = JSON.parse(savedSessions);
      // Complète les sessions existantes avec les nouveaux exercices si manquants
      ensureNewExercisesInSessions();
    } catch (e) {
      appState.sessions = [];
    }
  } else {
    seedInitialPastSession();
  }
}

function ensureNewExercisesInSessions() {
  let changed = false;
  appState.sessions.forEach(session => {
    if (session.records) {
      if (!session.records['lat_pulldown']) {
        session.records['lat_pulldown'] = { weight: 25, reps: 'Pyramide 25→30', done: true };
        changed = true;
      }
      if (!session.records['shoulder_press']) {
        session.records['shoulder_press'] = { weight: 10, reps: '10 reps', done: true };
        changed = true;
      }
    }
  });
  if (changed) saveSessions();
}

function seedInitialPastSession() {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 4); // 4 jours plus tôt
  const dateStr = pastDate.toISOString().split('T')[0];

  const pastSession = {
    id: 'session_' + Date.now(),
    date: dateStr,
    dateFormatted: formatFrenchDate(dateStr),
    records: {
      'gainage': { weight: 0, reps: '2 min', done: true },
      'banc_lombaires': { weight: 0, reps: '3 × 15 reps', done: true },
      'lat_pulldown': { weight: 25, reps: 'Pyramide 25→30', done: true },
      'low_rows': { weight: 30, reps: '10 reps', done: true },
      'chest_press': { weight: 32.5, reps: '10 reps', done: true },
      'shoulder_press': { weight: 10, reps: '10 reps', done: true },
      'elevations_laterales': { weight: 4, reps: '12 reps', done: true },
      'curl_biceps': { weight: 8, reps: '10 reps', done: true },
      'curl_inverse': { weight: 4, reps: '10 reps', done: true },
      'machine_crunches': { weight: 20, reps: '15 reps', done: true },
    }
  };

  appState.sessions = [pastSession];
  saveSessions();
}

function saveExercises() {
  localStorage.setItem(STORAGE_KEY_EXERCISES, JSON.stringify(appState.exercises));
}

function saveSessions() {
  localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(appState.sessions));
}

// --- 4. GESTION DES DATES & FORMULATION ---
function getTodayDateString() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

function formatFrenchDate(dateString) {
  try {
    const parts = dateString.split('-');
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const str = date.toLocaleDateString('fr-FR', options);
    return str.charAt(0).toUpperCase() + str.slice(1);
  } catch (e) {
    return dateString;
  }
}

function initDateInput() {
  const dateInput = document.getElementById('sessionDateInput');
  const dayBadge = document.getElementById('dayNameBadge');
  dateInput.value = appState.currentDate;
  dayBadge.textContent = formatFrenchDate(appState.currentDate);

  dateInput.addEventListener('change', (e) => {
    appState.currentDate = e.target.value;
    dayBadge.textContent = formatFrenchDate(appState.currentDate);
    renderWorkoutView();
  });
}

// --- 5. NAVIGATION PAR ONGLETS ---
function initNavigation() {
  const navWorkoutBtn = document.getElementById('navWorkoutBtn');
  const navHistoryBtn = document.getElementById('navHistoryBtn');
  const navSettingsBtn = document.getElementById('navSettingsBtn');
  const openSettingsTopBtn = document.getElementById('openSettingsBtn');

  const tabs = [
    { btn: navWorkoutBtn, viewId: 'viewWorkout', name: 'workout' },
    { btn: navHistoryBtn, viewId: 'viewHistory', name: 'history' },
    { btn: navSettingsBtn, viewId: 'viewSettings', name: 'settings' }
  ];

  function switchTab(targetName) {
    appState.activeTab = targetName;
    tabs.forEach(tab => {
      const viewEl = document.getElementById(tab.viewId);
      if (tab.name === targetName) {
        tab.btn.classList.add('active', 'text-blue-400');
        tab.btn.classList.remove('text-slate-400');
        viewEl.classList.remove('hidden');
      } else {
        tab.btn.classList.remove('active', 'text-blue-400');
        tab.btn.classList.add('text-slate-400');
        viewEl.classList.add('hidden');
      }
    });

    if (targetName === 'history') {
      renderHistoryView();
    }
  }

  navWorkoutBtn.addEventListener('click', () => switchTab('workout'));
  navHistoryBtn.addEventListener('click', () => switchTab('history'));
  navSettingsBtn.addEventListener('click', () => switchTab('settings'));
  openSettingsTopBtn.addEventListener('click', () => switchTab('settings'));
}

// --- 6. LOGIQUE DE LA SÉANCE DU JOUR ---
function getLastSessionRecord(exerciseId) {
  // Parcourt les sessions de la plus récente à la plus ancienne (sauf la séance de la date courante en cours de saisie)
  const sortedSessions = [...appState.sessions]
    .filter(s => s.date !== appState.currentDate)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  for (const session of sortedSessions) {
    if (session.records && session.records[exerciseId] && session.records[exerciseId].done) {
      return {
        ...session.records[exerciseId],
        date: session.date,
        dateFormatted: session.dateFormatted
      };
    }
  }
  return null;
}

function getCurrentSessionForDate(dateStr) {
  return appState.sessions.find(s => s.date === dateStr) || null;
}

function renderWorkoutView() {
  const container = document.getElementById('workoutExercisesList');
  container.innerHTML = '';

  const currentSavedSession = getCurrentSessionForDate(appState.currentDate);

  // Regrouper par catégorie
  const categories = {};
  appState.exercises.forEach(ex => {
    const cat = ex.category || 'Autres';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(ex);
  });

  let totalEx = appState.exercises.length;
  let completedEx = 0;

  Object.entries(categories).forEach(([categoryName, exList]) => {
    const groupCard = document.createElement('div');
    groupCard.className = 'space-y-2.5';

    // En-tête de catégorie
    const catHeader = document.createElement('div');
    catHeader.className = 'flex items-center gap-2 pt-2';
    catHeader.innerHTML = `
      <span class="text-xs font-bold uppercase tracking-wider text-slate-400">${categoryName}</span>
      <div class="h-[1px] flex-1 bg-slate-800"></div>
    `;
    groupCard.appendChild(catHeader);

    // Cartes des exercices
    exList.forEach(ex => {
      const lastRec = getLastSessionRecord(ex.id);
      const currentRec = currentSavedSession?.records?.[ex.id];

      if (currentRec && currentRec.done) {
        completedEx++;
      }

      // Valeurs initiales à afficher dans les champs
      const initialWeight = currentRec ? currentRec.weight : (lastRec ? lastRec.weight : ex.defaultWeight);
      const initialReps = currentRec ? currentRec.reps : (lastRec ? lastRec.reps : ex.defaultReps);
      const isChecked = currentRec ? currentRec.done : false;

      const card = document.createElement('div');
      card.id = `card_${ex.id}`;
      card.className = `exercise-card bg-[#121a2d] border ${isChecked ? 'border-blue-500/50 bg-[#142038]' : 'border-slate-800/80'} rounded-2xl p-3.5 shadow-md`;

      card.innerHTML = `
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-sm font-bold text-white tracking-tight">${ex.name}</h3>
              ${ex.isDuration ? '<span class="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-semibold">Chrono</span>' : ''}
              ${ex.note ? `<span class="text-[10px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-1.5 py-0.5 rounded font-medium">${ex.note}</span>` : ''}
              <span id="badge_delta_${ex.id}"></span>
            </div>
            
            <!-- Rappel séance précédente -->
            <div class="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
              <span class="text-slate-500 text-[11px]">Dernière séance :</span>
              ${lastRec 
                ? `<span class="font-mono font-medium text-slate-300">${lastRec.weight > 0 ? lastRec.weight + ' kg × ' : ''}${lastRec.reps}</span>
                   <button type="button" class="btn-copy-last text-[10px] text-blue-400 hover:text-blue-300 font-semibold underline ml-1 cursor-pointer" data-id="${ex.id}" data-weight="${lastRec.weight}" data-reps="${lastRec.reps}">Copier</button>`
                : `<span class="text-slate-500 italic text-[11px]">Aucun historique</span>`
              }
            </div>
          </div>

          <!-- Checkbox Valider l'exercice -->
          <label class="flex items-center gap-1.5 cursor-pointer bg-slate-800/80 hover:bg-slate-700/80 px-2.5 py-1 rounded-xl border border-slate-700 select-none">
            <input type="checkbox" id="check_${ex.id}" ${isChecked ? 'checked' : ''} class="exercise-check w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-600 focus:ring-0 cursor-pointer" />
            <span class="text-xs font-bold text-slate-300">Fait</span>
          </label>
        </div>

        <!-- Inputs Poids & Reps avec Steppers -->
        <div class="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-800/80">
          
          <!-- Poids -->
          <div>
            <label class="text-[11px] font-semibold text-slate-400 block mb-1">
              ${ex.isDuration ? 'Lest / Poids (kg)' : 'Poids (kg)'}
            </label>
            <div class="flex items-center gap-1">
              <button type="button" class="step-btn minus-weight" data-id="${ex.id}">-</button>
              <input type="number" step="0.5" id="weight_${ex.id}" value="${initialWeight}" class="input-weight w-full text-center bg-slate-900 border border-slate-700 text-white font-mono font-bold text-sm rounded-lg py-1.5 focus:border-blue-500 focus:outline-none" />
              <button type="button" class="step-btn plus-weight" data-id="${ex.id}">+</button>
            </div>
          </div>

          <!-- Répétitions / Temps -->
          <div>
            <label class="text-[11px] font-semibold text-slate-400 block mb-1">
              ${ex.isDuration ? 'Durée (ex: 2 min)' : 'Reps (ou séries × reps)'}
            </label>
            <div class="flex items-center gap-1">
              <button type="button" class="step-btn minus-reps" data-id="${ex.id}">-</button>
              <input type="text" id="reps_${ex.id}" value="${initialReps}" class="input-reps w-full text-center bg-slate-900 border border-slate-700 text-white font-mono font-bold text-sm rounded-lg py-1.5 focus:border-blue-500 focus:outline-none" />
              <button type="button" class="step-btn plus-reps" data-id="${ex.id}">+</button>
            </div>
          </div>

        </div>
      `;

      groupCard.appendChild(card);
    });

    container.appendChild(groupCard);
  });

  // Mise à jour du résumé
  document.getElementById('completedExercisesCount').textContent = completedEx;
  document.getElementById('totalExercisesCount').textContent = totalEx;

  // Calculer et afficher les deltas de progression
  attachExerciseCardEvents();
  updateAllDeltaBadges();
}

function attachExerciseCardEvents() {
  // Steppers Poids
  document.querySelectorAll('.minus-weight').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const input = document.getElementById(`weight_${id}`);
      let val = parseFloat(input.value) || 0;
      val = Math.max(0, val <= 10 ? val - 1 : val - 2.5);
      input.value = val;
      markExerciseAsDone(id);
      updateDeltaBadge(id);
    };
  });

  document.querySelectorAll('.plus-weight').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const input = document.getElementById(`weight_${id}`);
      let val = parseFloat(input.value) || 0;
      val = val < 10 ? val + 1 : val + 2.5;
      input.value = val;
      markExerciseAsDone(id);
      updateDeltaBadge(id);
    };
  });

  // Steppers Reps
  document.querySelectorAll('.minus-reps').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const input = document.getElementById(`reps_${id}`);
      adjustRepsString(input, -1);
      markExerciseAsDone(id);
      updateDeltaBadge(id);
    };
  });

  document.querySelectorAll('.plus-reps').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const input = document.getElementById(`reps_${id}`);
      adjustRepsString(input, 1);
      markExerciseAsDone(id);
      updateDeltaBadge(id);
    };
  });

  // Copier dernière séance
  document.querySelectorAll('.btn-copy-last').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const weight = btn.dataset.weight;
      const reps = btn.dataset.reps;
      const weightInput = document.getElementById(`weight_${id}`);
      const repsInput = document.getElementById(`reps_${id}`);
      if (weightInput) weightInput.value = weight;
      if (repsInput) repsInput.value = reps;
      markExerciseAsDone(id);
      updateDeltaBadge(id);
      showToast('Valeurs précédentes copiées !', '📋');
    };
  });

  // Checkbox Fait
  document.querySelectorAll('.exercise-check').forEach(chk => {
    chk.onchange = () => {
      const exId = chk.id.replace('check_', '');
      const card = document.getElementById(`card_${exId}`);
      if (chk.checked) {
        card.classList.add('border-blue-500/50', 'bg-[#142038]');
        card.classList.remove('border-slate-800/80');
      } else {
        card.classList.remove('border-blue-500/50', 'bg-[#142038]');
        card.classList.add('border-slate-800/80');
      }
      updateCompletedCount();
    };
  });

  // Modification directe des inputs
  document.querySelectorAll('.input-weight, .input-reps').forEach(input => {
    input.oninput = () => {
      const exId = input.id.replace('weight_', '').replace('reps_', '');
      markExerciseAsDone(exId);
      updateDeltaBadge(exId);
    };
  });
}

function adjustRepsString(input, delta) {
  let val = input.value.trim();
  // Cas simple: juste un nombre ou "X reps"
  const matchReps = val.match(/^(\d+)\s*(reps?)?$/i);
  if (matchReps) {
    let num = parseInt(matchReps[1], 10) + delta;
    if (num < 1) num = 1;
    input.value = `${num} reps`;
    return;
  }

  // Cas "3 x 15 reps"
  const matchMulti = val.match(/^(\d+)\s*[x×]\s*(\d+)\s*(reps?)?$/i);
  if (matchMulti) {
    let sets = matchMulti[1];
    let reps = parseInt(matchMulti[2], 10) + delta;
    if (reps < 1) reps = 1;
    input.value = `${sets} × ${reps} reps`;
    return;
  }

  // Cas durée "2 min"
  const matchMin = val.match(/^(\d+)\s*(min|m)?$/i);
  if (matchMin) {
    let mins = parseInt(matchMin[1], 10) + delta;
    if (mins < 1) mins = 1;
    input.value = `${mins} min`;
    return;
  }

  // Si format personnalisé inconnu, incrémente le premier nombre trouvé
  const anyNum = val.match(/\d+/);
  if (anyNum) {
    const num = parseInt(anyNum[0], 10) + delta;
    input.value = val.replace(/\d+/, Math.max(1, num));
  }
}

function markExerciseAsDone(exId) {
  const chk = document.getElementById(`check_${exId}`);
  if (chk && !chk.checked) {
    chk.checked = true;
    const card = document.getElementById(`card_${exId}`);
    if (card) {
      card.classList.add('border-blue-500/50', 'bg-[#142038]');
      card.classList.remove('border-slate-800/80');
    }
    updateCompletedCount();
  }
}

function updateCompletedCount() {
  const checkboxes = document.querySelectorAll('.exercise-check');
  let checked = 0;
  checkboxes.forEach(c => { if (c.checked) checked++; });
  document.getElementById('completedExercisesCount').textContent = checked;
}

function updateAllDeltaBadges() {
  appState.exercises.forEach(ex => updateDeltaBadge(ex.id));
}

function updateDeltaBadge(exId) {
  const badgeEl = document.getElementById(`badge_delta_${exId}`);
  if (!badgeEl) return;

  const lastRec = getLastSessionRecord(exId);
  const currentWeight = parseFloat(document.getElementById(`weight_${exId}`)?.value) || 0;
  const currentRepsStr = document.getElementById(`reps_${exId}`)?.value || '';

  if (!lastRec) {
    badgeEl.innerHTML = '';
    return;
  }

  let weightDelta = currentWeight - (parseFloat(lastRec.weight) || 0);

  // Extraire le nombre de reps pour comparer
  const parseRepCount = (str) => {
    const m = String(str).match(/(\d+)\s*(reps?)?$/i);
    return m ? parseInt(m[1], 10) : null;
  };

  const currRepNum = parseRepCount(currentRepsStr);
  const lastRepNum = parseRepCount(lastRec.reps);
  let repsDelta = (currRepNum !== null && lastRepNum !== null) ? (currRepNum - lastRepNum) : 0;

  if (weightDelta > 0) {
    badgeEl.innerHTML = `<span class="progression-badge text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.5 rounded-full font-bold">+${weightDelta} kg 🔥</span>`;
  } else if (repsDelta > 0 && weightDelta === 0) {
    badgeEl.innerHTML = `<span class="progression-badge text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.5 rounded-full font-bold">+${repsDelta} reps 🚀</span>`;
  } else if (weightDelta < 0) {
    badgeEl.innerHTML = `<span class="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded-full font-semibold">${weightDelta} kg</span>`;
  } else {
    badgeEl.innerHTML = `<span class="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full font-medium">Maintien</span>`;
  }
}

// --- 7. ENREGISTREMENT DE LA SÉANCE ---
function saveCurrentSession() {
  const dateStr = appState.currentDate;
  const dateFormatted = formatFrenchDate(dateStr);
  const records = {};

  let anyChecked = false;

  appState.exercises.forEach(ex => {
    const chk = document.getElementById(`check_${ex.id}`);
    const weightInput = document.getElementById(`weight_${ex.id}`);
    const repsInput = document.getElementById(`reps_${ex.id}`);

    const isDone = chk ? chk.checked : false;
    if (isDone) anyChecked = true;

    records[ex.id] = {
      weight: parseFloat(weightInput?.value) || 0,
      reps: repsInput?.value.trim() || ex.defaultReps,
      done: isDone
    };
  });

  if (!anyChecked) {
    // Si aucun exercice n'était coché, on propose de tous les cocher
    if (confirm("Aucun exercice n'a été coché 'Fait'. Veux-tu enregistrer tous les exercices comme validés ?")) {
      Object.keys(records).forEach(id => { records[id].done = true; });
    } else {
      return;
    }
  }

  // Vérifier si une session existe déjà pour cette date
  const existingIdx = appState.sessions.findIndex(s => s.date === dateStr);
  const sessionData = {
    id: existingIdx >= 0 ? appState.sessions[existingIdx].id : 'session_' + Date.now(),
    date: dateStr,
    dateFormatted: dateFormatted,
    records: records,
    savedAt: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    appState.sessions[existingIdx] = sessionData;
  } else {
    appState.sessions.unshift(sessionData);
  }

  saveSessions();
  showToast('Séance enregistrée avec succès !', '💪');
  renderWorkoutView();
  renderHistoryView();
}

// Reprendre toutes les perfs de la dernière séance
function quickFillFromLastSession() {
  const lastSession = [...appState.sessions]
    .filter(s => s.date !== appState.currentDate)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  if (!lastSession) {
    showToast('Aucune séance précédente trouvée', 'ℹ️');
    return;
  }

  appState.exercises.forEach(ex => {
    const rec = lastSession.records?.[ex.id];
    if (rec) {
      const weightInput = document.getElementById(`weight_${ex.id}`);
      const repsInput = document.getElementById(`reps_${ex.id}`);
      if (weightInput) weightInput.value = rec.weight;
      if (repsInput) repsInput.value = rec.reps;
      markExerciseAsDone(ex.id);
    }
  });

  updateAllDeltaBadges();
  showToast(`Données du ${lastSession.dateFormatted} appliquées`, '⚡');
}

// --- 8. VUE HISTORIQUE & PROGRESSION ---
function renderHistoryView() {
  const container = document.getElementById('historyListContainer');
  const totalCountEl = document.getElementById('historyTotalSessions');
  const filterSelect = document.getElementById('historyExerciseFilter');

  totalCountEl.textContent = appState.sessions.length;

  // Mise à jour des options du filtre
  const currentFilter = filterSelect.value || 'all';
  filterSelect.innerHTML = `<option value="all">Toutes les séances complètes</option>`;
  appState.exercises.forEach(ex => {
    const opt = document.createElement('option');
    opt.value = ex.id;
    opt.textContent = `${ex.category ? ex.category + ' : ' : ''}${ex.name}`;
    if (ex.id === currentFilter) opt.selected = true;
    filterSelect.appendChild(opt);
  });

  const sortedSessions = [...appState.sessions].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (sortedSessions.length === 0) {
    container.innerHTML = `
      <div class="text-center py-10 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400">
        <span class="text-3xl block mb-2">📋</span>
        <p class="font-bold text-white text-sm">Aucune séance enregistrée</p>
        <p class="text-xs text-slate-500 mt-1">Valide ta première séance dans l'onglet Aujourd'hui !</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';

  // Mode 1: Vue chronologique de toutes les séances
  if (currentFilter === 'all') {
    sortedSessions.forEach(session => {
      const sessionCard = document.createElement('div');
      sessionCard.className = 'bg-[#121a2d] border border-slate-800/80 rounded-2xl p-4 shadow-md space-y-3';

      // En-tête de la séance
      sessionCard.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div>
            <div class="text-sm font-extrabold text-white flex items-center gap-2">
              <span>📅</span> ${session.dateFormatted}
            </div>
            <div class="text-[11px] text-slate-400 font-mono">${session.date}</div>
          </div>
          <button class="btn-delete-session text-slate-500 hover:text-rose-400 p-1 text-xs" data-id="${session.id}" title="Supprimer cette séance">
            🗑️
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          ${appState.exercises.map(ex => {
            const rec = session.records?.[ex.id];
            if (!rec || !rec.done) return '';
            return `
              <div class="flex items-center justify-between bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800/60">
                <span class="font-semibold text-slate-300 truncate max-w-[140px]">${ex.name}</span>
                <span class="font-mono font-bold text-blue-400">
                  ${rec.weight > 0 ? rec.weight + ' kg × ' : ''}${rec.reps}
                </span>
              </div>
            `;
          }).join('')}
        </div>
      `;

      container.appendChild(sessionCard);
    });
  } 
  // Mode 2: Évolution d'un exercice précis
  else {
    const selectedEx = appState.exercises.find(e => e.id === currentFilter);
    const exerciseRecords = [];

    sortedSessions.forEach(s => {
      const rec = s.records?.[currentFilter];
      if (rec && rec.done) {
        exerciseRecords.push({
          date: s.date,
          dateFormatted: s.dateFormatted,
          weight: rec.weight,
          reps: rec.reps
        });
      }
    });

    if (exerciseRecords.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-xs text-slate-500">
          Aucune donnée enregistrée pour <strong>${selectedEx?.name}</strong>.
        </div>
      `;
      return;
    }

    const header = document.createElement('div');
    header.className = 'p-3 bg-blue-950/30 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-center justify-between';
    header.innerHTML = `
      <div>Évolution pour <strong>${selectedEx?.name}</strong></div>
      <div class="font-mono font-bold">${exerciseRecords.length} séances loggées</div>
    `;
    container.appendChild(header);

    exerciseRecords.forEach((entry, idx) => {
      const nextOlder = exerciseRecords[idx + 1];
      let diffHtml = '';

      if (nextOlder) {
        const diffW = entry.weight - nextOlder.weight;
        if (diffW > 0) diffHtml = `<span class="text-emerald-400 font-bold ml-1">(+${diffW} kg 📈)</span>`;
        else if (diffW < 0) diffHtml = `<span class="text-rose-400 font-bold ml-1">(${diffW} kg)</span>`;
        else diffHtml = `<span class="text-slate-500 ml-1">(=)</span>`;
      }

      const item = document.createElement('div');
      item.className = 'flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs';
      item.innerHTML = `
        <div>
          <div class="font-bold text-slate-200">${entry.dateFormatted}</div>
          <div class="text-[10px] text-slate-500 font-mono">${entry.date}</div>
        </div>
        <div class="text-right">
          <div class="font-mono font-bold text-sm text-blue-400">
            ${entry.weight > 0 ? entry.weight + ' kg × ' : ''}${entry.reps}
            ${diffHtml}
          </div>
        </div>
      `;
      container.appendChild(item);
    });
  }

  // Attacher événement de suppression
  document.querySelectorAll('.btn-delete-session').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      if (confirm('Supprimer définitivement cette séance de ton historique ?')) {
        appState.sessions = appState.sessions.filter(s => s.id !== id);
        saveSessions();
        renderHistoryView();
        renderWorkoutView();
        showToast('Séance supprimée', '🗑️');
      }
    };
  });
}

// --- 9. CHRONOMÈTRE DE REPOS (Avec Bip Audio Web API) ---
let timerInterval = null;
let timerSecondsRemaining = 60;
let isTimerRunning = false;

function initRestTimer() {
  const openTimerBtn = document.getElementById('openTimerBtn');
  const overlay = document.getElementById('restTimerOverlay');
  const closeTimerBtn = document.getElementById('closeTimerModalBtn');
  const toggleTimerBtn = document.getElementById('toggleTimerBtn');
  const clockDisplay = document.getElementById('timerClockDisplay');
  const statusLabel = document.getElementById('timerStatusLabel');

  openTimerBtn.onclick = () => {
    overlay.classList.toggle('hidden');
  };

  closeTimerBtn.onclick = () => {
    overlay.classList.add('hidden');
  };

  document.querySelectorAll('.timerPresetBtn').forEach(btn => {
    btn.onclick = () => {
      const s = parseInt(btn.dataset.seconds, 10);
      timerSecondsRemaining = s;
      updateTimerDisplay();
      if (!isTimerRunning) {
        startTimer();
      }
    };
  });

  toggleTimerBtn.onclick = () => {
    if (isTimerRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  function updateTimerDisplay() {
    const mins = Math.floor(timerSecondsRemaining / 60);
    const secs = timerSecondsRemaining % 60;
    const str = mins > 0 ? `${mins}m ${secs < 10 ? '0' : ''}${secs}s` : `${secs}s`;
    clockDisplay.textContent = str;
    if (isTimerRunning) {
      statusLabel.textContent = str;
    } else {
      statusLabel.textContent = 'Repos';
    }
  }

  function startTimer() {
    isTimerRunning = true;
    toggleTimerBtn.textContent = 'Pause';
    toggleTimerBtn.classList.replace('bg-blue-600', 'bg-amber-600');
    openTimerBtn.classList.add('border-blue-500', 'text-blue-400');

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timerSecondsRemaining--;
      updateTimerDisplay();

      if (timerSecondsRemaining <= 0) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        toggleTimerBtn.textContent = 'Start';
        toggleTimerBtn.classList.replace('bg-amber-600', 'bg-blue-600');
        openTimerBtn.classList.remove('border-blue-500', 'text-blue-400');
        statusLabel.textContent = 'Fini !';
        playBeepSound();
        showToast('Temps de repos terminé ! À toi de jouer ! 🔥', '⏱️');
      }
    }, 1000);
  }

  function pauseTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    toggleTimerBtn.textContent = 'Reprendre';
    toggleTimerBtn.classList.replace('bg-amber-600', 'bg-blue-600');
  }

  function playBeepSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // La 880Hz
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      // Audio context may require prior user interaction
    }
  }
}

// --- 10. MODAL AJOUT D'EXERCICE ---
function initExerciseModal() {
  const modal = document.getElementById('exerciseModal');
  const btnOpen = document.getElementById('btnOpenNewExerciseModal');
  const btnClose = document.getElementById('closeExerciseModalBtn');
  const btnCancel = document.getElementById('btnCancelExerciseModal');
  const btnSave = document.getElementById('btnSaveNewExercise');

  const inputName = document.getElementById('newExerciseName');
  const selectCat = document.getElementById('newExerciseCategory');
  const inputWeight = document.getElementById('newExerciseWeight');
  const inputReps = document.getElementById('newExerciseReps');

  btnOpen.onclick = () => {
    inputName.value = '';
    modal.classList.remove('hidden');
    inputName.focus();
  };

  const closeModal = () => modal.classList.add('hidden');
  btnClose.onclick = closeModal;
  btnCancel.onclick = closeModal;

  btnSave.onclick = () => {
    const name = inputName.value.trim();
    if (!name) {
      alert("Veuillez renseigner un nom d'exercice");
      return;
    }

    const id = 'custom_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
    const newEx = {
      id: id,
      name: name,
      category: selectCat.value,
      unit: 'kg',
      defaultWeight: parseFloat(inputWeight.value) || 0,
      defaultReps: inputReps.value.trim() || '10 reps',
      isDuration: inputReps.value.includes('min') || inputReps.value.includes('sec')
    };

    appState.exercises.push(newEx);
    saveExercises();
    closeModal();
    renderWorkoutView();
    renderHistoryView();
    showToast(`Exercice "${name}" ajouté !`, '✨');
  };
}

// --- 11. EXPORT, IMPORT & RESET ---
function initSettingsActions() {
  // Export JSON
  document.getElementById('btnExportJSON').onclick = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      exercises: appState.exercises,
      sessions: appState.sessions
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `irontrack_backup_${getTodayDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Sauvegarde exportée avec succès !', '💾');
  };

  // Import JSON
  const importInput = document.getElementById('importFileInput');
  importInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.exercises && data.sessions) {
          appState.exercises = data.exercises;
          appState.sessions = data.sessions;
          saveExercises();
          saveSessions();
          renderWorkoutView();
          renderHistoryView();
          showToast('Données restaurées avec succès !', '✅');
        } else {
          alert('Fichier JSON invalide pour IronTrack.');
        }
      } catch (err) {
        alert("Erreur lors de la lecture du fichier de sauvegarde.");
      }
    };
    reader.readAsText(file);
    importInput.value = '';
  };

  // Reset to defaults
  document.getElementById('btnResetToDefaults').onclick = () => {
    if (confirm("Réinitialiser tous les exercices et l'historique aux valeurs par défaut ?")) {
      localStorage.removeItem(STORAGE_KEY_EXERCISES);
      localStorage.removeItem(STORAGE_KEY_SESSIONS);
      appState.exercises = [...DEFAULT_EXERCISES];
      saveExercises();
      seedInitialPastSession();
      renderWorkoutView();
      renderHistoryView();
      showToast('Programme réinitialisé !', '🔄');
    }
  };
}

// --- 12. TOAST NOTIFICATIONS ---
function showToast(message, icon = '✅') {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMessage');
  const toastIcon = document.getElementById('toastIcon');

  toastMsg.textContent = message;
  toastIcon.textContent = icon;

  toast.classList.remove('opacity-0', 'translate-y-3');
  toast.classList.add('opacity-100', 'translate-y-0');

  setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', 'translate-y-3');
  }, 2200);
}

// --- 13. GLOBAL EVENT LISTENERS ---
function initEventListeners() {
  document.getElementById('btnSaveSession').onclick = saveCurrentSession;
  document.getElementById('btnSaveSessionBottom').onclick = saveCurrentSession;
  document.getElementById('btnQuickFillLast').onclick = quickFillFromLastSession;
  document.getElementById('historyExerciseFilter').onchange = renderHistoryView;

  initExerciseModal();
  initSettingsActions();
}
