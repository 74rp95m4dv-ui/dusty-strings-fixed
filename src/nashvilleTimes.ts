import { GameState, getTheme, fmtMoney, MANAGERS, fmtDuration, fmtPercent } from "./gameLogic";

export interface NewspaperStory {
  section: "Front Page" | "Country" | "Blues" | "Industry" | "Scene" | "Charts" | "Local";
  headline: string;
  byline: string;
  body: string;
  isPlayer?: boolean;
}

export interface LetterToEditor {
  signature: string;
  city: string;
  body: string;
  tone: "praise" | "critical" | "fan" | "industry" | "weird";
}

export interface NewspaperIssue {
  volume: number;
  issue: number;
  week: number;
  weather: string;
  stories: NewspaperStory[];
  letters?: LetterToEditor[];
}

const NPC_ARTISTS = [
  "Hank Monroe","Waylon Rhodes","Cody Tucker","Lainey Harlow","Beau Travis",
  "Earl Frizzell III","Lefty Acuff","Travis Boone","Wade Owens","Garth Macon",
  "Charlie Cobb","Rosie Webb","Stella Lane","Dale Doss","Lyle Hayes","Junior Tubb",
  "Mae Carter Williams","Reverend Otis King","Howlin' Sam Cross","Lightnin' Joe Waters",
  "Blind Roy Davis","Magic Slim Turner","Delta Pearl","Iris Holloway","Buddy Sims",
  "Dock Frizzell","Floyd Gentry","Glen Boone","Jessie Cline","Porter Sayles",
  "Stonewall Lovett","Muddy Black","Son Bayou","Elmore Crockett","Buck Tucker",
  "The Hellbenders","The Crossroad Kings","The Backroad Saints","The Honky Tonk Outfit",
  "The Delta Moan","The Bottle Rockets","The Midnight Riders","The Dust Devils",
  "The Gospel Train","The Ramblin' Ghosts","Sister Mae & The Holy Rollers",
  "The Gravel Yard","The Tin Roof Choir","Cordelia & the Hard Lines",
];

const VENUES = [
  "the Ryman","the Bluebird Cafe","Tootsie's","Robert's Western World","the Exit/In",
  "the Station Inn","Brooklyn Bowl Nashville","the Basement East","3rd & Lindsley",
  "Antone's in Austin","the Continental Club","Buddy Guy's Legends","the House of Blues",
  "the Apollo","the Beacon","Red Rocks","the Hollywood Bowl","the Fillmore",
  "the Fox Theatre","the Cain's Ballroom","the Grand Ole Opry","the Ascend Amphitheater",
];

const CITIES = [
  "Nashville","Memphis","Austin","Muscle Shoals","New Orleans","Chicago","Tulsa",
  "Bakersfield","Asheville","Atlanta","Houston","Macon","Clarksdale","Lubbock",
];

const LABELS = [
  "Big Loud","Mercury Nashville","Sony Music Nashville","Capitol Nashville",
  "Stoney Creek","Triple Tigers","Thirty Tigers","New West","Easy Eye Sound",
  "Alligator Records","Concord","Nonesuch","Single Lock","Dualtone",
];

const PRODUCERS = [
  "Dave Cobb","Jay Joyce","Shooter Jennings","T Bone Burnett","Rick Rubin",
  "Daniel Tashian","Joe Henry","Buddy Miller","Tom Schick","Cassidy Turbin",
];

const FESTIVALS = [
  "Bonnaroo","Stagecoach","Pilgrimage","CMA Fest","Bourbon & Beyond",
  "Newport Folk Festival","Telluride Bluegrass","King Biscuit Blues Festival",
  "Crossroads Festival","Hardly Strictly Bluegrass","Americanafest",
];

const WEATHER = [
  "Cool morning, low fog over the Cumberland.",
  "Hot week ahead — sweet tea weather across the South.",
  "Storms rolling through East Tennessee. Mind the back roads.",
  "Crisp air, neon sharp. Boots-on-the-floor weather.",
  "First frost in the holler. Coffee tastes better.",
  "Long shadows, longer setlists. Festival season is here.",
  "Honky-tonk humidity. Pedal steels are crying.",
  "Dry winds out of Texas. Whiskey cures everything.",
];

const FIRST = ["Annie","Bobby","Carla","Darlene","Earl","Frank","Gracie","Hank","Iris","Jesse","Kay","Lena","Mae","Otis","Pearl","Ruby","Sonny","Tommy","Vera","Willie"];
const LAST = ["Monroe","Cash","Williams","Stone","King","Waters","Walker","Brown","Hayes","Cobb","Holt","Boone","Sims","Frizzell","Tubb","Wills","Wells","Lynn"];
const REPORTERS = Array.from({length:14},() =>
  FIRST[Math.floor(Math.random()*FIRST.length)] + " " + LAST[Math.floor(Math.random()*LAST.length)]
);

function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }
function pickOther<T>(a: T[], not: T): T { let v = pick(a); let n=0; while(v===not && n<6){ v=pick(a); n++; } return v; }
function num(min:number,max:number){ return Math.floor(min+Math.random()*(max-min+1)); }
function ord(n:number){ const s=["th","st","nd","rd"], v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); }

// ── COUNTRY STORY TEMPLATES ────────────────────────────────
const COUNTRY_STORIES: ((s:GameState)=>NewspaperStory)[] = [
  () => { const a=pick(NPC_ARTISTS); const n=num(2,12);
    return { section:"Country", headline:`${a.toUpperCase()} ANNOUNCES ${ord(n).toUpperCase()} ALBUM`,
      byline:`By ${pick(REPORTERS)}`,
      body:`${a} confirmed a new full-length, "${pick(["Backroad Hymns","Dust on the Dashboard","Hard County Light","Whiskey & Wire","Last Cigarette","The Long Way Down","Tennessee Bones","Cold Coffee Sundays"])}", due out next quarter through ${pick(LABELS)}. Producer ${pick(PRODUCERS)} is at the boards.`}; },
  () => { const a=pick(NPC_ARTISTS), b=pickOther(NPC_ARTISTS,a);
    return { section:"Country", headline:`${a.toUpperCase()} & ${b.toUpperCase()} TEAM UP FOR DUET`,
      byline:`By ${pick(REPORTERS)}`,
      body:`A surprise studio session in ${pick(CITIES)} produced what insiders are calling "the heartbreak duet of the year." Single drops Friday.`}; },
  () => { const a=pick(NPC_ARTISTS); const n=num(8,40);
    return { section:"Country", headline:`${a.toUpperCase()} SELLS OUT ${n}-DATE TOUR IN HOURS`,
      byline:`By ${pick(REPORTERS)}`,
      body:`The "${pick(["Hard Country","Honky Tonk Heaven","Ride or Cry","Down Home","No Quitter"])}" Tour moved nearly half a million tickets before lunch. Resale prices are already brutal.`}; },
  () => { const a=pick(NPC_ARTISTS);
    return { section:"Country", headline:`${a.toUpperCase()} ARRESTED OUTSIDE BROADWAY HONKY-TONK`,
      byline:`By ${pick(REPORTERS)}`,
      body:`Police were called to ${pick(VENUES)} after a 2 a.m. altercation. ${a}'s publicist released a statement calling it "a misunderstanding involving a borrowed cowboy hat."`}; },
  () => { const a=pick(NPC_ARTISTS);
    return { section:"Country", headline:`${a.toUpperCase()} LEAVES ${pick(LABELS).toUpperCase()}`,
      byline:`By ${pick(REPORTERS)}`,
      body:`After three records and a famously testy renegotiation, ${a} is going independent. "I'm done asking permission," the artist said in a one-line statement.`}; },
  () => { const a=pick(NPC_ARTISTS);
    return { section:"Country", headline:`${a.toUpperCase()} CANCELS REMAINING TOUR DATES`,
      byline:`By ${pick(REPORTERS)}`,
      body:`Citing "exhaustion and the long road," ${a} pulled the plug on ${num(4,18)} remaining shows. Refunds are processing this week.`}; },
  () => { const a=pick(NPC_ARTISTS);
    return { section:"Country", headline:`${a.toUpperCase()} DEBUTS AT #${num(1,15)} ON COUNTRY CHART`,
      byline:`By ${pick(REPORTERS)}`,
      body:`The single "${pick(["Half a Heart","Cold Beer Sunday","Two-Lane Lord","She Took the Truck","Honky Tonk Hangover"])}" pulled ${num(3,22)} million streams in its first week.`}; },
  () => { const a=pick(NPC_ARTISTS);
    return { section:"Country", headline:`${a.toUpperCase()} OPENS BAR ON LOWER BROADWAY`,
      byline:`By ${pick(REPORTERS)}`,
      body:`Yet another artist-branded honky-tonk opens its doors next month. Locals are not amused.`}; },
];

