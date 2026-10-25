import { PROFILES, getProfile } from './profiles.mjs';
import { STORAGE_KEY, parseSettings, defaultSettings, normalizeParams, normalizeVolume, sliderPosition, sliderValue, fadeSeconds, remainingSeconds, formatClock, rhythmBand } from './state.mjs';
import { AudioEngine } from './audio/engine.mjs';
import { normalizeMotion, motionBounds, MOTION_SECONDS } from './audio/motion.mjs';
import { ToneSweep, toneLimit, GLIDE_SECONDS } from './audio/tone-sweep.mjs';
import { normalizeRateMotion, rateBand, RATE_SECONDS } from './audio/rate-motion.mjs';
import { retroStyle, RETRO_STYLES } from './retro-styles.mjs';
import { gardenInfluences } from './garden-influences.mjs';
import { SEQUENCE_SOUNDS, sequencePalette } from './sequence-palettes.mjs';
import { electronicCharacter, ELECTRONIC_KINDS } from './electronic-characters.mjs';
import { electronicVariationMix, ELECTRONIC_MIX_KEYS, ALL_MIX_SETTINGS, normalizeMixMask, mixSettingEnabled } from './electronic-variation.mjs';
import { profilePresentation, controlSection, controlHelp } from './ui-presentation.mjs';
import { initializeFocusUI } from './focus-ui.mjs';
import { musicAbout } from './music-about.mjs';
import { initializeAudioArtwork, drawRestingArtwork } from './audio-artwork.mjs';

const $ = (id) => document.getElementById(id);
const focusUI = initializeFocusUI();
let state;
try { state = parseSettings(localStorage.getItem(STORAGE_KEY)); }
catch { state = defaultSettings(); }
let currentFilter = 'All';
let busy = false;
let variationNumber = 1;
let lastMessage = '';
let liveParams = null;
let liveMoving = false;
let liveRateMoving = false;
let highSolo = false;
let liveSweep = null;
let scanResult = null;
let gardenReport = null;
let renderedGardenReport = null;
const controls = new Map();

const icons = {
  binaural: '<path d="M3 12c2-10 4 10 6 0s4 10 6 0 4 10 6 0"/><path d="M3 17c2-10 4 10 6 0s4 10 6 0 4 10 6 0" opacity=".35"/>',
  isochronic: '<path d="M2 17h3V7h4v10h5V7h4v10h4"/>',
  noise: '<path d="m2 13 2-4 2 7 2-11 2 14 2-9 2 6 2-12 2 14 2-8 2 3"/>',
  sequence: '<path d="M4 14v5m5-12v10m5-13v8m5-3v10" stroke-linecap="round"/>',
  retro: '<path d="M3 15V9h5v6h5V9h5v6h3M8 9V5h10v4"/>',
  synthwave: '<path d="m2 17 5-10 5 10 5-10 5 10M3 21h18M8 3h8"/>',
  bassmusic: '<path d="M3 10v4m4-7v10m5-14v18m5-14v10m4-7v4" stroke-linecap="round"/>',
  ambient: '<path d="M2 15c3-9 6 9 10 0s6 7 10-2M3 8c4-5 5 5 9 0s6 4 9 0M4 20h16" stroke-linecap="round"/>',
  fantasy: '<path d="m3 21 8-13 3 5 2-3 6 11H3ZM10 8l2-5 2 5M7 15h5" stroke-linejoin="round"/>',
  lounge: '<path d="M4 5h12v8a6 6 0 0 1-12 0V5Zm12 1h2a3 3 0 0 1 0 6h-2M3 21h17"/>',
  techno: '<path d="M3 5h18v14H3V5Zm4 4v6m5-8v10m5-6v4" stroke-linecap="round"/>',
  tone: '<path d="M2 12c4-13 6-13 10 0s6 13 10 0"/>',
};

const engine = new AudioEngine(({ playing, message }) => {
  lastMessage = message;
  if (!playing) {
    if (liveSweep?.mode === 'spectrum' && state.profileId === 'pure-tone' && Number.isFinite(liveParams?.base)) {
      state.params = normalizeParams(getProfile('pure-tone'), liveParams);
      scanResult = { frequency: state.params.base, completed: message === 'Pitch sweep complete.' };
      save();
    }
    liveParams = null; liveMoving = false; liveSweep = null; liveRateMoving = false;
  }
  document.body.classList.toggle('is-playing', playing);
  syncParameters();
  renderMotion();
  renderRateMotion();
  renderSoundSummary();
  renderPlayback();
  renderLibrary();
  if (message) showNotice(message);
}, ({ params, moving }) => {
  liveParams = state.motion.enabled || moving ? params : null;
  liveMoving = moving;
  syncParameters(undefined, true);
  renderMotion();
  renderSoundSummary(false);
}, (report) => {
  liveSweep = report;
  liveParams = report.params;
  syncParameters(undefined, true);
  renderSoundSummary(false);
  renderToneTools();
}, ({ params, moving }) => {
  liveParams = state.rateMotion.enabled || moving ? params : null;
  liveRateMoving = moving;
  syncParameters(undefined, true);
  renderRateMotion();
  renderSoundSummary(false);
}, ({ seed, style, mix }) => {
  const kind = getProfile(state.profileId).kind;
  if (!['soundscape', 'retro', ...ELECTRONIC_KINDS].includes(kind) || !Number.isInteger(seed) || seed <= 0 || seed > 0xffffffff) return;
  if (kind === 'retro') {
    if (!Number.isInteger(style) || style < 0 || style > RETRO_STYLES.length) return;
    state.params.style = style;
    syncParameters();
  }
  if (ELECTRONIC_KINDS.includes(kind) && mix) {
    state.params = normalizeParams(getProfile(state.profileId), { ...state.params, ...mix });
    syncParameters();
  }
  state.seed = seed; variationNumber++;
  $('variation-id').textContent = String(variationNumber).padStart(3, '0');
  renderSoundSummary(); save();
}, (description) => {
  if (getProfile(state.profileId).kind !== 'soundscape') return;
  gardenReport = description;
  renderSoundSummary(false);
});
engine.setRateMotion(state.rateMotion);
initializeAudioArtwork(engine, () => drawSignal());

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { showNotice('Settings cannot be saved in this browser. The player will still work.'); }
}

