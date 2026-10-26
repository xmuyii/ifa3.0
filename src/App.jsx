import React, { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

const INK = "#0D0F1E";
const INDIGO = "#1E2340";
const CAMWOOD = "#C4652E";
const GOLD = "#D9A94A";
const IVORY = "#F3EAD8";
const SAGE = "#8B9A7C";
const CUPS_BLUE = "#3E5C76";
const SWORD_GRAY = "#6B7280";
const GREEN = "#2F6B4F";
const RED = "#8B2E2E";
const HAIRLINE = "rgba(243,234,216,0.14)";

/* five-point orientation, reused everywhere a "star choice" is needed */
const ORIENTATIONS = [
  { key: "spiritual", label: "Spiritual", angle: -90, voice: "soulful, symbolic, unhurried" },
  { key: "emotional", label: "Emotional", angle: -18, voice: "warm, feeling-first, attuned" },
  { key: "psychological", label: "Psychological", angle: 54, voice: "reflective, pattern-aware, introspective" },
  { key: "physical", label: "Physical", angle: 126, voice: "grounded, practical, direct" },
  { key: "mental", label: "Mental", angle: 198, voice: "clear, analytical, structured" },
];

const SUGGESTED_QUESTIONS = [
  "What do I need to understand about this situation?",
  "What's blocking me from moving forward?",
  "What should I focus on this week?",
  "What is this relationship really showing me?",
  "What choice deserves my attention right now?",
  "What am I not seeing clearly?",
  "What's the right timing for this?",
  "What do I need to let go of?",
  "What's really behind how I've been feeling?",
  "Where is this path actually leading?",
  "What's the lesson in what just happened?",
  "What should I be paying closer attention to?",
  "Is this the right direction for me?",
  "What's standing between me and what I want?",
  "What do I need to hear right now?",
  "What pattern keeps showing up in my life?",
  "What's worth being patient about?",
  "What am I ready for, even if it doesn't feel like it?",
];
function pickRandom(arr, n) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

/* ---------- Tarot deck (78) ---------- */
const MAJORS = [
  ["The Fool", "A leap into the unknown, trusting the first step before the plan is finished.", "Hesitation, recklessness, or a leap taken without any preparation at all."],
  ["The Magician", "Having every tool you need already in hand, and the will to use them.", "Talent going unused, or using your skill to mislead rather than build."],
  ["The High Priestess", "Trusting a quiet, private knowing over what's loudly obvious.", "Ignoring your own instincts, or secrets that have started to cost you."],
  ["The Empress", "Growth, nurture, and something maturing because you've tended it.", "Neglect, or giving so much you've left nothing for yourself."],
  ["The Emperor", "Structure and steady authority that makes room for things to hold.", "Control tightened past the point it's helping."],
  ["The Hierophant", "Learning from tradition, mentorship, or an established way of doing things.", "Rigid rule-following, or rejecting guidance out of pure stubbornness."],
  ["The Lovers", "A real choice between two paths, made from values rather than convenience.", "Misalignment, or a choice avoided until it makes itself."],
  ["The Chariot", "Willpower pulling opposing forces in one direction through sheer focus.", "Losing direction, or forcing progress that isn't actually under control."],
  ["Strength", "Quiet, patient courage that doesn't need to dominate to win.", "Self-doubt, or force used where patience would have worked better."],
  ["The Hermit", "Stepping back to think clearly, alone, before deciding anything.", "Isolation that's gone on too long, or avoiding people who could help."],
  ["Wheel of Fortune", "A turn in circumstance that was always going to come around.", "Resisting a change that's already in motion."],
  ["Justice", "A fair, clear-eyed reckoning with cause and effect.", "An imbalance not yet accounted for, or a decision made unfairly."],
  ["The Hanged Man", "Pausing on purpose to see a situation from an angle you've missed.", "Stalling that's stopped being useful, delay for its own sake."],
  ["Death", "A definite ending that clears the way for what's next.", "Clinging to something that has already run its course."],
  ["Temperance", "Patient blending of opposites into something workable.", "Excess, or forcing two things together that don't actually mix."],
  ["The Devil", "A pattern or attachment that has more control over you than you'd like.", "Recognizing the chain and taking the first real step to loosen it."],
  ["The Tower", "A sudden, disruptive truth that breaks something built on a bad foundation.", "Bracing against inevitable change, delaying a collapse that will happen anyway."],
  ["The Star", "Quiet hope returning after a hard stretch, with room to heal.", "Disconnection from hope, doubting that things can get better."],
  ["The Moon", "Uncertainty and things that aren't fully visible yet.", "Confusion clearing, or fear that's larger than the actual threat."],
  ["The Sun", "Clarity, vitality, and something working out plainly and well.", "Clouded joy, or success that hasn't been fully claimed yet."],
  ["Judgement", "A reckoning or reassessment that calls you to answer for a chapter.", "Self-judgment that's too harsh, or avoiding a needed reckoning."],
  ["The World", "Completion — a cycle closing with everything in its place.", "Something left unfinished, close but not quite closed."],
];
const SUITS = [
  { key: "Wands", theme: "ambition, drive, and creative fire", color: CAMWOOD },
  { key: "Cups", theme: "feeling, connection, and the emotional undercurrent", color: CUPS_BLUE },
  { key: "Swords", theme: "thought, conflict, and hard truths", color: SWORD_GRAY },
  { key: "Pentacles", theme: "resources, work, and the material world", color: SAGE },
];
const RANKS = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];
const MINORS = SUITS.flatMap((s) => RANKS.map((r) => ({ name: `${r} of ${s.key}`, suit: s.key, rank: r })));

// Original, hand-written meanings for all 56 Minor Arcana — not reproduced from any
// existing deck guide or website, to keep this clear of anyone else's copyrighted text.
const MINOR_MEANINGS = [
  ["Ace of Wands", "A spark of ambition arriving before you've figured out what to do with it — pure creative charge, ready to be aimed.", "Excitement with nowhere to go yet, or a false start that fizzles before it takes hold."],
  ["Two of Wands", "Standing on your own ground, mapping out a bigger territory than the one you're standing in.", "Staying small out of caution, or planning endlessly instead of committing to a direction."],
  ["Three of Wands", "The first moves have paid off and now you're watching to see what comes back from further out.", "Delays on something you already set in motion, or expecting too much too soon from an early effort."],
  ["Four of Wands", "A milestone worth celebrating — solid ground built by real effort, not luck.", "A celebration postponed, or stability that hasn't been earned yet."],
  ["Five of Wands", "Competing energies in the same room, everyone pushing their own version of the plan.", "Conflict finally settling, or friction avoided by simply refusing to engage."],
  ["Six of Wands", "Recognition for work that was actually hard — a win that's visible, not just felt privately.", "Success that goes unnoticed, or claiming a win that wasn't fully earned."],
  ["Seven of Wands", "Holding your position while others press in, standing your ground on something worth defending.", "Exhaustion from defending too much, or giving up ground that mattered."],
  ["Eight of Wands", "Momentum with nothing left in the way — things moving fast once they finally get moving.", "Delays piling up, or moving so fast that nothing gets a chance to land properly."],
  ["Nine of Wands", "Worn down but still standing, one more effort between here and done.", "Defensiveness that's stopped being useful, or genuine burnout mistaken for resilience."],
  ["Ten of Wands", "Carrying more than your share, close to the finish line but feeling every step of it.", "Setting down a burden that was never really yours, or collapsing under weight you kept adding to yourself."],
  ["Page of Wands", "A new idea catching fire, eager and untested, still figuring out what it wants to become.", "Enthusiasm without follow-through, or news that turns out to be premature."],
  ["Knight of Wands", "Charging at something with total conviction, more interested in the chase than the plan.", "Recklessness dressed up as confidence, or momentum with no clear destination."],
  ["Queen of Wands", "Warmth with real backbone — drawing people in without losing your own direction.", "Confidence curdling into control, or warmth used to mask insecurity."],
  ["King of Wands", "Vision paired with the discipline to actually build it, leading by example rather than force.", "Big ideas with no grounding, or leadership that demands more than it gives."],

  ["Ace of Cups", "A feeling arriving before you have words for it — the start of real emotional openness.", "Feelings kept sealed off, or an offer of connection that goes unanswered."],
  ["Two of Cups", "A real meeting between equals, something mutual forming without either side having to win.", "A connection out of balance, or a bond straining under something unspoken."],
  ["Three of Cups", "Genuine celebration shared with people who actually showed up for you.", "A gathering that feels hollow, or joy that's really overindulgence in disguise."],
  ["Four of Cups", "Something good sitting right in front of you while your attention is somewhere else entirely.", "Finally noticing what was being offered, or restlessness with no real cause behind it."],
  ["Five of Cups", "Grieving what spilled while standing too close to it to see what's still upright.", "Starting to look up from the loss, or staying stuck in it longer than it deserves."],
  ["Six of Cups", "Something from earlier finding its way back — nostalgia that still has something useful to offer.", "Living in the past instead of the present, or outgrowing a memory that won't let go."],
  ["Seven of Cups", "Too many possibilities laid out at once, each one glittering and none of them tested.", "Cutting through the illusions and finally choosing one real thing over a dozen fantasies."],
  ["Eight of Cups", "Walking away from something that looks fine from the outside because it stopped being enough.", "Staying out of fear of the unknown, or leaving before really knowing why."],
  ["Nine of Cups", "A wish actually met — quiet satisfaction that doesn't need to prove itself to anyone.", "Satisfaction that's all surface, or chasing pleasure to avoid a deeper emptiness."],
  ["Ten of Cups", "A sense of real contentment, the kind built with other people rather than in spite of them.", "A picture-perfect life that doesn't match what's actually happening underneath it."],
  ["Page of Cups", "An emotional message or invitation arriving gently, worth taking seriously even though it looks small.", "Emotional immaturity, or a feeling being performed rather than truly felt."],
  ["Knight of Cups", "Following the heart on a real offer, moving toward something because it feels genuinely right.", "Charm without substance, or a promise made in a mood that won't survive the morning."],
  ["Queen of Cups", "Emotional depth that stays steady — feeling everything without being swept away by it.", "Absorbing everyone else's feelings until you've lost track of your own."],
  ["King of Cups", "Calm command of your own emotional weather, even when what's underneath is a lot.", "Feelings kept so controlled they leak out sideways, or compassion that's really avoidance."],

  ["Ace of Swords", "A moment of total clarity cutting through everything that was clouding the picture.", "Confusion mistaken for clarity, or a truth used carelessly instead of precisely."],
  ["Two of Swords", "A decision being avoided by refusing to look at it directly, balance held through denial.", "The blindfold finally coming off, or a stalemate breaking because it has to."],
  ["Three of Swords", "A hurt that's real and specific, not vague — something has actually been said or done.", "Old pain resurfacing, or finally starting to release a grief that's been held onto too tightly."],
  ["Four of Swords", "A deliberate pause — stepping back from the fight to actually recover before the next round.", "Rest that's been avoided too long, or restlessness that won't allow real recovery."],
  ["Five of Swords", "Winning an argument in a way that costs more than it gains.", "Walking away from a fight that wasn't worth winning, or finally making peace after conflict."],
  ["Six of Swords", "Moving away from a difficult situation toward calmer water, even if the way there is quiet and unglamorous.", "Stuck in transition, unable to fully leave what needs leaving."],
  ["Seven of Swords", "Getting away with something through cleverness rather than confrontation.", "A deception coming to light, or finally coming clean about something."],
  ["Eight of Swords", "Feeling trapped by a situation that has more exits than it appears to from the inside.", "Starting to see a way out, or realizing the trap was partly self-made."],
  ["Nine of Swords", "Anxiety at its loudest, usually at 3am, usually louder than the actual problem deserves.", "Finally getting some rest from the worry, or the fear turning out to be worse than the reality."],
  ["Ten of Swords", "A painful ending that's already happened — nothing left to do but accept it and get up.", "Resisting an ending that's already final, or recovery finally beginning after the worst of it."],
  ["Page of Swords", "A sharp new idea or piece of information, still untested but worth paying attention to.", "Gossip mistaken for insight, or words used carelessly before they're thought through."],
  ["Knight of Swords", "Charging straight at the truth, fast and direct, not always pausing to check who's in the way.", "Aggression that's outrun its own judgment, or a point being pushed too hard to land well."],
  ["Queen of Swords", "Seeing a situation exactly as it is and saying so, without softening it more than it needs.", "Honesty turned cold, or using sharp clarity as a way to keep people at a distance."],
  ["King of Swords", "Clear-headed authority — making the hard call because it's the right one, not the easy one.", "Logic used to justify something cruel, or rigidity mistaken for principle."],

  ["Ace of Pentacles", "A real opportunity landing in your hands — practical, tangible, worth building on.", "A missed opening, or a good opportunity built on shaky ground."],
  ["Two of Pentacles", "Juggling more than one priority and actually managing to keep both in the air.", "Overcommitted and starting to drop what matters most."],
  ["Three of Pentacles", "Good work getting recognized because it was actually built well, often with others' help.", "Effort going unrecognized, or a team not pulling in the same direction."],
  ["Four of Pentacles", "Holding tightly to what you've built, security bought at the cost of flexibility.", "Loosening a grip that's gotten too tight, or finally spending what's been hoarded out of fear."],
  ["Five of Pentacles", "A hard stretch — feeling left out in the cold, whether that's financial, physical, or both.", "Help finally arriving, or realizing support was there the whole time and just unseen."],
  ["Six of Pentacles", "A fair exchange — help given or received in a way that actually balances out.", "Generosity with strings attached, or a debt that's kept someone in a lesser position."],
  ["Seven of Pentacles", "Taking stock of an investment that's still growing, patience being the only thing left to give it.", "Impatience with slow progress, or effort that isn't actually paying off the way it should."],
  ["Eight of Pentacles", "Doing the quiet, repetitive work of getting genuinely good at something.", "Going through the motions without real craft behind it, or skill without any real growth."],
  ["Nine of Pentacles", "Standing on ground you built yourself, comfortable because you earned the comfort.", "Comfort that's come at the cost of connection, or self-sufficiency that's actually isolation."],
  ["Ten of Pentacles", "Something lasting — built not just for now but for whoever comes after.", "Instability in what should be solid, or wealth that hasn't translated into real security."],
  ["Page of Pentacles", "A practical new opportunity worth studying closely before acting on it.", "An opportunity treated too casually, or ambition without any concrete plan behind it."],
  ["Knight of Pentacles", "Slow, steady, reliable progress — not exciting, but it's the kind that actually holds.", "Progress stalling into pure routine, or caution tipping into standing completely still."],
  ["Queen of Pentacles", "Practical care — making sure the people and things you're responsible for are actually looked after.", "Overextending yourself caring for others while your own needs go unmet."],
  ["King of Pentacles", "Real, earned abundance, generous because there's genuinely enough to share.", "Success measured only in what can be counted, or generosity that's really about control."],
];

function tarotMeaning(name) {
  const major = MAJORS.find((m) => m[0] === name);
  if (major) return { upright: major[1], reversed: major[2] };
  const minor = MINOR_MEANINGS.find((m) => m[0] === name);
  if (minor) return { upright: minor[1], reversed: minor[2] };
  return { upright: "Meaning not yet written for this card.", reversed: "Meaning not yet written for this card." }; // safety net, shouldn't be reachable
}
function tarotColor(name) {
  const major = MAJORS.find((m) => m[0] === name);
  if (major) return GOLD;
  return SUITS.find((s) => s.key === MINORS.find((m) => m.name === name).suit).color;
}
const TAROT_DECK = [...MAJORS.map((m) => m[0]), ...MINORS.map((m) => m.name)];

/* ---------- Odu (4096 = 16 x 16 x 16, placeholder structure) ---------- */
const ODU_ROOT = ["Ogbe","Oyeku","Iwori","Odi","Irosun","Owonrin","Obara","Okanran","Ogunda","Osa","Ika","Oturupon","Otura","Irete","Ose","Ofun"];
const ODU_BITS = ["1111","0000","0110","1001","1100","0011","1000","0001","1110","0111","0100","0010","1011","1101","1010","0101"];
function oduMarks(i) { return ODU_BITS[i].split("").map(Number); }

/* ── 256 ODU MEJI ─────────────────────────────────────────────────────────
   Every ordered pair of the 16 principals.
   • Different principals: names concatenated, no suffix  (OgbeOyeku)
   • Same principal doubled: "X Meji"                     (Ose Meji)
   • Special case Ogbe+Ogbe: Eji Ogbe
────────────────────────────────────────────────────────────────────────── */
const ODU_MEJI = [];
for (let a = 0; a < 16; a++) for (let b = 0; b < 16; b++) {
  const name = a === b
    ? (a === 0 ? "Eji Ogbe" : ODU_ROOT[a] + " Meji")
    : ODU_ROOT[a] + ODU_ROOT[b];
  ODU_MEJI.push({ name, a, b, tier: "meji" });
}

/* ── 4096 ODU META ────────────────────────────────────────────────────────
   Each of the 256 Meji cards paired with one of the 16 principals.
   The principal is appended to the Meji card's name.
   Exception: principal-doubled Meji + same principal again => "X Meta".
────────────────────────────────────────────────────────────────────────── */
const ODU_META = [];
for (let m = 0; m < ODU_MEJI.length; m++) for (let p = 0; p < 16; p++) {
  const base = ODU_MEJI[m];
  const name = (base.a === base.b && p === base.a)
    ? (base.a === 0 ? "Eji Ogbe Meta" : ODU_ROOT[base.a] + " Meta")
    : base.name + ODU_ROOT[p];
  ODU_META.push({ name, a: base.a, b: base.b, c: p, tier: "meta" });
}

/* lookup helpers */
const ODU_LOOKUP = new Map();
ODU_MEJI.forEach(o => ODU_LOOKUP.set(o.name, o));
ODU_META.forEach(o => ODU_LOOKUP.set(o.name, o));
const normOdu = (s) => String(s||"").toLowerCase().replace(/[^a-z]/g,"");
function oduEntry(name) { return ODU_LOOKUP.get(name) || [...ODU_LOOKUP.values()].find(o => normOdu(o.name)===normOdu(name)) || null; }
function oduRootNames(name) { const e=oduEntry(name); if(!e) return null; return e.c!==undefined?[ODU_ROOT[e.a],ODU_ROOT[e.b],ODU_ROOT[e.c]]:[ODU_ROOT[e.a],ODU_ROOT[e.b]]; }
function oduRootsOf(name) { const e=oduEntry(name); if(!e) return null; return e.c!==undefined?[e.a,e.b,e.c]:[e.a,e.b]; }

function findOduConnections(resolved) {
  const byRoot = new Map();
  resolved.forEach(p => p.cards.forEach(c => {
    if (c.tradition === "ifa256" || c.tradition === "ifa4096") {
      const roots = oduRootsOf(c.name); if (!roots) return;
      [...new Set(roots)].forEach(r => { if (!byRoot.has(r)) byRoot.set(r,[]); byRoot.get(r).push(`${p.label} (${c.name})`); });
    }
  }));
  return [...byRoot.entries()].filter(([,w])=>w.length>=2).sort((a,b)=>b[1].length-a[1].length).slice(0,5)
    .map(([r,w])=>`The ${ODU_ROOT[r]} root runs through ${w.join(", ")}.`);
}

