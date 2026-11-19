"use client";

import { useFeatureCopy } from "./FeatureCopy";
import Link from "next/link";
import { useEffect, useId, useRef, type ReactNode } from "react";
import styles from "./BlogDoorCard.module.css";

type Scene = "technical" | "poems" | "photography";
const round = (value: number) => Math.round(value * 1000) / 1000;
const fishColors = ["#fff7e8", "#f0b77d", "#faf0da", "#eed7ad", "#fff5ec", "#eab16f"];

type MotionState = { time: number; follow: number; x: number; y: number };
type AnimateScene = (nodes: Element[], state: MotionState) => void;

// Animate only visible cards. Coordinates are updated without React rerenders.
function useSceneMotion(animate: AnimateScene) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const nodes = Array.from(svg.querySelectorAll("[data-mover]"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const state: MotionState = { time: 0, follow: 0, x: 160, y: 125 };
    let visible = false;
    let frame = 0;
    let previous = 0;
    function tick(now: number) {
      const dt = previous ? Math.min((now - previous) / 1000, .04) : 0;
      previous = now;
      const active = svg!.closest("a")?.matches(":hover, :focus-visible") ?? false;
      state.follow += ((active ? 1 : 0) - state.follow) * Math.min(1, dt * 2);
      state.time += dt * (1 + state.follow * .8);
      const aimX = Number(svg!.getAttribute("data-pointer-x") ?? 160);
      const aimY = Number(svg!.getAttribute("data-pointer-y") ?? 125);
      state.x += (aimX - state.x) * Math.min(1, dt * 2);
      state.y += (aimY - state.y) * Math.min(1, dt * 2);
      animate(nodes, state);
      frame = requestAnimationFrame(tick);
    }
    function sync() {
      cancelAnimationFrame(frame); previous = 0;
      if (visible && !reduced.matches && !document.hidden) frame = requestAnimationFrame(tick);
    }
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); });
    observer.observe(svg);
    reduced.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); reduced.removeEventListener("change", sync); document.removeEventListener("visibilitychange", sync); };
  }, [animate]);
  return ref;
}

function fishPosition(index: number, time: number) {
  const angle = time * (.19 + index * .035) + index * 2.399;
  const rx = 62 + (index % 3) * 22;
  const ry = 36 + (index % 3) * 17;
  return { x: round(160 + Math.cos(angle) * rx), y: round(125 + Math.sin(angle) * ry),
    angle: round(Math.atan2(Math.cos(angle) * ry, -Math.sin(angle) * rx) * 180 / Math.PI) };
}
const animateFish: AnimateScene = (nodes, state) => {
  nodes.forEach((node, index) => {
    const point = fishPosition(index, state.time);
    const gather = state.follow * .6;
    const x = point.x * (1 - gather) + state.x * gather;
    const y = point.y * (1 - gather) + state.y * gather;
    node.setAttribute("transform", `translate(${x} ${y}) rotate(${point.angle}) scale(${index % 2 ? .65 : .8})`);
  });
};

