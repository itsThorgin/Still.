import {SETTINGS_SECTIONS, settingsSections, primarySectionLabel} from './ui-presentation.mjs';

export function initializeFocusUI() {
  const $ = id => document.getElementById(id);
  let available = ['mix'], persistentVariation = false;
  const picker = $('sound-picker'), timer = $('timer-dialog');
  const pair = $('settings-pair');
  let sizeFrame = null;
  function sizeVariationButtons() {
    const panel = $('music-variation')?.parentElement;
    if (!panel?.querySelectorAll) return;
    const buttons = [...panel.querySelectorAll('.variation-toggle,.lock-control,#new-variation')].filter(node => node.getClientRects().length);
    if (!buttons.length) return;
    for (const node of buttons) { node.style.width = 'max-content'; node.style.maxWidth = 'none'; }
    const width = Math.max(...buttons.map(node => node.getBoundingClientRect().width));
    for (const node of buttons) { node.style.removeProperty('width'); node.style.removeProperty('max-width'); }
    panel.style.setProperty('--variation-button-width', `${width}px`);
  }
  function scheduleSizing() {
    if (!globalThis.requestAnimationFrame || sizeFrame !== null) return;
    sizeFrame = requestAnimationFrame(() => { sizeFrame = null; sizeVariationButtons(); });
  }
  if (globalThis.ResizeObserver) {
    let previousWidth = -1;
    new ResizeObserver(([entry]) => {
      if (entry.contentRect.width === previousWidth) return;
      previousWidth = entry.contentRect.width;
      scheduleSizing();
    }).observe($('music-variation').parentElement);
  }
  function open(dialog) { if (!dialog.open) dialog.showModal(); }
  function close(dialog) { if (dialog.open) dialog.close(); }
  function selectSection(section, focus = false) {
    if (!available.includes(section)) section = available[0];
    for (const name of SETTINGS_SECTIONS) {
      const tab = $('tab-' + name), active = name === section;
      tab.hidden = !available.includes(name);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      const panel = $('settings-' + name);
      panel.hidden = !active;
      panel.setAttribute('aria-hidden', String(!active));
      panel.inert = !active;
    }
    pair.hidden = !['mix','sound'].includes(section);
    scheduleSizing();
    if (focus) $('tab-' + section).focus();
  }
  $('library-open').addEventListener('click', () => open(picker));
  $('library-close').addEventListener('click', () => close(picker));
  $('timer-open').addEventListener('click', () => open(timer));
  $('timer-close').addEventListener('click', () => close(timer));
  for (const dialog of [picker, timer]) dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close(dialog);
  });
  for (const name of SETTINGS_SECTIONS) {
    const button = $('tab-' + name);
    button.addEventListener('click', () => selectSection(name));
    button.addEventListener('keydown', event => {
      const position = available.indexOf(name);
      const destination = event.key === 'ArrowRight' ? available[(position + 1) % available.length]
        : event.key === 'ArrowLeft' ? available[(position - 1 + available.length) % available.length]
        : event.key === 'Home' ? available[0] : event.key === 'End' ? available.at(-1) : null;
      if (destination) { event.preventDefault(); selectSection(destination, true); }
    });
  }
  $('quick-new-variation').addEventListener('click', () => $('new-variation').click());
  return {
    configure(profile) {
      document.body.dataset.profileFamily = profile.family;
      document.body.dataset.profileKind = profile.kind;
      persistentVariation = profile.family === 'Music' && profile.variation;
      document.body.dataset.persistentVariation = String(persistentVariation);
      const advancedVariation = profile.rateMotion || profile.motionKeys.length > 0;
      available = settingsSections(profile).filter(section => section !== 'variation' || !persistentVariation || advancedVariation);
      pair.dataset.reserve = String(profile.family === 'Music' && available.includes('sound'));
      const musicVariation = $('music-variation');
      musicVariation.hidden = !persistentVariation;
      for (const id of ['parameters-variation', 'variation-row']) {
        if (persistentVariation) musicVariation.append($(id));
        else $('settings-variation').insertBefore($(id), $('rate-panel'));
      }
      $('tab-variation').textContent = persistentVariation && profile.rateMotion ? 'Rhythm' : 'Variation';
      $('tab-mix').textContent = primarySectionLabel(profile);
      $('tab-sound').textContent = profile.kind === 'tone' ? 'Explore pitch' : primarySectionLabel(profile) === 'Sound' ? 'Details' : 'Sound';
      $('quick-new-variation').hidden = !profile.variation;
      $('primary-controls').hidden = !profile.controls.some(control => ['style', 'scene', 'tempo', 'influence', 'palette'].includes(control.key));
      selectSection('mix');
      close(picker);
    },
    closePicker() { close(picker); },
    closeTimer() { close(timer); },
    selectSection,
  };
}
