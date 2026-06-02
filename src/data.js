export const PLAYERS = [
  // GK
  { name: 'Emiliano Martínez',     country: 'Argentina',    flag: '🇦🇷', pos: 'GK'   },
  { name: 'Alisson Becker',        country: 'Brazil',       flag: '🇧🇷', pos: 'GK'   },
  { name: 'Thibaut Courtois',      country: 'Belgium',      flag: '🇧🇪', pos: 'GK'   },
  { name: 'Manuel Neuer',          country: 'Germany',      flag: '🇩🇪', pos: 'GK'   },
  { name: 'Mike Maignan',          country: 'France',       flag: '🇫🇷', pos: 'GK'   },
  { name: 'Unai Simón',            country: 'Spain',        flag: '🇪🇸', pos: 'GK'   },
  { name: 'Gianluigi Donnarumma',  country: 'Italy',        flag: '🇮🇹', pos: 'GK'   },
  { name: 'Jordan Pickford',       country: 'England',      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', pos: 'GK'   },
  { name: 'Yassine Bounou',        country: 'Morocco',      flag: '🇲🇦', pos: 'GK'   },
  { name: 'Ederson',               country: 'Brazil',       flag: '🇧🇷', pos: 'GK'   },
  // DEF
  { name: 'Alphonso Davies',       country: 'Canada',       flag: '🇨🇦', pos: 'DEF'  },
  { name: 'Virgil van Dijk',       country: 'Netherlands',  flag: '🇳🇱', pos: 'DEF'  },
  { name: 'Rúben Dias',            country: 'Portugal',     flag: '🇵🇹', pos: 'DEF'  },
  { name: 'Achraf Hakimi',         country: 'Morocco',      flag: '🇲🇦', pos: 'DEF'  },
  { name: 'Theo Hernandez',        country: 'France',       flag: '🇫🇷', pos: 'DEF'  },
  { name: 'Reece James',           country: 'England',      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', pos: 'DEF'  },
  { name: 'Josko Gvardiol',        country: 'Croatia',      flag: '🇭🇷', pos: 'DEF'  },
  { name: 'Alessandro Bastoni',    country: 'Italy',        flag: '🇮🇹', pos: 'DEF'  },
  { name: 'Dani Carvajal',         country: 'Spain',        flag: '🇪🇸', pos: 'DEF'  },
  { name: 'Antonio Rüdiger',       country: 'Germany',      flag: '🇩🇪', pos: 'DEF'  },
  { name: 'William Saliba',        country: 'France',       flag: '🇫🇷', pos: 'DEF'  },
  { name: 'Trent Alexander-Arnold',country: 'England',      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', pos: 'DEF'  },
  { name: 'Raphaël Varane',        country: 'France',       flag: '🇫🇷', pos: 'DEF'  },
  { name: 'Nuno Mendes',           country: 'Portugal',     flag: '🇵🇹', pos: 'DEF'  },
  { name: 'Kyle Walker',           country: 'England',      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', pos: 'DEF'  },
  { name: 'Marquinhos',            country: 'Brazil',       flag: '🇧🇷', pos: 'DEF'  },
  { name: 'Ronald Araújo',         country: 'Uruguay',      flag: '🇺🇾', pos: 'DEF'  },
  { name: 'Dayot Upamecano',       country: 'France',       flag: '🇫🇷', pos: 'DEF'  },
  { name: 'Noussair Mazraoui',     country: 'Morocco',      flag: '🇲🇦', pos: 'DEF'  },
  // MID
  { name: 'Declan Rice',           country: 'England',      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', pos: 'MID'  },
  { name: 'Rodri',                 country: 'Spain',        flag: '🇪🇸', pos: 'MID'  },
  { name: 'Aurélien Tchouaméni',   country: 'France',       flag: '🇫🇷', pos: 'MID'  },
  { name: 'Sofyan Amrabat',        country: 'Morocco',      flag: '🇲🇦', pos: 'MID'  },
  { name: 'Frenkie de Jong',       country: 'Netherlands',  flag: '🇳🇱', pos: 'MID'  },
  { name: 'Leon Goretzka',         country: 'Germany',      flag: '🇩🇪', pos: 'MID'  },
  { name: 'Ilkay Gündogan',        country: 'Germany',      flag: '🇩🇪', pos: 'MID'  },
  { name: 'Luka Modric',           country: 'Croatia',      flag: '🇭🇷', pos: 'MID'  },
  { name: 'Casemiro',              country: 'Brazil',       flag: '🇧🇷', pos: 'MID'  },
  { name: 'Thomas Partey',         country: 'Ghana',        flag: '🇬🇭', pos: 'MID'  },
  // AMID
  { name: 'Kevin De Bruyne',       country: 'Belgium',      flag: '🇧🇪', pos: 'AMID' },
  { name: 'Pedri',                 country: 'Spain',        flag: '🇪🇸', pos: 'AMID' },
  { name: 'Gavi',                  country: 'Spain',        flag: '🇪🇸', pos: 'AMID' },
  { name: 'Bruno Fernandes',       country: 'Portugal',     flag: '🇵🇹', pos: 'AMID' },
  { name: 'Bernardo Silva',        country: 'Portugal',     flag: '🇵🇹', pos: 'AMID' },
  { name: 'Phil Foden',            country: 'England',      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', pos: 'AMID' },
  { name: 'Jude Bellingham',       country: 'England',      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', pos: 'AMID' },
  { name: 'Antoine Griezmann',     country: 'France',       flag: '🇫🇷', pos: 'AMID' },
  { name: 'Dani Olmo',             country: 'Spain',        flag: '🇪🇸', pos: 'AMID' },
  { name: 'Christian Eriksen',     country: 'Denmark',      flag: '🇩🇰', pos: 'AMID' },
  // WIN
  { name: 'Bukayo Saka',           country: 'England',      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', pos: 'WIN'  },
  { name: 'Lamine Yamal',          country: 'Spain',        flag: '🇪🇸', pos: 'WIN'  },
  { name: 'Nico Williams',         country: 'Spain',        flag: '🇪🇸', pos: 'WIN'  },
  { name: 'Ousmane Dembélé',       country: 'France',       flag: '🇫🇷', pos: 'WIN'  },
  { name: 'Leroy Sané',            country: 'Germany',      flag: '🇩🇪', pos: 'WIN'  },
  { name: 'Rafael Leão',           country: 'Portugal',     flag: '🇵🇹', pos: 'WIN'  },
  { name: 'Vinicius Jr.',          country: 'Brazil',       flag: '🇧🇷', pos: 'WIN'  },
  { name: 'Rodrygo',               country: 'Brazil',       flag: '🇧🇷', pos: 'WIN'  },
  { name: 'Cody Gakpo',            country: 'Netherlands',  flag: '🇳🇱', pos: 'WIN'  },
  { name: 'Donyell Malen',         country: 'Netherlands',  flag: '🇳🇱', pos: 'WIN'  },
  { name: 'Federico Chiesa',       country: 'Italy',        flag: '🇮🇹', pos: 'WIN'  },
  { name: 'Ferran Torres',         country: 'Spain',        flag: '🇪🇸', pos: 'WIN'  },
  { name: 'Hakim Ziyech',          country: 'Morocco',      flag: '🇲🇦', pos: 'WIN'  },
  { name: 'Noni Madueke',          country: 'England',      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', pos: 'WIN'  },
  // ST
  { name: 'Erling Haaland',        country: 'Norway',       flag: '🇳🇴', pos: 'ST'   },
  { name: 'Kylian Mbappé',         country: 'France',       flag: '🇫🇷', pos: 'ST'   },
  { name: 'Harry Kane',            country: 'England',      flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', pos: 'ST'   },
  { name: 'Cristiano Ronaldo',     country: 'Portugal',     flag: '🇵🇹', pos: 'ST'   },
  { name: 'Lionel Messi',          country: 'Argentina',    flag: '🇦🇷', pos: 'ST'   },
  { name: 'Rasmus Højlund',        country: 'Denmark',      flag: '🇩🇰', pos: 'ST'   },
  { name: 'Marcus Thuram',         country: 'France',       flag: '🇫🇷', pos: 'ST'   },
  { name: 'Álvaro Morata',         country: 'Spain',        flag: '🇪🇸', pos: 'ST'   },
  { name: 'Darwin Núñez',          country: 'Uruguay',      flag: '🇺🇾', pos: 'ST'   },
  { name: 'Robert Lewandowski',    country: 'Poland',       flag: '🇵🇱', pos: 'ST'   },
  { name: 'Victor Osimhen',        country: 'Nigeria',      flag: '🇳🇬', pos: 'ST'   },
  { name: 'Lautaro Martínez',      country: 'Argentina',    flag: '🇦🇷', pos: 'ST'   },
  { name: 'Richarlison',           country: 'Brazil',       flag: '🇧🇷', pos: 'ST'   },
  { name: 'Olivier Giroud',        country: 'France',       flag: '🇫🇷', pos: 'ST'   },
]

export const FORMATIONS = [
  { label: '3-4-3', def: 3, mid: 4, fwd: 3 },
  { label: '3-5-2', def: 3, mid: 5, fwd: 2 },
  { label: '4-3-3', def: 4, mid: 3, fwd: 3 },
  { label: '4-4-2', def: 4, mid: 4, fwd: 2 },
  { label: '4-5-1', def: 4, mid: 5, fwd: 1 },
  { label: '5-3-2', def: 5, mid: 3, fwd: 2 },
  { label: '5-4-1', def: 5, mid: 4, fwd: 1 },
]

export const DEFAULT_RULES = {
  play_short: 1,
  play_long:  2,
  goal_fwd:   6,
  goal_mid:   5,
  goal_def:   6,
  goal_gk:    6,
  assist:     3,
  pen_miss:  -2,
  clean_def:  4,
  clean_mid:  1,
  clean_gk:   6,
  save:       1,
  pen_save:   5,
  yellow:    -1,
  red:       -3,
  own_goal:  -2,
}

export function eligibleForSlot(playerPos, slotType) {
  if (slotType === 'GK')  return playerPos === 'GK'
  if (slotType === 'DEF') return playerPos === 'DEF'
  if (slotType === 'MID') return ['MID', 'AMID', 'WIN'].includes(playerPos)
  if (slotType === 'FWD') return ['WIN', 'ST'].includes(playerPos)
  return false
}

export function defLabels(n) {
  return n === 3 ? ['LCB','CB','RCB'] : n === 4 ? ['LB','LCB','RCB','RB'] : ['LWB','LCB','CB','RCB','RWB']
}
export function midLabels(n) {
  return n === 2 ? ['LM','RM'] : n === 3 ? ['LM','CM','RM'] : n === 4 ? ['LM','LCM','RCM','RM'] : ['LM','LCM','CM','RCM','RM']
}
export function fwdLabels(n) {
  return n === 1 ? ['ST'] : n === 2 ? ['LS','RS'] : ['LW','ST','RW']
}

export function buildSlotDefs(formation) {
  return [
    [{ type: 'GK',  label: 'GK' }],
    defLabels(formation.def).map(l => ({ type: 'DEF', label: l })),
    midLabels(formation.mid).map(l => ({ type: 'MID', label: l })),
    fwdLabels(formation.fwd).map(l => ({ type: 'FWD', label: l })),
  ].flat()
}

export function calcPlayerPts(player, stats, rules) {
  if (!stats) return { pts: 0, breakdown: [] }
  const breakdown = []
  let pts = 0

  const playPts = stats.mins > 60 ? rules.play_long : stats.mins > 0 ? rules.play_short : 0
  if (playPts) { pts += playPts; breakdown.push({ label: `${stats.mins} mins`, pts: playPts }) }

  if (stats.goals > 0) {
    const gPts = player.slot === 'GK' ? rules.goal_gk
      : player.slot === 'DEF' ? rules.goal_def
      : player.slot === 'MID' ? rules.goal_mid
      : rules.goal_fwd
    const total = gPts * stats.goals
    pts += total
    breakdown.push({ label: `${stats.goals} goal${stats.goals > 1 ? 's' : ''}`, pts: total })
  }

  if (stats.assists > 0) {
    const a = rules.assist * stats.assists
    pts += a
    breakdown.push({ label: `${stats.assists} assist${stats.assists > 1 ? 's' : ''}`, pts: a })
  }

  const csEligible = player.slot !== 'FWD' && stats.mins >= 45 && stats.clean_team
  if (csEligible) {
    const csPts = player.slot === 'GK' ? rules.clean_gk : player.slot === 'DEF' ? rules.clean_def : rules.clean_mid
    pts += csPts
    breakdown.push({ label: 'Clean sheet', pts: csPts })
  }

  if (player.slot === 'GK' && stats.saves > 0) {
    const sv = Math.floor(stats.saves / 3) * rules.save
    if (sv) { pts += sv; breakdown.push({ label: `${stats.saves} saves`, pts: sv }) }
  }
  if (stats.pen_saved > 0)  { const p = rules.pen_save  * stats.pen_saved;  pts += p; breakdown.push({ label: 'Pen saved',   pts: p }) }
  if (stats.yellow > 0)     { const p = rules.yellow     * stats.yellow;     pts += p; breakdown.push({ label: 'Yellow card', pts: p }) }
  if (stats.red > 0)        { const p = rules.red        * stats.red;        pts += p; breakdown.push({ label: 'Red card',    pts: p }) }
  if (stats.own_goal > 0)   { const p = rules.own_goal   * stats.own_goal;   pts += p; breakdown.push({ label: 'Own goal',   pts: p }) }
  if (stats.pen_missed > 0) { const p = rules.pen_miss   * stats.pen_missed; pts += p; breakdown.push({ label: 'Pen missed', pts: p }) }

  return { pts, breakdown }
}

export function displayName(team) {
  return team.teamName ? `${team.teamName} (${team.manager})` : team.manager
}
export function shortTeam(team) {
  return team.teamName || team.manager
}