function PondScene() {
  const id = useId().replace(/:/g, "");
  const ref = useSceneMotion(animateFish);
  return <svg ref={ref} preserveAspectRatio="none" viewBox="0 0 320 250" className={styles.art} aria-hidden="true">
    <defs>
      <radialGradient id={`${id}-depth`} cx="65%" cy="65%" r="80%"><stop stopColor="#153c61"/><stop offset=".55" stopColor="#376f94"/><stop offset="1" stopColor="#95c5d8"/></radialGradient>
      <linearGradient id={`${id}-pad`} x2=".8" y2="1"><stop stopColor="#a3c7a7"/><stop offset=".5" stopColor="#558f88"/><stop offset="1" stopColor="#34696d"/></linearGradient>
      <linearGradient id={`${id}-petal`} x2="0" y2="1"><stop stopColor="#fff6ee"/><stop offset=".55" stopColor="#efbfd4"/><stop offset="1" stopColor="#ba7198"/></linearGradient>
      <linearGradient id={`${id}-fade`} x2="0" y2="1"><stop offset="0" stopColor="#397a9c" stopOpacity="0"/><stop offset="1" stopColor="#397a9c"/></linearGradient>
    </defs>
    <rect width="320" height="250" fill={`url(#${id}-depth)`}/>
    <g fill="#b4e2ec" opacity=".09"><path d="M30 0L170 250H205L88 0Z"/><path d="M96 0L252 250H278L135 0Z"/></g>
    <g fill="none" stroke="#c9f0fa" strokeWidth=".7" opacity=".25">
      {[0,1,2].map(i => <ellipse key={i} className={styles.ripple} cx={65+i*95} cy={65+i*49} rx="32" ry="13" style={{animationDelay:`${i*-3}s`}}/>)}
      <path className={styles.caustic} d="M-10 115Q65 71 136 112T330 85M-20 185Q75 137 167 179T340 153"/>
    </g>
    <g>
      {[0,1,2,3,4,5].map(index => { const {x,y,angle} = fishPosition(index,0); return <g key={index} data-mover transform={`translate(${x} ${y}) rotate(${angle}) scale(${index % 2 ? .65 : .8})`}><g className={styles.fish} style={{animationDelay:`${index * -.8}s`}}>
        <ellipse cx="-2" cy="7" rx="30" ry="10" fill="#3c776e" opacity=".12"/>
        <path className={styles.tail} d="M-20 0Q-35 -21 -43 -13Q-32 0 -43 13Q-34 20 -20 0" fill={fishColors[index]}/>
        <path d="M-4 -8Q-8 -26 -20 -19L-14 -3M-4 8Q-8 26 -20 19L-14 3" fill={fishColors[index]} opacity=".75"/>
        <path d="M30 0C22 -15 -8 -16 -25 0C-8 16 22 15 30 0" fill={fishColors[index]}/>
        <path d="M-13 -9Q-1 -15 5 -7L0 10Q-10 9 -13 -9M17 -9Q26 -6 23 5L15 9Q11 0 17 -9" fill={index === 2 ? "#626b5b" : "#de845c"}/>
        <circle cx="24" cy="-4" r="1.3" fill="#3c5549"/><circle cx="24" cy="4" r="1.3" fill="#3c5549"/>
      </g></g>; })}
    </g>
    {[{x:48,y:52,r:1},{x:83,y:27,r:.72},{x:269,y:194,r:1.05},{x:275,y:52,r:.68},{x:44,y:188,r:.75},{x:226,y:215,r:.6}].map((pad,i)=><g key={i} transform={`translate(${pad.x} ${pad.y}) scale(${pad.r})`}>
      <ellipse cx="4" cy="9" rx="32" ry="23" fill="#092e4b" opacity=".3"/>
      <path d="M0 0L22 -15C8 -29 -23 -25 -30 -6C-40 20 -5 31 20 16C30 10 33 1 29 -7Z" fill={`url(#${id}-pad)`} stroke="#b0d5ba" strokeWidth=".7"/>
      <g fill="none" stroke="#d2e5bd" strokeWidth=".5" opacity=".55"><path d="M0 0L-24 -13M0 0L-31 2M0 0L-20 18M0 0L1 23M0 0L21 13M0 0L5 -22"/><path d="M-13 -7L-13 -17M-17 1L-25 9M-10 9L-22 8M2 12L12 17"/></g>
      {i!==1 && <g transform="translate(-6 -5)">
        <ellipse cy="7" rx="19" ry="7" fill="#173e56" opacity=".3"/>
        {[0,45,90,135,180,225,270,315].map(angle=><path key={angle} d="M0 3Q-11 -7 0 -19Q11 -7 0 3" fill={`url(#${id}-petal)`} stroke="#fff2f1" strokeWidth=".4" transform={`rotate(${angle}) scale(1 .75)`}/>)}
        {[0,60,120,180,240,300].map(angle=><path key={angle} d="M0 2Q-5 -4 0 -11Q5 -4 0 2" fill="#fff0e6" transform={`rotate(${angle})`}/>)}
        <circle r="3.5" fill="#e6bd68"/><circle r="1.5" fill="#fff0ac"/>
      </g>}
    </g>)}
    <rect y="210" width="320" height="40" fill={`url(#${id}-fade)`}/>
  </svg>;
}

const planets = [
  { name: "Mercury", r:32, size:3, color:"#c9b9ad", duration:10, angle:210 },
  { name: "Venus", r:49, size:5, color:"#efc88b", duration:15, angle:30 },
  { name: "Earth", r:68, size:6.5, color:"#80c5d9", duration:21, angle:150 },
  { name: "Mars", r:88, size:4.5, color:"#df947c", duration:28, angle:310 },
  { name: "Jupiter", r:111, size:10, color:"#d7b592", duration:39, angle:230 },
  { name: "Saturn", r:137, size:8, color:"#e3cda0", duration:50, angle:55 },
];
function planetPosition(index: number, time: number) {
  const planet = planets[index];
  const angle = planet.angle * Math.PI / 180 + time * Math.PI * 2 / planet.duration;
  return { x: round(160 + planet.r * Math.cos(angle)), y: round(120 + planet.r * .68 * Math.sin(angle)) };
}
const animatePlanets: AnimateScene = (nodes, state) => {
  nodes.forEach((node, index) => {
    const { x, y } = planetPosition(index, state.time);
    node.setAttribute("transform", `translate(${x} ${y})`);
  });
};

