/**
 * CapyStats: O Guardião Estatístico do Pantanal
 * Motor de Jogo Educativo & Playground Estatístico em Tempo Real
 */

// --- AUDIO SYNTHESIZER (Web Audio API - Zero External Dependencies) ---
class SoundController {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  playTone(freq, type, duration, gainVal = 0.15) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  playClick() {
    this.playTone(600, 'sine', 0.08, 0.1);
  }

  playCorrect() {
    if (!this.enabled) return;
    this.init();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.25, 0.2);
      }, idx * 80);
    });
  }

  playWrong() {
    if (!this.enabled) return;
    this.init();
    this.playTone(220, 'sawtooth', 0.2, 0.15);
    setTimeout(() => this.playTone(185, 'sawtooth', 0.3, 0.15), 120);
  }

  playSplash() {
    this.playTone(350, 'sine', 0.15, 0.15);
    setTimeout(() => this.playTone(480, 'triangle', 0.2, 0.1), 80);
  }
}

const sound = new SoundController();

// --- GAME STATE ---
const GameState = {
  score: 0,
  streak: 0,
  currentLevel: 1,
  currentMissionIndex: 0,
  stars: { 1: 3, 2: 0, 3: 0, 4: 0 },
  ranks: [
    { min: 0, name: 'Filhote Curioso 🐾' },
    { min: 150, name: 'Observador da Várzea 🌿' },
    { min: 350, name: 'Analista do Bando 🍉' },
    { min: 650, name: 'Estatístico do Rio 🛶' },
    { min: 1000, name: 'Guardião Supremo do Pantanal 👑' }
  ],
  labHerd: [45, 52, 48, 50, 55, 47, 51, 60, 42, 50]
};

