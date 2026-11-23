// localStorage save / load.
const KEY = 'bahia-dorada-save-v1';
export function hasSave() { try { return !!localStorage.getItem(KEY); } catch { return false; } }
export function saveGame(G) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      cash: G.cash, jobIndex: G.jobIndex, respect: G.respect,
      standing: G.standing, upgrades: G.upgrades, paint: G.paint,
      weapons: G.weapons, stats: G.stats, radio: G.radio
    }));
  } catch { /* storage unavailable */ }
}
export function loadGame(G) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    G.cash = d.cash ?? G.cash; G.jobIndex = d.jobIndex ?? 0;
    G.respect = d.respect ?? 0; G.standing = d.standing ?? G.standing;
    G.upgrades = d.upgrades ?? G.upgrades; G.paint = d.paint ?? G.paint;
    G.weapons = d.weapons ?? G.weapons; G.stats = d.stats ?? G.stats;
    G.radio = d.radio ?? 0;
    return true;
  } catch { return false; }
}
export function clearSave() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }
