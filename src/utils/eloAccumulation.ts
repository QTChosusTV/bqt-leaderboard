export function getDisplayedElo(rawElo: number, contestCount: number) {
  const x = Math.min(contestCount, 6)
  const norm = rawElo - 1500
  const boost = (x * (11 - x) * 100) / 2
  return Math.max(0, Math.round(norm + boost))
}