// --- MISSIONS & CURRICULUM ---
const Missions = {
  1: [
    // FASE 1: MÉDIA, MEDIANA, MODA
    {
      type: 'mean',
      tag: 'FASE 1: MISSÃO 1/3 (MÉDIA)',
      title: 'A Divisão Justa de Melancias',
      hint: 'A Média Aritmética soma todas as melancias e divide pelo número de capivaras no piquenique!',
      generate: () => {
        // e.g. 4 capybaras with integer mean
        const targetMean = Math.floor(Math.random() * 4) + 3; // 3 to 6
        const n = 4;
        let numbers = [targetMean - 2, targetMean, targetMean + 1, targetMean + 1];
        // shuffle
        numbers = numbers.sort(() => Math.random() - 0.5);
        const sum = numbers.reduce((a, b) => a + b, 0);
        const mean = sum / n;

        const options = [mean, mean + 1, Math.max(1, mean - 1), mean + 2].sort(() => Math.random() - 0.5);

        return {
          question: `Estas 4 capivaras colheram as seguintes fatias de melancia: [${numbers.join(', ')}]. Qual é a <strong>Média</strong> de melancias por capivara?`,
          items: numbers.map(v => ({ icon: '🍉', val: `${v} fatias` })),
          correct: mean,
          options: [...new Set(options)],
          explanation: `A soma de todas as fatias é <code>${numbers.join(' + ')} = ${sum}</code>.<br>Dividindo pelo número de capivaras (4): <code>${sum} ÷ 4 = ${mean}</code>. A média é <strong>${mean}</strong>!`
        };
      }
    },
    {
      type: 'median',
      tag: 'FASE 1: MISSÃO 2/3 (MEDIANA)',
      title: 'A Capivara Central da Fila',
      hint: 'Para encontrar a Mediana, primeiro organize os números em ordem crescente (do menor para o maior). O valor do meio é a mediana!',
      generate: () => {
        const raw = [
          Math.floor(Math.random() * 5) + 2,
          Math.floor(Math.random() * 5) + 7,
          Math.floor(Math.random() * 5) + 12,
          Math.floor(Math.random() * 5) + 17,
          Math.floor(Math.random() * 5) + 22
        ];
        const sorted = [...raw].sort((a, b) => a - b);
        const median = sorted[2];
        const shuffled = [...raw].sort(() => Math.random() - 0.5);

        const options = [median, sorted[1], sorted[3], median + 3].sort(() => Math.random() - 0.5);

        return {
          question: `Os filhotes de capivara comeram goiabas: [${shuffled.join(', ')}]. Coloque mentalmente em ordem crescente. Qual é a <strong>Mediana</strong>?`,
          items: shuffled.map(v => ({ icon: '🍐', val: `${v} goiabas` })),
          correct: median,
          options: [...new Set(options)],
          explanation: `Organizando em ordem crescente: <code>[${sorted.join(', ')}]</code>.<br>O valor que fica perfeitamente no centro da fila é <strong>${median}</strong>!`
        };
      }
    },
    {
      type: 'mode',
      tag: 'FASE 1: MISSÃO 3/3 (MODA)',
      title: 'O Tamanho Mais Popular',
      hint: 'A Moda é simplesmente o valor mais frequente, o que mais se repete no bando!',
      generate: () => {
        const modalValue = Math.floor(Math.random() * 6) + 4;
        const other1 = modalValue + 2;
        const other2 = modalValue - 2;
        const raw = [modalValue, other1, modalValue, other2, modalValue, modalValue + 1].sort(() => Math.random() - 0.5);

        const options = [modalValue, other1, other2, modalValue + 1].sort(() => Math.random() - 0.5);

        return {
          question: `As capivaras trouxeram espigas de milho: [${raw.join(', ')}]. Qual é a <strong>Moda</strong> deste conjunto de dados?`,
          items: raw.map(v => ({ icon: '🌽', val: `${v} espigas` })),
          correct: modalValue,
          options: [...new Set(options)],
          explanation: `O número <strong>${modalValue}</strong> apareceu 3 vezes, mais do que qualquer outro número. Portanto, a Moda é <code>${modalValue}</code>!`
        };
      }
    }
  ],

  2: [
    // FASE 2: DISPERSÃO, AMPLITUDE E DESVIO PADRÃO
    {
      type: 'range',
      tag: 'FASE 2: MISSÃO 1/3 (AMPLITUDE)',
      title: 'A Amplitude da Manada',
      hint: 'Amplitude é a diferença entre o maior e o menor valor do conjunto: Amplitude = Maior - Menor.',
      generate: () => {
        const minVal = Math.floor(Math.random() * 15) + 20; // 20-35
        const maxVal = minVal + Math.floor(Math.random() * 25) + 15; // +15-40
        const mid1 = minVal + 5;
        const mid2 = maxVal - 6;
        const weights = [minVal, mid1, mid2, maxVal].sort(() => Math.random() - 0.5);
        const range = maxVal - minVal;

        const options = [range, range + 5, Math.max(2, range - 6), range + 10].sort(() => Math.random() - 0.5);

        return {
          question: `Os pesos registrados na balança do pantanal foram: [${weights.join(', ')}] kg. Qual é a <strong>Amplitude</strong> térmica/peso deste grupo?`,
          items: weights.map(v => ({ icon: '⚖️', val: `${v} kg` })),
          correct: range,
          options: [...new Set(options)],
          explanation: `O maior valor é <code>${maxVal} kg</code> e o menor é <code>${minVal} kg</code>.<br>Amplitude = <code>${maxVal} - ${minVal} = ${range} kg</code>.`
        };
      }
    },
    {
      type: 'std_concept',
      tag: 'FASE 2: MISSÃO 2/3 (DESVIO PADRÃO)',
      title: 'A Travessia Segura da Jangada',
      hint: 'O Desvio Padrão mede o quanto os valores estão dispersos da média. Um grupo homogêneo (pesos próximos) tem desvio padrão BAIXO!',
      generate: () => {
        return {
          question: `Dois grupos de capivaras querem subir numa jangada que requer equilíbrio constante:<br>
          • <strong>Grupo A:</strong> [49, 50, 51, 50] kg (Média = 50 kg)<br>
          • <strong>Grupo B:</strong> [20, 50, 80, 50] kg (Média = 50 kg)<br>
          Qual grupo tem o <strong>Menor Desvio Padrão</strong> e é mais previsível e homogêneo?`,
          items: [
            { icon: '🛶', val: 'Grupo A: [49, 50, 51, 50] kg' },
            { icon: '🌊', val: 'Grupo B: [20, 50, 80, 50] kg' }
          ],
          correct: 'Grupo A',
          options: ['Grupo A', 'Grupo B', 'Ambos são iguais', 'Nenhum tem desvio'],
          explanation: `Ambos têm a mesma média (50 kg), mas no <strong>Grupo A</strong> os pesos estão todos coladinhos na média (variação mínima). Portanto, seu desvio padrão (σ) é muito menor e o grupo é muito mais homogêneo!`
        };
      }
    },
    {
      type: 'variance_calc',
      tag: 'FASE 2: MISSÃO 3/3 (INTERPRETAÇÃO DE DISPERSÃO)',
      title: 'Medindo a Consistência',
      hint: 'Se todas as capivaras têm exatamente o mesmo peso (ex: 40kg, 40kg, 40kg), qual é a dispersão?',
      generate: () => {
        return {
          question: `Se 5 capivaras pesam exatamente <strong>45 kg</strong> cada uma, qual é o <strong>Desvio Padrão</strong> deste conjunto?`,
          items: [45, 45, 45, 45, 45].map(v => ({ icon: '🐾', val: `${v} kg` })),
          correct: 0,
          options: [0, 45, 5, 1],
          explanation: `Como nenhum valor se afasta da média (todos são 45 kg), a distância de cada ponto até a média é zero. Portanto, a variância e o desvio padrão são exatamente <strong>0</strong>!`
        };
      }
    }
  ],

  3: [
    // FASE 3: LAGOA DAS PROBABILIDADES
    {
      type: 'prob_simple',
      tag: 'FASE 3: MISSÃO 1/3 (PROBABILIDADE SIMPLES)',
      title: 'Amostragem na Lagoa Pantaneira',
      hint: 'Probabilidade P = (Casos Favoráveis) / (Casos Possíveis no Total).',
      generate: () => {
        const capys = 6;
        const caimans = 4;
        const total = capys + caimans; // 10
        const probFraction = `${capys}/${total}`;
        const probPercent = '60%';

        return {
          question: `Na lagoa estão nadando <strong>6 Capivaras</strong> e <strong>4 Jacarés pacíficos</strong> (total de 10 animais). Se observarmos um animal ao acaso, qual é a chance dele ser uma <strong>Capivara</strong>?`,
          items: [
            { icon: '🐾', val: '6 Capivaras' },
            { icon: '🐊', val: '4 Jacarés' }
          ],
          correct: '60% (6 em 10)',
          options: ['60% (6 em 10)', '40% (4 em 10)', '50% (5 em 10)', '10% (1 em 10)'],
          explanation: `Casos favoráveis (capivaras) = 6. Total de animais = 10.<br><code>P = 6/10 = 0,60 = 60%</code>.`
        };
      }
    },
    {
      type: 'prob_complement',
      tag: 'FASE 3: MISSÃO 2/3 (EVENTO COMPLEMENTAR)',
      title: 'A Regra da Certeza Total (100%)',
      hint: 'A probabilidade de algo NÃO acontecer é 1 menos a probabilidade de acontecer: P(não A) = 1 - P(A).',
      generate: () => {
        const pRain = 30;
        const pNoRain = 70;

        return {
          question: `A previsão meteorológica diz que a probabilidade de chover hoje na reserva das capivaras é de <strong>${pRain}%</strong>. Qual é a probabilidade de <strong>NÃO chover</strong>?`,
          items: [
            { icon: '🌧️', val: `${pRain}% Chuva` },
            { icon: '☀️', val: '? Sol' }
          ],
          correct: `${pNoRain}%`,
          options: [`${pNoRain}%`, `${pRain}%`, '100%', '50%'],
          explanation: `A soma de todos os eventos possíveis é 100%.<br><code>100% - ${pRain}% = ${pNoRain}%</code>. A chance de não chover é <strong>${pNoRain}%</strong>!`
        };
      }
    },
    {
      type: 'prob_cards',
      tag: 'FASE 3: MISSÃO 3/3 (AMOSTRAGEM SEM REPOSIÇÃO)',
      title: 'Sementes Especiais',
      hint: 'Sem reposição, o total no cesto diminui após a primeira retirada!',
      generate: () => {
        return {
          question: `Um cesto tem 3 sementes douradas e 2 sementes normais (total: 5). Se a Dona Capi pegar uma semente dourada e comê-la (sem devolver), qual a chance da 2ª semente também ser <strong>dourada</strong>?`,
          items: [
            { icon: '✨', val: '2 douradas restantes' },
            { icon: '🌰', val: '2 normais' }
          ],
          correct: '2 em 4 (50%)',
          options: ['2 em 4 (50%)', '3 em 5 (60%)', '1 em 4 (25%)', '3 em 4 (75%)'],
          explanation: `Havia 3 douradas de 5 totais. Após retirar 1 dourada, sobraram <strong>2 sementes douradas</strong> em um total de <strong>4 sementes</strong> no cesto. Logo: <code>2/4 = 50%</code>!`
        };
      }
    }
  ],

  4: [
    // FASE 4: CURVA NORMAL & REGRESSÃO
    {
      type: 'normal_curve',
      tag: 'FASE 4: MISSÃO 1/3 (DISTRIBUIÇÃO NORMAL)',
      title: 'A Curva de Sino das Capivaras',
      hint: 'Na distribuição normal, pela Regra Empírica (68-95-99.7), cerca de 68% dos indivíduos estão a 1 desvio padrão da média.',
      generate: () => {
        return {
          question: `O peso das capivaras adultas segue uma <strong>Distribuição Normal</strong> com Média = 50 kg e Desvio Padrão = 5 kg.<br>Aproximadamente quantos % das capivaras pesam entre <strong>45 kg e 55 kg</strong> (ou seja, &mu; &plusmn; 1&sigma;)?`,
          items: [
            { icon: '🔔', val: 'μ = 50 kg' },
            { icon: '📏', val: 'σ = 5 kg' }
          ],
          correct: 'Aproximadamente 68%',
          options: ['Aproximadamente 68%', 'Aproximadamente 95%', 'Aproximadamente 50%', '100%'],
          explanation: `Pela regra empírica da Curva Gaussiana (normal):<br>• Cerca de <strong>68%</strong> dos dados estão dentro de &plusmn;1 desvio padrão (45kg a 55kg).<br>• Cerca de <strong>95%</strong> dentro de &plusmn;2 desvios padrão (40kg a 60kg).`
        };
      }
    },
    {
      type: 'correlation',
      tag: 'FASE 4: MISSÃO 2/3 (CORRELAÇÃO)',
      title: 'Chuva e Capim Fresco',
      hint: 'Correlação Positiva significa que quando uma variável aumenta, a outra também tende a aumentar!',
      generate: () => {
        return {
          question: `Os biólogos notaram que quanto mais milímetros de chuva caem no Pantanal, mais quilos de capim fresco crescem para as capivaras. Que tipo de <strong>Correlação</strong> é essa?`,
          items: [
            { icon: '🌧️', val: '+ Chuva' },
            { icon: '🌱', val: '+ Capim' }
          ],
          correct: 'Correlação Positiva',
          options: ['Correlação Positiva', 'Correlação Negativa', 'Correlação Nula', 'Correlação Inversa'],
          explanation: `Como as duas variáveis caminham na <strong>mesma direção</strong> (mais chuva = mais alimento), trata-se de uma <strong>Correlação Positiva</strong>!`
        };
      }
    },
    {
      type: 'outliers',
      tag: 'FASE 4: MISSÃO 3/3 (OUTLIERS & MEDIANA)',
      title: 'A Capivara Gigante (Outlier)',
      hint: 'A Mediana não é distorcida por valores extremos (outliers), enquanto a Média é puxada para longe!',
      generate: () => {
        return {
          question: `Um bando tem 5 capivaras com pesos: [48, 50, 50, 52, <strong>150</strong>] kg. Aquela de 150 kg é um valor atípico (Outlier). Qual medida de centro é mais confiável e NÃO foi distorcida pelo outlier?`,
          items: [
            { icon: '🐾', val: '48 kg' },
            { icon: '🐾', val: '50 kg' },
            { icon: '🐾', val: '50 kg' },
            { icon: '🐾', val: '52 kg' },
            { icon: '🦣', val: '150 kg (Outlier)' }
          ],
          correct: 'Mediana (50 kg)',
          options: ['Mediana (50 kg)', 'Média (70 kg)', 'Amplitude (102 kg)', 'Variância'],
          explanation: `A média saltou para <code>(48+50+50+52+150)/5 = 70 kg</code>, valor que não representa bem quase nenhuma capivara. Já a <strong>Mediana (50 kg)</strong> permaneceu estável e robusta contra valores extremos!`
        };
      }
    }
  ]
};