// ── BLUES STORY TEMPLATES ──────────────────────────────────
const BLUES_STORIES: ((s:GameState)=>NewspaperStory)[] = [
  () => { const a=pick(NPC_ARTISTS); const n=num(3,11);
    return { section:"Blues", headline:`${a.toUpperCase()} RELEASES ${ord(n).toUpperCase()} STUDIO RECORD`,
      byline:`By ${pick(REPORTERS)}`,
      body:`${a}'s new album "${pick(["Delta Reckoning","Hellhound's Lament","Crossroads at Midnight","Twelve Bars Down","Mississippi Smoke","Slide & Sin","Hill Country Holler"])}" is being called the artist's most stripped-back work since their debut.`}; },
  () => { const a=pick(NPC_ARTISTS);
    return { section:"Blues", headline:`${a.toUpperCase()} HONORED AT ${pick(["BLUES MUSIC AWARDS","HANDY AWARDS","CHICAGO BLUES HALL OF FAME"])}`,
      byline:`By ${pick(REPORTERS)}`,
      body:`The lifetime nod recognizes ${num(20,55)} years on the road. ${a} performed three songs and gave a five-word acceptance speech: "I just love the music."`}; },
  () => { const a=pick(NPC_ARTISTS);
    return { section:"Blues", headline:`${a.toUpperCase()} ACCUSES MAJOR LABEL OF "STEALING THE BLUES"`,
      byline:`By ${pick(REPORTERS)}`,
      body:`In a long open letter posted overnight, ${a} accused ${pick(LABELS)} of marketing watered-down blues to mainstream audiences. The label has not responded.`}; },
  () => { const a=pick(NPC_ARTISTS);
    return { section:"Blues", headline:`LEGENDARY GUITARIST ${a.toUpperCase()} JOINS ${pick(NPC_ARTISTS).toUpperCase()}'S BAND`,
      byline:`By ${pick(REPORTERS)}`,
      body:`The collaboration was unveiled at a surprise late-night set at ${pick(VENUES)}. The room reportedly went dead quiet during the slow numbers.`}; },
  () => { const a=pick(NPC_ARTISTS);
    return { section:"Blues", headline:`${a.toUpperCase()} TO RECORD LIVE ALBUM AT ${pick(VENUES).toUpperCase()}`,
      byline:`By ${pick(REPORTERS)}`,
      body:`Two nights only, capacity capped, no phones allowed. Tickets went on sale at noon and were gone by 12:04.`}; },
  () => { const a=pick(NPC_ARTISTS);
    return { section:"Blues", headline:`BLUES PIONEER REMEMBERED AT ${pick(CITIES).toUpperCase()} TRIBUTE`,
      byline:`By ${pick(REPORTERS)}`,
      body:`A packed house turned out to honor a generation of players. ${a} closed the night with a slow burner that left no dry eyes in the building.`}; },
];

// ── INDUSTRY STORY TEMPLATES ───────────────────────────────
const INDUSTRY_STORIES: ((s:GameState)=>NewspaperStory)[] = [
  () => ({ section:"Industry", headline:`${pick(LABELS).toUpperCase()} ANNOUNCES NEW NASHVILLE A&R PUSH`,
    byline:`By ${pick(REPORTERS)}`,
    body:`The label is opening a Music Row office and reportedly signing ${num(3,8)} new acts before year-end. Indies are quietly worried.`}),
  () => ({ section:"Industry", headline:`STREAMING PAYOUTS DROP AGAIN, ARTISTS PUSH BACK`,
    byline:`By ${pick(REPORTERS)}`,
    body:`A coalition of mid-tier touring acts is calling for transparent per-stream rates. The platforms responded with a press release nobody read.`}),
  () => ({ section:"Industry", headline:`${pick(PRODUCERS).toUpperCase()} OPENS NEW STUDIO IN ${pick(CITIES).toUpperCase()}`,
    byline:`By ${pick(REPORTERS)}`,
    body:`The room is wired with a vintage console pulled from a closed studio in ${pick(CITIES)}. Booking is "by phone only — no email."`}),
  () => ({ section:"Industry", headline:`MERGER TALKS HEAT UP BETWEEN ${pick(LABELS).toUpperCase()} & ${pick(LABELS).toUpperCase()}`,
    byline:`By ${pick(REPORTERS)}`,
    body:`Sources close to the talks say the deal could reshape the country and Americana landscape. Several artist contracts are reportedly already in renegotiation.`}),
  () => ({ section:"Industry", headline:`AI-GENERATED COUNTRY SONGS DRAW BACKLASH`,
    byline:`By ${pick(REPORTERS)}`,
    body:`A handful of synthetic tracks cracked the lower end of the country chart this week. Songwriter unions are demanding disclosure rules. Listeners say they "could just tell."`}),
  () => ({ section:"Industry", headline:`VINYL OUTSELLS DIGITAL FOR ${ord(num(3,9)).toUpperCase()} STRAIGHT QUARTER`,
    byline:`By ${pick(REPORTERS)}`,
    body:`Pressing plants remain backed up. Indie acts are reportedly waiting up to nine months for runs of 500 LPs.`}),
];