function showNotice(message) {
  $('notice').textContent = message;
  $('notice').hidden = !message;
}

function randomSeed() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] || 1;
}

function svgIcon(kind) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[kind] ?? icons.sequence}</svg>`;
}

function renderLibrary() {
  $('profile-list').replaceChildren();
  const visible = PROFILES.filter((profile) => currentFilter === 'All' || profile.family === currentFilter);
  $('profile-count').textContent = String(visible.length);
  for (const profile of visible) {
    const wrapper = document.createElement('div');
    wrapper.className = 'profile-wrapper';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `profile-item${profile.id === state.profileId ? ' selected' : ''}`;
    button.setAttribute('aria-pressed', String(profile.id === state.profileId));
    button.dataset.profile = profile.id;
    const icon = document.createElement('span');
    icon.className = 'profile-icon';
    icon.innerHTML = svgIcon(profile.kind);
    const copy = document.createElement('span');
    copy.className = 'profile-copy';
    const title = document.createElement('strong');
    title.textContent = profilePresentation(profile).name;
    const subtitle = document.createElement('small');
    subtitle.textContent = profilePresentation(profile).subtitle;
    copy.append(title, subtitle);
    button.append(icon, copy);
    if (engine.playing && profile.id === state.profileId) {
      const dot = document.createElement('span');
      dot.className = 'profile-playing';
      button.append(dot);
    }
    button.addEventListener('click', () => { selectProfile(profile.id); if (!busy) focusUI.closePicker(); });
    const about = document.createElement('button');
    about.type = 'button';
    about.className = 'profile-info';
    about.textContent = 'i';
    about.setAttribute('aria-label', `About ${profilePresentation(profile).name}`);
    about.addEventListener('click', () => openAbout(profile.id));
    wrapper.append(button, about);
    $('profile-list').append(wrapper);
  }
}

function selectProfile(id) {
  if (busy || id === state.profileId) return;
  const profile = getProfile(id);
  state.profileId = id;
  state.params = { ...profile.defaults };
  gardenReport = null;
  highSolo = false;
  liveRateMoving = false;
  engine.setMonitor({ highSolo });
  liveParams = null;
  liveMoving = false;
  liveSweep = null;
  scanResult = null;
  if (profile.variation && !state.locked) { state.seed = randomSeed(); variationNumber++; }
  lastMessage = '';
  showNotice('');
  engine.changeProfile(profile, state.params, state.seed);
  save();
  renderProfile();
}

function renderProfile() {
  const profile = getProfile(state.profileId);
  $('profile-name').textContent = profilePresentation(profile).name;
  $('profile-type').textContent = profilePresentation(profile).subtitle;
  $('cover-label').textContent = profile.family === 'Music' ? 'still / ' + profilePresentation(profile).name.toLowerCase() : 'still / ' + profile.type.toLowerCase();
  $('output-label').textContent = profile.headphones ? 'Stereo headphones' : 'Speakers or headphones';
  $('variation-row').hidden = !profile.variation;
  $('profile-warning').hidden = !profile.warning;
  $('profile-warning').textContent = profile.warning ?? '';
  $('variation-id').textContent = String(variationNumber).padStart(3, '0');
  $('lock-variation').checked = state.locked;
  renderLibrary();
  renderParameters();
  renderMotion();
  renderRateMotion();
  renderSoundscapeTools();
  renderSoundSummary();
  renderPlayback();
  focusUI.configure(profile);
}

function renderParameters() {
  const profile = getProfile(state.profileId);
  controls.clear();
  for (const id of ['parameter-controls', 'parameters-sound', 'parameters-variation', 'parameters-upper', 'primary-controls']) $(id).replaceChildren();
  const displayControls = profile.controls.filter(control => control.key !== 'varyAmount');
  const amount = profile.controls.find(control => control.key === 'varyAmount');
  if (amount) displayControls.splice(displayControls.findIndex(control => control.key === 'varyMix'), 0, amount);
  for (const control of displayControls) {
    const helpText = controlHelp(profile, control);
    const section = controlSection(profile, control);
    const container = $({primary: 'primary-controls', mix: 'parameter-controls', sound: 'parameters-sound', variation: 'parameters-variation', upper: 'parameters-upper'}[section]);
    const row = document.createElement('div');
    row.className = 'parameter-row';
    row.dataset.control = control.key;
    const label = document.createElement('label');
    label.className = 'parameter-label';
    label.htmlFor = `parameter-${control.key}`;
    label.append(document.createTextNode(control.label));
    const hint = document.createElement('span');
    hint.className = 'parameter-help';
    hint.textContent = 'ⓘ';
    hint.title = helpText;
    hint.setAttribute('aria-hidden', 'true');
    label.append(hint);
    if (control.toggle) {
      const toggle = document.createElement('input');
      toggle.type = 'checkbox'; toggle.id = `parameter-${control.key}`;
      toggle.setAttribute('aria-label', control.label);
      toggle.setAttribute('aria-describedby', `help-${control.key}`);
      const help = document.createElement('span'); help.id = `help-${control.key}`;
      help.className = 'sr-only'; help.textContent = helpText;
      row.className += ' parameter-toggle-row';
      toggle.addEventListener('change', () => updateParameter(control.key, toggle.checked ? 1 : 0));
      if (control.key === 'varyMix') {
        label.className += ' variation-toggle';
        label.insertBefore(toggle, label.firstChild);
        row.append(label, help);
      } else row.append(label, toggle, help);
      container.append(row);
      if (control.key === 'varyMix') {
        const actions = document.createElement('div'); actions.className = 'mix-selection-actions';
        for (const [text, value] of [['Select all', ALL_MIX_SETTINGS], ['Select none', 0]]) {
          const button = document.createElement('button'); button.type = 'button';
          button.className = 'text-button'; button.textContent = text;
          button.id = value ? 'vary-select-all' : 'vary-select-none';
          button.setAttribute('aria-label', value ? 'Select all settings for mix variation' : 'Select no settings for mix variation');
          button.addEventListener('click', () => updateParameter('varyMask', value));
          actions.append(button);
        }
        row.append(actions);
      }
      controls.set(control.key, { control, toggle });
      continue;
    }
    if (control.options) {
      const select = document.createElement('select');
      select.id = `parameter-${control.key}`; select.className = 'parameter-select';
      select.setAttribute('aria-label', control.label);
      select.setAttribute('aria-describedby', `help-${control.key}`);
      for (const option of control.options) {
        const item = document.createElement('option'); item.value = String(option.value);
        item.textContent = control.unit ? `${option.value} ${control.unit} · ${option.label}` : option.label; select.append(item);
      }
      const help = document.createElement('p'); help.id = `help-${control.key}`;
      help.className = ['sequence', 'plucks', 'drift', 'soundscape', 'retro', ...ELECTRONIC_KINDS].includes(profile.kind) ? 'sr-only' : 'parameter-option-help';
      help.textContent = helpText;
      select.addEventListener('change', () => updateParameter(control.key, Number(select.value)));
      row.append(label, select, help); container.append(row);
      controls.set(control.key, { control, select });
      continue;
    }
    const sliderWrap = document.createElement('div');
    sliderWrap.className = 'parameter-slider-wrap';
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0'; slider.max = '1000'; slider.step = '1';
    slider.id = `parameter-${control.key}`;
    slider.setAttribute('aria-label', `${control.label} slider`);
    slider.setAttribute('aria-describedby', `help-${control.key}`);
    const ends = document.createElement('div');
    ends.className = 'range-ends';
    const min = document.createElement('span'); min.textContent = `${control.min} ${control.unit}`;
    const max = document.createElement('span'); max.textContent = `${control.max.toLocaleString('en-US')} ${control.unit}`;
    ends.append(min, max);
    const centre = document.createElement('span'); centre.className = 'parameter-centre';
    ends.insertBefore(centre, max);
    const marker = document.createElement('span'); marker.className = 'centre-marker'; marker.setAttribute('aria-hidden', 'true');
    const track = document.createElement('div'); track.className = 'parameter-track'; track.append(slider, marker);
    const help = document.createElement('span');
    help.className = 'sr-only'; help.id = `help-${control.key}`; help.textContent = helpText;
    sliderWrap.append(track, ends, help);
    const field = document.createElement('div'); field.className = 'number-field';
    const input = document.createElement('input');
    input.type = 'number'; input.inputMode = 'decimal'; input.min = String(control.min); input.max = String(control.max); input.step = String(control.step);
    input.setAttribute('aria-label', `Exact ${control.label.toLowerCase()} in ${control.unit}`);
    input.setAttribute('aria-describedby', help.id);
    const unit = document.createElement('span'); unit.textContent = control.unit;
    field.append(input, unit);
    slider.addEventListener('input', () => updateParameter(control.key, sliderValue(control, slider.value)));
    slider.addEventListener('blur', () => syncParameters());
    input.addEventListener('input', () => {
      if (input.value.trim() === '' || !Number.isFinite(input.valueAsNumber)) return;
      if (input.valueAsNumber < control.min || input.valueAsNumber > control.max) return;
      updateParameter(control.key, input.valueAsNumber, input);
    });
    input.addEventListener('change', () => updateParameter(control.key, input.valueAsNumber));
    input.addEventListener('blur', () => syncParameters());
    input.addEventListener('keydown', (event) => { if (event.key === 'Enter') input.blur(); });
    let heading = label, mixChoice;
    if (ELECTRONIC_KINDS.includes(profile.kind) && ELECTRONIC_MIX_KEYS.includes(control.key)) {
      heading = document.createElement('div'); heading.className = 'parameter-heading';
      const choiceLabel = document.createElement('label'); choiceLabel.className = 'mix-choice';
      choiceLabel.title = control.key === 'tempo'
        ? 'Vary around the incoming character’s standard pace. Uncheck to use its exact standard BPM.'
        : 'Allow this setting to vary on automatic changes and New variation when Vary mix at each change is on. Uncheck to keep its current value.';
      mixChoice = document.createElement('input'); mixChoice.type = 'checkbox'; mixChoice.id = `vary-${control.key}`;
      mixChoice.setAttribute('aria-label', `Vary ${control.label.toLowerCase()} at each change`);
      const choiceText = document.createElement('span'); choiceText.textContent = 'Vary';
      choiceLabel.append(mixChoice, choiceText); heading.append(label, choiceLabel);
      mixChoice.addEventListener('change', () => {
        const bit = 1 << ELECTRONIC_MIX_KEYS.indexOf(control.key), mask = normalizeMixMask(state.params.varyMask);
        updateParameter('varyMask', mixChoice.checked ? mask | bit : mask & ~bit);
      });
    }
    row.append(heading, sliderWrap, field);
    controls.set(control.key, { control, slider, input, marker, centre, mixChoice });
    container.append(row);
  }
  syncParameters();
}

function updateParameter(key, value, editingInput) {
  const profile = getProfile(state.profileId);
  scanResult = null;
  if (liveSweep) { liveSweep = null; liveParams = null; }
  state.params = normalizeParams(profile, { ...state.params, [key]: value }, key);
  if (profile.kind === 'retro' && key === 'style' && state.params.style > 10) {
    state.params.tempo = retroStyle(state.params.style, state.seed).tempo;
  }
  if (profile.character && key === 'style') {
    const character = electronicCharacter(profile.kind, state.params.style, state.seed, state.params.scene);
    state.params.tempo = character.tempo;
    if (profile.kind === 'fantasy') state.params.scene = character.scene;
  }
  if (profile.kind === 'fantasy' && key === 'scene') {
    state.params.style = 0;
    state.params.tempo = electronicCharacter('fantasy',0,state.seed,state.params.scene).tempo;
  }
  if (!engine.playing && ['influence', 'arrangements', 'strings'].includes(key)) gardenReport = null;
  syncParameters(editingInput, false, key);
  engine.setParams(state.params);
  renderMotion();
  renderRateMotion(); renderSoundscapeTools();
  renderPlayback();
  renderSoundSummary();
  save();
}

function syncParameters(editingInput, liveUpdate = false, changedKey = null) {
  const profile = getProfile(state.profileId);
  const fixedTempo=profile.character?electronicCharacter(profile.kind,state.params.style,state.seed,state.params.scene).fixedTempo:null;
  if(fixedTempo)state.params.tempo=fixedTempo;
  for (const [key, { control, slider, input, marker, centre, select, toggle, mixChoice }] of controls) {
    if (toggle) { toggle.checked = state.params[key] === 1; continue; }
    if (select) { select.value = String(state.params[key]); continue; }
    if (mixChoice) {
      mixChoice.checked = mixSettingEnabled(state.params, key);
      mixChoice.parentElement.hidden = state.params.varyMix !== 1;
      mixChoice.setAttribute('aria-describedby', 'help-varyMix');
    }
    const value = key !== changedKey && engine.playing && liveParams ? liveParams[key] : state.params[key];
    if(key==='tempo'){
      slider.disabled=input.disabled=!!fixedTempo;
      slider.title=input.title=fixedTempo?`This character uses a fixed ${fixedTempo} BPM.`:'';
      if(mixChoice)mixChoice.disabled=!!fixedTempo;
    }
    const shown = Math.max(control.min, Math.min(control.max, Math.round(value / control.step) * control.step));
    if (!liveUpdate || slider !== document.activeElement) slider.value = String(sliderPosition(control, value));
    slider.setAttribute('aria-valuetext', `${Number(shown.toFixed(4))} ${control.unit}`);
    if (input !== editingInput && input !== document.activeElement) input.value = control.step < 1 ? shown.toFixed(1) : String(Math.round(shown));
    const showCentre = (profile.motionKeys.includes(key) && (state.motion.enabled || liveMoving)) || (key === 'beat' && profile.rateMotion && (state.rateMotion.enabled || liveRateMoving));
    marker.hidden = !showCentre;
    centre.hidden = !showCentre;
    marker.style.left = `${sliderPosition(control, state.params[key]) / 10}%`;
    centre.textContent = `Chosen ${state.params[key]} ${control.unit}`;
  }
  const modified = Object.keys(profile.defaults).some((key) => state.params[key] !== profile.defaults[key])
    || ELECTRONIC_KINDS.includes(profile.kind) && normalizeMixMask(state.params.varyMask) !== ALL_MIX_SETTINGS;
  $('modified-tag').hidden = !modified;
  $('reset-button').disabled = !modified && !highSolo;
}

function renderRateMotion() {
  const profile = getProfile(state.profileId);
  $('rate-panel').hidden = !profile.rateMotion;
  if (!profile.rateMotion) return;
  const band = rateBand(state.params.beat);
  $('rate-enabled').checked = state.rateMotion.enabled;
  $('rate-settings').hidden = !state.rateMotion.enabled;
  $('rate-speed').value = state.rateMotion.speed;
  $('rate-status').textContent = state.rateMotion.enabled ? engine.playing ? 'Motion active' : 'Starts with playback' : liveRateMoving ? 'Returning to your chosen rate' : 'Off';
  $('rate-ranges').textContent = `${band.name}: ${band.low} to ${band.high} Hz. Chosen rate: ${state.params.beat} Hz.${profile.kind === 'soundscape' && state.params.binauralMix === 0 ? ' The binaural layer is off; raise its blend to hear this rhythm.' : ''}`;
  $('rate-speed-help').textContent = `Each change takes ${RATE_SECONDS[state.rateMotion.speed]} seconds.`;
}

function renderSoundscapeTools() {
  const isSoundscape = getProfile(state.profileId).kind === 'soundscape';
  $('soundscape-tools').hidden = !isSoundscape;
  if (!isSoundscape) return;
  $('high-solo').checked = highSolo;
  const limit = engine.context ? toneLimit(engine.context.sampleRate) : 20000;
  const low = state.params.highLow;
  const high = Math.min(limit, state.params.highHigh);
  $('upper-output').textContent = high < low ? `The selected upper range is above this output's ${limit.toLocaleString('en-US')} Hz limit and will be silent.` : `Upper layer: ${formatFrequency(low)} to ${formatFrequency(high)} Hz${engine.context ? ' on this output' : ' where supported by your audio output'}. Blend: ${state.params.highMix}%.`;
}