// --- DOM ELEMENTS ---
const elements = {
  scoreDisplay: document.getElementById('score-display'),
  rankDisplay: document.getElementById('rank-display'),
  streakCounter: document.getElementById('streak-counter'),
  soundBtn: document.getElementById('sound-btn'),
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),
  levelCards: document.querySelectorAll('.level-card'),
  missionTag: document.getElementById('mission-tag'),
  missionTitle: document.getElementById('mission-title'),
  capyHint: document.getElementById('capy-hint'),
  gameArena: document.getElementById('game-arena'),
  controlsBar: document.getElementById('controls-bar'),
  explanationBox: document.getElementById('explanation-box'),
  explanationText: document.getElementById('explanation-text'),
  nextQuestionBtn: document.getElementById('next-question-btn'),
  // Modal
  victoryModal: document.getElementById('victory-modal'),
  victoryTitle: document.getElementById('victory-title'),
  victoryDesc: document.getElementById('victory-desc'),
  modalFinalScore: document.getElementById('modal-final-score'),
  modalNextBtn: document.getElementById('modal-next-btn'),
  modalRestartBtn: document.getElementById('modal-restart-btn'),
  // Lab
  weightInput: document.getElementById('capy-weight-input'),
  weightVal: document.getElementById('weight-val'),
  addCapyBtn: document.getElementById('add-capy-btn'),
  randomHerdBtn: document.getElementById('random-herd-btn'),
  clearHerdBtn: document.getElementById('clear-herd-btn'),
  statN: document.getElementById('stat-n'),
  statMean: document.getElementById('stat-mean'),
  statMedian: document.getElementById('stat-median'),
  statMode: document.getElementById('stat-mode'),
  statRange: document.getElementById('stat-range'),
  statStd: document.getElementById('stat-std'),
  labCanvas: document.getElementById('lab-canvas')
};