// ── SCENE STORY TEMPLATES ──────────────────────────────────
const SCENE_STORIES: ((s:GameState)=>NewspaperStory)[] = [
  () => ({ section:"Scene", headline:`${pick(FESTIVALS).toUpperCase()} ANNOUNCES ${num(60,140)}-ARTIST LINEUP`,
    byline:`By ${pick(REPORTERS)}`,
    body:`Headliners include ${pick(NPC_ARTISTS)}, ${pick(NPC_ARTISTS)}, and ${pick(NPC_ARTISTS)}. Single-day passes are already moving.`}),
  () => ({ section:"Scene", headline:`${pick(VENUES).toUpperCase()} CLOSES AFTER ${num(20,80)} YEARS`,
    byline:`By ${pick(REPORTERS)}`,
    body:`Owners cite rising rents and "the changed shape of live music." A final tribute show is being planned for next month.`}),
  () => ({ section:"Scene", headline:`NEW LISTENING ROOM OPENS IN ${pick(CITIES).toUpperCase()}`,
    byline:`By ${pick(REPORTERS)}`,
    body:`200 seats. No talking. The waiting list for songwriter slots is already two months deep.`}),
  () => ({ section:"Scene", headline:`SONGWRITER ROUND AT ${pick(VENUES).toUpperCase()} GOES VIRAL`,
    byline:`By ${pick(REPORTERS)}`,
    body:`A late-night clip of an unsigned artist trading verses with ${pick(NPC_ARTISTS)} has been viewed over ${num(3,40)} million times.`}),
  () => ({ section:"Scene", headline:`${pick(NPC_ARTISTS).toUpperCase()} DONATES TOUR PROCEEDS TO ${pick(["FLOOD RELIEF","TORNADO RECOVERY","MUSICIANS' HEALTH FUND","RURAL ARTS PROGRAM"])}`,
    byline:`By ${pick(REPORTERS)}`,
    body:`The total came to roughly $${num(40,400)},000, paid out across ${num(3,12)} regional organizations. Quietly, no press conference.`}),
  () => ({ section:"Scene", headline:`UNDERGROUND BLUES NIGHT GROWS INTO MONTHLY EVENT`,
    byline:`By ${pick(REPORTERS)}`,
    body:`What started as a basement jam in ${pick(CITIES)} now draws ${num(150,500)} people. Organizers swear they're "not turning it into a brand."`}),
];

// ── CHART / TREND STORIES ──────────────────────────────────
const CHART_STORIES: ((s:GameState)=>NewspaperStory)[] = [
  (s) => { const trendC=s.trends?.Country??1, trendB=s.trends?.Blues??1;
    const hot = trendC>trendB ? "Country" : "Blues";
    const cool = hot==="Country" ? "Blues" : "Country";
    return { section:"Charts", headline:`${hot.toUpperCase()} STREAMS UP, ${cool.toUpperCase()} HOLDS STEADY`,
      byline:`By ${pick(REPORTERS)}`,
      body:`This month's tracking shows ${hot.toLowerCase()} listeners driving the bulk of growth. Analysts blame "${pick(["a TikTok cycle","tour season","the algorithm","seasonal nostalgia","that one viral cover"])}" for the swing.`}; },
  () => ({ section:"Charts", headline:`${pick(NPC_ARTISTS).toUpperCase()} HOLDS #1 FOR ${ord(num(2,11)).toUpperCase()} STRAIGHT WEEK`,
    byline:`By ${pick(REPORTERS)}`,
    body:`No challenger came close. Industry watchers are now openly asking when, if ever, the song will get knocked off.`}),
  () => ({ section:"Charts", headline:`SURPRISE INDIE RELEASE CRACKS TOP ${num(10,40)}`,
    byline:`By ${pick(REPORTERS)}`,
    body:`Self-released, no marketing budget, no label. ${pick(NPC_ARTISTS)}'s new single is the kind of story Music Row pretends it loves.`}),
  (s) => {
    const th = getTheme(s.currentTrendTheme);
    const themeName = th?.name ?? "heartbreak";
    const lc = themeName.toLowerCase();
    const flavors: Record<string,string> = {
      heartbreak:`Programmers say the breakup ballads are testing through the roof — A&R reps are scrambling to find the next torch song.`,
      whiskey:   `Bar-tab anthems are dominating playlists. Distilleries can't seem to keep up either.`,
      hometown:  `Small-town pride songs are landing hard. Co-writers are pitching nothing but porch-light imagery this month.`,
      road:      `Highway songs are back. Festival bookers are leaning into the wide-open feeling for summer slates.`,
      faith:     `Sunday-morning material is moving units. Gospel-tinged country is back on the major-label radar.`,
      loss:      `Eulogy ballads and grief songs are cutting through. Listeners want catharsis, apparently.`,
      outlaw:    `The black-hat songs are charting again. Programmers are talking about a new outlaw cycle.`,
      workingman:`Working-class anthems are pulling huge streams. Truck-stop jukeboxes are spinning nothing else.`,
      love:      `Sweet love songs are back in fashion. Wedding playlists are driving streams hard.`,
      nostalgia: `Throwback country is having a moment. Listeners want the sound of a transistor radio.`,
      redemption:`Comeback and second-chance songs are landing — playlists are full of them.`,
      freedom:   `Wide-open songs about freedom are spiking. The driving-with-the-windows-down energy is back.`,
    };
    const body = flavors[s.currentTrendTheme ?? ""] ?? `${themeName} songs are having a moment in Nashville this cycle.`;
    return {
      section:"Charts",
      headline:`${lc.toUpperCase()} SONGS ARE WHAT NASHVILLE WANTS RIGHT NOW`,
      byline:`By ${pick(REPORTERS)}`,
      body,
    };
  },
];

// ── LOCAL / COLOR STORIES ──────────────────────────────────
const LOCAL_STORIES: ((s:GameState)=>NewspaperStory)[] = [
  () => ({ section:"Local", headline:`BROADWAY NEON OUTAGE LEAVES BANDS PLAYING IN THE DARK`,
    byline:`By ${pick(REPORTERS)}`,
    body:`A transformer fire knocked out three blocks for ${num(2,7)} hours Saturday night. Several bands kept playing acoustic. Tips were reportedly excellent.`}),
  () => ({ section:"Local", headline:`HISTORIC ${pick(["RECORDING STUDIO","DANCE HALL","RADIO STATION","JUKEBOX"])} GETS LANDMARK STATUS`,
    byline:`By ${pick(REPORTERS)}`,
    body:`Preservationists are calling it a long-overdue win. The owner just wants the parking situation fixed.`}),
  () => ({ section:"Local", headline:`SONGWRITER FOUND ASLEEP IN ${pick(VENUES).toUpperCase()} BOOTH`,
    byline:`By ${pick(REPORTERS)}`,
    body:`Staff didn't have the heart to wake them. The notebook on the table contained, witnesses said, "the saddest line anybody had ever read."`}),
  () => ({ section:"Local", headline:`STRAY DOG ADOPTED BY HOUSE BAND AT ${pick(VENUES).toUpperCase()}`,
    byline:`By ${pick(REPORTERS)}`,
    body:`The dog, now named "Reverb," sleeps under the pedal steel and has reportedly never once barked during a slow song.`}),
  () => ({ section:"Local", headline:`MUSIC ROW PARKING METER PRICES SPARK PROTEST SONGS`,
    byline:`By ${pick(REPORTERS)}`,
    body:`At least ${num(3,12)} new tunes about the city's parking enforcement have been registered with the songwriter's guild this month.`}),
];

