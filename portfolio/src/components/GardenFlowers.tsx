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
      {mood === "sweet" && <g transform="translate(0 -76)"><path d="M-11 11L-17 4L-15 -7L-6 -16L5 -16L15 -9L18 2L11 13L0 17Z" fill={color}/><path d="M-12 3Q-14 -10 1 -11Q15 -9 10 5Q2 15 -8 5Q-12 -4 0 -6Q9 -5 5 2Q-2 8 -4 0Q-2 -4 2 -1" fill="none" stroke="#a84f71" strokeWidth="1.5" strokeLinecap="round"/><path d="M-10 13Q-19 8 -21 1L-14 3M10 13Q19 8 21 1L15 3" fill="#578654"/></g>}
      {mood === "proud" && <g transform="translate(0 -79)"><path d="M-17 -15L-6 -9L0 -22L8 -9L17 -16L14 7Q0 25 -14 7Z" fill="#925b90"/><path d="M-16 -13Q-3 -8 0 10Q2 -9 17 -15L13 8Q0 23 -13 8Z" fill={color}/><path d="M0 0Q-1 -13 0 -20Q13 -9 9 8Q2 16 0 0" fill="#ce91b4"/></g>}
      {mood === "kind" && <g transform="translate(0 -79)"><Petals count={6} color={color}/><circle r="4.5" fill="#efd37b"/><path d="M-2 -2L2 2M2 -2L-2 2" stroke="#b99a43" strokeWidth=".8"/></g>}
      {mood === "funny" && <g transform="translate(0 -78)"><path d="M0 0Q-28 3 -21 -14Q-17 -23 -4 -13Q3 -26 15 -19Q28 -14 16 -2Q28 10 12 15Q1 18 -3 7Q-20 19 -24 5Q-26 -7 0 0" fill={color}/><path d="M-4 -10Q2 0 -3 9M9 -10Q1 -3 10 8" stroke="#f8b678" strokeWidth="1" fill="none"/><circle r="5" fill="#4d5042"/>{Array.from({length:8},(_,i)=><path key={i} d="M0 -4V-8" stroke="#424c3d" transform={`rotate(${i*45})`}/>)}</g>}
      {mood === "curious" && <><path d="M0 -48Q-10 -74 2 -107M0 -65L14 -74M0 -79L-12 -87M1 -94L12 -99" fill="none" stroke="#578654" strokeWidth="1.5"/>{[[-10,-87],[13,-74],[11,-99],[2,-108],[-2,-61]].map(([cx,cy],i)=><g key={i} transform={`translate(${cx} ${cy}) rotate(${i%2?20:-15})`}><path d="M-5 -2Q0 -9 5 -2L7 6L3 5L0 8L-3 5L-7 6Z" fill={i%2?"#86bbcc":color}/><circle cy="4" r="1.6" fill="#f5d271"/></g>)}</>}
    </g>
  </g>;
}

export function GardenScene() {
  const plants: [GardenMood,number,number,number,number][] = [
    ["kind",28,160,.65,-12],["sweet",62,170,.74,-7],["excited",103,166,1,-12],
    ["curious",144,169,.88,-5],["proud",184,167,.95,3],["funny",223,174,.65,-8],
    ["kind",269,169,.9,6],["excited",309,164,.86,10],["sweet",352,175,.62,7],
    ["curious",389,168,.94,7],["proud",430,171,.72,-8],["funny",474,169,.78,10],
    ["kind",518,173,.65,-2],
  ];
  return <svg className={styles.landscape} viewBox="0 0 550 185" preserveAspectRatio="none" aria-hidden="true">
    <path d="M5 180Q8 161 44 163Q100 147 145 165Q200 143 247 164Q308 146 355 164Q407 148 455 164Q509 151 545 180Z" fill="#8cab6e" opacity=".38"/>
    <g fill="#749757" opacity=".65"><path d="M17 176Q6 149 4 143Q25 153 25 175M530 177Q543 148 549 146Q546 167 538 179M240 178Q237 142 229 128Q250 145 248 179"/></g>
    {plants.map(([mood,x,y,scale,lean],i)=><FlowerSprig key={i} mood={mood} x={x} y={y} scale={scale} lean={lean}/>)}
    <g fill="#86a65f"><path d="M75 178Q65 150 65 143Q82 160 80 179M365 179Q378 153 387 148Q382 168 374 180"/></g>
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