// Current active mission data
let currentMissionData = null;
let selectedAnswer = null;

// --- INITIALIZATION ---
function initApp() {
  setupEventListeners();
  updateHUD();
  loadMission(GameState.currentLevel, GameState.currentMissionIndex);
  initLab();
}

// --- SETUP EVENT LISTENERS ---
function setupEventListeners() {
  // Sound toggle
  elements.soundBtn.addEventListener('click', () => {
    sound.enabled = !sound.enabled;
    elements.soundBtn.textContent = sound.enabled ? '🔊' : '🔇';
    sound.playClick();
  });

  // Tab switching
  elements.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sound.playClick();
      elements.tabBtns.forEach(b => b.classList.remove('active'));
      elements.tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const target = document.getElementById(`tab-${btn.dataset.tab}`);
      if (target) target.classList.add('active');

      if (btn.dataset.tab === 'lab') {
        renderLabChart();
      }
    });
  });

  // Level selector cards
  elements.levelCards.forEach(card => {
    card.addEventListener('click', () => {
      sound.playClick();
      elements.levelCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      GameState.currentLevel = parseInt(card.dataset.level, 10);
      GameState.currentMissionIndex = 0;
      loadMission(GameState.currentLevel, GameState.currentMissionIndex);
    });
  });

  // Next question button in explanation box
  elements.nextQuestionBtn.addEventListener('click', () => {
    sound.playClick();
    advanceMission();
  });

  // Modal actions
  elements.modalNextBtn.addEventListener('click', () => {
    sound.playClick();
    elements.victoryModal.style.display = 'none';
    if (GameState.currentLevel < 4) {
      GameState.currentLevel++;
      GameState.currentMissionIndex = 0;
      updateActiveLevelCard();
      loadMission(GameState.currentLevel, GameState.currentMissionIndex);
    } else {
      // Switched to Lab
      document.querySelector('[data-tab="lab"]').click();
    }
  });

  elements.modalRestartBtn.addEventListener('click', () => {
    sound.playClick();
    elements.victoryModal.style.display = 'none';
    GameState.currentMissionIndex = 0;
    loadMission(GameState.currentLevel, GameState.currentMissionIndex);
  });
}