// ── NPC RIVALRY & FEUD STORIES ─────────────────────────────
const NPC_RIVALRY_STORIES: ((s:GameState)=>NewspaperStory)[] = [
  () => { const a=pick(NPC_ARTISTS), b=pickOther(NPC_ARTISTS,a);
    return { section:"Front Page",
      headline:`${a.toUpperCase()} CALLS OUT ${b.toUpperCase()} IN ROLLING STONE INTERVIEW`,
      byline:`By ${pick(REPORTERS)}`,
      body:`In an interview that has Music Row buzzing, ${a} described ${b}'s recent output as "plastic country for people who've never left the suburbs." ${b}'s camp has not responded officially, though a cryptic Instagram post appeared and was deleted within the hour.`}; },
  () => { const a=pick(NPC_ARTISTS), b=pickOther(NPC_ARTISTS,a);
    return { section:"Country",
      headline:`TWITTER FEUD BETWEEN ${a.toUpperCase()} AND ${b.toUpperCase()} SPILLS INTO REAL LIFE`,
      byline:`By ${pick(REPORTERS)}`,
      body:`What started as a subtweet about "authenticity" escalated when the two artists found themselves at the same songwriter showcase in ${pick(CITIES)}. Witnesses say the handshake was "technically a handshake." Both camps declined to comment.`}; },
  () => { const a=pick(NPC_ARTISTS), b=pickOther(NPC_ARTISTS,a);
    return { section:"Industry",
      headline:`${a.toUpperCase()} AND ${b.toUpperCase()} FIGHT OVER ${pick(["PUBLISHING RIGHTS","A SONG CREDIT","A PRODUCERS CHAIR","A CO-WRITE"])}`,
      byline:`By ${pick(REPORTERS)}`,
      body:`Legal filings obtained this week reveal a months-long dispute over a ${pick(["hit single","Grammy-nominated track","unreleased album cut","viral livestream clip"])}. Both artists insist they wrote it alone. The songwriting community is divided.`}; },
  () => { const a=pick(NPC_ARTISTS), b=pickOther(NPC_ARTISTS,a);
    return { section:"Scene",
      headline:`${a.toUpperCase()} REFUSES FESTIVAL SLOT AFTER LEARNING ${b.toUpperCase()} IS HEADLINING`,
      byline:`By ${pick(REPORTERS)}`,
      body:`${pick(FESTIVALS)} organizers confirmed they had to rebuild the entire Saturday lineup after ${a} pulled out. "Creative and personal differences" was the only statement issued. ${b} has since posted three sun-is-shining photos and called it "a great week."`}; },
  () => { const a=pick(NPC_ARTISTS), b=pickOther(NPC_ARTISTS,a);
    return { section:"Country",
      headline:`OLD BEEF RESURFACES: ${a.toUpperCase()} SAMPLES ${b.toUpperCase()} WITHOUT ASKING`,
      byline:`By ${pick(REPORTERS)}`,
      body:`A ${num(3,15)}-year-old recording by ${b} appears — unlicensed, sources say — on ${a}'s newest release. ${b} issued a terse statement: "My lawyer is aware." ${a}'s camp called it "an homage."`}; },
  () => { const a=pick(NPC_ARTISTS), b=pickOther(NPC_ARTISTS,a);
    return { section:"Scene",
      headline:`${a.toUpperCase()} AND ${b.toUpperCase()} PATCH THINGS UP ONSTAGE AT ${pick(VENUES).toUpperCase()}`,
      byline:`By ${pick(REPORTERS)}`,
      body:`After ${num(1,4)} years of very public silence, the two appeared side by side for a surprise closing number at ${pick(FESTIVALS)}. They sang a Hank Williams cover and left separately. Industry insiders called it "progress, maybe."`}; },
];

// ── NPC COMEBACK STORIES ────────────────────────────────────
const NPC_COMEBACK_STORIES: ((s:GameState)=>NewspaperStory)[] = [
  () => { const a=pick(NPC_ARTISTS);
    return { section:"Front Page",
      headline:`${a.toUpperCase()} RETURNS AFTER ${num(2,8)}-YEAR SILENCE`,
      byline:`By ${pick(REPORTERS)}`,
      body:`The artist who walked off a ${pick(FESTIVALS)} stage in ${2025-num(2,8)} and disappeared has resurfaced with a new single and a one-paragraph statement: "I needed to hear silence for a while." The song is the best thing they've ever recorded.`}; },
  () => { const a=pick(NPC_ARTISTS);
    return { section:"Country",
      headline:`${a.toUpperCase()} BACK ON THE ROAD AFTER HEALTH BATTLE`,
      byline:`By ${pick(REPORTERS)}`,
      body:`After a ${num(6,24)}-month recovery that was never publicly confirmed, ${a} returned to the stage at ${pick(VENUES)} in ${pick(CITIES)}. The standing ovation lasted through the full intro. "I missed it more than I can say," the artist told the crowd.`}; },
  () => { const a=pick(NPC_ARTISTS);
    return { section:"Blues",
      headline:`LEGEND ${a.toUpperCase()} ANNOUNCES FINAL TOUR, AGAIN`,
      byline:`By ${pick(REPORTERS)}`,
      body:`This marks the ${pick(["third","fourth","second","fifth"])} farewell run announced by ${a} in the past ${num(10,20)} years. Nobody is complaining. The shows reportedly still destroy.`}; },
  () => { const a=pick(NPC_ARTISTS);
    return { section:"Industry",
      headline:`${a.toUpperCase()} SIGNS WITH ${pick(LABELS).toUpperCase()} AFTER DECADE ON OWN`,
      byline:`By ${pick(REPORTERS)}`,
      body:`"The terms are different now," ${a} told the Times. After ${num(8,14)} years releasing music independently and building a fiercely loyal fanbase, the artist says the label finally agreed to their terms — not the other way around.`}; },
  () => { const a=pick(NPC_ARTISTS);
    return { section:"Scene",
      headline:`${a.toUpperCase()}'S UNEXPECTED LIVESTREAM DRAWS ${num(80,600)}K VIEWERS`,
      byline:`By ${pick(REPORTERS)}`,
      body:`With no announcement, no promotion, and no set list, ${a} played ${num(2,4)} hours from what appeared to be a kitchen in ${pick(CITIES)}. The stream became the most-clipped music moment of the month.`}; },
];

// ── NPC PERSONAL LIFE STORIES ──────────────────────────────
const NPC_PERSONAL_STORIES: ((s:GameState)=>NewspaperStory)[] = [
  () => { const a=pick(NPC_ARTISTS);
    return { section:"Scene",
      headline:`${a.toUpperCase()} MARRIES IN SURPRISE CEREMONY AT ${pick(VENUES).toUpperCase()}`,
      byline:`By ${pick(REPORTERS)}`,
      body:`Guests believed they were attending a "private listening party." The couple exchanged vows between the second and third sets. The band played on.`}; },
  () => { const a=pick(NPC_ARTISTS);
    return { section:"Scene",
      headline:`${a.toUpperCase()} AND PARTNER ANNOUNCE SPLIT`,
      byline:`By ${pick(REPORTERS)}`,
      body:`A joint statement described the separation as "mutual, loving, and boring to explain." The next album will reportedly be about it.`}; },
  () => { const a=pick(NPC_ARTISTS);
    return { section:"Local",
      headline:`${a.toUpperCase()} OPENS ANIMAL SHELTER IN ${pick(CITIES).toUpperCase()}`,
      byline:`By ${pick(REPORTERS)}`,
      body:`The facility can house ${num(40,120)} animals and is funded entirely by ${a}'s touring income. "I'm on the road enough," the artist said. "Least I can do is give somebody a bed."`}; },
  () => { const a=pick(NPC_ARTISTS);
    return { section:"Scene",
      headline:`${a.toUpperCase()} CHECKS INTO REHABILITATION FACILITY`,
      byline:`By ${pick(REPORTERS)}`,
      body:`A statement from the artist's team said the decision was voluntary and that upcoming shows would be rescheduled. "Health first" was the full text of the announcement. The music community responded with overwhelming support.`}; },
  () => { const a=pick(NPC_ARTISTS);
    return { section:"Scene",
      headline:`${a.toUpperCase()} WELCOMES FIRST CHILD, TAKES TOURING HIATUS`,
      byline:`By ${pick(REPORTERS)}`,
      body:`The announcement was made in a hand-written note posted to social media. The remaining ${num(8,22)} tour dates have been postponed to next year. "Some things are louder than an arena," the post read.`}; },
  () => { const a=pick(NPC_ARTISTS);
    return { section:"Blues",
      headline:`${a.toUpperCase()} RETURNS TO HOMETOWN FOR FIRST SHOW IN ${num(10,35)} YEARS`,
      byline:`By ${pick(REPORTERS)}`,
      body:`The sold-out show at a ${num(200,600)}-seat venue in ${pick(CITIES)} lasted ${num(2,4)} hours. Childhood friends filled the first three rows. The encore was a song the artist has never performed live before.`}; },
];

