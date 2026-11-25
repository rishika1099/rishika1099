import styles from "./GuestbookGarden.module.css";

export const gardenMoods = {
  sweet: { flower: "rose", color: "#d87591" },
  excited: { flower: "sunflower", color: "#e8b33e" },
  curious: { flower: "bluebell", color: "#6c9dbc" },
  funny: { flower: "poppy", color: "#e38a58" },
  kind: { flower: "cosmos", color: "#a38abd" },
  proud: { flower: "tulip", color: "#bd6d9c" },
} as const;
export type GardenMood = keyof typeof gardenMoods;
export function moodFor(value?: string): GardenMood {
  return value && Object.hasOwn(gardenMoods, value) ? value as GardenMood : "kind";
}

function Petals({ count, color, long = false }: { count: number; color: string; long?: boolean }) {
  return <>{Array.from({ length: count }, (_, i) => <ellipse key={i} cx="0" cy={long ? -12 : -8} rx={long ? 4 : 7} ry={long ? 12 : 9} fill={color} transform={`rotate(${i * 360 / count})`} />)}</>;
}

export function FlowerSprig({ mood, x = 0, y = 0, scale = 1, lean = 0 }: { mood: GardenMood; x?: number; y?: number; scale?: number; lean?: number }) {
  const color = gardenMoods[mood].color;
  return <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${lean})`}>
    <path d="M0 0Q-5 -35 0 -76" fill="none" stroke="#578654" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M-1 -25Q-22 -23 -25 -44Q-8 -43 -1 -25M-2 -41Q16 -37 22 -61Q5 -56 -2 -41" fill="#6b9b57" />
    <path d="M-2 -28L-20 -40M-1 -44L17 -56" stroke="#aac381" strokeWidth=".7" fill="none" />
    <g>
      {mood === "excited" && <g transform="translate(0 -80)"><Petals count={13} color="#ebbb41" long /><Petals count={9} color="#f5cd5d" /><circle r="10" fill="#715035"/><circle r="7.5" fill="#845b38"/>{[[-3,-3],[3,-2],[0,2],[-4,3],[4,4]].map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r=".8" fill="#b38b50"/>)}</g>}
      {mood === "sweet" && <g transform="translate(0 -76)"><path d="M-10 13Q-19 8-21 1L-14 3M10 13Q19 8 21 1L15 3" fill="#6e956c"/><Petals count={7} color="#e6a3b7"/><g transform="rotate(25) scale(.76)"><Petals count={6} color={color}/></g><g transform="rotate(-12) scale(.5)"><Petals count={5} color="#f0bdc8"/></g><path d="M-4 1Q-4-5 2-4Q8-1 2 4Q-3 7-4 1" fill="#bb6382"/><path d="M-2 0Q1-3 3 0" fill="none" stroke="#efb7c5" strokeWidth="1.2"/></g>}
      {mood === "proud" && <g transform="translate(0 -79)"><path d="M-17 -15L-6 -9L0 -22L8 -9L17 -16L14 7Q0 25 -14 7Z" fill="#925b90"/><path d="M-16 -13Q-3 -8 0 10Q2 -9 17 -15L13 8Q0 23 -13 8Z" fill={color}/><path d="M0 0Q-1 -13 0 -20Q13 -9 9 8Q2 16 0 0" fill="#ce91b4"/></g>}
      {mood === "kind" && <g transform="translate(0 -79)"><Petals count={6} color={color}/><circle r="4.5" fill="#efd37b"/><path d="M-2 -2L2 2M2 -2L-2 2" stroke="#b99a43" strokeWidth=".8"/></g>}
      {mood === "funny" && <g transform="translate(0 -78)"><path d="M0 0Q-28 3 -21 -14Q-17 -23 -4 -13Q3 -26 15 -19Q28 -14 16 -2Q28 10 12 15Q1 18 -3 7Q-20 19 -24 5Q-26 -7 0 0" fill={color}/><path d="M-4 -10Q2 0 -3 9M9 -10Q1 -3 10 8" stroke="#f8b678" strokeWidth="1" fill="none"/><circle r="5" fill="#4d5042"/>{Array.from({length:8},(_,i)=><path key={i} d="M0 -4V-8" stroke="#424c3d" transform={`rotate(${i*45})`}/>)}</g>}
      {mood === "curious" && <><path d="M0 -48Q-10 -74 2 -107M0 -65L14 -74M0 -79L-12 -87M1 -94L12 -99" fill="none" stroke="#578654" strokeWidth="1.5"/>{[[-10,-87],[13,-74],[11,-99],[2,-108],[-2,-61]].map(([cx,cy],i)=><g key={i} transform={`translate(${cx} ${cy}) rotate(${i%2?20:-15})`}><path d="M-5 -2Q0 -9 5 -2L7 6L3 5L0 8L-3 5L-7 6Z" fill={i%2?"#86bbcc":color}/><circle cy="4" r="1.6" fill="#f5d271"/></g>)}</>}
    </g>
  </g>;
}

export function GardenScene() {
  const moods = Object.keys(gardenMoods) as GardenMood[];
  return <svg className={styles.landscape} viewBox="0 0 550 220" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
    <path d="M0 185Q80 157 170 181T350 178T550 181V220H0Z" fill="#dce3cc" />
    <g opacity=".48">{Array.from({ length: 22 }, (_, i) => <FlowerSprig key={i} mood={moods[(i * 5 + 2) % 6]} x={12 + i * 25} y={199 + i % 3 * 5} scale={.48 + i % 4 * .07} lean={i % 2 ? 9 : -8} />)}</g>
    <path d="M0 206Q75 184 153 200T310 199T460 199T550 204V220H0Z" fill="#b7cba3" />
    <g>{Array.from({ length: 17 }, (_, i) => <g className={styles.sprig} key={i} style={{ animationDelay: `${i % 5 * -.8}s` }}><FlowerSprig mood={moods[(i * 5) % 6]} x={15 + i * 32} y={210 + i % 3 * 3} scale={.55 + [0, .15, .03, .24, .09][i % 5]} lean={[-9, 6, -4, 10, -3][i % 5]} /></g>)}</g>
    <path d="M0 218Q55 205 108 215T228 214T356 215T475 213T550 218V220H0Z" fill="#91af85" />
    {Array.from({ length: 33 }, (_, i) => <g key={i} transform={`translate(${8 + i * 17} ${212 + i % 3 * 2})`}>
      <path d="M0 5Q-2 -7 -6 -11M0 5Q2 -9 7 -14" stroke="#75976e" strokeWidth="1" fill="none" />
      {i % 3 !== 0 && <g transform={`translate(${i % 2 ? 6 : -5} -12)`}><g transform="scale(.28)"><Petals count={5} color={i % 2 ? "#fff4de" : "#e8c9d8"} /><circle r="2.4" fill="#d7ae60" /></g></g>}
    </g>)}
  </svg>;
}

export function Butterfly({ mood }: { mood: GardenMood }) {
  const color = gardenMoods[mood].color;
  return <svg viewBox="0 0 64 56" aria-hidden="true" className={styles.butterfly}>
    {[false, true].map(mirror => <g key={String(mirror)} transform={mirror ? "translate(64 0) scale(-1 1)" : undefined}>
      <g className={styles.wings}>
        <path d="M31 29C25 12 11 2 6 9C1 16 7 30 23 33C9 28 5 39 12 46C20 53 29 43 31 34Z" fill={color} stroke="#66536c" strokeWidth="1.2" strokeLinejoin="round"/>
        <path d="M29 28C22 16 13 10 10 12C8 17 13 26 26 29M28 35C19 32 13 35 14 40C17 45 25 40 28 35" fill="#fff3e8" opacity=".4"/>
        <path d="M30 30L11 12M30 30L8 22M29 32L14 27M29 35L14 40M29 35L21 45" fill="none" stroke="#66536c" strokeWidth=".7" opacity=".6"/>
        {[[7,14],[8,20],[11,26],[12,37],[15,44],[21,45]].map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r="1.2" fill="#fff8e9"/>)}
      </g>
    </g>)}
    <path d="M31 25Q29 20 26 19M33 25Q35 20 38 19" fill="none" stroke="#514052" strokeWidth="1" strokeLinecap="round"/>
    <ellipse cx="32" cy="32" rx="1.8" ry="10" fill="#514052"/>
    <circle cx="32" cy="23" r="2" fill="#514052"/>
  </svg>;
}