function updateActiveLevelCard() {
  elements.levelCards.forEach(c => {
    if (parseInt(c.dataset.level, 10) === GameState.currentLevel) {
      c.classList.add('active');
    } else {
      c.classList.remove('active');
    }
  });
}

// --- HUD & RANK UPDATE ---
function updateHUD() {
  elements.scoreDisplay.textContent = GameState.score;
  elements.streakCounter.textContent = `🔥 ${GameState.streak}`;

  // Find rank
  let currentRank = GameState.ranks[0].name;
  for (const r of GameState.ranks) {
    if (GameState.score >= r.min) {
      currentRank = r.name;
    }
  }
  elements.rankDisplay.textContent = currentRank;
}

// --- MISSION ENGINE ---
function loadMission(lvl, missionIdx) {
  const levelMissions = Missions[lvl];
  if (!levelMissions || missionIdx >= levelMissions.length) {
    showVictoryModal();
    return;
  }

  const missionDef = levelMissions[missionIdx];
  currentMissionData = missionDef.generate();

  // Reset UI
  elements.missionTag.textContent = missionDef.tag;
  elements.missionTitle.textContent = missionDef.title;
  elements.capyHint.textContent = `"${missionDef.hint}"`;
  elements.explanationBox.style.display = 'none';
  elements.explanationText.innerHTML = '';
  selectedAnswer = null;

  // Build Arena Content
  elements.gameArena.innerHTML = `
    <div style="font-size: 1.25rem; font-weight: 700; color: #1b4332; text-align: center; margin-bottom: 18px;">
      ${currentMissionData.question}
    </div>
    <div class="capy-herd-row">
      ${currentMissionData.items.map(item => `
        <div class="capy-member-card">
          <span class="capy-icon-display">${item.icon}</span>
          <span class="capy-val-badge">${item.val}</span>
        </div>
      `).join('')}
    </div>
    <div class="choices-grid" id="choices-container">
      ${currentMissionData.options.map(opt => `
        <button class="choice-btn" data-val="${opt}">${opt}</button>
      `).join('')}
    </div>
  `;

  // Attach choice handlers
  const choiceBtns = elements.gameArena.querySelectorAll('.choice-btn');
  choiceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sound.playClick();
      choiceBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedAnswer = btn.dataset.val;
      enableVerifyBtn();
    });
  });

  // Controls bar
  elements.controlsBar.innerHTML = `
    <button id="verify-answer-btn" class="btn primary-btn" disabled>✨ Confirmar Resposta</button>
  `;

  document.getElementById('verify-answer-btn').addEventListener('click', verifyAnswer);
}