// ── NPC LEGAL & BUSINESS STORIES ───────────────────────────
const NPC_LEGAL_STORIES: ((s:GameState)=>NewspaperStory)[] = [
  () => { const a=pick(NPC_ARTISTS), l=pick(LABELS);
    return { section:"Industry",
      headline:`${a.toUpperCase()} SUES ${l.toUpperCase()} FOR MASTERS`,
      byline:`By ${pick(REPORTERS)}`,
      body:`In a filing that legal observers are calling aggressive but not unprecedented, ${a} is seeking full ownership of ${num(2,7)} studio albums recorded between ${2005+num(0,12)} and ${2015+num(0,8)}. The label has not commented. Industry attorneys are circling.`}; },
  () => { const a=pick(NPC_ARTISTS);
    return { section:"Industry",
      headline:`${a.toUpperCase()} LAUNCHES INDEPENDENT LABEL`,
      byline:`By ${pick(REPORTERS)}`,
      body:`"I spent years making ${pick(["them","the suits","those people"])} rich," ${a} said on a podcast this week. The imprint, called ${pick(["Hard Miles","Two-Lane","Iron Holler","Dirt Floor","Low Cotton","Red River"])} Records, will sign ${num(3,8)} acts in its first year.`}; },
  () => { const a=pick(NPC_ARTISTS), b=pickOther(NPC_ARTISTS,a);
    return { section:"Industry",
      headline:`${a.toUpperCase()} HIT WITH PLAGIARISM CLAIM FROM ${b.toUpperCase()}`,
      byline:`By ${pick(REPORTERS)}`,
      body:`${b} claims a ${pick(["chord progression","bridge melody","lyric hook","song structure"])} from their ${num(4,18)}-year-old album appears verbatim in ${a}'s current chart single. Music scholars who reviewed both recordings are split on the merits.`}; },
  () => { const a=pick(NPC_ARTISTS);
    return { section:"Industry",
      headline:`${a.toUpperCase()}'S ESTATE DISPUTE GOES PUBLIC`,
      byline:`By ${pick(REPORTERS)}`,
      body:`Family members and former management are fighting over royalty rights to ${num(3,6)} decades of recordings. A court date has been set. The music, meanwhile, continues to stream.`}; },
];

// ── NPC ODDBALL / COLOR STORIES ────────────────────────────
const NPC_ODD_STORIES: ((s:GameState)=>NewspaperStory)[] = [
  () => { const a=pick(NPC_ARTISTS);
    return { section:"Local",
      headline:`${a.toUpperCase()} SPOTTED WASHING DISHES AT ${pick(CITIES).toUpperCase()} DINER`,
      byline:`By ${pick(REPORTERS)}`,
      body:`A patron who recognized the platinum-selling artist says ${a} "just sort of showed up, put on an apron, and worked the lunch rush." The owner confirmed the visit but refused to say whether money changed hands.`}; },
  () => { const a=pick(NPC_ARTISTS);
    return { section:"Local",
      headline:`${a.toUpperCase()} CAUGHT BUSKING ON LOWER BROADWAY — NOBODY NOTICED`,
      byline:`By ${pick(REPORTERS)}`,
      body:`For ${num(30,90)} minutes, a ${pick(["two-time Grammy winner","platinum artist","touring headliner","Country Hall inductee"])} played original songs to passing tourists. Tips earned: $${num(7,42)}. The video has since gone mildly viral.`}; },
  () => { const a=pick(NPC_ARTISTS);
    return { section:"Scene",
      headline:`${a.toUpperCase()} PLAYS SURPRISE SET AT TRUCK STOP OUTSIDE ${pick(CITIES).toUpperCase()}`,
      byline:`By ${pick(REPORTERS)}`,
      body:`The ${num(45,90)}-minute set happened in the parking lot of a Love's Travel Stop off I-${num(40,81)}. One attendee recorded it on a flip phone. The crowd topped out at ${num(20,60)} people. Everyone who was there says it was the best show they've ever seen.`}; },
  () => { const a=pick(NPC_ARTISTS);
    return { section:"Local",
      headline:`${a.toUpperCase()} LEAVES ${pick(["$500","$1,000","$2,000","entire tour rider"])} TIP AT ${pick(CITIES).toUpperCase()} DINER`,
      byline:`By ${pick(REPORTERS)}`,
      body:`The server, a single parent of ${num(2,4)}, described the moment as "surreal." ${a}'s people confirmed the visit and said the tip was "the least we could do after four plates of biscuits."`}; },
  () => { const a=pick(NPC_ARTISTS);
    return { section:"Blues",
      headline:`${a.toUpperCase()} RECORDS ENTIRE ALBUM IN ONE TAKE, IN A GAS STATION`,
      byline:`By ${pick(REPORTERS)}`,
      body:`A mobile recording rig, two microphones, and a cooperative clerk in ${pick(CITIES)} produced what ${a} is calling "the only honest record I've made in years." Release date TBD; the artist says they're "still deciding if the world deserves it."`}; },
];


// ── PLAYER PUBLISHING STORIES ──────────────────────────────
function playerPublishingStories(s: GameState): NewspaperStory[] {
  const out: NewspaperStory[] = [];
  const me = s.artistName || "You";

  if (s.currentPublishing) {
    const pub = s.currentPublishing;
    const typeLabel = pub.type === "admin" ? "admin deal" : pub.type === "co_pub" ? "co-publishing agreement" : "full catalog assignment";
    out.push({ section: "Industry", isPlayer: true,
      headline: `${me.toUpperCase()} SIGNS ${typeLabel.toUpperCase()} WITH ${pub.publisherName.toUpperCase()}`,
      byline: `By ${pick(REPORTERS)}`,
      body: `The ${typeLabel} gives ${pub.type === "full_assignment" ? "the publisher full ownership" : pub.type === "co_pub" ? "shared copyright control" : "collection rights while retaining copyright"}. ${pub.advance > 0 ? `A ${fmtMoney(pub.advance)} advance was part of the package.` : "No advance — just collection services."}` });
  }

  if (s.pendingPublishingOffers && s.pendingPublishingOffers.length > 0) {
    out.push({ section: "Industry", isPlayer: true,
      headline: `${me.toUpperCase()} FIELDING PUBLISHING OFFERS`,
      byline: `By ${pick(REPORTERS)}`,
      body: `Multiple publishers are circling the catalog. Sources say ${me} is weighing admin deals against co-pub proposals. The decision could reshape royalty flow for years.` });
  }

  return out;
}