function renderMotion() {
  const profile = getProfile(state.profileId);
  $('motion-panel').hidden = profile.motionKeys.length === 0;
  $('motion-enabled').checked = state.motion.enabled;
  $('motion-settings').hidden = !state.motion.enabled;
  $('motion-strength').value = String(state.motion.strength);
  if (document.activeElement !== $('motion-strength-number')) $('motion-strength-number').value = String(state.motion.strength);
  $('motion-speed').value = state.motion.speed;
  $('motion-status').textContent = !state.motion.enabled || state.motion.strength === 0
    ? liveMoving ? 'Returning to your settings' : state.motion.enabled ? 'Holding your settings' : 'Off'
    : engine.playing ? 'Motion active' : 'Starts with playback';
  const ranges = profile.controls.filter((control) => profile.motionKeys.includes(control.key)).map((control) => {
    const [low, high] = motionBounds(control, state.params[control.key], state.motion.strength);
    const format = (value) => Number(value.toFixed(control.unit === 'Hz' ? 0 : 1)).toLocaleString('en-US');
    return `${control.label}: ${format(low)} to ${format(high)} ${control.unit}`;
  });
  $('motion-ranges').textContent = `${ranges.join('. ')}. Values stay within these limits. Volume stays unchanged.`;
  $('motion-speed-help').textContent = `Each change takes ${MOTION_SECONDS[state.motion.speed]} seconds. Changing strength or speed first returns to your settings over five seconds.`;
  $('motion-help').textContent = profile.kind === 'noise'
    ? 'Slowly moves the filter limits around your chosen values. Sliders show the current values; markers show your settings. Turning motion off returns to your settings over five seconds.'
    : 'Slowly varies pace and note length around your settings. Slow drift can also vary overlap. Note pitches stay unchanged. Sliders show the current values; markers show your settings. Turning motion off returns to your settings over five seconds.';
}