function enableVerifyBtn() {
  const btn = document.getElementById('verify-answer-btn');
  if (btn) btn.removeAttribute('disabled');
}

function verifyAnswer() {
  if (selectedAnswer === null) return;

  const btn = document.getElementById('verify-answer-btn');
  if (btn) btn.style.display = 'none';

  const choiceBtns = elements.gameArena.querySelectorAll('.choice-btn');
  const isCorrect = String(selectedAnswer).trim() === String(currentMissionData.correct).trim();

  choiceBtns.forEach(b => {
    b.disabled = true;
    if (String(b.dataset.val).trim() === String(currentMissionData.correct).trim()) {
      b.classList.add('correct');
    } else if (b.classList.contains('selected')) {
      b.classList.add('wrong');
    }
  });

  if (isCorrect) {
    sound.playCorrect();
    GameState.score += 50 + (GameState.streak * 10);
    GameState.streak += 1;
    elements.capyHint.innerHTML = '🎉 <strong>Excelente raciocínio!</strong> Você acertou em cheio!';
  } else {
    sound.playWrong();
    GameState.streak = 0;
    elements.capyHint.innerHTML = '💡 <strong>Ops, não foi dessa vez!</strong> Não se preocupe, confira a explicação abaixo para aprender!';
  }

  updateHUD();

  // Show explanation
  elements.explanationText.innerHTML = currentMissionData.explanation;
  elements.explanationBox.style.display = 'block';
}