function SolarScene() {
  const t = useFeatureCopy();
  const ref = useSceneMotion(animatePlanets);
  const id = useId().replace(/:/g, "");
  return <svg ref={ref} viewBox="0 0 320 250" className={styles.art} aria-hidden="true">
    <defs>
      <radialGradient id={`${id}-sun`} cx="35%" cy="30%"><stop stopColor="#fff1bc"/><stop offset=".65" stopColor="#f4c474"/><stop offset="1" stopColor="#dc9454"/></radialGradient>
      {planets.map((planet,index)=><radialGradient key={planet.name} id={`${id}-planet-${index}`} cx="30%" cy="25%" r="80%"><stop stopColor="#fff6dc"/><stop offset=".35" stopColor={planet.color}/><stop offset="1" stopColor="#514254"/></radialGradient>)}
    </defs>
    {Array.from({length:35},(_,i)=><circle className={i%5===0?styles.star:undefined} key={i} cx={(i*79+17)%320} cy={(i*47+13)%250} r={i%5===0?1.3:.7} fill="#e9dced" opacity={.25+(i%4)*.15} style={{animationDelay:`${i%5*-.8}s`}}/>)}
    {planets.map(planet=><ellipse key={planet.r} cx="160" cy="120" rx={planet.r} ry={planet.r*.68} fill="none" stroke="#d6c4e6" strokeWidth=".65" opacity=".23"/>)}
    <circle className={styles.sunHalo} cx="160" cy="120" r="29" fill="#efc177" opacity=".12"/>
    <circle className={styles.sun} cx="160" cy="120" r="16" fill={`url(#${id}-sun)`}/>
    {planets.map((planet,index) => { const {x,y} = planetPosition(index,0); return <g key={planet.name} data-mover transform={`translate(${x} ${y})`}>
      <title>{planet.name}</title>
      {index===5 && <ellipse rx="15" ry="5" fill="none" stroke="#c3aa80" strokeWidth="2.5" transform="rotate(-25)"/>}
      <circle r={planet.size} fill={`url(#${id}-planet-${index})`}/>
      {index===2 && <path d="M-4 -3L0 -4L3 -1L0 2L-3 2Z" fill="#7eab91"/>}
      {index===4 && <path d="M-7 -4Q0 -2 7 -3M-8 1Q0 3 8 2M-6 5Q0 6 6 5" fill="none" stroke="#ab8066" strokeWidth="1.3" opacity=".55"/>}
      {index===5 && <path d="M-13 8Q-5 12 13 -3" fill="none" stroke="#e4cfab" strokeWidth="2"/>}
    </g>; })}
    <text x="160" y="237" fill="#c8b5d7" fontSize="8" textAnchor="middle" letterSpacing="2">{t("blog.art.solar")}</text>
  </svg>;
}