function updateMotion(settings) {
  state.motion = normalizeMotion({ ...state.motion, ...settings });
  engine.setMotion(state.motion);
  syncParameters(); renderMotion(); save();
}

function renderToneTools() {
  const pureTone = state.profileId === 'pure-tone';
  $('tone-tools').hidden = !pureTone;
  if (!pureTone) return;
  const running = liveSweep !== null && engine.playing;
  const upper = state.params.base;
  const limit = engine.context ? toneLimit(engine.context.sampleRate) : 20000;
  $('spectrum-start').disabled = busy || running;
  $('return-start').disabled = busy || running || upper <= 20 || upper > limit;
  $('sweep-stop').hidden = !running;
  $('sweep-stop').textContent = liveSweep?.mode === 'return' ? 'Stop glide' : 'Stop and keep displayed pitch';
  if (scanResult) {
    const label = scanResult.completed ? 'Sweep finished at' : 'Sweep stopped at';
    const frequency = `${formatFrequency(scanResult.frequency)} Hz`;
    if ($('scan-result-label').textContent !== label) $('scan-result-label').textContent = label;
    if ($('scan-result-frequency').textContent !== frequency) $('scan-result-frequency').textContent = frequency;
  }
  $('scan-result').hidden = scanResult === null;
  $('spectrum-start').textContent = `Sweep 20 to ${limit.toLocaleString('en-US')} Hz`;
  $('return-start').textContent = 'Glide up and down';
  const lowerText = formatFrequency(Math.max(20, upper * 0.8));
  const upperText = formatFrequency(upper);
  $('return-description').textContent = `Glides from ${lowerText} Hz to your selected ${upperText} Hz over ${GLIDE_SECONDS.up} seconds, holds for ${GLIDE_SECONDS.hold} seconds, then returns over ${GLIDE_SECONDS.down} seconds. Including fades, one pass takes 12 seconds.`;
  $('sweep-status').textContent = running
    ? `${liveSweep.mode === 'spectrum' ? 'Sweep' : 'Glide'}: ${Math.round((liveSweep.progress ?? 0) * 100)}%`
    : lastMessage === 'Pitch sweep complete.' ? 'Pass complete.' : 'Ready. Each button starts one pass.';
}