// ── PLAYER SYNC STORIES ────────────────────────────────────
function playerSyncStories(s: GameState): NewspaperStory[] {
  const out: NewspaperStory[] = [];
  const me = s.artistName || "You";

  if (s.pendingSyncOffers && s.pendingSyncOffers.length > 0) {
    for (const sync of s.pendingSyncOffers) {
      const tone = sync.showType === "prestige" ? "prestigious" : sync.showType === "embarrassing" ? "controversial" : "lucrative";
      out.push({ section: sync.showType === "prestige" ? "Front Page" : "Industry", isPlayer: true,
        headline: `${sync.showName.toUpperCase()} WANTS ${me.toUpperCase()} FOR ${tone.toUpperCase()} SYNC PLACEMENT`,
        byline: `By ${pick(REPORTERS)}`,
        body: `"${sync.songTitle}" is under consideration for ${sync.showName}. The ${tone} placement would pay ${fmtMoney(sync.payout)} and ${sync.showType === "prestige" ? "elevate the artist's profile significantly." : sync.showType === "embarrassing" ? "has some fans questioning the move." : "provide steady income without much reputational risk."}` });
    }
  }

  return out;
}

// ── PLAYER BRAND / SELLOUT STORIES ─────────────────────────
function playerBrandStories(s: GameState): NewspaperStory[] {
  const out: NewspaperStory[] = [];
  const me = s.artistName || "You";
  const sellout = s.selloutScore || 0;

  if (sellout > 60) {
    out.push({ section: "Scene", isPlayer: true,
      headline: `FANS QUESTION ${me.toUpperCase()}'S AUTHENTICITY AMID BRAND DEALS`,
      byline: `By ${pick(REPORTERS)}`,
      body: `Social media is buzzing with accusations that ${me} has "sold out." The sellout meter is reading ${Math.round(sellout)}%, and the hardcore fanbase is starting to push back. "Used to be real," one comment read. "Now it's just ads."` });
  } else if (sellout > 30) {
    out.push({ section: "Scene", isPlayer: true,
      headline: `${me.toUpperCase()} WALKS THE LINE BETWEEN ART AND COMMERCE`,
      byline: `By ${pick(REPORTERS)}`,
      body: `The brand deals are piling up, but ${me} hasn't crossed the line yet. Purists are watching closely. "One more truck commercial and I'm out," a longtime fan posted.` });
  }

  const activeBrands = s.activeBrandDeals || [];
  if (activeBrands.length > 0) {
    const bigDeal = activeBrands[activeBrands.length - 1];
    out.push({ section: "Industry", isPlayer: true,
      headline: `${me.toUpperCase()} INKS DEAL WITH ${bigDeal.name.toUpperCase()}`,
      byline: `By ${pick(REPORTERS)}`,
      body: `The ${bigDeal.name} partnership adds ${fmtMoney(bigDeal.weeklyIncome)} weekly to the balance sheet. ${sellout > 40 ? "Some fans are calling it a cash grab." : "Fans seem supportive of the alignment."}` });
  }

  return out;
}

// ── PLAYER MANAGER STORIES ─────────────────────────────────
function playerManagerStories(s: GameState): NewspaperStory[] {
  const out: NewspaperStory[] = [];
  const me = s.artistName || "You";

  if (s.currentManager) {
    const mgr = s.currentManager;
    const def = MANAGERS.find(m => m.id === mgr.managerId);
    if (def) {
      let clash = false;
      if (def.type === "aggressive" && s.rep < 30) clash = true;
      if (def.type === "legend" && s.fame < 60) clash = true;
      if (def.type === "old_school" && s.themeCounts && Object.keys(s.themeCounts).some(t => t === "experimental")) clash = true;

      if (clash) {
        out.push({ section: "Industry", isPlayer: true,
          headline: `TENSIONS RISE BETWEEN ${me.toUpperCase()} AND MANAGER ${def.name.toUpperCase()}`,
          byline: `By ${pick(REPORTERS)}`,
          body: `Sources close to the camp describe "creative differences" between ${me} and ${def.name}. The manager's aggressive approach is reportedly clashing with the artist's vision. "They're butting heads on every decision," one insider said.` });
      } else {
        out.push({ section: "Industry", isPlayer: true,
          headline: `${me.toUpperCase()} AND ${def.name.toUpperCase()} BUILDING STRONG PARTNERSHIP`,
          byline: `By ${pick(REPORTERS)}`,
          body: `${def.name} is reportedly opening doors that were previously closed. The manager's industry connections are paying off, with better tour slots and label meetings on the horizon.` });
      }
    }
  }

  if (s.pendingManagerOffers && s.pendingManagerOffers.length > 0) {
    out.push({ section: "Industry", isPlayer: true,
      headline: `MANAGERS COURTING ${me.toUpperCase()}`,
      byline: `By ${pick(REPORTERS)}`,
      body: `Multiple management firms are making pitches. The right manager could accelerate ${me}'s trajectory significantly — or derail it if the fit is wrong.` });
  }

  return out;
}

// ── PLAYER RECORDING STORIES ───────────────────────────────
function playerRecordingStories(s: GameState): NewspaperStory[] {
  const out: NewspaperStory[] = [];
  const me = s.artistName || "You";

  // Active recording project
  if (s.project && s.project.weeksLeft > 0) {
    const p = s.project;
    const studio = p.studioId === "home_studio" ? "a home setup" : "a proper studio";
    const modeLabel = p.mode === "rush" ? "at a breakneck pace" : p.mode === "deliberate" ? "methodically, take by take" : "on schedule";
    out.push({ section:"Scene", isPlayer:true,
      headline:`${me.toUpperCase()} SPOTTED IN ${studio.toUpperCase()} — NEW MUSIC INCOMING`,
      byline:`By ${pick(REPORTERS)}`,
      body:`Sources close to the project say ${me} is cutting ${p.type.toLowerCase()} material ${modeLabel}. ${p.tracks.length} track${p.tracks.length===1?"":"s"} in the can so far. Expected to wrap in ${p.weeksLeft} week${p.weeksLeft===1?"":"s"}.`});
  }

  // Recently finished but unreleased
  const recentUnreleased = (s.unreleased ?? []).filter(u => s.week - (u as any).recordedWeek < 4);
  if (recentUnreleased.length > 0) {
    const u = recentUnreleased[0];
    out.push({ section:"Industry", isPlayer:true,
      headline:`${me.toUpperCase()} HAS NEW MATERIAL IN THE CAN`,
      byline:`By ${pick(REPORTERS)}`,
      body:`A ${(u as any).type?.toLowerCase() ?? "project"} titled "${(u as any).title}" is finished and awaiting release. Insiders describe the quality as "${(u as any).avgQuality > 75 ? "career-best" : (u as any).avgQuality > 60 ? "solid" : "a grower"}."`});
  }

  return out;
}