function advanceMission() {
  GameState.currentMissionIndex++;
  const levelMissions = Missions[GameState.currentLevel];

  if (GameState.currentMissionIndex >= levelMissions.length) {
    showVictoryModal();
  } else {
    loadMission(GameState.currentLevel, GameState.currentMissionIndex);
  }
}

function showVictoryModal() {
  sound.playSplash();
  elements.victoryModal.style.display = 'flex';
  elements.modalFinalScore.textContent = `${GameState.score} pts`;

  if (GameState.currentLevel === 4) {
    elements.victoryTitle.textContent = '👑 Você é o Guardião Supremo do Pantanal!';
    elements.victoryDesc.textContent = 'Parabéns! Você completou todas as missões estatísticas com honras. Agora experimente o Laboratório Interativo para brincar com dados à vontade!';
    elements.modalNextBtn.textContent = 'Ir para o Laboratório 🧪';
  } else {
    elements.victoryTitle.textContent = `🎉 Fase ${GameState.currentLevel} Concluída!`;
    elements.victoryDesc.textContent = 'Você dominou estes conceitos e ajudou as capivaras a tomarem as melhores decisões baseadas em dados!';
    elements.modalNextBtn.textContent = 'Próxima Fase ➔';
  }
}

// --- STATISTICAL LAB / PLAYGROUND ---
function initLab() {
  elements.weightInput.addEventListener('input', (e) => {
    elements.weightVal.textContent = `${e.target.value} kg`;
  });

  elements.addCapyBtn.addEventListener('click', () => {
    sound.playClick();
    const w = parseInt(elements.weightInput.value, 10);
    GameState.labHerd.push(w);
    updateLabStats();
    renderLabChart();
  });

  elements.randomHerdBtn.addEventListener('click', () => {
    sound.playClick();
    GameState.labHerd = [];
    // Generate normal-like random weights centered at 50kg
    for (let i = 0; i < 12; i++) {
      const val = Math.round(50 + (Math.random() - 0.5) * 30);
      GameState.labHerd.push(Math.max(15, Math.min(85, val)));
    }
    updateLabStats();
    renderLabChart();
  });

  elements.clearHerdBtn.addEventListener('click', () => {
    sound.playClick();
    GameState.labHerd = [];
    updateLabStats();
    renderLabChart();
  });

  updateLabStats();
  renderLabChart();
}

function calculateStats(arr) {
  const n = arr.length;
  if (n === 0) {
    return { n: 0, mean: 0, median: 0, mode: '-', range: 0, std: 0 };
  }

  const sum = arr.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;

  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(n / 2);
  const median = n % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  // Mode
  const freq = {};
  let maxFreq = 0;
  let mode = [];
  arr.forEach(v => {
    freq[v] = (freq[v] || 0) + 1;
    if (freq[v] > maxFreq) maxFreq = freq[v];
  });
  if (maxFreq > 1) {
    for (const key in freq) {
      if (freq[key] === maxFreq) mode.push(key);
    }
  }

  const minVal = sorted[0];
  const maxVal = sorted[sorted.length - 1];
  const range = maxVal - minVal;

  // Standard Deviation
  const variance = arr.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
  const std = Math.sqrt(variance);

  return {
    n,
    mean: mean.toFixed(1),
    median: median.toFixed(1),
    mode: mode.length > 0 ? `${mode.join(', ')} kg (${maxFreq}x)` : 'Amodal',
    range: range.toFixed(1),
    std: std.toFixed(1),
    minVal,
    maxVal,
    rawMean: mean,
    rawStd: std,
    rawMedian: median
  };
}

function updateLabStats() {
  const s = calculateStats(GameState.labHerd);
  elements.statN.textContent = s.n;
  elements.statMean.textContent = `${s.mean} kg`;
  elements.statMedian.textContent = `${s.median} kg`;
  elements.statMode.textContent = s.mode;
  elements.statRange.textContent = `${s.range} kg`;
  elements.statStd.textContent = `${s.std} kg`;
}