async function startToneSweep(mode) {
  if (busy || liveSweep || state.profileId !== 'pure-tone') return;
  busy = true;
  scanResult = null;
  lastMessage = '';
  showNotice('');
  renderPlayback();
  try {
    await engine.prepare();
    const profile = getProfile(state.profileId);
    const plan = new ToneSweep(mode, state.params.base, engine.context.sampleRate);
    const config = { mode, high: plan.high };
    const params = { base: plan.frequency };
    liveSweep = { mode, progress: 0 };
    liveParams = params;
    if (engine.playing) engine.changeProfile(profile, params, state.seed, config);
    else engine.play(profile, params, state.seed, state.timer, state.volume, state.muted, state.motion, config);
    syncParameters(); renderSoundSummary();
  } catch (error) {
    liveSweep = null; liveParams = null;
    engine.stop();
    showNotice(error.userMessage || 'Audio could not start. Try again or reload the page.');
  } finally {
    busy = false;
    renderPlayback();
    if (liveSweep && engine.playing) $('sweep-stop').focus();
  }
}

function formatFrequency(value) {
  return Number(value.toFixed(1)).toLocaleString('en-US', { maximumFractionDigits: 1 });
}

function renderGardenChoices() {
  const panel = $('garden-choices');
  panel.hidden = getProfile(state.profileId).kind !== 'soundscape';
  if (panel.hidden) return;
  const report = gardenReport;
  const summary = $('garden-choice-summary');
  $('garden-instruments').hidden = !report;
  if (!report) {
    const text = engine.playing ? 'Choosing instruments…' : 'Start listening to see the chosen instruments and string sounds.';
    if (summary.textContent !== text) summary.textContent = text;
    renderedGardenReport = null;
    return;
  }
  const arrangement = report.arrangement.value === 4 ? 'Seeded ensemble' : `${report.arrangement.label} arrangement`;
  const lead = report.arrangement.value === 4 ? report.parts.find((part) => part.role === 'lead')?.choices[0]?.instrumentLabel : null;
  const strings = report.stringSounds.length === 1 ? `Strings: ${report.stringSounds[0]}` : report.stringSounds.length ? 'Mixed strings' : 'No strings';
  const text = `${engine.playing ? '' : 'Last played · '}${[arrangement, lead ? `${lead} lead` : null, strings].filter(Boolean).join(' · ')}`;
  if (summary.textContent !== text) summary.textContent = text;
  if (renderedGardenReport === report) return;
  renderedGardenReport = report;
  $('garden-parts').replaceChildren();
  for (const part of report.parts) {
    const role = document.createElement('dt'); role.textContent = part.label;
    const sounds = document.createElement('dd');
    sounds.textContent = part.choices.map((choice) => `${choice.instrumentLabel}${choice.sound ? ` · ${choice.sound}` : ''}`).join('; ');
    $('garden-parts').append(role, sounds);
  }
}

