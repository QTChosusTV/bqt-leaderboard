export const ELO_TIERS = [
  { min: 3000, class: 'elo-3000-plus', color: '#8b0000' },
  { min: 2700, class: 'elo-2700-3000', color: '#ff0000' },
  { min: 2500, class: 'elo-2500-2700', color: '#ff7575' },
  { min: 2300, class: 'elo-2300-2500', color: '#ffaa00' },
  { min: 2100, class: 'elo-2100-2300', color: '#fbff00' },
  { min: 1900, class: 'elo-1900-2100', color: '#aa00aa' },
  { min: 1750, class: 'elo-1750-1900', color: '#7900fa' },
  { min: 1600, class: 'elo-1600-1750', color: '#55aaff' },
  { min: 1500, class: 'elo-1500-1600', color: '#15d0ff' },
  { min: 1400, class: 'elo-1400-1500', color: '#00aaaa' },
  { min: 1200, class: 'elo-1200-1400', color: '#00aa00' },
  { min: 800,  class: 'elo-800-1200',  color: '#aa5500' },
  { min: 400,  class: 'elo-400-800',   color: '#aaaaaa' },
  { min: 0,    class: 'elo-0-400',     color: '#ffffff' },
] as const

export function getEloClass(elo: number) {
  if (!Number.isFinite(elo)) return 'elo-0-400';

  return (
    ELO_TIERS.find(t => elo >= t.min)?.class
    ?? 'elo-0-400'
  );
}

export function getEloColor(elo: number) {
  if (!Number.isFinite(elo)) return '#ffffff';

  return (
    ELO_TIERS.find(t => elo >= t.min)?.color
    ?? '#ffffff'
  );
}