/* ---------- moon phase ---------- */
function getMoonPhase(date) {
  const d = date || new Date();
  const synodic = 29.53058867;
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14);
  const diffDays = (d.getTime() - knownNewMoon) / 86400000;
  let phaseDays = diffDays % synodic;
  if (phaseDays < 0) phaseDays += synodic;
  const t = phaseDays / synodic;
  const illumination = Math.round((1 - Math.cos(2 * Math.PI * t)) / 2 * 100);
  const waxing = t < 0.5;
  let name;
  if (t < 0.03 || t > 0.97) name = "New Moon";
  else if (t < 0.22) name = "Waxing Crescent";
  else if (t < 0.28) name = "First Quarter";
  else if (t < 0.47) name = "Waxing Gibbous";
  else if (t < 0.53) name = "Full Moon";
  else if (t < 0.72) name = "Waning Gibbous";
  else if (t < 0.78) name = "Last Quarter";
  else name = "Waning Crescent";
  return { name, illumination, waxing };
}
function MoonGlyph({ illumination, waxing, size }) {
  const s = size || 44, r = s / 2 - 2, litWidth = (illumination / 100) * s;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <defs><clipPath id={`moonClip-${s}`}><circle cx={s/2} cy={s/2} r={r}/></clipPath></defs>
      <circle cx={s/2} cy={s/2} r={r} fill={INK} stroke={HAIRLINE} strokeWidth="1"/>
      <g clipPath={`url(#moonClip-${s})`}><rect x={waxing ? s - litWidth : 0} y="0" width={litWidth} height={s} fill={GOLD}/></g>
    </svg>
  );
}

/* ---------- storage ---------- */
async function safeGet(key) {
  try { const r = await window.storage.get(key); return r ? r.value : null; } catch (e) { return null; }
}
async function pushEvent(type, extra) {
  try {
    const raw = await safeGet("ifatarot:events");
    const list = raw ? JSON.parse(raw) : [];
    list.push({ type, date: new Date().toISOString(), ...extra });
    await window.storage.set("ifatarot:events", JSON.stringify(list.slice(-500)));
  } catch (e) {}
}
function getDeviceId() {
  try {
    let id = localStorage.getItem("ifatarot:device-id");
    if (!id) { id = "dev-" + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("ifatarot:device-id", id); }
    return id;
  } catch (e) { return "dev-unknown"; } // localStorage can be unavailable in some sandboxed previews
}

/* ---------- dimension configs, renamed evocatively ---------- */
function mkMode(key, title, labels) {
  return { key, title, label: labels.join(", "), traditionMode: "single", positions: labels.map((l, i) => ({ key: `p${i + 1}`, label: l })) };
}

const DIMENSIONS = {
  "1D": {
    label: "1D of thought",
    modes: [
      { key: "single", title: "The Single Flame", label: "One card, one focus", traditionMode: "single", positions: [{ key: "focus", label: "Focus" }] },
      mkMode("unlabeled", "Unlabeled Reading", ["Card"]),
      mkMode("cardOfDay", "Card of the Day", ["Card of the Day"]),
      mkMode("weekAhead", "The Week Ahead", ["The Week Ahead"]),
      mkMode("heart", "Matters of the Heart", ["Matters of the Heart"]),
      mkMode("career", "Career Advice", ["Career Advice"]),
      mkMode("yesno", "Yes or No", ["Yes or No"]),
      mkMode("decision", "Make a Decision", ["Decision"]),
      mkMode("needToKnow", "What I Need to Know", ["What I Need to Know"]),
      mkMode("selfKnowledge", "Self Knowledge", ["Self Knowledge"]),
    ],
  },
  "2D": {
    label: "2D of thought",
    modes: [
      { key: "duality", title: "The Twin Paths", label: "Agreeable and disagreeable", traditionMode: "perPosition", positions: [{ key: "agreeable", label: "Agreeable" }, { key: "disagreeable", label: "Disagreeable" }] },
      { key: "polarity", title: "Sky and Root", label: "Spiritual above, physical below", traditionMode: "perPosition", positions: [{ key: "spiritual", label: "Spiritual" }, { key: "physical", label: "Physical" }] },
      mkMode("unlabeled", "Unlabeled Reading", ["Card 1", "Card 2"]),
      mkMode("cardOfDay", "Card of the Day", ["Card of the Day", "Clarifier"]),
      mkMode("weekAhead", "The Week Ahead", ["Next Few Days", "After That"]),
      mkMode("career", "Career Advice", ["Situation", "Advice"]),
      mkMode("yesno", "Yes or No", ["Yes or No", "Clarifier"]),
      mkMode("seekAdvice", "Seek Advice", ["Situation", "Advice"]),
      mkMode("decision", "Make a Decision", ["Pros", "Cons"]),
      mkMode("assess", "Assess a Situation", ["Situation", "Extra Info"]),
      mkMode("problemSolving", "Problem Solving", ["Problem", "Solution"]),
      mkMode("selfKnowledge", "Self Knowledge", ["Accept", "Release"]),
      mkMode("thisOrThat", "This or That", ["This", "That"]),
    ],
  },
  "3D": {
    label: "3D of thought",
    modes: [
      { key: "timeline", title: "The River's Course", label: "Past, present, future", traditionMode: "single", positions: [{ key: "past", label: "Past" }, { key: "present", label: "Present" }, { key: "future", label: "Future" }] },
      { key: "forces", title: "The Threshold", label: "What blocks, what centers, what guides", traditionMode: "single", positions: [{ key: "blocking", label: "What's blocking" }, { key: "core", label: "Core focus" }, { key: "guiding", label: "What's guiding" }] },
      mkMode("unlabeled", "Unlabeled Reading", ["Card 1", "Card 2", "Card 3"]),
      mkMode("cardOfDay", "Card of the Day", ["Card of the Day", "Lesson", "Gift"]),
      mkMode("weekAhead", "The Week Ahead", ["Personal", "Work", "Love"]),
      mkMode("heart", "Matters of the Heart", ["You", "Them", "Where It's Going"]),
      mkMode("relationshipAdvice", "Relationship Advice", ["Situation", "Lesson", "Advice"]),
      mkMode("yesno", "Yes or No", ["Yes or No", "Pros", "Cons"]),
      mkMode("seekAdvice", "Seek Advice", ["Situation", "Advice", "Outcome"]),
      mkMode("decision", "Make a Decision", ["Problem", "Cause", "Do This"]),
      mkMode("evaluateOptions", "Evaluate Options", ["Option 1", "Option 2", "Advice"]),
      mkMode("assess", "Assess a Situation", ["Situation", "Extra Info", "Advice"]),
      mkMode("problemSolving", "Problem Solving", ["Problem", "Cause", "Solution"]),
      mkMode("selfKnowledge", "Self Knowledge", ["My Power", "My Flaw", "My Passion"]),
      mkMode("findPath", "Find the Path", ["The Illusion", "What Is Real", "My Next Action"]),
      mkMode("perspective", "Gain Perspective", ["Overview", "Problem", "Action"]),
      mkMode("serenity", "Achieve Serenity", ["Cannot Change", "Can Change", "What to Know"]),
      mkMode("balance", "Achieve Balance", ["Mind", "Body", "Soul"]),
    ],
  },
  "4D": {
    label: "4D of thought",
    modes: [
      mkMode("unlabeled", "Unlabeled Reading", ["Card 1", "Card 2", "Card 3", "Card 4"]),
      mkMode("cardOfDay", "Card of the Day", ["Focus", "Action", "Challenge", "Solution"]),
      mkMode("weekAhead", "The Week Ahead", ["Personal", "Work", "Love", "Lesson"]),
      mkMode("timeline", "Past, Present, Future", ["Past", "Present", "Future", "Advice"]),
      mkMode("whatsNext", "What's Next", ["Situation", "Next", "Factors", "Outcome"]),
      mkMode("needToKnow", "What I Need to Know", ["You", "Known", "Unknown", "Action"]),
      mkMode("wantsNeeds", "Wants and Needs", ["Have", "Want", "Need", "Advice"]),
      mkMode("selfKnowledge", "Self Knowledge", ["Physical", "Mental", "Emotional", "Spiritual"]),
    ],
  },
  "7D": {
    label: "7D of thought",
    modes: [
      { key: "star", title: "The Crown of Seven", label: "A core with six around it", traditionMode: "single", positions: [{ key: "core", label: "Core" }, { key: "p1", label: "Past" }, { key: "p2", label: "Present" }, { key: "p3", label: "Future" }, { key: "p4", label: "Challenge" }, { key: "p5", label: "Guidance" }, { key: "p6", label: "Outcome" }] },
      { key: "sides", title: "The Twin Pillars", label: "A core flanked three and three", traditionMode: "single", positions: [{ key: "core", label: "Core" }, { key: "l1", label: "Left 1" }, { key: "l2", label: "Left 2" }, { key: "l3", label: "Left 3" }, { key: "r1", label: "Right 1" }, { key: "r2", label: "Right 2" }, { key: "r3", label: "Right 3" }] },
      { key: "split", title: "Heaven's Three, Earth's Four", label: "Three spiritual, four physical", traditionMode: "perGroup", groups: [{ key: "spiritual", label: "Spiritual (3 cards)", positionKeys: ["s1", "s2", "s3"] }, { key: "physical", label: "Physical (4 cards)", positionKeys: ["b1", "b2", "b3", "b4"] }], positions: [{ key: "s1", label: "Spiritual 1" }, { key: "s2", label: "Spiritual 2" }, { key: "s3", label: "Spiritual 3" }, { key: "b1", label: "Physical 1" }, { key: "b2", label: "Physical 2" }, { key: "b3", label: "Physical 3" }, { key: "b4", label: "Physical 4" }] },
      mkMode("unlabeled", "Unlabeled Reading", ["Card 1", "Card 2", "Card 3", "Card 4", "Card 5", "Card 6", "Card 7"]),
      mkMode("cardOfDay", "Card of the Day", ["Morning", "Midday", "Afternoon", "Evening", "Challenge", "Gift", "Focus"]),
      mkMode("weekAhead", "The Week Ahead", ["Personal", "Work", "Love", "Health", "Challenge", "Opportunity", "Lesson"]),
      mkMode("timeline", "Past, Present, Future", ["Distant Past", "Recent Past", "Present", "Near Future", "Distant Future", "Hopes", "Fears"]),
      mkMode("heart", "Matters of the Heart", ["You", "Them", "Connection", "Past", "Present", "Future", "Advice"]),
      mkMode("relationshipAdvice", "Relationship Advice", ["You", "Them", "Foundation", "Challenge", "Strength", "Lesson", "Advice"]),
      mkMode("yesno", "Yes or No", ["Yes or No", "Why", "Pros", "Cons", "Timing", "Clarifier", "Advice"]),
      mkMode("seekAdvice", "Seek Advice", ["Situation", "Root Cause", "Hidden Factor", "Advice", "Action", "Outcome", "Lesson"]),
      mkMode("decision", "Make a Decision", ["Problem", "Option A", "Option B", "Pros", "Cons", "Guidance", "Outcome"]),
      mkMode("evaluateOptions", "Evaluate Options", ["Option 1", "Option 1 Outcome", "Option 2", "Option 2 Outcome", "Shared Factor", "Advice", "Final Guidance"]),
      mkMode("assess", "Assess a Situation", ["Situation", "Root", "Hidden Factor", "Strength", "Weakness", "Advice", "Outcome"]),
      mkMode("problemSolving", "Problem Solving", ["Problem", "Cause", "Hidden Factor", "Obstacle", "Resource", "Solution", "Outcome"]),
      mkMode("selfKnowledge", "Self Knowledge", ["Spiritual", "Mental", "Emotional", "Physical", "Psychological", "Power", "Path"]),
      mkMode("findPath", "Find the Path", ["The Illusion", "What Is Real", "Obstacle", "Support", "Guidance", "Next Action", "Destination"]),
      mkMode("perspective", "Gain Perspective", ["Overview", "Root", "Blind Spot", "Strength", "Challenge", "Advice", "Action"]),
      mkMode("serenity", "Achieve Serenity", ["Cannot Change", "Can Change", "Root of Unrest", "Support", "Practice", "Reminder", "What to Know"]),
      mkMode("balance", "Achieve Balance", ["Mind", "Body", "Soul", "Work", "Relationships", "Rest", "Center"]),
    ],
  },
  "9D": {
    label: "9D of thought",
    modes: [
      { key: "dimensions", title: "The Nine Realms", label: "Nine planes of your life, one each", traditionMode: "single", positions: [{ key: "spiritual", label: "Spiritual" }, { key: "mental", label: "Mental" }, { key: "emotional", label: "Emotional" }, { key: "physical", label: "Physical" }, { key: "psychological", label: "Psychological" }, { key: "past", label: "Past" }, { key: "present", label: "Present" }, { key: "future", label: "Future" }, { key: "path", label: "Path forward" }] },
      { key: "grid", title: "The Nine Chambers", label: "A three-by-three field", traditionMode: "single", positions: [{ key: "t1", label: "Top left" }, { key: "t2", label: "Top center" }, { key: "t3", label: "Top right" }, { key: "m1", label: "Mid left" }, { key: "m2", label: "Mid center" }, { key: "m3", label: "Mid right" }, { key: "b1", label: "Bottom left" }, { key: "b2", label: "Bottom center" }, { key: "b3", label: "Bottom right" }] },
      mkMode("unlabeled", "Unlabeled Reading", ["Card 1", "Card 2", "Card 3", "Card 4", "Card 5", "Card 6", "Card 7", "Card 8", "Card 9"]),
      mkMode("cardOfDay", "Card of the Day", ["Dawn", "Morning", "Midday", "Afternoon", "Dusk", "Evening", "Night", "Challenge", "Gift"]),
      mkMode("weekAhead", "The Week Ahead", ["Personal", "Work", "Love", "Health", "Money", "Challenge", "Opportunity", "Lesson", "Outlook"]),
      mkMode("timeline", "Past, Present, Future", ["Far Past", "Past", "Recent Past", "Present", "Immediate Future", "Near Future", "Far Future", "Hopes", "Fears"]),
      mkMode("heart", "Matters of the Heart", ["You", "Them", "Connection", "Past", "Present", "Future", "Challenge", "Gift", "Advice"]),
      mkMode("relationshipAdvice", "Relationship Advice", ["You", "Them", "Foundation", "Communication", "Challenge", "Strength", "Lesson", "Growth", "Advice"]),
      mkMode("yesno", "Yes or No", ["Yes or No", "Why", "Pros", "Cons", "Hidden Factor", "Timing", "Risk", "Clarifier", "Advice"]),
      mkMode("seekAdvice", "Seek Advice", ["Situation", "Root Cause", "Hidden Factor", "Emotion", "Mind", "Body", "Advice", "Action", "Outcome"]),
      mkMode("decision", "Make a Decision", ["Problem", "Option A", "Option A Outcome", "Option B", "Option B Outcome", "Values", "Fear", "Guidance", "Final Word"]),
      mkMode("evaluateOptions", "Evaluate Options", ["Option 1", "Option 1 Outcome", "Option 2", "Option 2 Outcome", "Option 3", "Option 3 Outcome", "Shared Factor", "Heart's Truth", "Advice"]),
      mkMode("assess", "Assess a Situation", ["Situation", "Root", "Hidden Factor", "Strength", "Weakness", "Opportunity", "Threat", "Advice", "Outcome"]),
      mkMode("problemSolving", "Problem Solving", ["Problem", "Root Cause", "Hidden Factor", "Obstacle", "Resource", "Ally", "Action", "Solution", "Outcome"]),
      mkMode("findPath", "Find the Path", ["The Illusion", "What Is Real", "Obstacle", "Support", "Ally", "Guidance", "Risk", "Next Action", "Destination"]),
      mkMode("perspective", "Gain Perspective", ["Overview", "Root", "Blind Spot", "Strength", "Weakness", "Challenge", "Opportunity", "Advice", "Action"]),
      mkMode("serenity", "Achieve Serenity", ["Cannot Change", "Can Change", "Root of Unrest", "Support", "Practice", "Obstacle", "Reminder", "Grace", "What to Know"]),
      mkMode("balance", "Achieve Balance", ["Mind", "Body", "Soul", "Work", "Relationships", "Rest", "Play", "Purpose", "Center"]),
    ],
  },
};

function drawCard(tradition, reversalsOn) {
  if (tradition === "tarot") {
    const name = TAROT_DECK[Math.floor(Math.random() * TAROT_DECK.length)];
    return { tradition, name, reversed: reversalsOn && Math.random() < 0.5 };
  }
  if (tradition === "ifa256") {
    const odu = ODU_MEJI[Math.floor(Math.random() * ODU_MEJI.length)];
    return { tradition, name: odu.name, reversed: reversalsOn && false }; // no reversals for Ifa
  }
  // ifa4096
  const pool = [...ODU_MEJI, ...ODU_META];
  const odu = pool[Math.floor(Math.random() * pool.length)];
  return { tradition, name: odu.name, reversed: false };
}

function jargonLine(profile) {
  return profile.jargon === "esoteric" ? "The seeker is comfortable with traditional esoteric and divinatory vocabulary — you may use it where it fits." : "Never use esoteric or occult jargon, invented mystical terminology, or words like \"energies\" or \"the universe wants\". Speak in plain, everyday language.";
}
function verbosityLine(profile) {
  return profile.verbosity === "brief" ? "Keep it tight: only the critical points, no padding, a handful of short sentences." : "Give a fuller reading, still plain-spoken, with enough detail to feel complete.";
}
function orientationVoice(key) { return ORIENTATIONS.find((o) => o.key === key)?.voice || "balanced"; }