const buildings = [
  {x:0,w:28,h:61},{x:32,w:24,h:94},{x:62,w:27,h:75},{x:96,w:29,h:126},
  {x:132,w:24,h:64},{x:162,w:33,h:103},{x:202,w:22,h:81},{x:231,w:32,h:143},{x:270,w:25,h:92},{x:300,w:26,h:67},
];
function SkylineScene() {
  const id = useId().replace(/:/g, "");
  return <svg viewBox="0 -55 320 410" preserveAspectRatio="xMidYMid slice" className={styles.art} aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor="#8b789d"/><stop offset=".55" stopColor="#e7a995"/><stop offset="1" stopColor="#f7d6a6"/></linearGradient>
      <linearGradient id={`${id}-river`} x2="0" y2="1"><stop stopColor="#a28fa8"/><stop offset="1" stopColor="#5f6e88"/></linearGradient>
      <radialGradient id={`${id}-glow`}><stop stopColor="#ffdfad" stopOpacity=".7"/><stop offset="1" stopColor="#ffdfad" stopOpacity="0"/></radialGradient>
      <linearGradient id={`${id}-tower`} x2="1" y2="0"><stop stopColor="#655b7b"/><stop offset="1" stopColor="#8d7187"/></linearGradient>
    </defs>
    <rect y="-55" width="320" height="410" fill={`url(#${id}-sky)`}/>
    <circle cx="224" cy="94" r="70" fill={`url(#${id}-glow)`}/><circle cx="224" cy="94" r="28" fill="#ffdcab"/>
    <g className={styles.cloud} fill="none" stroke="#f3d0c1" strokeLinecap="round" opacity=".55"><path d="M-15 49H67M10 54H45M160 33H241M200 38H269" strokeWidth="3"/><path d="M30 77H92M265 67H333" strokeWidth="2"/></g>
    <g className={styles.distantCity} fill="#a58a9c" opacity=".7"><path d="M0 189V117H18V131H35V99H49V118H71V88H87V112H104V101H122V129H139V106H154V122H174V81H189V100H208V128H232V110H253V93H269V117H292V104H320V192Z"/></g>
    <g className={styles.nearCity}>
      {buildings.map((building,i)=><g key={building.x}>
        <rect x={building.x} y={193-building.h} width={building.w} height={building.h} rx="1" fill={`url(#${id}-tower)`}/>
        <rect x={building.x+building.w-5} y={193-building.h} width="5" height={building.h} fill="#554f70" opacity=".65"/>
        {i===3 && <><path d="M101 67V56H105V47H116V56H121V67" fill="#74617d"/><path d="M110 47V28" stroke="#74617d" strokeWidth="1.6"/><circle cx="110" cy="28" r="1.5" fill="#ffe6be"/></>}
        {i===7 && <><path d="M235 50L247 22L259 50Z" fill="#6c5a78"/><path d="M247 22V12" stroke="#6c5a78" strokeWidth="1.5"/></>}
        {i===1 && <g fill="#675776"><path d="M37 99V87Q44 81 51 87V99Z"/><path d="M38 99V103M50 99V103" stroke="#675776"/></g>}
        {Array.from({length:Math.floor((building.h-10)/12)},(_,row)=>[0,1].map(col=><rect className={styles.window} key={`${row}-${col}`} x={building.x+5+col*10} y={200-building.h+row*12} width="3" height="5" rx=".4" fill={(i+row+col)%3===0?"#ffe1a0":"#c3979d"} style={{transitionDelay:`${(i+row+col)%5*65}ms`,animationDelay:`${(i+row+col)%7*-1.1}s`}}/>))}
      </g>)}
    </g>
    <rect y="193" width="320" height="162" fill={`url(#${id}-river)`}/>
    <g className={styles.reflection} fill="none" strokeLinecap="round"><path d="M197 200H246M207 205H238M213 211H253M204 220H240M217 232H247" stroke="#f1c395" strokeWidth="2.4" opacity=".6"/><path d="M9 208H39M68 221H102M141 203H171M263 218H305M102 241H137M282 241H320" stroke="#d6bbc1" strokeWidth="1.3" opacity=".6"/></g>
    <g fill="none" stroke="#514d6b">
      <path d="M-10 220Q48 212 108 219T330 213" strokeWidth="4"/>
      <path d="M-10 203Q31 210 66 175Q112 214 165 182Q218 218 330 191" strokeWidth="1.8"/>
      <path d="M61 226V174H71V226M160 222V180H170V222" strokeWidth="3"/>
      <path d="M10 207V217M26 204V216M42 194V216M85 193V217M103 204V218M122 207V218M140 199V218M188 199V219M207 205V219M230 207V217M251 205V216M278 200V215M301 195V214" strokeWidth=".7"/>
    </g>
    <g className={styles.boat}><path d="M43 234H64L60 239H48Z" fill="#f4dfc3"/><path d="M49 234V230H58V234" fill="#eee3d1"/><path d="M33 241H58" stroke="#d1c4cf" opacity=".5"/></g>
    <path className={styles.birds} d="M15 82Q19 78 23 82Q27 78 31 82M147 62Q151 58 155 62Q159 58 163 62" fill="none" stroke="#79627f" strokeWidth="1.2"/>
  </svg>;
}

export default function BlogDoorCard({ scene, href, title, blurb, locked }: { scene: Scene; href: string; title: string; blurb: ReactNode; locked?: boolean }) {
  const t = useFeatureCopy();
  return <Link href={href} className={`${styles.card} ${styles[scene]}`} onPointerMove={event => {
    if (event.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const svg = event.currentTarget.querySelector("svg");
    const sceneRect = svg?.getBoundingClientRect();
    if (svg && sceneRect) {
      svg.setAttribute("data-pointer-x", String(Math.max(65, Math.min(255, (event.clientX - sceneRect.left) / sceneRect.width * 320))));
      svg.setAttribute("data-pointer-y", String(Math.max(50, Math.min(195, (event.clientY - sceneRect.top) / sceneRect.height * 250))));
    }
    event.currentTarget.style.setProperty("--drift-x", `${((event.clientX - rect.left)/rect.width-.5)*28}px`);
    event.currentTarget.style.setProperty("--drift-y", `${((event.clientY - rect.top)/rect.height-.5)*18}px`);
  }} onPointerLeave={event => { event.currentTarget.style.setProperty("--drift-x", "0px"); event.currentTarget.style.setProperty("--drift-y", "0px"); }}>
    <span className={styles.scene}>{scene === "technical" ? <PondScene /> : scene === "poems" ? <SolarScene /> : <SkylineScene />}</span>
    <span className={styles.copy}><span className={styles.number}>{t(`blog.art.${scene}.label`)}</span><span className={styles.title}>{t(`blog.art.${scene}.title`) || title}{locked && <span className={styles.lock} aria-label={t("blog.art.locked")}>🔒</span>}<span className={styles.arrow} aria-hidden="true">↗</span></span><span className={styles.blurb}>{blurb}</span></span>
  </Link>;
}