// ── PLAYER STORIES ─────────────────────────────────────────
function playerStories(s: GameState): NewspaperStory[] {
  const out: NewspaperStory[] = [];
  const me = s.artistName || "You";

  // Recent release (within last 4 weeks)
  const recent = (s.discography ?? []).filter(d => s.week - d.releasedWeek <= 4 && s.week - d.releasedWeek >= 0);
  if (recent.length > 0) {
    const r = recent[recent.length - 1];
    const verdict = r.outcome === "Viral" ? "a stone-cold smash" :
                    r.outcome === "Hit" ? "a legitimate hit" :
                    r.outcome === "Moderate" ? "a modest success" :
                    r.outcome === "Flop" ? "a commercial disappointment" : "a quiet release";
    const fmtType = r.type === "Single" ? "single" : r.type === "EP" ? "EP" : r.type === "Live Album" ? "live album" : "album";
    out.push({ section:"Front Page", isPlayer:true,
      headline:`${me.toUpperCase()} RELEASES "${r.title.toUpperCase()}" — CRITICS CALL IT ${verdict.toUpperCase()}`,
      byline:`By ${pick(REPORTERS)}`,
      body:`The ${fmtType} pulled ${r.peakStreams.toLocaleString()} weekly streams at peak. ${r.criticHeadline ? `One critic wrote: "${r.criticHeadline}"` : "Reviews are still rolling in."}`});
  }

  // Tour activity
  if (s.tourActive) {
    out.push({ section:"Scene", isPlayer:true,
      headline:`${me.toUpperCase()} ON THE ROAD — ${s.tourActive.shows.length}-DATE RUN UNDERWAY`,
      byline:`By ${pick(REPORTERS)}`,
      body:`Sources close to the camp say crowds are "${s.fame > 40 ? "selling out fast" : s.fame > 20 ? "showing up dependable" : "small but loyal"}." Next stop: ${s.tourActive.shows[s.tourActive.progress]?.cityName ?? "TBA"}.`});
  } else if (s.tourHistory && s.tourHistory.length > 0) {
    const last = s.tourHistory[0];
    if (s.week - last.week <= 4) {
      out.push({ section:"Scene", isPlayer:true,
        headline:`${me.toUpperCase()} WRAPS RUN AT ${last.venueName.toUpperCase()}`,
        byline:`By ${pick(REPORTERS)}`,
        body:`The ${last.cityName} date drew ${last.attendancePct}% capacity. ${last.attendancePct >= 80 ? "The room was packed wall to wall." : last.attendancePct >= 50 ? "Solid turnout, solid set." : "A quiet crowd, but the band played hard."}`});
    }
  }

  // Milestones
  if (s.totalReleases === 5)  out.push(milestone(me, "FIVE RELEASES DEEP", "Half a decade's worth of work in the catalog. The arc is starting to show."));
  if (s.totalReleases === 10) out.push(milestone(me, "TEN RELEASES — A REAL BODY OF WORK", "A full discography. Critics are starting to write the long retrospectives."));
  if (s.totalReleases === 20) out.push(milestone(me, "TWENTY RELEASES — VETERAN STATUS", "The kind of catalog younger artists name-drop in interviews."));
  if (s.fame >= 50 && s.fame < 60) out.push(milestone(me, "BREAKING THROUGH", "Industry chatter has shifted. Booking agents who didn't return calls last year are calling first."));
  if (s.fame >= 80) out.push(milestone(me, "HEADLINER STATUS CONFIRMED", "Festival posters list the name in the top tier. The career trajectory is no longer a question."));
  if (s.fans >= 100000 && s.fans < 110000) out.push(milestone(me, "PASSES 100,000 FAN MARK", "Six figures of dedicated listeners. The door is open."));
  if ((s.currentLabel || s.labelSigned) && s.week % 12 === 0) out.push({ section:"Industry", isPlayer:true,
    headline:`${me.toUpperCase()}'S LABEL DEAL CONTINUES TO PAY OFF`,
    byline:`By ${pick(REPORTERS)}`,
    body:`Insiders describe the relationship as "productive, mostly." The next album is reportedly already in pre-production.`});
  if ((s.awardsWon ?? []).length > 0 && s.week % 8 === 0) {
    const a = s.awardsWon[s.awardsWon.length - 1];
    out.push({ section:"Front Page", isPlayer:true,
      headline:`${me.toUpperCase()} STILL RIDING ${a.toUpperCase()} BUZZ`,
      byline:`By ${pick(REPORTERS)}`,
      body:`The recognition continues to open doors. Bookings, press requests, and label interest are all reportedly up.`});
  }

  return out;
}

// ── LETTERS TO THE EDITOR ──────────────────────────────────
const LETTER_CITIES = [
  "Nashville, TN","Memphis, TN","Knoxville, TN","Chattanooga, TN","Bowling Green, KY",
  "Asheville, NC","Birmingham, AL","Tuscaloosa, AL","Macon, GA","Athens, GA","Atlanta, GA",
  "Lubbock, TX","Austin, TX","Houston, TX","Dallas, TX","Oklahoma City, OK","Tulsa, OK",
  "Little Rock, AR","Jackson, MS","Clarksdale, MS","Shreveport, LA","New Orleans, LA",
  "St. Louis, MO","Branson, MO","Louisville, KY","Roanoke, VA","Charleston, WV",
  "Bakersfield, CA","Boise, ID","Cheyenne, WY","Bismarck, ND","Topeka, KS",
];
const LETTER_FIRST = ["Wilma","Earl","Doris","Hank","Ruby","Cletus","Mabel","Otis","Eunice","Buck","Loretta","Dwayne","Pearl","Reba","Travis","Bonnie","Jerry","Lila","Ronnie","Gladys","Burl","Tammy","Roscoe","Naomi","Cleve","Willa","Joe Bob","Ladonna","Merle","Sue Ellen"];
const LETTER_LAST = ["Pickens","Hatfield","McCoy","Gentry","Strait","Buford","Boudreaux","Tatum","Whitley","Combs","Pruitt","Yoakum","Tisdale","Doolittle","Hargrove","Sutter","Bullard","Wainwright","Skaggs","Hollis"];

function letterSignature(): string {
  return `${pick(LETTER_FIRST)} ${pick(LETTER_LAST)}`;
}

type LetterFn = (s: GameState, me: string) => LetterToEditor;

const PRAISE_LETTERS: LetterFn[] = [
  (_s,me) => ({ tone:"praise", signature:letterSignature(), city:pick(LETTER_CITIES),
    body:`Editor — I drove three hours through a thunderstorm to catch ${me} at a roadhouse last spring, and I'd drive thirty more. This is the real stuff. Tell the suits in town we don't need any more polish.` }),
  (_s,me) => ({ tone:"praise", signature:letterSignature(), city:pick(LETTER_CITIES),
    body:`Sir or Madam — My grandfather played pedal steel for forty years and he says ${me} reminds him of the old days, before everybody started singing about pickup trucks like they were people. High compliment from a hard man.` }),
  (_s,me) => ({ tone:"praise", signature:letterSignature(), city:pick(LETTER_CITIES),
    body:`To Whom It May Concern — Put me down as a lifetime subscriber to anything ${me} ever does. That voice could talk a barn cat off a hot tin roof.` }),
  (_s,me) => ({ tone:"praise", signature:letterSignature(), city:pick(LETTER_CITIES),
    body:`Editor — Heard ${me} on the radio while driving home from a double shift. Sat in my truck in the driveway until the song ended. That's the highest compliment a working person can pay an artist.` }),
];

const CRITICAL_LETTERS: LetterFn[] = [
  (_s,me) => ({ tone:"critical", signature:letterSignature(), city:pick(LETTER_CITIES),
    body:`Editor — With respect, ${me} sounds like every other act trying to dress up a slow week as profound. The genre deserves better than recycled heartache. Sincerely, a paying ticket holder who wants their money back.` }),
  (_s,me) => ({ tone:"critical", signature:letterSignature(), city:pick(LETTER_CITIES),
    body:`Dear Editor — I read your glowing coverage of ${me} with a furrowed brow. Let us not confuse a good haircut and a label budget for substance. Time will sort the wheat from the chaff.` }),
  (_s,me) => ({ tone:"critical", signature:letterSignature(), city:pick(LETTER_CITIES),
    body:`Editor — When did "country" become a marketing demographic? I'd take one Loretta over a hundred ${me}s. Print this if you've got the spine.` }),
  (_s,me) => ({ tone:"critical", signature:letterSignature(), city:pick(LETTER_CITIES),
    body:`Sir — I attended the recent show by ${me} expecting an evening of music and instead received an evening of merchandise advertisements between songs. The music industry has lost its way.` }),
];

