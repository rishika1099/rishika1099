// Approximate J2000 bright-star positions, projected using local sidereal time.
// Horizontal-coordinate method: https://aa.usno.navy.mil/faq/alt_az
const RAD = Math.PI / 180;
export const cities = [
  { name: "New York", lat: 40.713, lon: -74.006, zone: "America/New_York" },
  { name: "London", lat: 51.507, lon: -0.128, zone: "Europe/London" },
  { name: "Hyderabad", lat: 17.385, lon: 78.487, zone: "Asia/Kolkata" },
  { name: "Tokyo", lat: 35.676, lon: 139.65, zone: "Asia/Tokyo" },
  { name: "Sydney", lat: -33.869, lon: 151.209, zone: "Australia/Sydney" },
];
export type SkyLocation = typeof cities[number];
const stars: [string, number, number][] = [
  ["Sirius",6.752,-16.716],["Canopus",6.399,-52.696],["Arcturus",14.261,19.182],
  ["Vega",18.616,38.784],["Capella",5.278,45.998],["Rigel",5.243,-8.202],
  ["Procyon",7.655,5.225],["Betelgeuse",5.919,7.407],["Altair",19.846,8.868],
  ["Aldebaran",4.599,16.509],["Spica",13.42,-11.161],["Antares",16.49,-26.432],
  ["Pollux",7.755,28.026],["Deneb",20.691,45.28],["Regulus",10.139,11.967],
  ["Polaris",2.53,89.264],["Dubhe",11.062,61.751],["Merak",11.031,56.382],
  ["Phecda",11.897,53.695],["Megrez",12.257,57.033],["Alioth",12.9,55.96],
  ["Mizar",13.399,54.925],["Alkaid",13.792,49.313],
  ["Caph",0.153,59.15],["Schedar",0.675,56.537],["Navi",0.945,60.717],
  ["Ruchbah",1.43,60.235],["Segin",1.906,63.67],
];
export const starLines = [
  ["Dubhe","Merak"],["Merak","Phecda"],["Phecda","Megrez"],["Megrez","Dubhe"],
  ["Megrez","Alioth"],["Alioth","Mizar"],["Mizar","Alkaid"],
  ["Caph","Schedar"],["Schedar","Navi"],["Navi","Ruchbah"],["Ruchbah","Segin"],
];
export function skyAt(date: Date, location: SkyLocation) {
  const days = date.getTime() / 86400000 + 2440587.5 - 2451545;
  const sidereal = (280.46061837 + 360.98564736629 * days + location.lon) * RAD;
  const lat = location.lat * RAD;
  return stars.map(([name, ra, dec]) => {
    const h = sidereal - ra * 15 * RAD;
    const d = dec * RAD;
    const alt = Math.asin(Math.sin(lat)*Math.sin(d)+Math.cos(lat)*Math.cos(d)*Math.cos(h));
    const az = Math.atan2(-Math.cos(d)*Math.sin(h), Math.sin(d)*Math.cos(lat)-Math.cos(d)*Math.sin(lat)*Math.cos(h));
    const r = (Math.PI/2-alt)/(Math.PI/2)*106;
    return { name, visible: alt > 0, x: 130 - r*Math.sin(az), y: 130 - r*Math.cos(az) };
  }).filter(s => s.visible);
}
export function moonAt(date: Date) {
  // Mean lunar cycle, not an ephemeris. Reference new moon: 2000-01-06 18:14 UTC.
  const phase = (((date.getTime()-Date.UTC(2000,0,6,18,14))/86400000/29.53059)%1+1)%1;
  const names = ["new moon","waxing crescent","first quarter","waxing gibbous","full moon","waning gibbous","last quarter","waning crescent"];
  const icons = ["🌑","🌒","🌓","🌔","🌕","🌖","🌗","🌘"];
  const index = Math.round(phase*8)%8;
  return { name: names[index], icon: icons[index], illumination: Math.round((1-Math.cos(phase*2*Math.PI))/2*100) };
}

export type GardenLight = "day" | "sunset" | "night";
// NOAA's fractional-year solar-position approximation, evaluated in UTC.
// https://gml.noaa.gov/grad/solcalc/solareqns.PDF
export function sunAltitude(date: Date, location: SkyLocation) {
  const year = date.getUTCFullYear();
  const yearStart = Date.UTC(year, 0, 1);
  const yearDays = (Date.UTC(year + 1, 0, 1) - yearStart) / 86400000;
  const gamma = 2 * Math.PI / yearDays * ((date.getTime() - yearStart) / 86400000 - 0.5);
  const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
  const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);
  const minutes = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
  const hourAngle = ((minutes + eq + 4 * location.lon) / 4 - 180) * RAD;
  const lat = location.lat * RAD;
  return Math.asin(Math.max(-1, Math.min(1, Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(hourAngle)))) / RAD;
}
export function gardenLight(date: Date, location: SkyLocation): GardenLight {
  const altitude = sunAltitude(date, location);
  return altitude > 6 ? "day" : altitude > -6 ? "sunset" : "night";
}