function renderSoundSummary(draw = true) {
  const profile = getProfile(state.profileId);
  const p = engine.playing && liveParams ? liveParams : state.params;
  let values;
  if (profile.kind === 'binaural') values = [[p.base, 'Left ear'], [p.base + p.beat, 'Right ear'], [p.beat, 'Difference']];
  else if (profile.kind === 'isochronic') values = [[p.base, 'Tone frequency'], [p.beat, 'Pulse rate']];
  else if (profile.kind === 'tone') values = [[p.base, 'Tone frequency']];
  else if (profile.kind === 'soundscape') values = [[p.tempo, 'Musical pace', '/min'], [p.highLow, 'Upper layer from'], [p.highHigh, 'Upper layer to']];
  else if (profile.kind === 'retro') values = [[p.tempo, 'Musical pace', '/min'], [p.melody, 'Melody blend', '%'], [p.percussion, 'Percussion blend', '%']];
  else if (profile.kind === 'ambient') values = [[p.tempo, 'Evolution pace', 'BPM'], [p.melody, 'Distant notes', '%'], [p.accompaniment, 'Drone layers', '%']];
  else if (profile.kind === 'fantasy') values = [[p.tempo, 'Musical pace', 'BPM'], [p.intensity, 'Intensity', '%'], [p.percussion, 'Hand percussion', '%']];
  else if (profile.character) values = [[p.tempo, 'Musical pace', 'BPM'], [p.melody, 'Melody blend', '%'], [p.percussion, 'Drum blend', '%']];
  else values = [[p.low, profile.kind === 'noise' ? 'Lower filter edge' : 'Lowest tone'], [p.high, profile.kind === 'noise' ? 'Upper filter edge' : 'Highest tone']];
  $('signal-readouts').replaceChildren();
  for (const [value, label, unitLabel = 'Hz'] of values) {
    const item = document.createElement('div'); item.className = 'signal-readout';
    const number = document.createElement('strong'); number.textContent = formatFrequency(value);
    const unit = document.createElement('small'); unit.textContent = unitLabel; number.append(unit);
    const text = document.createElement('span'); text.textContent = label;
    item.append(number, text); $('signal-readouts').append(item);
  }
  $('band-label').textContent = `${p.beat ? rhythmBand(p.beat) : profile.band} / ${p.beat ? `${formatFrequency(p.beat)} HZ` : profile.kind === 'tone' ? 'STEADY TONE' : 'GENERATED SOUND'}`;
  if (profile.kind === 'soundscape') $('band-label').textContent = highSolo ? 'MUSIC / UPPER LAYER ALONE' : `GARDEN / ${(gardenReport?.influences ?? gardenInfluences(state.seed, state.params.influence)).map((item) => item.label.toUpperCase()).join(' + ')}`;
  if (profile.kind === 'retro') $('band-label').textContent = `RETRO / ${retroStyle(state.params.style, state.seed).label.toUpperCase()}`;
  if (profile.character) {
    const character = electronicCharacter(profile.kind, state.params.style, state.seed, state.params.scene);
    $('band-label').textContent = `${character.genre.toUpperCase()} / ${character.label.toUpperCase()}`;
  }
  if (SEQUENCE_SOUNDS[profile.kind]) $('band-label').textContent = `TEXTURE / ${sequencePalette(profile.kind, state.seed, state.params.palette).label.toUpperCase()}`;
  $('output-label').textContent = profile.headphones || (profile.kind === 'soundscape' && state.params.binauralMix > 0) ? 'Stereo headphones' : 'Speakers or headphones';
  renderGardenChoices();
  if (draw) drawSignal();
}

function drawSignal() {
  drawRestingArtwork((state.seed % 997) / 997 * Math.PI * 2);
}

function renderVolume(editing = false) {
  $('volume-slider').value = String(state.volume);
  $('volume-slider').setAttribute('aria-valuetext', `${state.volume.toFixed(2)} percent${state.muted ? ', muted' : ''}`);
  if (!editing) $('volume-number').value = state.volume.toFixed(2);
  $('mute-button').setAttribute('aria-pressed', String(state.muted));
  $('mute-button').setAttribute('aria-label', state.muted ? 'Unmute sound' : 'Mute sound');
  $('volume-hint').textContent = state.muted ? 'Muted. Your level is saved.' : 'Start quietly.';
  engine.setVolume(state.volume, state.muted);
}