function buildSystemPrompt(profile) {
  const planeLabel = ORIENTATIONS.find((o) => o.key === profile.plane)?.label || "unspecified";
  const birth = profile.dob || profile.tob || profile.pob
    ? `Known blueprint details — date of birth: ${profile.dob || "not given"}, time of birth: ${profile.tob || "not given"}, place of birth: ${profile.pob || "not given"}.`
    : "No birth details were given, so speak in general terms about their blueprint rather than inventing specifics.";
  const numerology = profile.numerologyReduced ? `Name expression number: ${profile.numerologyReduced} (raw letter sum ${profile.numerologySum}).` : "";
  const lifePath = profile.lifePath ? `Life path number: ${profile.lifePath}.` : "";
  const zodiac = profile.chineseZodiac ? `Chinese zodiac: ${profile.chineseZodiac}.` : "";
  const moon = getMoonPhase();
  const moonLine = `Tonight's sky: ${moon.name} (${moon.illumination}% lit).`;
  const relay = profile.relayMode && profile.relayForName
    ? `\nImportant: ${profile.name || "the seeker"} is not asking for themselves right now — they are consulting on behalf of ${profile.relayForName}, someone who isn't using Ifatarot. Speak about ${profile.relayForName} in the third person, in language ${profile.name || "the seeker"} can easily relay to them afterward. Don't address ${profile.relayForName} directly.`
    : "";
  const bo = profile.birthOdu;
  let birthOduLine = "";
  if (bo && bo.name) {
    const parts = [`The seeker's birth odu is ${bo.name} — this is their own recorded teaching, entered by them or their babalawo, not something you determined. Treat it as ground truth.`];
    if (bo.strengths?.length) parts.push(`Strengths: ${bo.strengths.join(", ")}.`);
    if (bo.taboos?.length) parts.push(`Taboos (eewo) — never suggest anything that conflicts with these: ${bo.taboos.join(", ")}.`);
    if (bo.foodsToEat?.length) parts.push(`Foods favored: ${bo.foodsToEat.join(", ")}.`);
    if (bo.foodsToAvoid?.length) parts.push(`Foods to avoid: ${bo.foodsToAvoid.join(", ")}.`);
    if (bo.colorsToWear?.length) parts.push(`Colors to favor: ${bo.colorsToWear.join(", ")}.`);
    if (bo.colorsToAvoid?.length) parts.push(`Colors to avoid: ${bo.colorsToAvoid.join(", ")}.`);
    if (bo.bestDays?.length) parts.push(`Best days: ${bo.bestDays.join(", ")}.`);
    if (bo.worstDays?.length) parts.push(`Worst days: ${bo.worstDays.join(", ")}.`);
    if (bo.friendlyOdus?.length) parts.push(`Friendly odus: ${bo.friendlyOdus.join(", ")}.`);
    if (bo.odusToAvoid?.length) parts.push(`Odus to avoid: ${bo.odusToAvoid.join(", ")}.`);
    if (bo.frictionOdus?.length) parts.push(`Odus that cause friction: ${bo.frictionOdus.join(", ")}.`);
    if (bo.easeOdus?.length) parts.push(`Odus that bring ease: ${bo.easeOdus.join(", ")}.`);
    if (bo.animalsToKeep?.length) parts.push(`Animals favorable to keep: ${bo.animalsToKeep.join(", ")}.`);
    if (bo.animalsToAvoid?.length) parts.push(`Animals to avoid keeping: ${bo.animalsToAvoid.join(", ")}.`);
    if (bo.rituals?.length) parts.push(`Rituals recorded: ${bo.rituals.join(", ")}.`);
    if (bo.notes) parts.push(`Additional notes: ${bo.notes}`);
    parts.push("Draw on this when genuinely relevant — especially taboos, if the question touches on them — never as a recited checklist.");
    birthOduLine = "\n" + parts.join(" ");
  }
  return `You are ${profile.agentName || "the cosmic strategist"}, a personal divination guide inside an app called Ifatarot, which blends Ifa divination and Tarot. You are speaking to ${profile.name || "the seeker"}, whose dominant plane is ${planeLabel} and whose personal orientation is ${profile.element || "unspecified"}. Your own orientation as their agent is ${profile.agentElement || "unspecified"} — let it flavor your voice (${orientationVoice(profile.agentElement)}) without ever naming it outright.

${birth} ${numerology} ${lifePath} ${zodiac}
You may reference these blueprint numbers when genuinely relevant to the question — never recite them as a checklist.
${moonLine} You may mention this if it genuinely fits — a Full Moon culminating, a New Moon starting fresh — but never force it in.
${relay}${birthOduLine}
${jargonLine(profile)} ${verbosityLine(profile)}

Strict boundaries: only speak to the cards or odu actually drawn, the seeker's own question, and Ifatarot itself. Never introduce generic self-help advice, motivational filler, or anything unrelated to what was drawn. Do not hedge with "some believe" — speak with grounded confidence, not fortune-teller theatrics. If a related card or odu from the same tradition is genuinely worth exploring next, you may name it once, briefly, but only if it truly serves the question. Always end with one concrete, practical next step. Sign off in your own voice as their agent, never as an AI assistant.`;
}
function buildMultiPrompt(dimKey, modeKey, dimLabel, modeTitle, resolved, question, profile) {
  // Each position has one Ifa card (spirit). The physical Tarot card is on resolved[0].physicalCard.
  const physicalCard = resolved[0] && resolved[0].physicalCard;
  const lines = resolved.map((p) => `${p.label}: ${p.cards.map((c) => `${c.name}${c.reversed ? " (reversed)" : ""} [${c.tradition === "ifa4096" ? "Odu Meta" : "Odu Meji"} — Spiritual]`).join(" and ")}`);
  const positionCount = resolved.length;
  const lengthGuidance = positionCount <= 3
    ? "Keep the whole reading comfortably concise — this is a short spread, it shouldn't run long."
    : positionCount <= 7
    ? "This has several positions — keep each one to about 2 short sentences so the whole reading stays readable and finishes cleanly, not 3-4."
    : "This has many positions — keep each one to a single tight sentence. Brevity per position matters more than depth here; the synthesis at the end can carry more weight.";
  let extra = "";
  if (dimKey === "2D" && modeKey === "duality") extra = "\n\nThis is a literal light-versus-dark reading: treat the Agreeable side as bright, open, affirming energy, and the Disagreeable side as its dark, resistant counterpart. Let that light/dark contrast actively shape how you interpret both cards, not just their positions.";
  if (dimKey === "2D" && modeKey === "polarity") extra = "\n\nThis is a spiritual-versus-physical reading: the Spiritual position carries a green, higher, sky-facing energy, and the Physical position carries a red, rooted, earth-facing energy. Let that elemental contrast actively shape your interpretation of both cards.";
  const oduConnections = findOduConnections(resolved);
  if (oduConnections.length) extra += `\n\nOdu connections detected across this spread — these shared roots are meaningful, not coincidence, weave them into your reading where it serves the question: ${oduConnections.join(" ")}`;
  const bo = profile && profile.birthOdu;
  if (bo && bo.name) {
    const oduNames = resolved.flatMap((p) => p.cards.filter((c) => c.tradition === "ifa").map((c) => c.name));
    const relationNotes = [];
    oduNames.forEach((name) => {
      if (bo.friendlyOdus?.some((x) => normOdu(x) === normOdu(name))) relationNotes.push(`${name} is on the seeker's own list of friendly odus to their birth odu (${bo.name}).`);
      if (bo.odusToAvoid?.some((x) => normOdu(x) === normOdu(name))) relationNotes.push(`${name} is on the seeker's own list of odus to avoid, relative to their birth odu (${bo.name}) — flag this plainly.`);
      if (bo.frictionOdus?.some((x) => normOdu(x) === normOdu(name))) relationNotes.push(`${name} is one the seeker has recorded as causing friction with their birth odu (${bo.name}).`);
      if (bo.easeOdus?.some((x) => normOdu(x) === normOdu(name))) relationNotes.push(`${name} is one the seeker has recorded as bringing ease with their birth odu (${bo.name}).`);
    });
    if (relationNotes.length) extra += `\n\nBirth odu relationships in this draw (from the seeker's own recorded teaching): ${relationNotes.join(" ")}`;
  }
  const tarotGrounding = resolved.flatMap((p) => p.cards.filter((c) => c.tradition === "tarot").map((c) => {
    const m = tarotMeaning(c.name);
    return `${c.name}${c.reversed ? " (reversed)" : ""} — ${c.reversed ? m.reversed : m.upright}`;
  }));
  if (tarotGrounding.length) extra += `\n\nThis app's own grounding for the Tarot cards drawn (treat as your anchor, not a script to recite word-for-word):\n${tarotGrounding.join("\n")}`;
  return `This is a ${dimLabel} reading, laid out as "${modeTitle}". Positions and what was drawn:\n${lines.join("\n")}\n\nThe seeker's question: "${question}"${extra}\n\nAddress each position by its label, in order, then close with a short synthesis and one concrete next step. ${lengthGuidance}`;
}

// When there's no connection, a tailored AI reading isn't possible — but the card's
// own written meaning already lives locally, so offer that instead of nothing.
function buildOfflineFallback(positions) {
  const lines = positions.flatMap((p) => p.cards.map((c) => {
    if (c.tradition === "tarot") {
      const m = tarotMeaning(c.name);
      return `${p.label} — ${c.name}${c.reversed ? " (reversed)" : ""}: ${c.reversed ? m.reversed : m.upright}`;
    }
    return `${p.label} — ${c.name}${c.reversed ? " (reversed)" : ""}: full teaching for this odu isn't written yet, so there's no offline meaning to show here.`;
  }));
  return `You're offline, so here's the card's own written meaning rather than a reading tailored to your question — reconnect for that. No consultation was used.\n\n${lines.join("\n\n")}`;
}
async function callAgentMessagesFull(system, messages, opts) {
  const maxTokens = (opts && opts.maxTokens) || 1200;
  const res = await fetch("/api/generate", {
    method: "POST", headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
    body: JSON.stringify({ max_tokens: maxTokens, system, messages, internal: !!(opts && opts.internal), meta: (opts && opts.meta) || undefined }),
  });
  const data = await res.json();
  if (res.status === 429) throw new Error(data.error || "Rate limited");
  if (data.error) throw new Error(data.error);
  const text = (data.content || []).map((b) => b.text || "").join("\n").trim();
  return { text, truncated: data.stop_reason === "max_tokens" };
}
async function callAgentMessages(system, messages, opts) {
  const { text } = await callAgentMessagesFull(system, messages, opts);
  return text;
}
async function callAgent(system, user, opts) { return callAgentMessages(system, [{ role: "user", content: user }], opts); }

/* how many tokens a reading needs scales with how many cards it has to address —
   a 9D spread cut short mid-sentence is the "gets cut off" bug; this fixes the cause */
function maxTokensForReading(positionCount, verbosity) {
  const perPosition = verbosity === "brief" ? 180 : 320;
  return Math.max(1000, Math.min(8192, 700 + positionCount * perPosition));
}

/* Simulates a live typewriter reveal of text we already have in hand. This gives the
   same "it's arriving in real time" feel as true streaming, without depending on a
   real SSE connection surviving every environment this app runs in — that fragility
   was the actual cause of readings failing outright. */
function revealProgressively(fullText, onDelta) {
  return new Promise((resolve) => {
    if (!fullText) { resolve(); return; }
    let i = 0;
    const chunk = Math.max(3, Math.round(fullText.length / 60));
    function tick() {
      i += chunk;
      onDelta(fullText.slice(0, i));
      if (i < fullText.length) setTimeout(tick, 14);
      else resolve();
    }
    tick();
  });
}

/* after a reading or a strategist reply, quietly checks whether something durable
   about the seeker surfaced, and if so which of the five orientations it belongs to */
async function extractVesselInsight(exchangeSummary) {
  const system = `You read one exchange from a divination app and decide what it revealed about the seeker (not the cards — the person). There are two kinds of thing worth capturing:
KNOWN — a durable fact, pattern, or truth about who they already are or what they're carrying.
POWER — a strength, quality, or way of being they are visibly reaching for but haven't fully claimed yet; something the reading or conversation is pointing them toward becoming.
Most exchanges reveal neither — only flag something genuinely durable, not small talk.
Reply with ONLY one line, in one of these exact forms:
NONE
KNOWN:AREA:insight under 12 words, about the seeker directly
POWER:AREA:Short Power Name|one line under 14 words on what claiming it would look like
AREA must be exactly one of: spiritual, mental, emotional, physical, psychological.`;
  try {
    const text = await callAgent(system, exchangeSummary, { internal: true });
    const clean = text.trim();
    if (clean.toUpperCase().startsWith("NONE")) return null;
    const knownMatch = clean.match(/^KNOWN\s*:\s*(spiritual|mental|emotional|physical|psychological)\s*:\s*(.+)$/i);
    if (knownMatch) return { kind: "known", area: knownMatch[1].toLowerCase(), text: knownMatch[2].trim() };
    const powerMatch = clean.match(/^POWER\s*:\s*(spiritual|mental|emotional|physical|psychological)\s*:\s*([^|]+)\|(.+)$/i);
    if (powerMatch) return { kind: "power", area: powerMatch[1].toLowerCase(), name: powerMatch[2].trim(), guidance: powerMatch[3].trim() };
    return null;
  } catch (e) { return null; }
}

/* ---------- UI atoms ---------- */
function Field({ label, children }) { return <div style={{ marginBottom: 20 }}><div style={{ fontSize: 13, color: SAGE, marginBottom: 8 }}>{label}</div>{children}</div>; }
function TextInput(props) { return <input {...props} style={{ width: "100%", boxSizing: "border-box", background: "rgba(243,234,216,0.05)", border: `1px solid ${HAIRLINE}`, borderRadius: 6, padding: "12px 14px", color: IVORY, fontSize: 15, fontFamily: "Karla, sans-serif", outline: "none", ...props.style }} />; }
function PillButton({ active, onClick, children }) { return <button onClick={onClick} style={{ padding: "9px 16px", borderRadius: 999, fontSize: 13.5, cursor: "pointer", border: `1px solid ${active ? GOLD : HAIRLINE}`, background: active ? "rgba(217,169,74,0.14)" : "transparent", color: active ? GOLD : IVORY, fontFamily: "Karla, sans-serif" }}>{children}</button>; }
function EditableList({ label, items, onAdd, onRemove }) {
  const [val, setVal] = useState("");
  const commit = () => { if (val.trim()) { onAdd(val.trim()); setVal(""); } };
  return (
    <Field label={label}>
      {items.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {items.map((item, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(217,169,74,0.08)", border: `1px solid ${HAIRLINE}`, borderRadius: 999, padding: "4px 10px", fontSize: 12, color: IVORY }}>
              {item}
              <button onClick={() => onRemove(i)} style={{ background: "none", border: "none", color: SAGE, cursor: "pointer", padding: 0, fontSize: 13, lineHeight: 1 }}>&times;</button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 6 }}>
        <TextInput value={val} onChange={(e) => setVal(e.target.value)} placeholder={`Add...`} onKeyDown={(e) => e.key === "Enter" && commit()} />
        <GhostButton onClick={commit}>Add</GhostButton>
      </div>
    </Field>
  );
}
function PrimaryButton({ onClick, children, disabled, style }) { return <button onClick={onClick} disabled={disabled} style={{ width: "100%", padding: "15px 20px", borderRadius: 8, border: "none", background: disabled ? "rgba(196,101,46,0.35)" : CAMWOOD, color: IVORY, fontSize: 15, fontFamily: "Karla, sans-serif", fontWeight: 600, cursor: disabled ? "default" : "pointer", ...style }}>{children}</button>; }
function GhostButton({ onClick, children, style }) { return <button onClick={onClick} style={{ padding: "12px 18px", borderRadius: 8, border: `1px solid ${HAIRLINE}`, background: "transparent", color: IVORY, fontSize: 14, fontFamily: "Karla, sans-serif", cursor: "pointer", ...style }}>{children}</button>; }
function Header({ title, onBack }) { return <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>{onBack && <button onClick={onBack} style={{ background: "none", border: "none", color: SAGE, fontSize: 20, cursor: "pointer", padding: 0 }}>&larr;</button>}<h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 500, fontSize: 22, color: IVORY, margin: 0 }}>{title}</h1></div>; }
function BottomNav({ screen, go }) {
  const items = [["home", "Home"], ["strategist", "Strategist"]];
  return <div style={{ display: "flex", borderTop: `1px solid ${HAIRLINE}`, marginTop: 32, paddingTop: 14, gap: 8 }}>{items.map(([key, label]) => <button key={key} onClick={() => go(key)} style={{ flex: 1, background: "none", border: "none", color: screen === key ? GOLD : SAGE, fontSize: 12.5, fontFamily: "Karla, sans-serif", cursor: "pointer", padding: "6px 0" }}>{label}</button>)}</div>;
}