const FAN_LETTERS: LetterFn[] = [
  (_s,me) => ({ tone:"fan", signature:letterSignature(), city:pick(LETTER_CITIES),
    body:`Editor!! I waited four hours outside the venue and ${me} signed my guitar AND my forearm. I am getting the autograph tattooed before it washes off. My mother is furious. WORTH IT.` }),
  (_s,me) => ({ tone:"fan", signature:letterSignature(), city:pick(LETTER_CITIES),
    body:`To the Editor — My wedding song this fall will be a ${me} cut. My fiancée doesn't know yet but she'll come around. She always does. Please send my regards to the band.` }),
  (_s,me) => ({ tone:"fan", signature:letterSignature(), city:pick(LETTER_CITIES),
    body:`Editor — I have started a fan club out of my garage. We have nine members so far, including the dog. ${me} fans of the world, unite!` }),
  (_s,me) => ({ tone:"fan", signature:letterSignature(), city:pick(LETTER_CITIES),
    body:`Dear Editor — Please tell ${me} that I named my new mule after them. The mule is stubborn, beautiful, and refuses to take direction. Felt like a tribute.` }),
];

const INDUSTRY_LETTERS: LetterFn[] = [
  (_s,me) => ({ tone:"industry", signature:letterSignature()+", Programming Director", city:pick(LETTER_CITIES),
    body:`Editor — As a small market PD, I want to thank you for covering acts like ${me}. Phone lines lit up the first time we spun the new single. Real listener response, not chart payola. Keep it coming.` }),
  (_s,me) => ({ tone:"industry", signature:letterSignature()+", Songwriter", city:pick(LETTER_CITIES),
    body:`Editor — Caught a writers round in town last week and ${me} held the room without raising their voice once. That's a craft they don't teach you in the publishing seminars.` }),
  (_s,me) => ({ tone:"industry", signature:letterSignature()+", Venue Owner", city:pick(LETTER_CITIES),
    body:`Editor — In thirty years of running a club, I can count on two hands the artists who left the green room cleaner than they found it. ${me} is on that list. Take it for what it's worth.` }),
];

const WEIRD_LETTERS: LetterFn[] = [
  (_s,me) => ({ tone:"weird", signature:letterSignature(), city:pick(LETTER_CITIES),
    body:`Editor — My rooster crows at exactly the moment ${me}'s song hits the bridge, every single morning. I do not know what this means but I felt the public should know.` }),
  (_s,me) => ({ tone:"weird", signature:letterSignature(), city:pick(LETTER_CITIES),
    body:`To the Editor — I have written ${me} eleven letters proposing marriage and have received no reply. I will continue to write. The mail moves slow these days.` }),
  (_s,me) => ({ tone:"weird", signature:letterSignature(), city:pick(LETTER_CITIES),
    body:`Editor — I am convinced ${me} is the reincarnation of my late uncle Royce, who also played guitar and also could not parallel park. Coincidence? You decide.` }),
  (_s,me) => ({ tone:"weird", signature:letterSignature(), city:pick(LETTER_CITIES),
    body:`Editor — I run a small bait shop and have started playing ${me} over the loudspeakers. Worm sales are up 14%. The crawdads seem to enjoy it as well. Print this in the science section.` }),
];

function generateLetters(s: GameState): LetterToEditor[] {
  const me = s.artistName || "the artist";
  const fame = s.fame ?? 0;
  if (fame < 10) return [];

  const pools: LetterFn[][] = [];
  // Always at least one praise letter once you're known
  pools.push(PRAISE_LETTERS);
  // Critical letters appear once you're more visible (more haters as you grow)
  if (fame >= 20) pools.push(CRITICAL_LETTERS);
  // Fan letters skew with bigger fan base
  if ((s.fans ?? 0) >= 500) pools.push(FAN_LETTERS);
  // Industry letters once you're a working artist
  if (fame >= 35 || (s.totalReleases ?? 0) >= 3) pools.push(INDUSTRY_LETTERS);
  // Weird letters always possible past a threshold
  if (fame >= 25) pools.push(WEIRD_LETTERS);

  const targetCount = fame >= 60 ? 4 : fame >= 30 ? 3 : 2;
  const out: LetterToEditor[] = [];
  const usedBodies = new Set<string>();
  let attempts = 0;
  while (out.length < targetCount && attempts < 25) {
    attempts++;
    const pool = pick(pools);
    const letter = pick(pool)(s, me);
    const key = letter.body.slice(0, 40);
    if (usedBodies.has(key)) continue;
    usedBodies.add(key);
    out.push(letter);
  }
  return out;
}

function milestone(me: string, title: string, body: string): NewspaperStory {
  return { section:"Front Page", isPlayer:true,
    headline:`${me.toUpperCase()}: ${title}`,
    byline:`By ${pick(REPORTERS)}`,
    body };
}

   // ── GENERATOR ──────────────────────────────────────────────
   export function generateNashvilleTimes(s: GameState): NewspaperIssue {
     const stories: NewspaperStory[] = [];
     const used = new Set<string>();

     function tryAdd(story: NewspaperStory): boolean {
       const key = story.headline.slice(0, 40);
       if (used.has(key)) return false;
       used.add(key);
       stories.push(story);
       return true;
     }

     // Player stories (capped at 8 — recording, releases, milestones, business)
     const player = playerStories(s);
     const rec = playerRecordingStories(s);
     const pub = playerPublishingStories(s);
     const sync = playerSyncStories(s);
     const brand = playerBrandStories(s);
     const mgr = playerManagerStories(s);
     for (const st of [...rec, ...player, ...pub, ...sync, ...brand, ...mgr].slice(0, 8)) tryAdd(st);

     // Always one chart/trend story
     tryAdd(pick(CHART_STORIES)(s));

     // ── GUARANTEED NPC WORLD STORIES ───────────────────────────
     // Each issue always has at least one rivalry/feud, one personal/comeback,
     // and one oddball — so the paper feels like a real publication.
     const npcSpotlightPools = [NPC_RIVALRY_STORIES, NPC_COMEBACK_STORIES, NPC_PERSONAL_STORIES, NPC_LEGAL_STORIES, NPC_ODD_STORIES];
     // Pick 4 distinct NPC spotlight stories from different categories (increased from 3)
     const shuffledNpc = [...npcSpotlightPools].sort(() => Math.random() - 0.5);
     for (const pool of shuffledNpc.slice(0, 4)) {
       let added = false, att = 0;
       while (!added && att++ < 6) added = tryAdd(pick(pool)(s));
     }

     // ── GENRE / INDUSTRY / SCENE FILLER ───────────────────────
     // Fill remaining slots with the classic pools
     const fillerPools = [COUNTRY_STORIES, BLUES_STORIES, INDUSTRY_STORIES, SCENE_STORIES, LOCAL_STORIES];
     const target = 18; // aim for ~18 total stories per issue (increased from 9)
     let attempts = 0;
     while (stories.length < target && attempts++ < 60) { // increased attempts
       tryAdd(pick(pick(fillerPools))(s));
     }

     const monthsIn = Math.floor(s.week / 4);
     return {
       volume: 1 + Math.floor(monthsIn / 12),
       issue: (monthsIn % 12) + 1,
       week: s.week,
       weather: pick(WEATHER),
       stories,
       letters: generateLetters(s),
     };
   }