function updateVolume(value, editing = false) {
  state.volume = normalizeVolume(value);
  renderVolume(editing);
  save();
}

function setTimer(duration) {
  state.timer = duration;
  lastMessage = '';
  showNotice('');
  engine.scheduleTimer(duration);
  renderTimers();
  renderPlayback();
  save();
  focusUI.closeTimer();
}

function renderTimers() {
  for (const button of document.querySelectorAll('[data-seconds]')) {
    const seconds = button.dataset.seconds === 'continuous' ? null : Number(button.dataset.seconds);
    const selected = seconds === state.timer;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
    button.title = seconds === null ? 'Play without a time limit' : `Set a new ${seconds / 60}-minute countdown`;
  }
  const isNight = state.timer !== null && state.timer >= 21600;
  $('overnight-timer').value = isNight ? String(state.timer) : '';
  $('overnight-timer').parentElement.classList.toggle('selected', isNight);
  $('timer-description').textContent = state.timer === null ? 'Choose a duration. The sound fades before it stops.' : isNight ? 'Fades during the last minute. Keep your computer awake.' : 'Fades during the last 10 seconds. A new choice resets the timer.';
}

function renderPlayback() {
  const playing = engine.playing;
  const button = $('play-button');
  button.classList.toggle('playing', playing);
  button.disabled = busy;
  button.querySelector('span').textContent = busy ? 'Preparing audio' : playing ? 'Stop listening' : 'Start listening';
  button.querySelector('svg').innerHTML = playing ? '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>' : '<path d="m9 5 11 7-11 7V5Z" fill="currentColor"/>';
  $('playback-dot').classList.toggle('playing', playing);
  const completed = !playing && ['Timer complete.', 'Pitch sweep complete.'].includes(lastMessage);
  const deadline = engine.sweepDeadline === null ? engine.deadline : engine.deadline === null ? engine.sweepDeadline : Math.min(engine.deadline, engine.sweepDeadline);
  const left = completed ? 0 : playing ? remainingSeconds(deadline) : state.timer;
  const timerLeft = playing ? remainingSeconds(engine.deadline) : null;
  const fading = playing && timerLeft !== null && timerLeft <= fadeSeconds(state.timer);
  $('playback-label').textContent = busy ? 'Getting ready' : fading ? 'Fading to silence' : engine.bassPlaybackStage() || (playing ? 'Playing' : completed ? 'Session complete' : 'Ready');
  $('playback-detail').textContent = completed ? 'Select Start listening to begin again.' : playing && liveSweep ? 'Stops when the sweep or glide ends.' : state.timer === null ? 'Continuous listening' : playing ? 'Stops at the end of the timer' : 'Timer starts with playback.';
  $('clock').textContent = left === null ? '∞' : formatClock(left);
  $('clock-label').textContent = completed ? 'COMPLETE' : left === null ? 'NO TIME LIMIT' : playing ? 'REMAINING' : 'SESSION LENGTH';
  $('dialog-stop').hidden = !playing;
  renderToneTools();
}

function openAbout(id) {
  const profile = getProfile(id);
  const music = profile.family === 'Music';
  focusUI.closePicker();
  $('about-title').textContent = profilePresentation(profile).name;
  $('about-type').textContent = profile.type.toUpperCase();
  $('about-description').textContent = profile.description;
  $('about-purpose').textContent = profile.purpose;
  $('about-background').textContent = profile.background;
  for (const section of ['purpose', 'how', 'evidence', 'sources']) $('about-section-' + section).hidden = music;
  $('about-background').hidden = music;
  $('about-characters').hidden = !music;
  $('about-background-title').textContent = music ? 'Character inspirations' : 'Background';
  $('about-characters').replaceChildren();
  if (music) for (const character of musicAbout(profile)) {
    const item = document.createElement('div'), name = document.createElement('dt'), detail = document.createElement('dd');
    name.textContent = character.name; detail.textContent = character.inspiration;
    item.append(name, detail); $('about-characters').append(item);
  }
  $('about-how').textContent = profile.how;
  $('about-evidence').textContent = profile.evidence;
  $('about-sources').replaceChildren();
  for (const reference of profile.references) {
    const item = document.createElement('li');
    item.textContent = reference;
    $('about-sources').append(item);
  }
  $('source-details').open = false;
  $('about-dialog').showModal();
  $('about-dialog').scrollTop = 0;
}