function renderLabChart() {
  const canvas = elements.labCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  if (GameState.labHerd.length === 0) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px Nunito';
    ctx.textAlign = 'center';
    ctx.fillText('Nenhuma capivara na manada. Adicione algumas acima!', w / 2, h / 2);
    return;
  }

  // Define bins: 10kg to 90kg in intervals of 10kg
  const binSize = 10;
  const minBin = 10;
  const maxBin = 90;
  const numBins = (maxBin - minBin) / binSize; // 8 bins
  const bins = new Array(numBins).fill(0);

  GameState.labHerd.forEach(val => {
    let idx = Math.floor((val - minBin) / binSize);
    if (idx < 0) idx = 0;
    if (idx >= numBins) idx = numBins - 1;
    bins[idx]++;
  });

  const maxFreq = Math.max(1, ...bins);
  const chartPadX = 60;
  const chartPadY = 40;
  const plotW = w - chartPadX * 2;
  const plotH = h - chartPadY * 2;
  const barWidth = plotW / numBins;

  // Draw Grid Lines & Y Axis
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#64748b';
  ctx.font = '12px Nunito';
  ctx.textAlign = 'right';

  for (let i = 0; i <= maxFreq; i++) {
    const y = h - chartPadY - (i / maxFreq) * plotH;
    ctx.beginPath();
    ctx.moveTo(chartPadX, y);
    ctx.lineTo(w - chartPadX, y);
    ctx.stroke();
    ctx.fillText(i, chartPadX - 8, y + 4);
  }

  // Draw Histogram Bars
  bins.forEach((count, i) => {
    const barH = (count / maxFreq) * plotH;
    const x = chartPadX + i * barWidth + 4;
    const y = h - chartPadY - barH;

    // Gradient bar
    const grad = ctx.createLinearGradient(0, y, 0, h - chartPadY);
    grad.addColorStop(0, '#52b788');
    grad.addColorStop(1, '#2d6a4f');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth - 8, barH, [6, 6, 0, 0]);
    ctx.fill();

    // X Axis Labels
    ctx.fillStyle = '#475569';
    ctx.font = '11px Nunito';
    ctx.textAlign = 'center';
    const labelX = minBin + i * binSize;
    ctx.fillText(`${labelX}-${labelX + binSize}`, x + (barWidth - 8) / 2, h - chartPadY + 18);

    // Count on top of bar
    if (count > 0) {
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 12px Nunito';
      ctx.fillText(count, x + (barWidth - 8) / 2, y - 6);
    }
  });

  // Calculate Statistics for Overlay
  const stats = calculateStats(GameState.labHerd);

  // Mean & Median to canvas X
  const valToX = (val) => {
    const fraction = (val - minBin) / (maxBin - minBin);
    return chartPadX + fraction * plotW;
  };

  const meanX = valToX(stats.rawMean);
  const medianX = valToX(stats.rawMedian);
  const sdLeftX = valToX(stats.rawMean - stats.rawStd);
  const sdRightX = valToX(stats.rawMean + stats.rawStd);

  // Standard Deviation Shade
  ctx.fillStyle = 'rgba(231, 111, 81, 0.12)';
  ctx.fillRect(sdLeftX, chartPadY, Math.max(0, sdRightX - sdLeftX), plotH);

  // Median line (Teal)
  ctx.strokeStyle = '#2a9d8f';
  ctx.lineWidth = 3;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(medianX, chartPadY);
  ctx.lineTo(medianX, h - chartPadY);
  ctx.stroke();

  // Mean line (Orange/Coral)
  ctx.strokeStyle = '#e76f51';
  ctx.lineWidth = 3;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(meanX, chartPadY);
  ctx.lineTo(meanX, h - chartPadY);
  ctx.stroke();

  // Draw Bell Curve (Normal Distribution approximation overlay)
  if (stats.rawStd > 0 && GameState.labHerd.length >= 3) {
    ctx.strokeStyle = 'rgba(42, 157, 143, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    const nPoints = 80;
    for (let p = 0; p <= nPoints; p++) {
      const val = minBin + (p / nPoints) * (maxBin - minBin);
      const z = (val - stats.rawMean) / stats.rawStd;
      const gauss = Math.exp(-0.5 * z * z);
      const curveY = h - chartPadY - (gauss * plotH * 0.9);
      const curveX = valToX(val);

      if (p === 0) ctx.moveTo(curveX, curveY);
      else ctx.lineTo(curveX, curveY);
    }
    ctx.stroke();
  }
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