/* ---------- the juicy star ---------- */
function StarSelector({ value, onChange, decorative, size }) {
  const cx = 150, cy = 150, outer = 116, inner = 46;
  const bigPts = [];
  for (let i = 0; i < 6; i++) { const a = (-90 + i * 60) * Math.PI / 180; const r = i % 2 === 0 ? outer : inner * 0.7; bigPts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`); }
  const sparkles = [[60, 60], [235, 50], [250, 220], [45, 210], [150, 20]];
  return (
    <svg viewBox="0 0 300 300" style={{ width: size || "100%", maxWidth: size || 320, display: "block", margin: "0 auto" }}>
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.35" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="starFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.5" />
          <stop offset="100%" stopColor={CAMWOOD} stopOpacity="0.25" />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={130} fill="url(#glow)" />
      <polygon points={bigPts.join(" ")} fill="url(#starFill)" stroke={GOLD} strokeWidth="1.2" opacity="0.85" />
      {sparkles.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 2 === 0 ? 1.6 : 1} fill={IVORY} opacity="0.6"><animate attributeName="opacity" values="0.2;0.8;0.2" dur={`${2.5 + i}s`} repeatCount="indefinite" /></circle>)}
      {!decorative && ORIENTATIONS.map((o) => {
        const rad = (o.angle * Math.PI) / 180;
        const x = cx + outer * Math.cos(rad), y = cy + outer * Math.sin(rad);
        const selected = value === o.key;
        return (
          <g key={o.key} onClick={() => onChange(o.key)} style={{ cursor: "pointer" }}>
            {selected && <circle cx={x} cy={y} r={34} fill="none" stroke={GOLD} strokeWidth="1"><animate attributeName="r" values="30;40;30" dur="2s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.8;0.1;0.8" dur="2s" repeatCount="indefinite" /></circle>}
            <circle cx={x} cy={y} r={32} fill={selected ? "rgba(217,169,74,0.25)" : "rgba(243,234,216,0.05)"} stroke={selected ? GOLD : HAIRLINE} strokeWidth={selected ? 2 : 1} />
            <text x={x} y={y + 4} textAnchor="middle" fontSize="11.5" fontFamily="Karla, sans-serif" fontWeight={selected ? 700 : 400} fill={selected ? GOLD : IVORY}>{o.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- placeholder card art ---------- */
function TarotArt({ name, size }) {
  const color = tarotColor(name); const isMajor = MAJORS.some((m) => m[0] === name);
  return <svg viewBox="0 0 100 140" style={{ width: size || 64, height: (size || 64) * 1.4, display: "block" }}><rect x="1" y="1" width="98" height="138" rx="6" fill={INDIGO} stroke={color} strokeWidth="2" />{isMajor ? <polygon points="50,20 58,45 84,45 63,60 71,86 50,71 29,86 37,60 16,45 42,45" fill={color} opacity="0.85" /> : <circle cx="50" cy="52" r="22" fill="none" stroke={color} strokeWidth="4" />}<text x="50" y="122" textAnchor="middle" fontSize="9" fontFamily="Karla, sans-serif" fill={IVORY}>{name.length > 16 ? name.slice(0, 15) + "…" : name}</text></svg>;
}
function OduArt({ name, size }) {
  const entry = oduEntry(name);
  const isMeta = entry && entry.tier === "meta";
  // Meji: 2 columns (legs a,b). Meta: 3 columns (legs a,b from Meji base + principal c).
  const legs = isMeta ? [entry.a, entry.b, entry.c] : (entry ? [entry.a, entry.b] : [0,0]);
  const n = legs.length;
  const colW = 18, gap = isMeta ? 4 : 7;
  const totalW = n * colW + (n-1) * gap;
  const x0 = (100 - totalW) / 2;
  const divX = isMeta ? x0 + 2*(colW+gap) - 2 : null;
  const fs = name.length > 24 ? 5.4 : name.length > 18 ? 6.4 : name.length > 12 ? 7.4 : 8.5;
  return (
    <svg viewBox="0 0 100 140" style={{ width: size||64, height:(size||64)*1.4, display:"block" }}>
      <rect x="1" y="1" width="98" height="138" rx="6" fill={INK} stroke={isMeta?CAMWOOD:GOLD} strokeWidth={isMeta?"2.5":"2"}/>
      {divX && <line x1={divX} y1="14" x2={divX} y2="108" stroke={GOLD} strokeWidth="0.7" strokeDasharray="3,2" opacity="0.5"/>}
      {legs.map((r,col) => {
        const marks = oduMarks(r);
        const cx = x0 + col*(colW+gap);
        const color = (isMeta && col===2) ? CAMWOOD : GOLD;
        return (
          <g key={col}>
            {marks.map((bit,row) => bit
              ? <g key={row}><rect x={cx} y={20+row*16} width="7" height="5" fill={color}/><rect x={cx+11} y={20+row*16} width="7" height="5" fill={color}/></g>
              : <rect key={row} x={cx+4} y={20+row*16} width="9" height="5" fill={color}/>
            )}
          </g>
        );
      })}
      <text x="50" y="128" textAnchor="middle" fontSize={fs} fontFamily="Karla, sans-serif" fill={IVORY}>{name}</text>
    </svg>
  );
}

function CardArt({ tradition, name, size }) { return tradition === "tarot" ? <TarotArt name={name} size={size} /> : <OduArt name={name} size={size} />; }

/* ---------- rolling credits (no midnight reset — regenerate over time) ---------- */
const CREDIT_MAX = 8;
const CREDIT_REFILL_HOURS = 3;
function computeCredits(profile) {
  const now = new Date();
  const last = profile.lastCreditRefillAt ? new Date(profile.lastCreditRefillAt) : now;
  const elapsedHours = (now - last) / 3600000;
  const toAdd = Math.floor(elapsedHours / CREDIT_REFILL_HOURS);
  const startCredits = profile.credits ?? CREDIT_MAX;
  const credits = Math.min(CREDIT_MAX, startCredits + Math.max(0, toAdd));
  const newLast = toAdd > 0 ? new Date(last.getTime() + toAdd * CREDIT_REFILL_HOURS * 3600000) : last;
  const hoursUntilNext = credits >= CREDIT_MAX ? null : CREDIT_REFILL_HOURS - (now - newLast) / 3600000;
  return { credits, lastCreditRefillAt: newLast.toISOString(), hoursUntilNext };
}
function formatWait(hours) {
  if (hours == null) return "";
  const totalMin = Math.max(1, Math.round(hours * 60));
  const h = Math.floor(totalMin / 60), m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/* ---------- app ---------- */
const emptyBirthOdu = { name: "", strengths: [], taboos: [], foodsToEat: [], foodsToAvoid: [], colorsToWear: [], colorsToAvoid: [], bestDays: [], worstDays: [], friendlyOdus: [], odusToAvoid: [], frictionOdus: [], easeOdus: [], animalsToKeep: [], animalsToAvoid: [], rituals: [], notes: "", lastUpdated: null };
const emptyProfile = { name: "", agentName: "", plane: "", element: "", agentElement: "", dob: "", tob: "", pob: "", jargon: "simple", verbosity: "warm", tarotReversals: true, ifaReversalsExperimental: false, residentDimension: null, credits: CREDIT_MAX, lastCreditRefillAt: null, relayMode: false, relayForName: "", vesselInsights: {}, vesselPowers: {}, restHourEnabled: false, restHourStart: "", readingMode: "speed", birthOdu: emptyBirthOdu, dailyOutfit: null };

function isStrategistResting(profile) {
  if (!profile.restHourEnabled || !profile.restHourStart) return { resting: false };
  const [h, m] = profile.restHourStart.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return { resting: false };
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const startMin = h * 60 + m;
  const endMin = (startMin + 60) % 1440;
  const resting = startMin < endMin ? (nowMin >= startMin && nowMin < endMin) : (nowMin >= startMin || nowMin < endMin);
  if (!resting) return { resting: false };
  const untilMin = (endMin - nowMin + 1440) % 1440 || 60;
  return { resting: true, untilMin };
}
function formatMinutes(totalMin) {
  const h = Math.floor(totalMin / 60), m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function Ifatarot() {
  const [screen, setScreen] = useState("home");
  const [onboarded, setOnboarded] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [showInstallCard, setShowInstallCard] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [profile, setProfile] = useState(emptyProfile);
  const [draftProfile, setDraftProfile] = useState(emptyProfile);
  const [rootStep, setRootStep] = useState(null); // null = show form if birthOdu.name set, else ask; "ask" | "manual"
  const [draftBirthOdu, setDraftBirthOdu] = useState(emptyBirthOdu);
  const [outfitLoading, setOutfitLoading] = useState(false);
  const [outfitError, setOutfitError] = useState(null);
  const [obStep, setObStep] = useState(0);

  const [dimKey, setDimKey] = useState(null);
  const [mode, setMode] = useState(null);
  const [assignment, setAssignment] = useState({});
  const [question, setQuestion] = useState("");
  const [listening, setListening] = useState(false);
  const [resolved, setResolved] = useState(null);
  const [reading, setReading] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [readingFailed, setReadingFailed] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [questionSuggestions, setQuestionSuggestions] = useState(() => pickRandom(SUGGESTED_QUESTIONS, 6));
  const [homeSuggestions, setHomeSuggestions] = useState(() => pickRandom(SUGGESTED_QUESTIONS, 3));
  const [showVibe, setShowVibe] = useState(false);
  const [dimensionNotes, setDimensionNotes] = useState([]);

  const [libraryTradition, setLibraryTradition] = useState(null);
  const [libraryOduGroup, setLibraryOduGroup] = useState("all");
  const [cardDetail, setCardDetail] = useState(null);
  const [cardDetailBack, setCardDetailBack] = useState("library");

  const [strategistLog, setStrategistLog] = useState([]);
  const [strategistInput, setStrategistInput] = useState("");
  const [strategistLoading, setStrategistLoading] = useState(false);
  const [strategistSuggestion, setStrategistSuggestion] = useState(null);

  const [notesList, setNotesList] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [residentMsg, setResidentMsg] = useState("");

  const [events, setEvents] = useState([]);
  const [adminInput, setAdminInput] = useState("");
  const [adminStats, setAdminStats] = useState(null);
  const [isAdminDevice, setIsAdminDevice] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recogRef = useRef(null);
  const timerRef = useRef(null);
  const baseQuestionRef = useRef("");
  const finalTranscriptRef = useRef("");
  const [viaResident, setViaResident] = useState(false);
  const [attachNoteId, setAttachNoteId] = useState(null);
  const [noteChatInput, setNoteChatInput] = useState("");
  const [noteChatLoading, setNoteChatLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await safeGet("ifatarot:profile");
      if (p) {
        let parsed = { ...emptyProfile, ...JSON.parse(p) };
        const c = computeCredits(parsed);
        parsed = { ...parsed, credits: c.credits, lastCreditRefillAt: c.lastCreditRefillAt };
        setProfile(parsed); setDraftProfile(parsed); setOnboarded(true);
        try { await window.storage.set("ifatarot:profile", JSON.stringify(parsed)); } catch (e) {}
      }
      const admin = await safeGet("ifatarot:is-admin");
      if (admin === "1") setIsAdminDevice(true);

      // Resume an in-progress or just-finished reading if the app got closed
      // mid-flow — otherwise leaving the app mid-reading loses it entirely.
      const s = await safeGet("ifatarot:session");
      if (s) {
        try {
          const session = JSON.parse(s);
          const isRecent = Date.now() - (session.savedAt || 0) < 24 * 3600000;
          const dc = session.dimKey ? DIMENSIONS[session.dimKey] : null;
          const restoredMode = dc && session.modeKey ? dc.modes.find((m) => m.key === session.modeKey) : null;
          if (isRecent && restoredMode) {
            setDimKey(session.dimKey);
            setMode(restoredMode);
            setAssignment(session.assignment || {});
            setQuestion(session.question || "");
            setAttachNoteId(session.attachNoteId || null);
            if (session.reading && session.resolved) {
              // a completed reading they hadn't saved yet — the highest-value thing to not lose
              setResolved(session.resolved);
              setReading(session.reading);
              setScreen("dim-reading");
            } else {
              // mid-setup, or mid-shuffle-animation which can't itself be resumed —
              // land back on the question screen with everything they'd already entered intact
              setScreen("dim-question");
            }
          }
          if (Array.isArray(session.strategistLog) && session.strategistLog.length) setStrategistLog(session.strategistLog);
        } catch (e) {}
      }
    })();

    const standalone = window.matchMedia && window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    setIsStandalone(!!standalone);
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);
    const onBeforeInstall = (e) => { e.preventDefault(); setInstallPromptEvent(e); };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    (async () => {
      const dismissed = await safeGet("ifatarot:install-dismissed");
      if (!dismissed && !standalone) setShowInstallCard(true);
    })();
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  async function clearSession() { try { await window.storage.delete("ifatarot:session"); } catch (e) {} }

  // Debounced autosave of whatever reading/conversation is currently in progress,
  // so closing or backgrounding the app mid-flow doesn't wipe it out.
  useEffect(() => {
    const hasSomethingToResume = dimKey || question.trim() || resolved || strategistLog.length > 0;
    if (!hasSomethingToResume) return;
    const timer = setTimeout(() => {
      const session = { screen, dimKey, modeKey: mode ? mode.key : null, assignment, question, resolved, reading, attachNoteId, strategistLog, savedAt: Date.now() };
      window.storage.set("ifatarot:session", JSON.stringify(session)).catch(() => {});
    }, 600);
    return () => clearTimeout(timer);
  }, [screen, dimKey, mode, assignment, question, resolved, reading, attachNoteId, strategistLog]);

  function openTheRoot() {
    const bo = profile.birthOdu && profile.birthOdu.name ? profile.birthOdu : emptyBirthOdu;
    setDraftBirthOdu(bo);
    setRootStep(bo.name ? null : "ask");
    setScreen("the-root");
  }
  function drawPlaceholderOdu() {
    const odu = ODU_MEJI[Math.floor(Math.random() * ODU_MEJI.length)];
    setDraftBirthOdu({ ...emptyBirthOdu, name: odu.name });
    setRootStep(null);
  }
  function birthOduListAdd(field, value) { setDraftBirthOdu((d) => ({ ...d, [field]: [...(d[field] || []), value] })); }
  function birthOduListRemove(field, i) { setDraftBirthOdu((d) => ({ ...d, [field]: d[field].filter((_, idx) => idx !== i) })); }
  async function saveBirthOdu() {
    const updated = { ...profile, birthOdu: { ...draftBirthOdu, lastUpdated: new Date().toISOString() } };
    setProfile(updated); setDraftProfile(updated);
    try { await window.storage.set("ifatarot:profile", JSON.stringify(updated)); } catch (e) {}
    go("home");
  }

  async function revealTodaysOutfit(force) {
    const today = new Date().toISOString().slice(0, 10);
    if (!force && profile.dailyOutfit && profile.dailyOutfit.date === today) return;
    if (!strategistGate() || !creditGate()) return;
    setOutfitLoading(true); setOutfitError(null);
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setOutfitError("You're offline — today's outfit needs a connection. No consultation was used.");
      setOutfitLoading(false);
      return;
    }
    try {
      const tradition = Math.random() < 0.5 ? "tarot" : "ifa";
      const card = drawCard(tradition, tradition === "tarot" ? profile.tarotReversals : profile.ifaReversalsExperimental);
      const bo = profile.birthOdu;
      const colorHint = bo && bo.colorsToWear?.length ? ` Their birth odu's colors to favor: ${bo.colorsToWear.join(", ")}.${bo.colorsToAvoid?.length ? ` Colors to avoid: ${bo.colorsToAvoid.join(", ")}.` : ""}` : "";
      const system = buildSystemPrompt(profile);
      const user = `Today's card is ${card.name}${card.reversed ? " (reversed)" : ""} [${card.tradition === "tarot" ? "Tarot" : "Ifa"}]. Based on what this card represents, tell the seeker what to wear today — colors, textures, overall vibe (bold vs. quiet, structured vs. flowing) — and one concrete styling detail that channels the card. Practical and wearable, not abstract.${colorHint} Two or three sentences, plus the outfit note.`;
      const { text } = await callAgentMessagesFull(system, [{ role: "user", content: user }], { maxTokens: 500, meta: { type: "reading", dimension: "outfit", cardNames: [{ tradition: card.tradition, name: card.name }], traditions: [card.tradition] } });
      if (!text || !text.trim()) { setOutfitError("Nothing came through — no consultation was used. Try again in a moment."); setOutfitLoading(false); return; }
      const entry = { date: today, card, advice: text };
      const updated = { ...profile, dailyOutfit: entry };
      setProfile(updated); setDraftProfile(updated);
      try { await window.storage.set("ifatarot:profile", JSON.stringify(updated)); } catch (e) {}
      await consumeCredit();
      pushEvent("reading", { dimension: "outfit", traditions: [card.tradition], cardNames: [{ tradition: card.tradition, name: card.name }] });
    } catch (e) {
      const raw = e && e.message ? e.message : "";
      const resolved = await describeGenerationError(raw);
      setOutfitError(resolved || "Couldn't reach your strategist. Try again.");
    } finally { setOutfitLoading(false); }
  }

  async function dismissInstallCard() {
    setShowInstallCard(false);
    try { await window.storage.set("ifatarot:install-dismissed", "1"); } catch (e) {}
  }
  async function triggerInstall() {
    if (installPromptEvent) { installPromptEvent.prompt(); await installPromptEvent.userChoice; setInstallPromptEvent(null); }
    dismissInstallCard();
  }

  /* Patience mode: orbs drop one at a time, then a brief "vibe" transition,
     then hand off to the reading screen — independent of whether the reading
     itself is done generating yet (it usually is, by the time this finishes). */
  useEffect(() => {
    if (screen !== "dim-reveal" || !resolved) return;
    setRevealedCount(0);
    setShowVibe(false);
    const items = resolved.flatMap((p) => p.cards.map((c) => ({ p, c })));
    const perCard = 550;
    const timers = [];
    items.forEach((_, i) => timers.push(setTimeout(() => setRevealedCount(i + 1), (i + 1) * perCard)));
    const total = items.length * perCard;
    timers.push(setTimeout(() => setShowVibe(true), total + 200));
    timers.push(setTimeout(() => setScreen("dim-reading"), total + 1200));
    return () => timers.forEach(clearTimeout);
  }, [screen]);

  useEffect(() => {
    if (screen === "dim-question") setQuestionSuggestions(pickRandom(SUGGESTED_QUESTIONS, 6));
    if (screen === "home") setHomeSuggestions(pickRandom(SUGGESTED_QUESTIONS, 3));
  }, [screen]);

  function creditGate() {
    if (isAdminDevice) return true;
    const c = computeCredits(profile);
    if (c.credits < 1) { setError(`You're out of consultations for now — the next one unlocks in about ${formatWait(c.hoursUntilNext)}.`); return false; }
    return true;
  }
  function strategistGate() {
    if (isAdminDevice) return true;
    const r = isStrategistResting(profile);
    if (r.resting) { setError(`${profile.agentName || "Your strategist"} is resting right now — back in about ${formatMinutes(r.untilMin)}.`); return false; }
    return true;
  }
  async function consumeCredit() {
    const c = computeCredits(profile);
    const updated = { ...profile, credits: Math.max(0, c.credits - 1), lastCreditRefillAt: c.lastCreditRefillAt };
    setProfile(updated);
    try { await window.storage.set("ifatarot:profile", JSON.stringify(updated)); } catch (e) {}
  }
  // The one case where a server "out of consultations" error can arrive despite the
  // client believing it's admin: the server restarted (every redeploy does this) and
  // forgot this device. Rather than show a confusing "unlimited" label next to an "out
  // of consultations" error, quietly correct the stale local flag and say so plainly.
  async function describeGenerationError(message) {
    if (isAdminDevice && message && message.toLowerCase().includes("consultation")) {
      setIsAdminDevice(false);
      try { await window.storage.delete("ifatarot:is-admin"); } catch (e) {}
      return "The server no longer recognizes this device as admin — it likely restarted since you last unlocked it. Re-enter your admin passphrase in Settings, then try again.";
    }
    return message || "";
  }
  async function recordVesselInsight(ins) {
    if (!ins) return;
    setProfile((prev) => {
      const updated = { ...prev };
      if (ins.kind === "known") {
        updated.vesselInsights = { ...prev.vesselInsights, [ins.area]: { text: ins.text, date: new Date().toISOString() } };
      } else if (ins.kind === "power") {
        updated.vesselPowers = { ...prev.vesselPowers, [ins.area]: { name: ins.name, guidance: ins.guidance, date: new Date().toISOString() } };
      }
      window.storage && window.storage.set("ifatarot:profile", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }

  async function loadNotes() { const raw = await safeGet("ifatarot:notes-list"); setNotesList(raw ? JSON.parse(raw) : []); }
  async function deleteNote(id) {
    const raw = await safeGet("ifatarot:notes-list");
    const list = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((n) => n.id !== id);
    try { await window.storage.set("ifatarot:notes-list", JSON.stringify(filtered)); } catch (e) {}
    setNotesList(filtered);
    setConfirmDeleteId(null);
    if (activeNote && activeNote.id === id) setActiveNote(null);
  }
  async function loadEvents() { const raw = await safeGet("ifatarot:events"); setEvents(raw ? JSON.parse(raw) : []); }
  async function tryAdminUnlock(phrase) {
    if (!phrase) return;
    try {
      const res = await fetch("/api/admin/stats", { method: "POST", headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() }, body: JSON.stringify({ passphrase: phrase }) });
      if (!res.ok) return; // wrong phrase, or not deployed with a server — fail silently either way
      const data = await res.json();
      setAdminStats(data);
      setIsAdminDevice(true);
      try { await window.storage.set("ifatarot:is-admin", "1"); } catch (e) {}
      setScreen("admin-stats");
    } catch (e) { /* silent — this input never shows an error, by design */ }
  }
  async function loadDimensionNotes(key) { const raw = await safeGet("ifatarot:notes-list"); const list = raw ? JSON.parse(raw) : []; setDimensionNotes(list.filter((n) => n.dimKey === key)); }

  function go(key) {
    if (key === "home") clearSession();
    if (key === "library-root") { setLibraryTradition(null); setScreen("library"); }
    else if (key === "notes") { setActiveNote(null); loadNotes(); setScreen("notes"); }
    else setScreen(key);
  }

  function beginClicked() {
    setAttachNoteId(null);
    clearSession();
    if (onboarded) setScreen("begin");
    else { setDraftProfile(emptyProfile); setObStep(0); setScreen("onboarding"); }
  }
  async function finishOnboarding() {
    const derived = withDerived(draftProfile);
    setProfile(derived); setDraftProfile(derived); setOnboarded(true);
    try { await window.storage.set("ifatarot:profile", JSON.stringify(derived)); } catch (e) {}
    setScreen("begin");
  }
  async function saveSettings() {
    const derived = withDerived(draftProfile);
    setProfile(derived); setDraftProfile(derived);
    try { await window.storage.set("ifatarot:profile", JSON.stringify(derived)); } catch (e) {}
    setScreen("home");
  }

  function startDimension(key, prefillQuestion) {
    const dimCfg = DIMENSIONS[key];
    setDimKey(key); setAssignment({}); setQuestion(prefillQuestion || ""); setResolved(null); setReading(""); setError(null); setResidentMsg(""); setViaResident(false);
    loadDimensionNotes(key);
    if (dimCfg.modes.length === 1) { setMode(dimCfg.modes[0]); setScreen("dim-tradition"); }
    else { setMode(null); setScreen("dim-mode"); }
  }
  function resumeResident() {
    if (!profile.residentDimension) return;
    const { dimKey: rk, modeKey, assignment: ra } = profile.residentDimension;
    const dc = DIMENSIONS[rk]; const m = dc.modes.find((mm) => mm.key === modeKey);
    setDimKey(rk); setMode(m); setAssignment(ra); setQuestion(""); setResolved(null); setReading(""); setError(null); setResidentMsg(""); setViaResident(true); setAttachNoteId(null);
    loadDimensionNotes(rk);
    setScreen("dim-question");
  }
  function quickDraw() {
    if (!profile.residentDimension) return;
    if (!question.trim()) { setError("Enter or record your question first."); return; }
    if (!strategistGate()) return;
    if (!creditGate()) return;
    const { dimKey: rk, modeKey, assignment: ra } = profile.residentDimension;
    const dc = DIMENSIONS[rk]; const m = dc.modes.find((mm) => mm.key === modeKey);
    setDimKey(rk); setMode(m); setAssignment(ra); setResolved(null); setReading(""); setError(null); setResidentMsg(""); setViaResident(true); setAttachNoteId(null);
    loadDimensionNotes(rk);
    if (profile.readingMode === "stealth") { drawAndReveal({ dimKey: rk, mode: m, assignment: ra, question }); return; }
    setScreen("dim-shuffling");
  }

  function traditionsForPosition(posKey, modeArg, assignmentArg) {
    // Ifa is always the spiritual tradition; Tarot is always physical (drawn once per reading).
    // This function returns which Ifa deck to draw from for each position.
    const a = assignmentArg || assignment;
    return [a.__single || "ifa256"];
  }
  function assignmentComplete() {
    if (!mode) return false;
    return !!assignment.__single;
    return false;
  }

  function toggleMic() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError("Voice input isn't available in this browser. Type instead."); return; }
    if (listening) { recogRef.current && recogRef.current.stop(); return; }
    baseQuestionRef.current = question;
    finalTranscriptRef.current = "";
    const recog = new SR();
    recog.lang = "en-US"; recog.interimResults = true; recog.continuous = true;
    recog.onresult = (e) => {
      // Only text the browser has actually finalized gets permanently committed —
      // still-changing interim guesses are shown live but never locked in, so a
      // word the recognizer later corrects doesn't end up duplicated or jumbled
      // in with the committed sentence.
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const chunk = result[0].transcript.trim();
        if (result.isFinal) {
          if (chunk) finalTranscriptRef.current = (finalTranscriptRef.current ? finalTranscriptRef.current + " " : "") + chunk;
        } else {
          interim += (interim ? " " : "") + chunk;
        }
      }
      const base = baseQuestionRef.current;
      const combined = [base, finalTranscriptRef.current, interim].filter((s) => s && s.trim()).join(" ");
      setQuestion(combined);
    };
    recog.onend = () => { setListening(false); if (timerRef.current) clearInterval(timerRef.current); };
    recog.onerror = (e) => {
      setListening(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setError(e.error === "not-allowed" || e.error === "service-not-allowed"
        ? "Microphone access was blocked. If you're testing inside a preview iframe, voice input needs to run on your own hosted domain to get a real permission prompt."
        : `Voice input stopped (${e.error}). Try again or type instead.`);
    };
    recogRef.current = recog;
    setRecordSeconds(0);
    setListening(true);
    timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    recog.start();
  }

  function beginShuffle() {
    if (!question.trim()) { setError("Enter or record your question first."); return; }
    if (!strategistGate()) return;
    if (!creditGate()) return;
    setError(null);
    if (profile.readingMode === "stealth") { drawAndReveal(); return; }
    setScreen("dim-shuffling");
  }

  async function drawAndReveal(overrides) {
    const useDimKey = (overrides && overrides.dimKey) || dimKey;
    const useMode = (overrides && overrides.mode) || mode;
    const useAssignment = (overrides && overrides.assignment) || assignment;
    const useQuestion = overrides && overrides.question !== undefined ? overrides.question : question;

    if (!strategistGate()) { setScreen("dim-question"); return; }
    if (!creditGate()) { setScreen("dim-question"); return; }
    setLoading(true);
    setReadingFailed(false);
    const positions = useMode.positions.map((p) => {
      const traditions = traditionsForPosition(p.key, useMode, useAssignment);
      const cards = traditions.map((t) => drawCard(t, t === "tarot" ? profile.tarotReversals : false));
      return { ...p, cards };
    });
        setResolved(positions);
    setReading("");
    setScreen(profile.readingMode === "patience" ? "dim-reveal" : "dim-reading");

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setReading(buildOfflineFallback(positions));
      setReadingFailed(true);
      setLoading(false);
      return;
    }

    try {
      const system = buildSystemPrompt(profile);
      const user = buildMultiPrompt(useDimKey, useMode.key, DIMENSIONS[useDimKey].label, useMode.title, positions, useQuestion, profile);
      const cardCount = positions.flatMap((p) => p.cards).length;
      const maxTokens = maxTokensForReading(cardCount, profile.verbosity);
      const meta = { type: "reading", dimension: useDimKey, mode: useMode.key, traditions: positions.flatMap((p) => p.cards.map((c) => c.tradition)).concat(positions[0]?.physicalCard ? ["tarot"] : []), cardNames: positions.flatMap((p) => p.cards.map((c) => ({ tradition: c.tradition, name: c.name }))) };
      let { text, truncated } = await callAgentMessagesFull(system, [{ role: "user", content: user }], { maxTokens, meta });
      if ((!text || !text.trim()) || truncated) {
        // Fixing a truncated/empty first attempt is on us, not a second consultation —
        // mark it internal so it can never be billed or logged a second time.
        ({ text, truncated } = await callAgentMessagesFull(system, [{ role: "user", content: user }], { maxTokens: Math.min(8192, maxTokens + 1500), meta, internal: true }));
      }
      if (!text || !text.trim()) {
        setReading("Your strategist didn't come back with a reading that time — no consultation was used.");
        setReadingFailed(true);
        return;
      }
      await revealProgressively(text, (partial) => setReading(partial));
      setReading(text);
      setNoteTitle(useQuestion);
      pushEvent("reading", { dimension: useDimKey, mode: useMode.key, traditions: positions.flatMap((p) => p.cards.map((c) => c.tradition)).concat(positions[0]?.physicalCard ? ["tarot"] : []), cardNames: positions.flatMap((p) => p.cards.map((c) => ({ tradition: c.tradition, name: c.name }))) });
      await consumeCredit();
      extractVesselInsight(`Question: "${useQuestion}"\nReading given: ${text}`).then((ins) => { if (ins) recordVesselInsight(ins); });
      if (attachNoteId) await appendReadingToNote(attachNoteId, { dimKey: useDimKey, modeLabel: useMode.title, question: useQuestion, positions, reading: text });
    } catch (e) {
      const detail = await describeGenerationError(e && e.message ? e.message : "");
      setReading(detail
        ? `Your cards are drawn, but ${profile.agentName || "your strategist"} couldn't respond: ${detail} No consultation was used.`
        : `Your cards are drawn, but the reading couldn't reach ${profile.agentName || "your strategist"} — check your connection and tap "Try again" below. No consultation was used.`);
      setReadingFailed(true);
    } finally { setLoading(false); }
  }

  function openCardFromResult(card) { setCardDetail(card); setCardDetailBack("dim-reading"); setScreen("card-detail"); }
  function openCardFromLibrary(tradition, name) { setCardDetail({ tradition, name, reversed: false }); setCardDetailBack("library-grid"); setScreen("card-detail"); }

  async function sendStrategistMessage(overrideText) {
    const q = (overrideText || strategistInput).trim();
    if (!q) return;
    if (!strategistGate()) return;
    if (!creditGate()) return;
    const nextLog = [...strategistLog, { role: "user", text: q }];
    setStrategistLog(nextLog); setStrategistInput(""); setStrategistLoading(true); setStrategistSuggestion(null);
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setStrategistLog([...nextLog, { role: "agent", text: `I can't reach the cosmos without a connection right now — reconnect and ask me again. No consultation was used.` }]);
      setStrategistLoading(false);
      return;
    }
    try {
      const system = buildSystemPrompt(profile) + "\n\nThis is a live back-and-forth conversation before any cards are drawn. Build on everything said so far, ask a clarifying question if it would sharpen the question, and work toward a clear synthesis of what's really being asked. Only speak to their question and Ifatarot — no generic advice. Keep replies to a few sentences unless real depth is needed.";
      const apiMessages = nextLog.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
      let { text: answer, truncated } = await callAgentMessagesFull(system, apiMessages, { maxTokens: 1200, meta: { type: "strategist" } });
      if (truncated) {
        ({ text: answer } = await callAgentMessagesFull(system, apiMessages, { maxTokens: 2400, meta: { type: "strategist" }, internal: true }));
      }
      if (!answer || !answer.trim()) {
        setStrategistLog([...nextLog, { role: "agent", text: "That didn't come through clearly — no consultation was used. Try sending it again." }]);
        setStrategistLoading(false);
        return;
      }
      await revealProgressively(answer, (partial) => setStrategistLog([...nextLog, { role: "agent", text: partial }]));
      const updatedLog = [...nextLog, { role: "agent", text: answer }];
      setStrategistLog(updatedLog);
      await consumeCredit();
      extractVesselInsight(`Seeker said: "${q}"\nStrategist replied: ${answer}`).then((ins) => { if (ins) recordVesselInsight(ins); });
      const suggestSystem = "Given a seeker's question for a Tarot and Ifa divination app, pick the single best reading depth from this list and reply with ONLY the key, nothing else: 1D (a quick single focus), 2D (weighing two sides), 3D (a timeline or core-plus-forces view), 7D (a deep multi-angle spread), 9D (the most exhaustive spread).";
      const dimGuess = (await callAgent(suggestSystem, q, { internal: true })).trim();
      const match = Object.keys(DIMENSIONS).find((k) => dimGuess.includes(k)) || "1D";
      setStrategistSuggestion({ dimKey: match, question: q });
      pushEvent("strategist", { dimension: match });
    } catch (e) {
      const raw = e && e.message ? e.message : "";
      const resolved = await describeGenerationError(raw);
      const text = resolved && resolved !== raw
        ? resolved
        : `Something went wrong reaching your strategist${raw ? ` (${raw})` : ""} — no consultation was used. Try again in a moment.`;
      setStrategistLog([...nextLog, { role: "agent", text }]);
    } finally { setStrategistLoading(false); }
  }

  async function saveNote() {
    if (!resolved || !reading) return;
    const entry = {
      id: Date.now(), title: noteTitle || question || `${dimKey} · ${mode.title}`, date: new Date().toISOString(),
      dimKey, modeLabel: mode.title,
      entries: [{ type: "reading", dimKey, modeLabel: mode.title, question, positions: resolved, reading, date: new Date().toISOString() }],
    };
    const raw = await safeGet("ifatarot:notes-list");
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(entry);
    try { await window.storage.set("ifatarot:notes-list", JSON.stringify(list.slice(0, 100))); } catch (e) {}
    pushEvent("note", { dimension: dimKey });
    setNoteTitle("");
    clearSession();
    go("notes");
  }
  function normalizeNote(n) {
    if (n.entries) return n;
    return { ...n, entries: [{ type: "reading", dimKey: n.dimKey, modeLabel: n.modeLabel, question: n.question, positions: n.positions, reading: n.reading, date: n.date }] };
  }
  async function appendReadingToNote(noteId, readingData) {
    const raw = await safeGet("ifatarot:notes-list");
    const list = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((n) => n.id === noteId);
    if (idx === -1) return;
    const note = normalizeNote(list[idx]);
    note.entries = [...note.entries, { type: "reading", ...readingData, date: new Date().toISOString() }];
    list[idx] = note;
    try { await window.storage.set("ifatarot:notes-list", JSON.stringify(list)); } catch (e) {}
    setActiveNote(note);
  }
  async function appendChatToNote(noteId, userText, agentText) {
    const raw = await safeGet("ifatarot:notes-list");
    const list = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((n) => n.id === noteId);
    if (idx === -1) return null;
    const note = normalizeNote(list[idx]);
    note.entries = [...note.entries, { type: "chat", role: "user", text: userText, date: new Date().toISOString() }, { type: "chat", role: "agent", text: agentText, date: new Date().toISOString() }];
    list[idx] = note;
    try { await window.storage.set("ifatarot:notes-list", JSON.stringify(list)); } catch (e) {}
    return note;
  }
  async function sendNoteChatMessage(note) {
    const q = noteChatInput.trim();
    if (!q || !strategistGate() || !creditGate()) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setError("You're offline right now — no tailored guidance without a connection. No consultation was used.");
      return;
    }
    setNoteChatLoading(true); setNoteChatInput("");
    const normalized = normalizeNote(note);
    const historyMessages = normalized.entries.map((e) => {
      if (e.type === "chat") return { role: e.role === "user" ? "user" : "assistant", content: e.text };
      return { role: "assistant", content: `(Earlier reading — ${e.modeLabel}, question: "${e.question}") ${e.reading}` };
    });
    historyMessages.push({ role: "user", content: q });
    try {
      const system = buildSystemPrompt(profile) + "\n\nYou're continuing a saved conversation thread with the seeker, picking up from the reading(s) already in it. Stay grounded in what's already been discussed.";
      const answer = await callAgentMessages(system, historyMessages, { maxTokens: 1200, meta: { type: "strategist" } });
      if (!answer || !answer.trim()) {
        setError("That didn't come through clearly — no consultation was used. Try again.");
        return;
      }
      const updated = await appendChatToNote(note.id, q, answer);
      if (updated) setActiveNote(updated);
      await consumeCredit();
      extractVesselInsight(`Seeker said: "${q}"\nStrategist replied: ${answer}`).then((ins) => { if (ins) recordVesselInsight(ins); });
    } catch (e) {
      const raw = e && e.message ? e.message : "";
      const resolved = await describeGenerationError(raw);
      setError(resolved && resolved !== raw ? resolved : `Couldn't reach your strategist.${raw ? ` ${raw}` : ""} Try again — no consultation was used.`);
    } finally { setNoteChatLoading(false); }
  }
  function drawAnotherForNote(note) {
    setAttachNoteId(note.id);
    setScreen("begin");
  }
  async function makeResident() {
    const updated = { ...profile, residentDimension: { dimKey, modeKey: mode.key, assignment } };
    setProfile(updated); setDraftProfile(updated);
    try { await window.storage.set("ifatarot:profile", JSON.stringify(updated)); } catch (e) {}
    setResidentMsg(`${mode.title} is now where you reside. Look for "Draw" on your home screen.`);
  }

  const wrap = { maxWidth: 460, margin: "0 auto", minHeight: 600, background: INK, color: IVORY, fontFamily: "Karla, sans-serif", padding: "36px 24px 28px", borderRadius: 16, boxSizing: "border-box" };
  const dimCfg = dimKey ? DIMENSIONS[dimKey] : null;

  function DimensionSidebar() {
    if (dimensionNotes.length === 0) return null;
    return (
      <div style={{ width: 100, flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: SAGE, marginBottom: 6 }}>Past in {dimKey}</div>
        {dimensionNotes.slice(0, 6).map((n) => (
          <button key={n.id} onClick={() => { setActiveNote(n); go("notes"); }} style={{ display: "block", width: "100%", textAlign: "left", background: "rgba(243,234,216,0.05)", border: `1px solid ${HAIRLINE}`, borderRadius: 6, padding: 6, marginBottom: 6, cursor: "pointer" }}>
            <div style={{ fontSize: 10, color: GOLD, fontFamily: "Fraunces, serif" }}>{n.title.length > 14 ? n.title.slice(0, 13) + "…" : n.title}</div>
            <div style={{ fontSize: 9, color: SAGE }}>{new Date(n.date).toLocaleDateString()}</div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{ background: INDIGO, padding: "24px 12px", borderRadius: 20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600&family=Karla:wght@400;500;600;700&display=swap');
        @keyframes shuffleMove { 0% { transform: translateX(-46px) rotate(-10deg); } 50% { transform: translateX(46px) rotate(10deg); } 100% { transform: translateX(-46px) rotate(-10deg); } }
        @keyframes micPulse { 0% { box-shadow: 0 0 0 0 rgba(196,101,46,0.5); } 70% { box-shadow: 0 0 0 12px rgba(196,101,46,0); } 100% { box-shadow: 0 0 0 0 rgba(196,101,46,0); } }
        @keyframes orbResolve { 0% { opacity: 0; transform: scale(0.6); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes vibesPulse { 0% { opacity: 0; transform: translateX(-50%) scale(0.3); } 50% { opacity: 1; } 100% { opacity: 0; transform: translateX(-50%) scale(2.4); } }
      `}</style>
      <div style={wrap}>

        {screen === "home" && (
          <div>
            {showInstallCard && (
              <div style={{ border: `1px solid ${GOLD}`, borderRadius: 10, padding: 14, marginBottom: 20, background: "rgba(217,169,74,0.07)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ fontSize: 13, color: IVORY, lineHeight: 1.5 }}>
                    <strong style={{ color: GOLD }}>Add Ifatarot to your home screen</strong> for real-time answers, one tap away — no browser bar, no searching for the tab.
                    {isIOS ? " Tap the Share icon below, then \"Add to Home Screen.\"" : installPromptEvent ? "" : " Look for \"Add to Home screen\" or \"Install app\" in your browser's menu."}
                  </div>
                  <button onClick={dismissInstallCard} style={{ background: "none", border: "none", color: SAGE, fontSize: 16, cursor: "pointer", padding: 0, lineHeight: 1 }}>&times;</button>
                </div>
                {!isIOS && installPromptEvent && <PrimaryButton style={{ marginTop: 12 }} onClick={triggerInstall}>Install Ifatarot</PrimaryButton>}
              </div>
            )}
            <div style={{ textAlign: "center", marginBottom: 32, marginTop: 4 }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: -6 }}><StarSelector decorative value={null} onChange={() => {}} size={110} /></div>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 28, color: GOLD }}>Ifatarot</div>
              <div style={{ fontSize: 11, color: SAGE, marginTop: 2, letterSpacing: 0.5 }}>by Ifakande</div>
              <div style={{ fontSize: 13, color: SAGE, marginTop: 8 }}>Two traditions. One clear answer.</div>
              {onboarded && <div style={{ fontSize: 11, color: SAGE, marginTop: 10 }}>{isAdminDevice ? "Unlimited consultations (admin)" : `${computeCredits(profile).credits}/${CREDIT_MAX} consultations available`}</div>}
              {onboarded && isStrategistResting(profile).resting && <div style={{ fontSize: 11, color: CAMWOOD, marginTop: 4 }}>{profile.agentName || "Your strategist"} is resting — back in about {formatMinutes(isStrategistResting(profile).untilMin)}</div>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {profile.residentDimension && (
                <div style={{ border: `1px solid ${HAIRLINE}`, borderRadius: 10, padding: 14, background: "rgba(217,169,74,0.04)" }}>
                  <div style={{ fontSize: 11, color: SAGE, marginBottom: 8 }}>Quick ask &middot; {DIMENSIONS[profile.residentDimension.dimKey].modes.find((m) => m.key === profile.residentDimension.modeKey)?.title}</div>
                  <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What's on your mind?" style={{ width: "100%", minHeight: 64, boxSizing: "border-box", background: "rgba(243,234,216,0.05)", border: `1px solid ${HAIRLINE}`, borderRadius: 6, padding: 10, color: IVORY, fontSize: 14, fontFamily: "Karla, sans-serif", resize: "vertical", outline: "none", marginBottom: 8 }} />
                  {!question.trim() && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                      {homeSuggestions.map((q) => <PillButton key={q} onClick={() => setQuestion(q)}>{q}</PillButton>)}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={toggleMic} style={{ width: 44, borderRadius: 8, border: `1px solid ${listening ? CAMWOOD : HAIRLINE}`, background: listening ? "rgba(196,101,46,0.15)" : "transparent", color: listening ? GOLD : IVORY, cursor: "pointer", animation: listening ? "micPulse 1.4s infinite" : "none" }}>&#127908;</button>
                    <PrimaryButton style={{ flex: 1 }} onClick={quickDraw}>Shuffle now</PrimaryButton>
                  </div>
                  {error && <p style={{ color: CAMWOOD, fontSize: 12, marginTop: 8 }}>{error}</p>}
                  <button onClick={resumeResident} style={{ background: "none", border: "none", color: SAGE, fontSize: 11, marginTop: 8, cursor: "pointer", textDecoration: "underline" }}>Change tradition or settings for this reading</button>
                </div>
              )}
              <PrimaryButton onClick={beginClicked}>Begin</PrimaryButton>
              <GhostButton onClick={() => go("library-root")}>Library</GhostButton>
              <GhostButton onClick={() => go("notes")}>Notes</GhostButton>
              {onboarded && <GhostButton onClick={() => setScreen("todays-outfit")}>Today's Outfit</GhostButton>}
              {onboarded && <GhostButton onClick={() => setScreen("vessel")}>The Vessel</GhostButton>}
              {onboarded && <GhostButton onClick={openTheRoot}>The Root</GhostButton>}
              <GhostButton onClick={() => { setDraftProfile(profile); setScreen("settings"); }}>Settings</GhostButton>
            </div>
            <BottomNav screen="home" go={go} />
          </div>
        )}

        {screen === "onboarding" && (
          <div>
            <Header title="Set your blueprint" />
            {obStep === 0 && (
              <div>
                <p style={{ color: SAGE, fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>Which plane do you operate from most, right now?</p>
                <StarSelector value={draftProfile.plane} onChange={(v) => setDraftProfile({ ...draftProfile, plane: v })} />
                <PrimaryButton style={{ marginTop: 24 }} disabled={!draftProfile.plane} onClick={() => setObStep(1)}>Continue</PrimaryButton>
              </div>
            )}
            {obStep === 1 && (
              <div>
                <p style={{ color: SAGE, fontSize: 13, marginBottom: 12 }}>Your own orientation</p>
                <StarSelector value={draftProfile.element} onChange={(v) => setDraftProfile({ ...draftProfile, element: v })} size={220} />
                <p style={{ color: SAGE, fontSize: 13, margin: "20px 0 12px" }}>What should your cosmic strategist focus on?</p>
                <StarSelector value={draftProfile.agentElement} onChange={(v) => setDraftProfile({ ...draftProfile, agentElement: v })} size={220} />
                <PrimaryButton style={{ marginTop: 12 }} disabled={!draftProfile.element || !draftProfile.agentElement} onClick={() => setObStep(2)}>Continue</PrimaryButton>
              </div>
            )}
            {obStep === 2 && (
              <div>
                <Field label="What should Ifatarot call you?"><TextInput placeholder="Your name" value={draftProfile.name} onChange={(e) => setDraftProfile({ ...draftProfile, name: e.target.value })} /></Field>
                <Field label="What would you like to call your agent?"><TextInput placeholder="Agent name" value={draftProfile.agentName} onChange={(e) => setDraftProfile({ ...draftProfile, agentName: e.target.value })} /></Field>
                <PrimaryButton disabled={!draftProfile.name || !draftProfile.agentName} onClick={() => setObStep(3)}>Continue</PrimaryButton>
              </div>
            )}
            {obStep === 3 && (
              <div>
                <p style={{ color: SAGE, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>Optional — this also unlocks your numerology, life path, and Chinese zodiac. Skip and add later in Settings if you'd rather not share it yet.</p>
                <Field label="Date of birth"><TextInput type="date" value={draftProfile.dob} onChange={(e) => setDraftProfile({ ...draftProfile, dob: e.target.value })} /></Field>
                <Field label="Time of birth"><TextInput type="time" value={draftProfile.tob} onChange={(e) => setDraftProfile({ ...draftProfile, tob: e.target.value })} /></Field>
                <Field label="Place of birth"><TextInput placeholder="City, country" value={draftProfile.pob} onChange={(e) => setDraftProfile({ ...draftProfile, pob: e.target.value })} /></Field>
                <div style={{ display: "flex", gap: 10 }}>
                  <GhostButton style={{ flex: 1 }} onClick={() => setObStep(4)}>Skip for now</GhostButton>
                  <PrimaryButton style={{ flex: 1 }} onClick={() => setObStep(4)}>Continue</PrimaryButton>
                </div>
              </div>
            )}
            {obStep === 4 && (
              <div>
                <p style={{ color: SAGE, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>You can fine-tune exactly how your strategist speaks any time in Settings.</p>
                <PrimaryButton onClick={finishOnboarding}>Enter Ifatarot</PrimaryButton>
              </div>
            )}
          </div>
        )}

        {screen === "begin" && (
          <div>
            <Header title="Choose your depth" onBack={() => go("home")} />
            {attachNoteId && <p style={{ fontSize: 12, color: GOLD, marginBottom: 16 }}>Adding this reading to your saved note.</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Object.keys(DIMENSIONS).map((k) => <GhostButton key={k} onClick={() => startDimension(k)}>{DIMENSIONS[k].label}</GhostButton>)}
            </div>
            <BottomNav screen="begin" go={go} />
          </div>
        )}

        {screen === "dim-mode" && dimCfg && (
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Header title={dimCfg.label} onBack={() => setScreen("begin")} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 480, overflowY: "auto", paddingRight: 4 }}>
                {dimCfg.modes.map((m) => (
                  <button key={m.key} onClick={() => { setMode(m); setScreen("dim-tradition"); }} style={{ textAlign: "left", background: "rgba(243,234,216,0.03)", border: `1px solid ${HAIRLINE}`, borderRadius: 8, padding: 14, cursor: "pointer" }}>
                    <div style={{ fontFamily: "Fraunces, serif", color: GOLD, fontSize: 16 }}>{m.title}</div>
                    <div style={{ fontSize: 12, color: SAGE, marginTop: 2 }}>{m.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <DimensionSidebar />
          </div>
        )}

                {screen === "dim-tradition" && dimCfg && mode && (
          <div>
            <Header title="Choose your Ifa deck" onBack={() => setScreen(mode ? "dim-mode" : "begin")} />
            <p style={{ fontSize: 13, color: SAGE, marginBottom: 20, lineHeight: 1.6 }}>Ifa speaks to the spirit realm — one card per position. Tarot speaks to the physical realm — one card for the whole reading. Choose which Ifa deck to draw from.</p>
            <Field label="Ifa deck">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <PillButton active={assignment.__single === "ifa256"} onClick={() => setAssignment({ __single: "ifa256" })}>
                  Odu Meji · 256 cards
                </PillButton>
                <PillButton active={assignment.__single === "ifa4096"} onClick={() => setAssignment({ __single: "ifa4096" })}>
                  Odu Meta · 4,096 cards
                </PillButton>
              </div>
            </Field>
            <div style={{ marginTop: 24 }}>
              <PrimaryButton onClick={() => { if (!assignment.__single) setAssignment({ __single: "ifa256" }); setScreen("dim-question"); }}>Continue</PrimaryButton>
            </div>
          </div>
        )}

{screen === "dim-question" && (
          <div>
            <Header title="Ask your question" onBack={() => (viaResident ? go("home") : setScreen("dim-tradition"))} />
            <p style={{ fontSize: 11, color: SAGE, marginBottom: 16 }}>{isAdminDevice ? "Unlimited consultations (admin)" : `${computeCredits(profile).credits} consultation${computeCredits(profile).credits === 1 ? "" : "s"} available right now${isStrategistResting(profile).resting ? ` · resting for about ${formatMinutes(isStrategistResting(profile).untilMin)}` : ""}`}</p>
            {attachNoteId && <p style={{ fontSize: 12, color: GOLD, marginBottom: 12 }}>Adding this reading to your saved note.</p>}
            <Field label="Speak or type what's on your mind">
              <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What do I need to understand about this decision?" style={{ width: "100%", minHeight: 110, boxSizing: "border-box", background: "rgba(243,234,216,0.05)", border: `1px solid ${HAIRLINE}`, borderRadius: 6, padding: 14, color: IVORY, fontSize: 15, fontFamily: "Karla, sans-serif", resize: "vertical", outline: "none" }} />
            </Field>
            {!question.trim() && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: SAGE, marginBottom: 8 }}>Not sure what to ask?</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {questionSuggestions.map((q) => <PillButton key={q} onClick={() => setQuestion(q)}>{q}</PillButton>)}
                </div>
              </div>
            )}
            <button onClick={toggleMic} style={{ width: "100%", boxSizing: "border-box", marginBottom: 8, padding: 12, borderRadius: 8, border: `1px solid ${listening ? CAMWOOD : HAIRLINE}`, background: listening ? "rgba(196,101,46,0.15)" : "transparent", color: listening ? GOLD : IVORY, fontFamily: "Karla, sans-serif", cursor: "pointer", animation: listening ? "micPulse 1.4s infinite" : "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: listening ? CAMWOOD : SAGE, display: "inline-block" }} />
              {listening ? `Recording ${String(Math.floor(recordSeconds / 60)).padStart(1, "0")}:${String(recordSeconds % 60).padStart(2, "0")} — tap to stop` : "Tap to speak"}
            </button>
            {listening && <p style={{ fontSize: 12, color: SAGE, marginTop: 0, marginBottom: 24 }}>Transcribing live above as you talk — check the text box.</p>}
            {!listening && <div style={{ marginBottom: 24 }} />}
            {error && <p style={{ color: CAMWOOD, fontSize: 13, marginBottom: 16 }}>{error}</p>}
            <PrimaryButton onClick={beginShuffle}>Begin shuffling</PrimaryButton>
          </div>
        )}

        {screen === "dim-shuffling" && (
          <div>
            <Header title={loading ? "Consulting" : "Shuffling"} onBack={() => !loading && setScreen("dim-question")} />
            {!loading ? (
              <div>
                <div style={{ position: "relative", height: 180, marginBottom: 28 }}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} style={{ position: "absolute", left: "calc(50% - 30px)", top: 20, width: 60, height: 90, borderRadius: 6, background: INDIGO, border: `2px solid ${GOLD}`, animation: "shuffleMove 1.3s ease-in-out infinite", animationDelay: `${i * 0.11}s`, boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }} />
                  ))}
                </div>
                <p style={{ textAlign: "center", color: SAGE, fontSize: 13, marginBottom: 20 }}>Let it run as long as feels right.</p>
                <PrimaryButton onClick={() => drawAndReveal()}>Stop shuffling</PrimaryButton>
              </div>
            ) : (
              <p style={{ textAlign: "center", color: SAGE, fontSize: 14, marginTop: 60 }}>{profile.agentName || "Your strategist"} is reading what came up...</p>
            )}
            {error && <p style={{ color: CAMWOOD, fontSize: 13, marginTop: 16 }}>{error}</p>}
          </div>
        )}

        {screen === "dim-reveal" && resolved && (() => {
          const items = resolved.flatMap((p) => p.cards.map((c) => ({ p, c })));
          return (
            <div style={{ textAlign: "center", paddingTop: 24 }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16, marginBottom: 32 }}>
                {items.map((item, i) => (
                  <div key={i} style={{ width: 76 }}>
                    {i < revealedCount ? (
                      <div style={{ animation: "orbResolve 0.5s ease" }}>
                        <CardArt tradition={item.c.tradition} name={item.c.name} size={64} />
                      </div>
                    ) : (
                      <div style={{ width: 64, height: 90, borderRadius: 8, background: "radial-gradient(circle, rgba(217,169,74,0.55), rgba(217,169,74,0.05))", border: `1px solid ${HAIRLINE}`, margin: "0 auto" }} />
                    )}
                    <div style={{ fontSize: 9, color: SAGE, marginTop: 6 }}>{item.p.label}</div>
                  </div>
                ))}
              </div>
              <p style={{ color: SAGE, fontSize: 13 }}>{showVibe ? `${profile.agentName || "Your strategist"} is settling into the pattern...` : "The cards are dropping into place..."}</p>
              {showVibe && (
                <div style={{ position: "relative", height: 60, marginTop: 8 }}>
                  <div style={{ position: "absolute", left: "50%", top: 0, width: 200, height: 60, borderRadius: "50%", background: "radial-gradient(circle, rgba(217,169,74,0.4), transparent)", animation: "vibesPulse 1s ease-out" }} />
                </div>
              )}
            </div>
          );
        })()}

        {screen === "dim-reading" && resolved && !(dimKey === "2D" && (mode.key === "duality" || mode.key === "polarity")) && (
          <div>
            <Header title="Your reading" onBack={() => go("begin")} />
            <div style={{ fontSize: 10, color: CAMWOOD, letterSpacing: 1, marginBottom: 8 }}>SPIRIT · IFA</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
              {resolved.map((p) => p.cards.map((c, i) => (
                <button key={p.key + i} onClick={() => openCardFromResult(c)} style={{ background: "rgba(217,169,74,0.05)", border: `1px solid ${HAIRLINE}`, borderRadius: 8, padding: 8, cursor: "pointer", textAlign: "left", width: 96 }}>
                  <CardArt tradition={c.tradition} name={c.name} size={80} />
                  <div style={{ fontSize: 10, color: SAGE, marginTop: 4 }}>{p.label}{c.reversed ? " · rev." : ""}</div>
                </button>
              )))}
            </div>
            {resolved[0]?.physicalCard && (() => {
              const pc = resolved[0].physicalCard;
              return (
                <div style={{ marginBottom: 20, padding: "12px 14px", background: "rgba(243,234,216,0.04)", border: `1px solid ${HAIRLINE}`, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: GOLD, letterSpacing: 1, marginBottom: 10 }}>PHYSICAL REALM · TAROT</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <button onClick={() => openCardFromResult(pc)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
                      <CardArt tradition="tarot" name={pc.name} size={64} />
                    </button>
                    <div>
                      <div style={{ fontSize: 14, color: IVORY, fontFamily: "Fraunces, serif" }}>{pc.name}{pc.reversed ? " (reversed)" : ""}</div>
                      <div style={{ fontSize: 11, color: SAGE, marginTop: 4, lineHeight: 1.5 }}>The physical world you are navigating right now — present through the entire reading.</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          
            {loading && !reading && <p style={{ fontSize: 13, color: SAGE, fontStyle: "italic" }}>{profile.agentName || "Your strategist"} is reading what came up...</p>}
            <p style={{ fontSize: 15, lineHeight: 1.8, color: IVORY, whiteSpace: "pre-wrap" }}>{reading}{loading && reading && <span style={{ opacity: 0.5 }}>▍</span>}</p>
            {!loading && !readingFailed && <div style={{ marginTop: 8, fontSize: 13, color: SAGE }}>&mdash; {profile.agentName || "your agent"}</div>}
            {!loading && readingFailed ? (
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <PrimaryButton style={{ flex: 1 }} onClick={() => drawAndReveal()}>Try again</PrimaryButton>
                <GhostButton style={{ flex: 1 }} onClick={() => go("home")}>Home</GhostButton>
              </div>
            ) : !loading && attachNoteId ? (
              <PrimaryButton style={{ marginTop: 20 }} onClick={() => { setAttachNoteId(null); go("notes"); setActiveNote(null); loadNotes(); }}>Back to your note</PrimaryButton>
            ) : !loading && (
              <div>
                <Field label="Save this reading to Notes (optional)"><TextInput placeholder="Name this note" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} /></Field>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <GhostButton style={{ flex: 1 }} onClick={saveNote}>Save to notes</GhostButton>
                  <GhostButton style={{ flex: 1 }} onClick={() => go("home")}>Home</GhostButton>
                </div>
                <GhostButton style={{ width: "100%", boxSizing: "border-box" }} onClick={makeResident}>Make this your resident dimension</GhostButton>
                {residentMsg && <p style={{ fontSize: 12, color: GOLD, marginTop: 10 }}>{residentMsg}</p>}
              </div>
            )}
          </div>
        )}

        {screen === "dim-reading" && resolved && dimKey === "2D" && (mode.key === "duality" || mode.key === "polarity") && (() => {
          const isDuality = mode.key === "duality";
          const left = resolved.find((p) => p.key === (isDuality ? "disagreeable" : "physical"));
          const right = resolved.find((p) => p.key === (isDuality ? "agreeable" : "spiritual"));
          return (
            <div>
              <Header title="Your reading" onBack={() => go("begin")} />
              <div style={{ display: "flex", flexDirection: isDuality ? "row" : "column", borderRadius: 10, overflow: "hidden", marginBottom: 20, border: `1px solid ${HAIRLINE}` }}>
                <div onClick={() => openCardFromResult(right.cards[0])} style={{ flex: 1, background: isDuality ? IVORY : GREEN, color: isDuality ? INK : IVORY, padding: 20, textAlign: "center", cursor: "pointer" }}>
                  <div style={{ fontSize: 12, letterSpacing: 1, marginBottom: 10, opacity: 0.8 }}>{right.label.toUpperCase()}</div>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><CardArt tradition={right.cards[0].tradition} name={right.cards[0].name} size={70} /></div>
                  <div style={{ fontSize: 12 }}>{right.cards[0].reversed ? "Reversed" : ""}</div>
                </div>
                <div onClick={() => openCardFromResult(left.cards[0])} style={{ flex: 1, background: isDuality ? INK : RED, color: IVORY, padding: 20, textAlign: "center", cursor: "pointer" }}>
                  <div style={{ fontSize: 12, letterSpacing: 1, marginBottom: 10, opacity: 0.8 }}>{left.label.toUpperCase()}</div>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><CardArt tradition={left.cards[0].tradition} name={left.cards[0].name} size={70} /></div>
                  <div style={{ fontSize: 12 }}>{left.cards[0].reversed ? "Reversed" : ""}</div>
                </div>
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: IVORY, whiteSpace: "pre-wrap" }}>{reading}{loading && reading && <span style={{ opacity: 0.5 }}>▍</span>}</p>
              {!loading && !readingFailed && <div style={{ marginTop: 8, fontSize: 13, color: SAGE }}>&mdash; {profile.agentName || "your agent"}</div>}
              {!loading && readingFailed ? (
                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <PrimaryButton style={{ flex: 1 }} onClick={() => drawAndReveal()}>Try again</PrimaryButton>
                  <GhostButton style={{ flex: 1 }} onClick={() => go("home")}>Home</GhostButton>
                </div>
              ) : !loading && attachNoteId ? (
                <PrimaryButton style={{ marginTop: 20 }} onClick={() => { setAttachNoteId(null); go("notes"); setActiveNote(null); loadNotes(); }}>Back to your note</PrimaryButton>
              ) : !loading && (
                <div>
                  <Field label="Save this reading to Notes (optional)"><TextInput placeholder="Name this note" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} /></Field>
                  <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                    <GhostButton style={{ flex: 1 }} onClick={saveNote}>Save to notes</GhostButton>
                    <GhostButton style={{ flex: 1 }} onClick={() => go("home")}>Home</GhostButton>
                  </div>
                  <GhostButton style={{ width: "100%", boxSizing: "border-box" }} onClick={makeResident}>Make this your resident dimension</GhostButton>
                  {residentMsg && <p style={{ fontSize: 12, color: GOLD, marginTop: 10 }}>{residentMsg}</p>}
                </div>
              )}
            </div>
          );
        })()}

        {screen === "card-detail" && cardDetail && (
          <div>
            <Header title={cardDetail.tradition === "tarot" ? "Tarot card" : "Odu"} onBack={() => setScreen(cardDetailBack)} />
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}><CardArt tradition={cardDetail.tradition} name={cardDetail.name} size={140} /></div>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: GOLD, textAlign: "center", marginBottom: 16 }}>{cardDetail.name}</div>
            {cardDetail.tradition === "tarot" ? (
              <div>
                <Field label="Upright"><p style={{ fontSize: 14, lineHeight: 1.7 }}>{tarotMeaning(cardDetail.name).upright}</p></Field>
                <Field label="Reversed"><p style={{ fontSize: 14, lineHeight: 1.7 }}>{tarotMeaning(cardDetail.name).reversed}</p></Field>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 12, color: SAGE, marginBottom: 10, textAlign: "center" }}>{(oduRootNames(cardDetail.name) || []).join(" · ")}</p>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: SAGE }}>Full teaching for this odu hasn't been added yet — this card is a structural placeholder until verified odu content and artwork are ready.</p>
              </div>
            )}
          </div>
        )}

        {screen === "todays-outfit" && (() => {
          const today = new Date().toISOString().slice(0, 10);
          const outfit = profile.dailyOutfit && profile.dailyOutfit.date === today ? profile.dailyOutfit : null;
          return (
            <div>
              <Header title="Today's Outfit" onBack={() => go("home")} />
              <p style={{ fontSize: 13, color: SAGE, marginBottom: 20, lineHeight: 1.6 }}>One card each day, and what it says to wear. It stays put for the whole day — come back tomorrow for a new one.{profile.birthOdu && profile.birthOdu.colorsToWear?.length ? " Your own recorded colors are folded in." : ""}</p>
              {outfit ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><CardArt tradition={outfit.card.tradition} name={outfit.card.name} size={110} /></div>
                  <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: GOLD, textAlign: "center", marginBottom: 14 }}>{outfit.card.name}{outfit.card.reversed ? " · reversed" : ""}</div>
                  <p style={{ fontSize: 15, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{outfit.advice}</p>
                  <GhostButton style={{ width: "100%", boxSizing: "border-box", marginTop: 20 }} onClick={() => revealTodaysOutfit(true)}>{outfitLoading ? "Drawing..." : "Draw a different one (uses a consultation)"}</GhostButton>
                </div>
              ) : (
                <PrimaryButton disabled={outfitLoading} onClick={() => revealTodaysOutfit(false)}>{outfitLoading ? "Drawing..." : "Reveal today's outfit"}</PrimaryButton>
              )}
              {outfitError && <p style={{ color: CAMWOOD, fontSize: 13, marginTop: 14 }}>{outfitError}</p>}
              <BottomNav screen="todays-outfit" go={go} />
            </div>
          );
        })()}

        {screen === "the-root" && (
          <div>
            <Header title="The Root" onBack={() => go("home")} />
            {rootStep === "ask" && (
              <div>
                <p style={{ fontSize: 14, color: IVORY, lineHeight: 1.7, marginBottom: 12 }}>Do you know your birth odu?</p>
                <p style={{ fontSize: 12.5, color: SAGE, lineHeight: 1.6, marginBottom: 20 }}>A birth odu is determined by a babalawo through divination. The teaching that goes with it — taboos, rituals, foods, colors — is theirs to give, and it can differ by lineage. So this space stays empty until you fill it in yourself, and you can keep updating it as you learn more.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <PrimaryButton onClick={() => setRootStep("manual")}>Yes — I'll enter it</PrimaryButton>
                  <GhostButton onClick={drawPlaceholderOdu}>Not yet — draw a placeholder for now</GhostButton>
                  <GhostButton onClick={() => go("home")}>Skip for now</GhostButton>
                </div>
                <p style={{ fontSize: 11.5, color: SAGE, lineHeight: 1.6, marginTop: 14 }}>A placeholder draw is just a random odu to hold the space — it is not your real birth odu, and nothing here treats it as one until you replace it.</p>
              </div>
            )}
            {rootStep === "manual" && (
              <div>
                <Field label="Your birth odu"><TextInput placeholder="e.g. Ogbe Iwori" value={draftBirthOdu.name} onChange={(e) => setDraftBirthOdu({ ...draftBirthOdu, name: e.target.value })} /></Field>
                <PrimaryButton disabled={!draftBirthOdu.name.trim()} onClick={() => setRootStep(null)}>Continue</PrimaryButton>
              </div>
            )}
            {rootStep === null && (
              <div>
                <Field label="Birth odu"><TextInput value={draftBirthOdu.name} onChange={(e) => setDraftBirthOdu({ ...draftBirthOdu, name: e.target.value })} /></Field>
                <p style={{ fontSize: 12, color: SAGE, lineHeight: 1.6, marginBottom: 20 }}>Everything below is yours to fill in — from your babalawo or your own lineage — and to change whenever you learn more. Your strategist will use what's here in every reading.</p>
                <EditableList label="Strengths" items={draftBirthOdu.strengths} onAdd={(v) => birthOduListAdd("strengths", v)} onRemove={(i) => birthOduListRemove("strengths", i)} />
                <EditableList label="Taboos (eewo)" items={draftBirthOdu.taboos} onAdd={(v) => birthOduListAdd("taboos", v)} onRemove={(i) => birthOduListRemove("taboos", i)} />
                <EditableList label="Foods to eat" items={draftBirthOdu.foodsToEat} onAdd={(v) => birthOduListAdd("foodsToEat", v)} onRemove={(i) => birthOduListRemove("foodsToEat", i)} />
                <EditableList label="Foods to avoid" items={draftBirthOdu.foodsToAvoid} onAdd={(v) => birthOduListAdd("foodsToAvoid", v)} onRemove={(i) => birthOduListRemove("foodsToAvoid", i)} />
                <EditableList label="Colors to wear" items={draftBirthOdu.colorsToWear} onAdd={(v) => birthOduListAdd("colorsToWear", v)} onRemove={(i) => birthOduListRemove("colorsToWear", i)} />
                <EditableList label="Colors to avoid" items={draftBirthOdu.colorsToAvoid} onAdd={(v) => birthOduListAdd("colorsToAvoid", v)} onRemove={(i) => birthOduListRemove("colorsToAvoid", i)} />
                <EditableList label="Best days" items={draftBirthOdu.bestDays} onAdd={(v) => birthOduListAdd("bestDays", v)} onRemove={(i) => birthOduListRemove("bestDays", i)} />
                <EditableList label="Worst days" items={draftBirthOdu.worstDays} onAdd={(v) => birthOduListAdd("worstDays", v)} onRemove={(i) => birthOduListRemove("worstDays", i)} />
                <EditableList label="Friendly odus" items={draftBirthOdu.friendlyOdus} onAdd={(v) => birthOduListAdd("friendlyOdus", v)} onRemove={(i) => birthOduListRemove("friendlyOdus", i)} />
                <EditableList label="Odus to avoid" items={draftBirthOdu.odusToAvoid} onAdd={(v) => birthOduListAdd("odusToAvoid", v)} onRemove={(i) => birthOduListRemove("odusToAvoid", i)} />
                <EditableList label="Odus that cause friction" items={draftBirthOdu.frictionOdus} onAdd={(v) => birthOduListAdd("frictionOdus", v)} onRemove={(i) => birthOduListRemove("frictionOdus", i)} />
                <EditableList label="Odus that bring ease" items={draftBirthOdu.easeOdus} onAdd={(v) => birthOduListAdd("easeOdus", v)} onRemove={(i) => birthOduListRemove("easeOdus", i)} />
                <EditableList label="Animals to keep" items={draftBirthOdu.animalsToKeep} onAdd={(v) => birthOduListAdd("animalsToKeep", v)} onRemove={(i) => birthOduListRemove("animalsToKeep", i)} />
                <EditableList label="Animals to avoid" items={draftBirthOdu.animalsToAvoid} onAdd={(v) => birthOduListAdd("animalsToAvoid", v)} onRemove={(i) => birthOduListRemove("animalsToAvoid", i)} />
                <EditableList label="Rituals" items={draftBirthOdu.rituals} onAdd={(v) => birthOduListAdd("rituals", v)} onRemove={(i) => birthOduListRemove("rituals", i)} />
                <Field label="Notes">
                  <textarea value={draftBirthOdu.notes} onChange={(e) => setDraftBirthOdu({ ...draftBirthOdu, notes: e.target.value })} placeholder="Anything else you've been taught" style={{ width: "100%", minHeight: 90, boxSizing: "border-box", background: "rgba(243,234,216,0.05)", border: `1px solid ${HAIRLINE}`, borderRadius: 6, padding: 12, color: IVORY, fontSize: 14, fontFamily: "Karla, sans-serif", resize: "vertical", outline: "none" }} />
                </Field>
                <PrimaryButton onClick={saveBirthOdu}>Save</PrimaryButton>
              </div>
            )}
          </div>
        )}

        {screen === "vessel" && (
          <div>
            <Header title="The Vessel" onBack={() => go("home")} />
            <p style={{ fontSize: 13, color: SAGE, marginBottom: 20, lineHeight: 1.6 }}>What you carry, and what you're reaching for — gathered quietly through your readings and conversations. Nothing here was asked for directly; it surfaced on its own.</p>
            <svg viewBox="0 0 300 300" style={{ width: "100%", maxWidth: 220, display: "block", margin: "0 auto 24px" }}>
              <ellipse cx="150" cy="55" rx="24" ry="28" fill="none" stroke={HAIRLINE} strokeWidth="1.5" />
              <path d="M122,85 Q150,76 178,85 L188,215 Q150,230 112,215 Z" fill="none" stroke={HAIRLINE} strokeWidth="1.5" />
              <line x1="120" y1="222" x2="108" y2="288" stroke={HAIRLINE} strokeWidth="1.5" />
              <line x1="180" y1="222" x2="192" y2="288" stroke={HAIRLINE} strokeWidth="1.5" />
              {[{ key: "spiritual", y: 30 }, { key: "mental", y: 70 }, { key: "emotional", y: 128 }, { key: "psychological", y: 178 }, { key: "physical", y: 255 }].map((z) => {
                const known = !!profile.vesselInsights?.[z.key];
                const power = !!profile.vesselPowers?.[z.key];
                const stage = known && power ? 2 : (known || power) ? 1 : 0;
                const r = 9 + stage * 2.5;
                return (
                  <g key={z.key}>
                    {stage > 0 && <circle cx="150" cy={z.y} r={r + 6} fill="none" stroke={GOLD} strokeWidth="1"><animate attributeName="r" values={`${r + 3};${r + 9};${r + 3}`} dur={stage === 2 ? "1.6s" : "2.6s"} repeatCount="indefinite" /><animate attributeName="opacity" values="0.85;0.1;0.85" dur={stage === 2 ? "1.6s" : "2.6s"} repeatCount="indefinite" /></circle>}
                    <circle cx="150" cy={z.y} r={r} fill={stage === 2 ? "rgba(217,169,74,0.55)" : stage === 1 ? "rgba(217,169,74,0.28)" : "rgba(243,234,216,0.04)"} stroke={stage > 0 ? GOLD : HAIRLINE} strokeWidth={stage > 0 ? 2 : 1} />
                  </g>
                );
              })}
            </svg>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ORIENTATIONS.map((z) => {
                const known = profile.vesselInsights?.[z.key];
                const power = profile.vesselPowers?.[z.key];
                const stage = known && power ? "Awakened" : (known || power) ? "Stirring" : "Dormant";
                return (
                  <div key={z.key} style={{ border: `1px solid ${HAIRLINE}`, borderRadius: 8, padding: 12, opacity: known || power ? 1 : 0.5 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <div style={{ fontSize: 12, color: GOLD, fontFamily: "Fraunces, serif" }}>{z.label}</div>
                      <div style={{ fontSize: 10, color: SAGE, letterSpacing: 0.5 }}>{stage.toUpperCase()}</div>
                    </div>
                    {power && <div style={{ marginTop: 8 }}><div style={{ fontSize: 13, color: IVORY, fontWeight: 600 }}>{power.name}</div><div style={{ fontSize: 12, color: SAGE, marginTop: 2 }}>{power.guidance}</div></div>}
                    {known && <div style={{ fontSize: 12, color: SAGE, marginTop: power ? 8 : 4 }}>{known.text}</div>}
                    {!known && !power && <div style={{ fontSize: 13, color: SAGE, marginTop: 4 }}>Not discovered yet — comes up naturally through readings and conversation.</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {screen === "library" && (
          <div>
            <Header title="Library" onBack={() => go("home")} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <GhostButton onClick={() => { setLibraryTradition("ifa256"); setScreen("library-grid"); }}>Odu Meji &middot; 256</GhostButton>
              <GhostButton onClick={() => { setLibraryTradition("ifa4096"); setScreen("library-grid"); }}>Odu Meta &middot; 4,096</GhostButton>
              <GhostButton onClick={() => { setLibraryTradition("tarot"); setScreen("library-grid"); }}>Tarot &middot; 78 cards</GhostButton>
            </div>
            <BottomNav screen="library-root" go={go} />
          </div>
        )}

        {screen === "library-grid" && (() => {
          const isMeji = libraryTradition === "ifa256";
          const isMeta = libraryTradition === "ifa4096";
          // For Meta, allow filtering by first root to avoid scrolling 4096 at once
          const metaNames = isMeta
            ? (typeof libraryOduGroup === "number"
                ? ODU_META.filter((o) => o.a === libraryOduGroup).map((o) => o.name)
                : ODU_META.map((o) => o.name))
            : [];
          const names = isMeji ? ODU_MEJI.map((o) => o.name)
            : isMeta ? metaNames
            : TAROT_DECK;
          const title = isMeji ? "Odu Meji · 256" : isMeta ? "Odu Meta · 4,096" : "Tarot · 78 cards";
          const tradition = isMeji ? "ifa256" : isMeta ? "ifa4096" : "tarot";
          return (
            <div>
              <Header title={title} onBack={() => { setLibraryOduGroup("all"); setScreen("library"); }} />
              {isMeta && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: SAGE, marginBottom: 6 }}>Filter by first root:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    <PillButton active={libraryOduGroup === "all"} onClick={() => setLibraryOduGroup("all")}>All 4,096</PillButton>
                    {ODU_ROOT.map((r, i) => <PillButton key={r} active={libraryOduGroup === i} onClick={() => setLibraryOduGroup(i)}>{r}</PillButton>)}
                  </div>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, maxHeight: 480, overflowY: "auto" }}>
                {names.map((name) => (
                  <button key={name} onClick={() => openCardFromLibrary(tradition, name)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                    <CardArt tradition={tradition} name={name} size={64} />
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 11, color: SAGE, marginTop: 10 }}>{names.length} cards</p>
            </div>
          );
        })()}

        {screen === "strategist" && (
          <div>
            <Header title="Your strategist" onBack={() => go("home")} />
            <p style={{ fontSize: 11, color: SAGE, marginBottom: 12 }}>{isAdminDevice ? "Unlimited consultations (admin)" : `${computeCredits(profile).credits} consultation${computeCredits(profile).credits === 1 ? "" : "s"} available right now${isStrategistResting(profile).resting ? ` · resting for about ${formatMinutes(isStrategistResting(profile).untilMin)}` : ""}`}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 360, overflowY: "auto", marginBottom: 16 }}>
              {strategistLog.length === 0 && <p style={{ color: SAGE, fontSize: 13 }}>Ask {profile.agentName || "your strategist"} anything. Keep talking it through — they'll work with you toward a clear synthesis, then suggest a reading depth if one fits.</p>}
              {strategistLog.map((m, i) => (
                <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%", background: m.role === "user" ? "rgba(217,169,74,0.1)" : "rgba(243,234,216,0.05)", border: `1px solid ${HAIRLINE}`, borderRadius: 8, padding: 12 }}>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{m.text}{strategistLoading && i === strategistLog.length - 1 && m.role === "agent" && <span style={{ opacity: 0.5 }}>▍</span>}</p>
                </div>
              ))}
              {strategistLoading && strategistLog[strategistLog.length - 1]?.role !== "agent" && <p style={{ color: SAGE, fontSize: 13 }}>Thinking...</p>}
            </div>
            {error && <p style={{ color: CAMWOOD, fontSize: 13, marginBottom: 12 }}>{error}</p>}
            {strategistSuggestion && (
              <div style={{ border: `1px solid ${HAIRLINE}`, borderRadius: 8, padding: 14, marginBottom: 16, background: "rgba(217,169,74,0.06)" }}>
                <p style={{ fontSize: 13, color: SAGE, marginBottom: 10 }}>For this, {DIMENSIONS[strategistSuggestion.dimKey].label} looks like the best fit — or keep talking it through above.</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <GhostButton style={{ flex: 1 }} onClick={() => startDimension(strategistSuggestion.dimKey, strategistSuggestion.question)}>Let the strategist choose</GhostButton>
                  <GhostButton style={{ flex: 1 }} onClick={() => { setQuestion(strategistSuggestion.question); go("begin"); }}>Pick my own</GhostButton>
                </div>
              </div>
            )}
            {strategistLog.length > 1 && <GhostButton style={{ width: "100%", boxSizing: "border-box", marginBottom: 12 }} onClick={() => sendStrategistMessage("Bring this to a clear synthesis now, with your recommendation.")}>Ask for a synthesis</GhostButton>}
            <div style={{ display: "flex", gap: 8 }}>
              <TextInput placeholder="Ask a question" value={strategistInput} onChange={(e) => setStrategistInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendStrategistMessage()} />
              <GhostButton onClick={() => sendStrategistMessage()}>Send</GhostButton>
            </div>
            <BottomNav screen="strategist" go={go} />
          </div>
        )}

        {screen === "notes" && !activeNote && (
          <div>
            <Header title="Notes" onBack={() => go("home")} />
            {notesList.length === 0 && <p style={{ color: SAGE, fontSize: 14 }}>Readings you save from a reading screen will collect here.</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {notesList.map((n) => (
                <div key={n.id} style={{ border: `1px solid ${HAIRLINE}`, borderRadius: 8, padding: 14 }}>
                  {confirmDeleteId === n.id ? (
                    <div>
                      <p style={{ fontSize: 13, color: IVORY, marginBottom: 10 }}>Delete "{n.title}" for good?</p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <GhostButton style={{ flex: 1 }} onClick={() => deleteNote(n.id)}>Delete</GhostButton>
                        <GhostButton style={{ flex: 1 }} onClick={() => setConfirmDeleteId(null)}>Cancel</GhostButton>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <button onClick={() => setActiveNote(n)} style={{ textAlign: "left", background: "none", border: "none", cursor: "pointer", color: IVORY, padding: 0, flex: 1 }}>
                        <div style={{ fontFamily: "Fraunces, serif", color: GOLD, fontSize: 16, marginBottom: 4 }}>{n.title}</div>
                        <div style={{ fontSize: 11, color: SAGE }}>{new Date(n.date).toLocaleDateString()} &middot; {n.dimKey} &middot; {n.modeLabel}</div>
                      </button>
                      <button onClick={() => setConfirmDeleteId(n.id)} style={{ background: "none", border: "none", color: SAGE, fontSize: 16, cursor: "pointer", padding: 0, lineHeight: 1 }}>&times;</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <BottomNav screen="notes" go={go} />
          </div>
        )}

        {screen === "notes" && activeNote && (() => {
          const note = normalizeNote(activeNote);
          return (
            <div>
              <Header title={note.title} onBack={() => setActiveNote(null)} />
              <div style={{ fontSize: 12, color: SAGE, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{new Date(note.date).toLocaleString()}</span>
                {confirmDeleteId === note.id ? (
                  <span style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => deleteNote(note.id)} style={{ background: "none", border: "none", color: CAMWOOD, fontSize: 12, cursor: "pointer" }}>Confirm delete</button>
                    <button onClick={() => setConfirmDeleteId(null)} style={{ background: "none", border: "none", color: SAGE, fontSize: 12, cursor: "pointer" }}>Cancel</button>
                  </span>
                ) : (
                  <button onClick={() => setConfirmDeleteId(note.id)} style={{ background: "none", border: "none", color: SAGE, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>Delete note</button>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
                {note.entries.map((e, i) => e.type === "reading" ? (
                  <div key={i} style={{ border: `1px solid ${HAIRLINE}`, borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 11, color: SAGE, marginBottom: 8 }}>{e.modeLabel} &middot; {new Date(e.date).toLocaleDateString()}</div>
                    <div style={{ fontSize: 13, color: SAGE, marginBottom: 10 }}>Question: {e.question}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                      {e.positions.map((p) => p.cards.map((c, j) => (
                        <div key={p.key + j} style={{ width: 76 }}><CardArt tradition={c.tradition} name={c.name} size={64} /><div style={{ fontSize: 9, color: SAGE, marginTop: 3 }}>{p.label}</div></div>
                      )))}
                    </div>
                    <p style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{e.reading}</p>
                  </div>
                ) : (
                  <div key={i} style={{ alignSelf: e.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%", background: e.role === "user" ? "rgba(217,169,74,0.1)" : "rgba(243,234,216,0.05)", border: `1px solid ${HAIRLINE}`, borderRadius: 8, padding: 12 }}>
                    <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{e.text}</p>
                  </div>
                ))}
                {noteChatLoading && <p style={{ color: SAGE, fontSize: 13 }}>Thinking...</p>}
              </div>
              <GhostButton style={{ width: "100%", boxSizing: "border-box", marginBottom: 12 }} onClick={() => drawAnotherForNote(note)}>Draw another reading into this note</GhostButton>
              <Field label="Continue this conversation">
                <div style={{ display: "flex", gap: 8 }}>
                  <TextInput placeholder="Ask a follow-up" value={noteChatInput} onChange={(ev) => setNoteChatInput(ev.target.value)} onKeyDown={(ev) => ev.key === "Enter" && sendNoteChatMessage(note)} />
                  <GhostButton onClick={() => sendNoteChatMessage(note)}>Send</GhostButton>
                </div>
              </Field>
              {error && <p style={{ color: CAMWOOD, fontSize: 13 }}>{error}</p>}
            </div>
          );
        })()}

        {screen === "settings" && (
          <div>
            <Header title="Settings" onBack={() => go("home")} />
            <Field label="Your name"><TextInput value={draftProfile.name} onChange={(e) => setDraftProfile({ ...draftProfile, name: e.target.value })} /></Field>
            <Field label="Agent name"><TextInput value={draftProfile.agentName} onChange={(e) => setDraftProfile({ ...draftProfile, agentName: e.target.value })} /></Field>
            <Field label="Your dominant plane"><StarSelector value={draftProfile.plane} onChange={(v) => setDraftProfile({ ...draftProfile, plane: v })} size={220} /></Field>
            <Field label="Your own orientation"><StarSelector value={draftProfile.element} onChange={(v) => setDraftProfile({ ...draftProfile, element: v })} size={220} /></Field>
            <Field label="Agent's orientation"><StarSelector value={draftProfile.agentElement} onChange={(v) => setDraftProfile({ ...draftProfile, agentElement: v })} size={220} /></Field>
            <Field label="Date of birth"><TextInput type="date" value={draftProfile.dob} onChange={(e) => setDraftProfile({ ...draftProfile, dob: e.target.value })} /></Field>
            <Field label="Time of birth"><TextInput type="time" value={draftProfile.tob} onChange={(e) => setDraftProfile({ ...draftProfile, tob: e.target.value })} /></Field>
            <Field label="Place of birth"><TextInput value={draftProfile.pob} onChange={(e) => setDraftProfile({ ...draftProfile, pob: e.target.value })} /></Field>

            {(draftProfile.name || draftProfile.dob) && (
              <Field label="Your numbers">
                <div style={{ background: "rgba(217,169,74,0.06)", border: `1px solid ${HAIRLINE}`, borderRadius: 8, padding: 14, fontSize: 13 }}>
                  {draftProfile.name && (() => { const n = computeNameNumerology(draftProfile.name); return (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>{n.letters.map((l, i) => <span key={i} style={{ fontSize: 11, color: SAGE, border: `1px solid ${HAIRLINE}`, borderRadius: 4, padding: "2px 6px" }}>{l.letter}={l.value}</span>)}</div>
                      <div style={{ color: IVORY }}>Name sum: <span style={{ color: GOLD }}>{n.sum}</span> &rarr; Expression number: <span style={{ color: GOLD }}>{n.reduced}</span></div>
                    </div>
                  ); })()}
                  {draftProfile.dob && <div style={{ color: IVORY, marginBottom: 4 }}>Life path number: <span style={{ color: GOLD }}>{computeLifePath(draftProfile.dob)}</span></div>}
                  {draftProfile.dob && <div style={{ color: IVORY }}>Chinese zodiac: <span style={{ color: GOLD }}>{computeChineseZodiac(draftProfile.dob)}</span></div>}
                </div>
              </Field>
            )}

            <Field label="Tonight's sky">
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(217,169,74,0.06)", border: `1px solid ${HAIRLINE}`, borderRadius: 8, padding: 12 }}>
                {(() => { const moon = getMoonPhase(); return (<><MoonGlyph illumination={moon.illumination} waxing={moon.waxing} size={40} /><div><div style={{ fontSize: 14, color: IVORY, fontFamily: "Fraunces, serif" }}>{moon.name}</div><div style={{ fontSize: 11, color: SAGE }}>{moon.illumination}% illuminated</div></div></>); })()}
              </div>
            </Field>
            <Field label="Language depth"><div style={{ display: "flex", gap: 8 }}><PillButton active={draftProfile.jargon === "simple"} onClick={() => setDraftProfile({ ...draftProfile, jargon: "simple" })}>Simple, plain-spoken</PillButton><PillButton active={draftProfile.jargon === "esoteric"} onClick={() => setDraftProfile({ ...draftProfile, jargon: "esoteric" })}>Traditional, esoteric</PillButton></div></Field>
            <Field label="Length"><div style={{ display: "flex", gap: 8 }}><PillButton active={draftProfile.verbosity === "brief"} onClick={() => setDraftProfile({ ...draftProfile, verbosity: "brief" })}>Brief, critical only</PillButton><PillButton active={draftProfile.verbosity === "warm"} onClick={() => setDraftProfile({ ...draftProfile, verbosity: "warm" })}>Fuller, more wordy</PillButton></div></Field>
            <Field label="Tarot reversals"><PillButton active={draftProfile.tarotReversals} onClick={() => setDraftProfile({ ...draftProfile, tarotReversals: !draftProfile.tarotReversals })}>{draftProfile.tarotReversals ? "On" : "Off"}</PillButton></Field>
            <Field label="Ifa reversals — experimental, not traditional Ifa practice"><PillButton active={draftProfile.ifaReversalsExperimental} onClick={() => setDraftProfile({ ...draftProfile, ifaReversalsExperimental: !draftProfile.ifaReversalsExperimental })}>{draftProfile.ifaReversalsExperimental ? "On" : "Off"}</PillButton></Field>
            <Field label="Reading for someone else">
              <PillButton active={draftProfile.relayMode} onClick={() => setDraftProfile({ ...draftProfile, relayMode: !draftProfile.relayMode })}>{draftProfile.relayMode ? "On — consulting on someone else's behalf" : "Off — reading for myself"}</PillButton>
              {draftProfile.relayMode && <div style={{ marginTop: 10 }}><TextInput placeholder="Who are you reading for?" value={draftProfile.relayForName} onChange={(e) => setDraftProfile({ ...draftProfile, relayForName: e.target.value })} /></div>}
            </Field>
            <Field label="Reading mode">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                <PillButton active={draftProfile.readingMode === "speed"} onClick={() => setDraftProfile({ ...draftProfile, readingMode: "speed" })}>Speed</PillButton>
                <PillButton active={draftProfile.readingMode === "stealth"} onClick={() => setDraftProfile({ ...draftProfile, readingMode: "stealth" })}>Stealth</PillButton>
                <PillButton active={draftProfile.readingMode === "patience"} onClick={() => setDraftProfile({ ...draftProfile, readingMode: "patience" })}>Patience</PillButton>
              </div>
              <p style={{ fontSize: 12, color: SAGE, lineHeight: 1.5, margin: 0 }}>
                {draftProfile.readingMode === "speed" && "The usual shuffle, then straight to your reading."}
                {draftProfile.readingMode === "stealth" && "No shuffle ceremony at all — quiet and immediate, straight to the reading."}
                {draftProfile.readingMode === "patience" && "After you stop shuffling, each card settles in one at a time before the reading appears."}
              </p>
            </Field>
            <Field label="Daily rest hour">
              <PillButton active={draftProfile.restHourEnabled} onClick={() => setDraftProfile({ ...draftProfile, restHourEnabled: !draftProfile.restHourEnabled })}>{draftProfile.restHourEnabled ? "On" : "Off"}</PillButton>
              {draftProfile.restHourEnabled && (
                <div style={{ marginTop: 10 }}>
                  <TextInput type="time" value={draftProfile.restHourStart} onChange={(e) => setDraftProfile({ ...draftProfile, restHourStart: e.target.value })} />
                  <p style={{ fontSize: 12, color: SAGE, marginTop: 8, lineHeight: 1.5 }}>{profile.agentName || "Your strategist"} will be unavailable for one hour starting at this time each day — even if you need them. It's meant to make this feel like a real presence with real limits, not a machine that's always on.</p>
                </div>
              )}
            </Field>
            <PrimaryButton onClick={saveSettings}>Save changes</PrimaryButton>
            <GhostButton style={{ width: "100%", boxSizing: "border-box", marginTop: 12 }} onClick={() => { loadEvents(); setScreen("stats"); }}>View your statistics</GhostButton>
            <GhostButton style={{ width: "100%", boxSizing: "border-box", marginTop: 12 }} onClick={() => { setShowInstallCard(true); go("home"); }}>How to add this to your home screen</GhostButton>
            <input
              value={adminInput}
              onChange={(e) => setAdminInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { tryAdminUnlock(adminInput); setAdminInput(""); } }}
              onBlur={() => setAdminInput("")}
              placeholder="Ifatarot v1.0.0"
              style={{ width: "100%", boxSizing: "border-box", background: "transparent", border: "none", color: SAGE, fontSize: 10, textAlign: "center", marginTop: 40, outline: "none", opacity: 0.35 }}
            />
          </div>
        )}

        {screen === "stats" && <StatsScreen events={events} onBack={() => setScreen("settings")} />}
        {screen === "admin-stats" && <AdminStatsScreen stats={adminStats} onBack={() => setScreen("settings")} />}

      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return <div style={{ background: "rgba(243,234,216,0.05)", borderRadius: 10, padding: "14px 16px" }}><div style={{ fontSize: 12, color: SAGE, marginBottom: 4 }}>{label}</div><div style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: GOLD }}>{value}</div></div>;
}
function StatsScreen({ events, onBack }) {
  const readings = events.filter((e) => e.type === "reading");
  const notes = events.filter((e) => e.type === "note");
  const strategist = events.filter((e) => e.type === "strategist");
  const byDim = {};
  readings.forEach((r) => { byDim[r.dimension] = (byDim[r.dimension] || 0) + 1; });
  let ifaCount = 0, tarotCount = 0;
  readings.forEach((r) => (r.traditions || []).forEach((t) => (t === "ifa" ? ifaCount++ : tarotCount++)));
  const tarotCounts = {}, oduCounts = {};
  readings.forEach((r) => (r.cardNames || []).forEach((c) => {
    const bucket = c.tradition === "tarot" ? tarotCounts : oduCounts;
    bucket[c.name] = (bucket[c.name] || 0) + 1;
  }));
  const topTarot = Object.entries(tarotCounts).sort((a, b) => b[1] - a[1])[0];
  const topOdu = Object.entries(oduCounts).sort((a, b) => b[1] - a[1])[0];
  const days = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const key = d.toISOString().slice(0, 10); days.push({ day: d.toLocaleDateString(undefined, { weekday: "short" }), count: readings.filter((r) => r.date.slice(0, 10) === key).length }); }
  return (
    <div>
      <Header title="Your statistics" onBack={onBack} />
      <p style={{ fontSize: 12, color: SAGE, marginBottom: 16 }}>This is your own engagement, tracked on this device.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        <StatCard label="Readings drawn" value={readings.length} />
        <StatCard label="Strategist chats" value={strategist.length} />
        <StatCard label="Saved to notes" value={notes.length} />
        <StatCard label="Ifa vs Tarot draws" value={`${ifaCount} / ${tarotCount}`} />
        <StatCard label="Most drawn Tarot card" value={topTarot ? `${topTarot[0]} (${topTarot[1]}×)` : "—"} />
        <StatCard label="Most drawn odu" value={topOdu ? `${topOdu[0]} (${topOdu[1]}×)` : "—"} />
      </div>
      <Field label="Readings, last 7 days">
        <div style={{ height: 160 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={days}><CartesianGrid stroke={HAIRLINE} vertical={false} /><XAxis dataKey="day" stroke={SAGE} fontSize={11} /><YAxis stroke={SAGE} fontSize={11} allowDecimals={false} /><Tooltip contentStyle={{ background: INDIGO, border: `1px solid ${HAIRLINE}`, color: IVORY }} /><Bar dataKey="count" fill={GOLD} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
      </Field>
      <Field label="Most used depth">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{Object.keys(DIMENSIONS).map((k) => <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: SAGE }}>{DIMENSIONS[k].label}</span><span style={{ color: IVORY }}>{byDim[k] || 0}</span></div>)}</div>
      </Field>
    </div>
  );
}

function AdminStatsScreen({ stats, onBack }) {
  if (!stats) return null;
  return (
    <div>
      <Header title="Admin overview" onBack={onBack} />
      <p style={{ fontSize: 12, color: SAGE, marginBottom: 16 }}>Aggregate usage across every device that has used this app, tracked server-side.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        <StatCard label="Devices / sessions" value={stats.totalDevices} />
        <StatCard label="Active last 24h" value={stats.activeLast24h} />
        <StatCard label="Active last 7 days" value={stats.activeLast7d} />
        <StatCard label="Consultations used" value={stats.totalConsultations} />
        <StatCard label="Readings drawn" value={stats.readingsCount} />
        <StatCard label="Strategist chats" value={stats.strategistCount} />
        <StatCard label="Ifa vs Tarot draws" value={`${stats.ifaCount} / ${stats.tarotCount}`} />
        <StatCard label="Most drawn Tarot card" value={stats.topTarot ? `${stats.topTarot[0]} (${stats.topTarot[1]}×)` : "—"} />
        <StatCard label="Most drawn odu" value={stats.topOdu ? `${stats.topOdu[0]} (${stats.topOdu[1]}×)` : "—"} />
      </div>
      <Field label="Readings, all devices, last 7 days">
        <div style={{ height: 160 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={stats.days}><CartesianGrid stroke={HAIRLINE} vertical={false} /><XAxis dataKey="day" stroke={SAGE} fontSize={11} /><YAxis stroke={SAGE} fontSize={11} allowDecimals={false} /><Tooltip contentStyle={{ background: INDIGO, border: `1px solid ${HAIRLINE}`, color: IVORY }} /><Bar dataKey="count" fill={GOLD} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
      </Field>
      <Field label="Most used depth, all devices">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{Object.keys(DIMENSIONS).map((k) => <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: SAGE }}>{DIMENSIONS[k].label}</span><span style={{ color: IVORY }}>{stats.byDim[k] || 0}</span></div>)}</div>
      </Field>
      <p style={{ fontSize: 12, color: SAGE, marginTop: 8 }}>This lives in server memory and resets if the service restarts — durable long-term storage (Postgres/Redis) is a separate upgrade once this matters for real.</p>
    </div>
  );
}