document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
  currentFilter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach((item) => { item.classList.toggle('active', item === button); item.setAttribute('aria-pressed', String(item === button)); });
  renderLibrary();
}));
$('play-button').addEventListener('click', async () => {
  if (busy) return;
  if (engine.playing) { engine.stop(); return; }
  busy = true;
  gardenReport = null;
  showNotice('');
  renderPlayback();
  try {
    const profile = getProfile(state.profileId);
    if (profile.variation && !state.locked) { state.seed = randomSeed(); variationNumber++; }
    await engine.prepare();
    // Read current controls after loading. An edit during loading must take effect.
    const incoming = getProfile(state.profileId);
    if (incoming.character && state.params.style === 0 && !state.locked) {
      state.params.tempo = electronicCharacter(incoming.kind, 0, state.seed, state.params.scene).tempo;
      syncParameters();
    }
    engine.play(incoming, state.params, state.seed, state.timer, state.volume, state.muted, state.motion);
    renderRateMotion(); renderSoundscapeTools();
    $('variation-id').textContent = String(variationNumber).padStart(3, '0');
    save();
  } catch (error) {
    engine.stop();
    showNotice(error.userMessage || 'Audio could not start. Try again or reload the page.');
  } finally { busy = false; renderPlayback(); }
});
$('about-button').addEventListener('click', () => openAbout(state.profileId));
$('close-dialog').addEventListener('click', () => $('about-dialog').close());
$('dialog-done').addEventListener('click', () => $('about-dialog').close());
$('dialog-stop').addEventListener('click', () => engine.stop());
$('about-dialog').addEventListener('click', (event) => { if (event.target === $('about-dialog')) { const rect = event.target.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.target.close(); } });
$('reset-button').addEventListener('click', () => {
  scanResult = null;
  if (liveSweep) { liveSweep = null; liveParams = null; }
  state.params = { ...getProfile(state.profileId).defaults };
  if (!engine.playing) gardenReport = null;
  highSolo = false; engine.setMonitor({ highSolo });
  engine.setParams(state.params);
  syncParameters(); renderMotion(); renderRateMotion(); renderSoundscapeTools(); renderPlayback(); renderSoundSummary(); save();
});
$('spectrum-start').addEventListener('click', () => startToneSweep('spectrum'));
$('return-start').addEventListener('click', () => startToneSweep('return'));
$('sweep-stop').addEventListener('click', () => engine.stop('Stopped. The displayed pitch is now selected.'));
$('new-variation').addEventListener('click', () => {
  state.seed = randomSeed(); variationNumber++;
  const profile = getProfile(state.profileId);
  if (ELECTRONIC_KINDS.includes(profile.kind) && state.params.varyMix === 1) {
    const character = electronicCharacter(profile.kind, state.params.style, state.seed, state.params.scene);
    const mix = electronicVariationMix(profile.kind, character, state.seed, state.params);
    state.params = normalizeParams(profile, { ...state.params, ...mix });
  } else if (profile.character && state.params.style === 0) {
    state.params.tempo = electronicCharacter(profile.kind, 0, state.seed, state.params.scene).tempo;
  }
  gardenReport = null;
  liveParams = null; liveMoving = false; liveRateMoving = false;
  engine.changeProfile(profile, state.params, state.seed);
  syncParameters(); renderSoundSummary(); renderRateMotion(); renderPlayback();
  $('variation-id').textContent = String(variationNumber).padStart(3, '0'); save();
});
$('lock-variation').addEventListener('change', () => { state.locked = $('lock-variation').checked; save(); });
$('motion-enabled').addEventListener('change', () => updateMotion({ enabled: $('motion-enabled').checked }));
$('rate-enabled').addEventListener('change', () => updateRateMotion({ enabled: $('rate-enabled').checked }));
$('rate-speed').addEventListener('change', () => updateRateMotion({ speed: $('rate-speed').value }));
$('high-solo').addEventListener('change', () => {
  highSolo = $('high-solo').checked; engine.setMonitor({ highSolo });
  syncParameters(); renderSoundSummary();
});

function updateRateMotion(settings) {
  state.rateMotion = normalizeRateMotion({ ...state.rateMotion, ...settings });
  engine.setRateMotion(state.rateMotion);
  syncParameters(); renderRateMotion(); save();
}
$('motion-strength').addEventListener('input', () => updateMotion({ strength: Number($('motion-strength').value) }));
$('motion-strength-number').addEventListener('input', () => {
  const input = $('motion-strength-number');
  if (input.value.trim() && Number.isFinite(input.valueAsNumber) && input.valueAsNumber >= 0 && input.valueAsNumber <= 100) updateMotion({ strength: input.valueAsNumber });
});
$('motion-strength-number').addEventListener('change', () => updateMotion({ strength: $('motion-strength-number').valueAsNumber }));
$('motion-strength-number').addEventListener('blur', renderMotion);
$('motion-strength-number').addEventListener('keydown', (event) => { if (event.key === 'Enter') event.currentTarget.blur(); });
$('motion-speed').addEventListener('change', () => updateMotion({ speed: $('motion-speed').value }));
$('volume-slider').addEventListener('input', () => updateVolume($('volume-slider').value));
$('volume-number').addEventListener('input', () => {
  const input = $('volume-number');
  if (input.value.trim() && Number.isFinite(input.valueAsNumber) && input.valueAsNumber >= 0.01 && input.valueAsNumber <= 100) updateVolume(input.valueAsNumber, true);
});
$('volume-number').addEventListener('change', () => updateVolume($('volume-number').valueAsNumber));
$('volume-number').addEventListener('blur', () => renderVolume());
$('volume-number').addEventListener('keydown', (event) => { if (event.key === 'Enter') event.currentTarget.blur(); });
$('mute-button').addEventListener('click', () => { state.muted = !state.muted; renderVolume(); save(); });
document.querySelectorAll('[data-seconds]').forEach((button) => button.addEventListener('click', () => setTimer(button.dataset.seconds === 'continuous' ? null : Number(button.dataset.seconds))));
$('overnight-timer').addEventListener('change', () => { if ($('overnight-timer').value) setTimer(Number($('overnight-timer').value)); });
$('forget-button').addEventListener('click', () => {
  engine.stop();
  scanResult = null;
  state = defaultSettings(); variationNumber = 1; lastMessage = '';
  engine.setMotion(state.motion);
  highSolo = false; engine.setMonitor({ highSolo });
  engine.setRateMotion(state.rateMotion);
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  renderProfile(); renderVolume(); renderTimers(); renderPlayback();
  showNotice('Saved settings cleared. Default settings restored.');
});
setInterval(() => { engine.checkDeadline(); renderPlayback(); }, 1000);
document.addEventListener('visibilitychange', () => { engine.checkDeadline(); renderPlayback(); });
window.addEventListener('pageshow', () => { engine.checkDeadline(); renderPlayback(); });
window.addEventListener('pagehide', () => engine.stop());
renderProfile(); renderVolume(); renderTimers(); renderPlayback();
