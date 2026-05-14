// ============================================================
// Dusty Strings — Game Logic (Data, Types, Helpers)
// Country / Blues career simulator
// ============================================================

export type Genre = "Country" | "Blues";
export type GameScreen = "menu" | "setup" | "game" | "gameover" | "victory";
export type ReleaseType = "Single" | "EP" | "Album" | "Live Album";
export type ReleaseOutcome = "Flop" | "Moderate" | "Hit" | "Viral";
export type SongLifecycle = "Normal" | "Hit" | "Evergreen";

// ── ARCHETYPE ──────────────────────────────────────────────
export interface Archetype {
  id: string;
  name: string;
  genre: Genre;
  desc: string;
  bonus: string;
  bonusVal: number | boolean;
}

export const ARCHETYPES: Record<string, Archetype> = {
  outlaw:          { id:"outlaw",          name:"Outlaw Country",      genre:"Country", desc:"Raw, road-worn authenticity. Shows build rep faster.",              bonus:"showRepBonus",     bonusVal:1.4 },
  radio_country:   { id:"radio_country",   name:"Radio Country",       genre:"Country", desc:"Radio-ready sound. Radio plays hit harder.",                        bonus:"radioBonus",       bonusVal:1.15 },
  self_producer:   { id:"self_producer",   name:"Self-Producer",       genre:"Country", desc:"Record at home free. Quality floor is raised.",                     bonus:"selfProdQuality",  bonusVal:18 },
  storyteller:     { id:"storyteller",     name:"Storyteller",         genre:"Country", desc:"Lyric-driven depth. Every track gets +8 quality.",                  bonus:"trackQualBonus",   bonusVal:8 },
  nashville_sound: { id:"nashville_sound", name:"Nashville Sound",     genre:"Country", desc:"Industry connections. Tier-2 producers unlock earlier.",            bonus:"prodUnlock",       bonusVal:true },
  honky_tonk:      { id:"honky_tonk",      name:"Honky Tonk Hustler",  genre:"Country", desc:"Built for the road. Touring costs are 20% cheaper.",               bonus:"tourCostDiscount", bonusVal:0.80 },
  delta_blues:     { id:"delta_blues",     name:"Delta Blues",         genre:"Blues",   desc:"Old soul music. Evergreen rate doubled.",                           bonus:"evergreenBoost",   bonusVal:2.0 },
  electric_blues:  { id:"electric_blues",  name:"Electric Blues",      genre:"Blues",   desc:"Electrified grit. Radio and sync placements more likely.",          bonus:"syncRadioBoost",   bonusVal:1.5 },
  blues_rock:      { id:"blues_rock",      name:"Blues-Rock Crossover", genre:"Blues",  desc:"Broader appeal. Rock venues and fans available.",                   bonus:"crossoverFans",    bonusVal:true },
  soul_blues:      { id:"soul_blues",      name:"Soul Blues",          genre:"Blues",   desc:"Soulful warmth. Feature fees cut 25%.",                             bonus:"featureCostDisc",  bonusVal:0.75 },
  chicago_blues:   { id:"chicago_blues",   name:"Chicago Sound",       genre:"Blues",   desc:"Midwest institution. Show revenue +20% in the region.",             bonus:"midwestShowBonus", bonusVal:1.20 },
  raw_acoustic:    { id:"raw_acoustic",    name:"Raw Acoustic",        genre:"Blues",   desc:"Stripped back and real. Quality starts higher; no producer needed.", bonus:"acousticQBonus",  bonusVal:22 },
};

// ── CITY / VENUE ───────────────────────────────────────────
export interface CityVenue {
  tier: number;
  name: string;
  cap: number;
  cost: number;
}

export interface City {
  name: string;
  region: string;
  travelCost: number;
  genreMod: Record<string, number>;
  venues: CityVenue[];
}

export const CITIES: City[] = [
  { name:"Nashville, TN",    region:"South",         travelCost:0,    genreMod:{Country:1.5,Blues:1.2}, venues:[{tier:1,name:"The Bluebird Cafe",cap:90,cost:100},{tier:2,name:"The Station Inn",cap:250,cost:450},{tier:3,name:"3rd & Lindsley",cap:500,cost:1200},{tier:4,name:"Marathon Music Works",cap:1800,cost:3800},{tier:5,name:"Ryman Auditorium",cap:2362,cost:9000},{tier:6,name:"Bridgestone Arena",cap:20000,cost:42000}]},
  { name:"Memphis, TN",      region:"South",         travelCost:400,  genreMod:{Blues:1.6,Country:1.2}, venues:[{tier:1,name:"Blues City Cafe",cap:120,cost:120},{tier:2,name:"Rum Boogie Cafe",cap:300,cost:500},{tier:3,name:"Hi-Tone",cap:600,cost:1400},{tier:4,name:"New Daisy Theatre",cap:1200,cost:3500},{tier:5,name:"Orpheum Theatre",cap:2800,cost:9500},{tier:6,name:"FedExForum",cap:18000,cost:40000}]},
  { name:"New Orleans, LA",  region:"South",         travelCost:700,  genreMod:{Blues:1.5,Country:1.1}, venues:[{tier:1,name:"Frenchmen Street Corner",cap:80,cost:80},{tier:2,name:"Spotted Cat Music Club",cap:200,cost:400},{tier:3,name:"Tipitina's",cap:850,cost:2000},{tier:4,name:"House of Blues NOLA",cap:1000,cost:3200},{tier:5,name:"Saenger Theatre",cap:2700,cost:8500},{tier:6,name:"Smoothie King Center",cap:19000,cost:41000}]},
  { name:"Austin, TX",       region:"South",         travelCost:800,  genreMod:{Country:1.4,Blues:1.3}, venues:[{tier:1,name:"Saxon Pub Open Mic",cap:100,cost:100},{tier:2,name:"Continental Club",cap:280,cost:500},{tier:3,name:"Antone's Nightclub",cap:700,cost:1600},{tier:4,name:"ACL Live at the Moody",cap:2750,cost:4500},{tier:5,name:"Bass Concert Hall",cap:3000,cost:9000},{tier:6,name:"Moody Center",cap:15000,cost:38000}]},
  { name:"Atlanta, GA",      region:"South",         travelCost:600,  genreMod:{Country:1.1,Blues:1.2}, venues:[{tier:1,name:"Eddie's Attic Open Stage",cap:100,cost:100},{tier:2,name:"Red Light Café",cap:250,cost:450},{tier:3,name:"Terminal West",cap:1000,cost:2500},{tier:4,name:"Buckhead Theatre",cap:1000,cost:3000},{tier:5,name:"Coca-Cola Roxy",cap:4300,cost:9500},{tier:6,name:"State Farm Arena",cap:21000,cost:45000}]},
  { name:"Muscle Shoals, AL",region:"Deep South",    travelCost:500,  genreMod:{Blues:1.5,Country:1.3}, venues:[{tier:1,name:"Church Street Open Mic",cap:80,cost:80},{tier:2,name:"Shoals Theater Bar",cap:200,cost:380},{tier:3,name:"Shoals Theater",cap:800,cost:1800},{tier:4,name:"Ford Amphitheater",cap:1500,cost:3500}]},
  { name:"Macon, GA",        region:"Deep South",    travelCost:550,  genreMod:{Blues:1.3,Country:1.2}, venues:[{tier:1,name:"Back Street Open Mic",cap:80,cost:80},{tier:2,name:"Hummingbird Stage & Taproom",cap:350,cost:600},{tier:3,name:"Cox Capitol Theatre",cap:1200,cost:2800},{tier:4,name:"Macon City Auditorium",cap:3700,cost:8000}]},
  { name:"Jackson, MS",      region:"Deep South",    travelCost:600,  genreMod:{Blues:1.5,Country:1.2}, venues:[{tier:1,name:"Hal & Mal's Open Mic",cap:100,cost:90},{tier:2,name:"Martin's Restaurant & Bar",cap:250,cost:420},{tier:3,name:"Duling Hall",cap:800,cost:1800},{tier:4,name:"Mississippi Coliseum",cap:8000,cost:18000}]},
  { name:"Baton Rouge, LA",  region:"Deep South",    travelCost:750,  genreMod:{Blues:1.4,Country:1.1}, venues:[{tier:1,name:"Coyote Blues Open Mic",cap:90,cost:90},{tier:2,name:"Varsity Theatre",cap:650,cost:1400},{tier:3,name:"Manship Theatre",cap:330,cost:900},{tier:4,name:"L'Auberge Casino Amphitheater",cap:2000,cost:5000},{tier:5,name:"Raising Canes River Center",cap:10000,cost:25000}]},
  { name:"Birmingham, AL",   region:"Deep South",    travelCost:450,  genreMod:{Blues:1.3,Country:1.2}, venues:[{tier:1,name:"WorkPlay Theatre Stage",cap:100,cost:100},{tier:2,name:"Saturn Birmingham",cap:450,cost:900},{tier:3,name:"Iron City",cap:1800,cost:4000},{tier:4,name:"Alabama Theatre",cap:2500,cost:7000},{tier:5,name:"Legacy Arena",cap:19000,cost:40000}]},
  { name:"Clarksdale, MS",   region:"Deep South",    travelCost:500,  genreMod:{Blues:1.8,Country:1.0}, venues:[{tier:1,name:"Ground Zero Blues Club",cap:150,cost:130},{tier:2,name:"Red's Lounge",cap:120,cost:200},{tier:3,name:"Hopson Plantation Stage",cap:400,cost:800}]},
  { name:"Tulsa, OK",        region:"Southwest",     travelCost:900,  genreMod:{Country:1.3,Blues:1.1}, venues:[{tier:1,name:"Colony Club Open Mic",cap:100,cost:100},{tier:2,name:"Mercury Lounge",cap:300,cost:550},{tier:3,name:"Cain's Ballroom",cap:1600,cost:3500},{tier:4,name:"BOK Center",cap:19000,cost:42000}]},
  { name:"Dallas, TX",       region:"Southwest",     travelCost:1000, genreMod:{Country:1.3,Blues:1.2}, venues:[{tier:1,name:"Poor David's Pub",cap:200,cost:350},{tier:2,name:"Prophet Bar",cap:400,cost:800},{tier:3,name:"House of Blues Dallas",cap:1800,cost:4200},{tier:4,name:"Dos Equis Pavilion",cap:20000,cost:43000}]},
  { name:"Charlotte, NC",    region:"Southeast",     travelCost:1100, genreMod:{Country:1.2,Blues:1.2}, venues:[{tier:1,name:"Evening Muse",cap:100,cost:110},{tier:2,name:"Neighborhood Theatre",cap:1000,cost:2200},{tier:3,name:"Fillmore Charlotte",cap:2500,cost:6500},{tier:4,name:"Spectrum Center",cap:20000,cost:43000}]},
  { name:"Knoxville, TN",    region:"South",         travelCost:350,  genreMod:{Country:1.3,Blues:1.1}, venues:[{tier:1,name:"Preservation Pub",cap:150,cost:120},{tier:2,name:"Bijou Theatre",cap:700,cost:1500},{tier:3,name:"Mill & Mine",cap:1800,cost:4000},{tier:4,name:"Thompson-Boling Arena",cap:24500,cost:50000}]},
  { name:"Louisville, KY",   region:"Midwest-South", travelCost:800,  genreMod:{Country:1.2,Blues:1.2}, venues:[{tier:1,name:"Bards Town Open Stage",cap:100,cost:100},{tier:2,name:"Zanzabar",cap:300,cost:600},{tier:3,name:"Mercury Ballroom",cap:1000,cost:2500},{tier:4,name:"KFC Yum! Center",cap:22000,cost:46000}]},
  { name:"Chicago, IL",      region:"Midwest",       travelCost:1400, genreMod:{Blues:1.6,Country:1.0}, venues:[{tier:1,name:"Rosa's Lounge",cap:150,cost:150},{tier:2,name:"Kingston Mines",cap:400,cost:800},{tier:3,name:"House of Blues Chicago",cap:1600,cost:4000},{tier:4,name:"Thalia Hall",cap:1600,cost:4000},{tier:5,name:"Chicago Theatre",cap:3600,cost:10000},{tier:6,name:"United Center",cap:23500,cost:50000}]},

  // ── Texas ──
  { name:"Houston, TX",      region:"Southwest",     travelCost:1100, genreMod:{Country:1.2,Blues:1.3}, venues:[{tier:1,name:"The Continental Club Houston",cap:200,cost:300},{tier:2,name:"The Heights Theater",cap:600,cost:1400},{tier:3,name:"White Oak Music Hall",cap:1500,cost:3500},{tier:4,name:"House of Blues Houston",cap:1700,cost:4200},{tier:5,name:"713 Music Hall",cap:5000,cost:11000},{tier:6,name:"Toyota Center",cap:18000,cost:42000}]},
  { name:"San Antonio, TX",  region:"Southwest",     travelCost:1100, genreMod:{Country:1.4,Blues:1.1}, venues:[{tier:1,name:"Sam's Burger Joint",cap:300,cost:400},{tier:2,name:"Floore's Country Store",cap:1000,cost:2200},{tier:3,name:"Aztec Theatre",cap:2300,cost:5500},{tier:4,name:"Majestic Theatre",cap:2300,cost:6500},{tier:5,name:"Frost Bank Center",cap:18500,cost:42000}]},
  { name:"Fort Worth, TX",   region:"Southwest",     travelCost:1000, genreMod:{Country:1.6,Blues:1.1}, venues:[{tier:1,name:"Magnolia Motor Lounge",cap:200,cost:300},{tier:2,name:"Tannahill's Tavern & Music Hall",cap:1000,cost:2400},{tier:3,name:"Billy Bob's Texas",cap:6000,cost:10000},{tier:4,name:"Will Rogers Auditorium",cap:2900,cost:8000},{tier:5,name:"Dickies Arena",cap:14000,cost:36000}]},
  { name:"Lubbock, TX",      region:"Southwest",     travelCost:1200, genreMod:{Country:1.5,Blues:1.1}, venues:[{tier:1,name:"Blue Light Live",cap:250,cost:280},{tier:2,name:"Cactus Theater",cap:400,cost:900},{tier:3,name:"Buddy Holly Hall",cap:2200,cost:5000},{tier:4,name:"United Supermarkets Arena",cap:15000,cost:34000}]},

  // ── Louisiana ──
  { name:"Lafayette, LA",    region:"Deep South",    travelCost:800,  genreMod:{Blues:1.4,Country:1.2}, venues:[{tier:1,name:"Blue Moon Saloon",cap:150,cost:160},{tier:2,name:"Artmosphere",cap:300,cost:550},{tier:3,name:"Heymann Performing Arts Center",cap:2200,cost:5000},{tier:4,name:"Cajundome",cap:11000,cost:26000}]},
  { name:"Shreveport, LA",   region:"Deep South",    travelCost:850,  genreMod:{Country:1.3,Blues:1.3}, venues:[{tier:1,name:"Bear's on Fairfield",cap:120,cost:140},{tier:2,name:"The Strand Theatre",cap:1700,cost:3800},{tier:3,name:"Municipal Auditorium",cap:3200,cost:7500},{tier:4,name:"Brookshire Grocery Arena",cap:14000,cost:32000}]},

  // ── Carolinas ──
  { name:"Asheville, NC",    region:"Southeast",     travelCost:900,  genreMod:{Country:1.3,Blues:1.3}, venues:[{tier:1,name:"The Grey Eagle",cap:550,cost:1000},{tier:2,name:"The Orange Peel",cap:1050,cost:2400},{tier:3,name:"Thomas Wolfe Auditorium",cap:2400,cost:5800},{tier:4,name:"ExploreAsheville.com Arena",cap:7600,cost:18000}]},
  { name:"Raleigh, NC",      region:"Southeast",     travelCost:1100, genreMod:{Country:1.2,Blues:1.1}, venues:[{tier:1,name:"Pour House Music Hall",cap:300,cost:500},{tier:2,name:"Lincoln Theatre",cap:600,cost:1300},{tier:3,name:"The Ritz",cap:1400,cost:3300},{tier:4,name:"Red Hat Amphitheater",cap:5500,cost:13000},{tier:5,name:"PNC Arena",cap:19500,cost:43000}]},
  { name:"Greenville, SC",   region:"Southeast",     travelCost:950,  genreMod:{Country:1.2,Blues:1.2}, venues:[{tier:1,name:"Smiley's Acoustic Cafe",cap:120,cost:140},{tier:2,name:"The Radio Room",cap:300,cost:500},{tier:3,name:"Peace Center",cap:2100,cost:5000},{tier:4,name:"Bon Secours Wellness Arena",cap:15000,cost:34000}]},

  // ── Georgia / Florida ──
  { name:"Athens, GA",       region:"Southeast",     travelCost:650,  genreMod:{Country:1.1,Blues:1.2}, venues:[{tier:1,name:"Caledonia Lounge",cap:200,cost:280},{tier:2,name:"40 Watt Club",cap:500,cost:1100},{tier:3,name:"Georgia Theatre",cap:1100,cost:2700},{tier:4,name:"Classic Center",cap:2100,cost:5000}]},
  { name:"Savannah, GA",     region:"Southeast",     travelCost:850,  genreMod:{Blues:1.3,Country:1.1}, venues:[{tier:1,name:"The Jinx 912",cap:200,cost:260},{tier:2,name:"Victory North",cap:900,cost:2000},{tier:3,name:"Trustees Theater",cap:1100,cost:2800},{tier:4,name:"Enmarket Arena",cap:9500,cost:23000}]},
  { name:"Tampa, FL",        region:"Southeast",     travelCost:1100, genreMod:{Country:1.1,Blues:1.2}, venues:[{tier:1,name:"Skipper's Smokehouse",cap:300,cost:450},{tier:2,name:"Crowbar",cap:400,cost:800},{tier:3,name:"The Ritz Ybor",cap:1700,cost:4000},{tier:4,name:"Hard Rock Live Tampa",cap:1800,cost:4500},{tier:5,name:"Amalie Arena",cap:19000,cost:42000}]},
  { name:"Jacksonville, FL", region:"Southeast",     travelCost:1000, genreMod:{Country:1.2,Blues:1.1}, venues:[{tier:1,name:"Jack Rabbits",cap:300,cost:450},{tier:2,name:"Underbelly",cap:500,cost:1000},{tier:3,name:"Florida Theatre",cap:1900,cost:4500},{tier:4,name:"Daily's Place Amphitheater",cap:5500,cost:13000},{tier:5,name:"VyStar Veterans Memorial Arena",cap:15000,cost:34000}]},

  // ── Mississippi / Arkansas ──
  { name:"Tupelo, MS",       region:"Deep South",    travelCost:550,  genreMod:{Blues:1.5,Country:1.4}, venues:[{tier:1,name:"Blue Canoe",cap:150,cost:160},{tier:2,name:"Lyric Theatre Tupelo",cap:1100,cost:2400},{tier:3,name:"Cadence Bank Arena",cap:8000,cost:18000}]},
  { name:"Helena, AR",       region:"Deep South",    travelCost:520,  genreMod:{Blues:1.7,Country:1.0}, venues:[{tier:1,name:"Bubba's Blues Corner",cap:80,cost:80},{tier:2,name:"Cherry Street Pavilion",cap:600,cost:1200},{tier:3,name:"Levitt AMP Helena",cap:1500,cost:3200}]},
  { name:"Little Rock, AR",  region:"Deep South",    travelCost:700,  genreMod:{Country:1.2,Blues:1.3}, venues:[{tier:1,name:"White Water Tavern",cap:200,cost:240},{tier:2,name:"Stickyz Rock'n'Roll Chicken Shack",cap:400,cost:800},{tier:3,name:"Robinson Center",cap:2200,cost:5200},{tier:4,name:"Simmons Bank Arena",cap:18000,cost:40000}]},

  // ── Midwest ──
  { name:"Kansas City, MO",  region:"Midwest",       travelCost:1100, genreMod:{Blues:1.4,Country:1.2}, venues:[{tier:1,name:"Knuckleheads Saloon",cap:300,cost:500},{tier:2,name:"recordBar",cap:400,cost:850},{tier:3,name:"Uptown Theater",cap:2100,cost:5000},{tier:4,name:"The Midland",cap:2900,cost:7500},{tier:5,name:"T-Mobile Center",cap:18500,cost:42000}]},
  { name:"St. Louis, MO",    region:"Midwest",       travelCost:1000, genreMod:{Blues:1.5,Country:1.1}, venues:[{tier:1,name:"BB's Jazz, Blues & Soups",cap:200,cost:240},{tier:2,name:"Off Broadway",cap:425,cost:900},{tier:3,name:"Delmar Hall",cap:750,cost:1900},{tier:4,name:"The Pageant",cap:2300,cost:5800},{tier:5,name:"Enterprise Center",cap:19000,cost:42000}]},
  { name:"Oklahoma City, OK",region:"Southwest",     travelCost:950,  genreMod:{Country:1.4,Blues:1.1}, venues:[{tier:1,name:"VZD's Restaurant & Bar",cap:200,cost:280},{tier:2,name:"Tower Theatre",cap:1100,cost:2500},{tier:3,name:"The Criterion",cap:4000,cost:9500},{tier:4,name:"Paycom Center",cap:18000,cost:40000}]},

  // ── Kentucky / Bristol ──
  { name:"Lexington, KY",    region:"Midwest-South", travelCost:700,  genreMod:{Country:1.3,Blues:1.1}, venues:[{tier:1,name:"The Burl",cap:250,cost:380},{tier:2,name:"Manchester Music Hall",cap:1100,cost:2500},{tier:3,name:"Lexington Opera House",cap:1000,cost:2400},{tier:4,name:"Rupp Arena",cap:20500,cost:44000}]},
  { name:"Bristol, TN",      region:"South",         travelCost:500,  genreMod:{Country:1.6,Blues:1.2}, venues:[{tier:1,name:"Studio Brew",cap:120,cost:130},{tier:2,name:"Birthplace of Country Music Museum Stage",cap:300,cost:600},{tier:3,name:"Paramount Bristol",cap:760,cost:1900},{tier:4,name:"Bristol Motor Speedway Lawn",cap:5000,cost:12000}]},
];

// Flat venue tier reference for selector
export const VENUES = [
  {tier:1,name:"Intimate Venue",    cap:150,   cost:110,   fameReq:0,  repReq:0},
  {tier:2,name:"Local Bar / Club",  cap:400,   cost:600,   fameReq:4,  repReq:0},
  {tier:3,name:"Mid Club",          cap:1000,  cost:2000,  fameReq:10, repReq:5},
  {tier:4,name:"Regional Theater",  cap:3000,  cost:7000,  fameReq:25, repReq:15},
  {tier:5,name:"Large Theater",     cap:5000,  cost:12000, fameReq:40, repReq:28},
  {tier:6,name:"Arena",             cap:20000, cost:42000, fameReq:58, repReq:42},
  {tier:7,name:"Stadium",           cap:60000, cost:175000,fameReq:80, repReq:65},
];

// ── PRODUCERS ──────────────────────────────────────────────
export interface Producer {
  id: string; name: string; tier: number; cost: number; qB: number;
  genres: string[]; repReq: number; fanReq: number; specialty: string; bio: string;
  real?: boolean; // real-world person/place (vs. fictional)
}

export const PRODUCERS: Producer[] = [
  // ── Tier 0: Free ──
  {id:"self",       name:"Home Studio",                  tier:0,cost:0,     qB:0,  genres:["Country","Blues"],repReq:0,  fanReq:0,    specialty:"DIY",                  bio:"Your kitchen table, a laptop, and grit. Free always."},

  // ── Tier 1: Indie / Local (fictional flavor) ──
  {id:"earl",       name:"Earl Pickett",                 tier:1,cost:600,   qB:7,  genres:["Country","Blues"],repReq:0,  fanReq:0,    specialty:"Acoustic & Strings",    bio:"Semi-retired session guitarist from Muscle Shoals. Plays on everything."},
  {id:"dottie",     name:"Dottie Mae Sounds",            tier:1,cost:800,   qB:7,  genres:["Country"],       repReq:0,  fanReq:0,    specialty:"Pedal Steel & Fiddle",  bio:"Born in a church pew, raised on George Jones. Loves a good honky tonk cut."},
  {id:"ray_lee",    name:"Ray Lee",                      tier:1,cost:750,   qB:7,  genres:["Blues"],         repReq:0,  fanReq:0,    specialty:"Delta Slide Guitar",    bio:"Mississippi delta man. His slide guitar work is unmistakable."},
  {id:"porch_house",name:"Porch House Studios",          tier:1,cost:1000,  qB:8,  genres:["Country","Blues"],repReq:0,  fanReq:500,  specialty:"Lo-Fi Warmth",          bio:"A literal converted porch in East Nashville. Cheap tape machine magic."},
  {id:"clarence",   name:"Clarence Webb",                tier:1,cost:950,   qB:8,  genres:["Blues"],         repReq:0,  fanReq:0,    specialty:"Chicago Electric",      bio:"Grandson of a Buddy Guy sideman. Electric blues in his blood."},
  {id:"cassie_bloom",name:"Cassie Bloom",                tier:1,cost:700,   qB:7,  genres:["Country"],       repReq:0,  fanReq:0,    specialty:"Female Vocal Coaching", bio:"Records out of a converted dental office in Murfreesboro. Eerie patience for vocals."},
  {id:"beau_hardin",name:"Beau Hardin",                  tier:1,cost:850,   qB:8,  genres:["Country","Blues"],repReq:5,  fanReq:200,  specialty:"Tape Saturation",       bio:"Refuses to use ProTools. Owns four 1/2-inch tape machines and a cigarette habit."},
  {id:"junebug",    name:"Junebug Carter",               tier:1,cost:650,   qB:7,  genres:["Country"],       repReq:0,  fanReq:0,    specialty:"Bluegrass & Mountain",  bio:"Hails from Wise County, VA. If a banjo's involved, she's your call."},
  {id:"two_step",   name:"Wallace \"Two-Step\" Pruitt",  tier:1,cost:900,   qB:8,  genres:["Country"],       repReq:8,  fanReq:300,  specialty:"Western Swing",         bio:"Lives in a tour bus parked behind a Texaco. Never finishes a take in fewer than seven."},
  {id:"otis_mae",   name:"Otis Mae Reeves",              tier:1,cost:1100,  qB:9,  genres:["Blues"],         repReq:6,  fanReq:600,  specialty:"Hill Country Blues",    bio:"Niece of a Mississippi juke-joint owner. Records you live, no overdubs."},
  {id:"lila_h",     name:"Lila Hawthorne",               tier:1,cost:1000,  qB:8,  genres:["Country","Blues"],repReq:5,  fanReq:400,  specialty:"Folk Singer-Songwriter",bio:"Berklee dropout running a candle-lit one-room studio in Asheville."},
  {id:"cyrus_tate", name:"Cyrus Tate",                   tier:1,cost:1150,  qB:9,  genres:["Blues"],         repReq:8,  fanReq:700,  specialty:"Swamp Blues",           bio:"Louisiana boy. Thinks reverb is a sin and tremolo is the cure."},

  // ── Tier 2: Mid-Level (fictional + a couple recognizable real names) ──
  {id:"mama_reed",  name:"Mama Reed",                    tier:2,cost:3000,  qB:16, genres:["Country","Blues"],repReq:10, fanReq:2000, specialty:"Vocals & Arrangement",  bio:"Legend in the Nashville session world. Wants artists who know what they feel."},
  {id:"hank_prod",  name:"Bobby Hicks Production",       tier:2,cost:3500,  qB:17, genres:["Country"],       repReq:14, fanReq:3000, specialty:"Classic Nashville",     bio:"Two decades on Music Row. Every note is deliberate and honest."},
  {id:"shoals",     name:"Shoals Sound",                 tier:2,cost:4000,  qB:18, genres:["Country","Blues"],repReq:12, fanReq:3500, specialty:"Swampy Americana",      bio:"The Muscle Shoals rhythm section is still active. If you can afford it."},
  {id:"grace",      name:"Grace Porter",                 tier:2,cost:4200,  qB:17, genres:["Blues"],         repReq:14, fanReq:2500, specialty:"Soul Blues",            bio:"New Orleans soul and blues fusion. Horns, keys, and groove."},
  {id:"lonesome",   name:"Lonesome Pine Recording",      tier:2,cost:3800,  qB:16, genres:["Country"],       repReq:10, fanReq:2000, specialty:"Outlaw Country",        bio:"Red-dirt and Texan vibes. Willie Nelson allegedly slept on their couch."},
  {id:"muddy",      name:"Muddy Waters Memorial Studio", tier:2,cost:5000,  qB:19, genres:["Blues"],         repReq:18, fanReq:4000, specialty:"Chicago Heritage",      bio:"Named for a reason. If you're not serious, don't bother calling."},
  {id:"harlan",     name:"Harlan Strickland",            tier:2,cost:3300,  qB:16, genres:["Country"],       repReq:12, fanReq:2200, specialty:"Modern Pop-Country",    bio:"Has the ear that turns a B-side into a wedding-dance hit. Knows it, charges for it."},
  {id:"roxy",       name:"Roxy Beaumont",                tier:2,cost:3700,  qB:17, genres:["Blues"],         repReq:14, fanReq:2800, specialty:"Power Trio Blues-Rock", bio:"Toured with Stevie Ray's bassist for a year. Loves Marshalls and a bone-dry kick."},
  {id:"jed",        name:"Jed Calloway",                 tier:2,cost:3600,  qB:16, genres:["Country","Blues"],repReq:11, fanReq:2400, specialty:"Roots Americana",       bio:"Three Grammys, two divorces, one studio cat named Patsy."},
  {id:"nora_v",     name:"Nora \"Nightingale\" Vega",    tier:2,cost:4400,  qB:18, genres:["Country"],       repReq:16, fanReq:3500, specialty:"Cinematic Strings",     bio:"Books the Nashville Symphony's strings on her lunch break. Worth every dollar."},
  {id:"silas_b",    name:"Silas Boone",                  tier:2,cost:4100,  qB:18, genres:["Country","Blues"],repReq:15, fanReq:3200, specialty:"Live-to-Tape",          bio:"Records you in one room, all at once. No headphone bleed, just feel."},
  {id:"marigold",   name:"Marigold Pace",                tier:2,cost:4500,  qB:18, genres:["Country"],       repReq:18, fanReq:4000, specialty:"Female Country Pop",    bio:"Cut three platinum records before turning thirty. Currently at her peak."},
  {id:"rusty_t",    name:"Rusty Threadgill",             tier:2,cost:3900,  qB:17, genres:["Blues"],         repReq:14, fanReq:2700, specialty:"Texas Roadhouse",       bio:"Lubbock-born. Has a glass eye and a story for every console knob."},
  {id:"shooter",    name:"Shooter Jennings",             tier:2,cost:5500,  qB:20, genres:["Country","Blues"],repReq:22, fanReq:6000, specialty:"Outlaw Revival",        bio:"Waylon's son. Produces Tanya Tucker, Brandi Carlile. Books fast.", real:true},
  {id:"vance",      name:"Vance Powell",                 tier:2,cost:6000,  qB:21, genres:["Country","Blues"],repReq:24, fanReq:7000, specialty:"Analog Engineering",    bio:"Engineered Jack White and Chris Stapleton. The man behind the sound.", real:true},

  // ── Tier 3: Elite (fictional + mid-tier real producers) ──
  {id:"rca_b",      name:"RCA Studio B",                 tier:3,cost:9000,  qB:27, genres:["Country"],       repReq:40, fanReq:15000,specialty:"Historic Nashville Sound",bio:"Where Elvis and Dolly recorded. You need real pull to get in here.", real:true},
  {id:"ardent",     name:"Ardent Studios",               tier:3,cost:10000, qB:28, genres:["Country","Blues"],repReq:38, fanReq:12000,specialty:"Memphis Magic",         bio:"ZZ Top, Big Star. The room has legends in the walls.", real:true},
  {id:"pres_hall",  name:"Preservation Hall Sound",      tier:3,cost:11000, qB:29, genres:["Blues"],         repReq:42, fanReq:18000,specialty:"New Orleans Jazz-Blues",bio:"Living history. Full orchestra, horns, the real thing.", real:true},
  {id:"sound_emp",  name:"Sound Emporium",               tier:3,cost:12000, qB:30, genres:["Country","Blues"],repReq:50, fanReq:25000,specialty:"World Class",           bio:"Garth, Shania, Beck — if you're here, you've made it. Almost.", real:true},
  {id:"auggie",     name:"Augustine \"Auggie\" Reeves",  tier:3,cost:8500,  qB:26, genres:["Blues"],         repReq:36, fanReq:11000,specialty:"Soul-Blues Production", bio:"Three-time Blues Music Award winner. Doesn't take new clients without a referral."},
  {id:"della",      name:"Della Sutton",                 tier:3,cost:9500,  qB:27, genres:["Country"],       repReq:42, fanReq:14000,specialty:"Female Vocal Production",bio:"The producer behind every female country breakthrough of the last decade. Allegedly."},
  {id:"ramsey_k",   name:"Ramsey Knox",                  tier:3,cost:11500, qB:29, genres:["Country","Blues"],repReq:48, fanReq:20000,specialty:"Genre-Bending Auteur",  bio:"His records are studied in Belmont seminars. Rude on email but worth it."},
  {id:"frank_l",    name:"Frank Liddell",                tier:3,cost:13000, qB:31, genres:["Country"],       repReq:55, fanReq:28000,specialty:"Texas Country",         bio:"Husband of Lee Ann Womack. Built Miranda Lambert's sound from the ground up.", real:true},
  {id:"buddy_c",    name:"Buddy Cannon",                 tier:3,cost:13500, qB:31, genres:["Country"],       repReq:58, fanReq:30000,specialty:"Willie's Co-Conspirator",bio:"Has produced every Willie Nelson record since 2008. Quiet hands, patient ears.", real:true},
  {id:"jay_joyce",  name:"Jay Joyce",                    tier:3,cost:14000, qB:32, genres:["Country"],       repReq:60, fanReq:32000,specialty:"Modern Arena Country",  bio:"Eric Church, Brothers Osborne, Little Big Town. Records in a converted East Nashville church.", real:true},
  {id:"joe_h",      name:"Joe Henry",                    tier:3,cost:13500, qB:31, genres:["Blues","Country"],repReq:55, fanReq:25000,specialty:"Songwriter's Producer", bio:"Solomon Burke, Allen Toussaint, Bonnie Raitt. He'll find the song under the song.", real:true},

  // ── Tier 4: Living Legends (real-world icons) ──
  {id:"dave_cobb",  name:"Dave Cobb",                    tier:4,cost:22000, qB:42, genres:["Country","Blues"],repReq:75, fanReq:60000,specialty:"American Roots Renaissance",bio:"Chris Stapleton, Sturgill Simpson, Brandi Carlile. He IS the modern country sound.", real:true},
  {id:"tbone",      name:"T Bone Burnett",               tier:4,cost:25000, qB:44, genres:["Country","Blues"],repReq:80, fanReq:75000,specialty:"Cinematic Americana",   bio:"Robert Plant & Alison Krauss, the Coen Brothers' soundtracks. The mountaintop.", real:true},
  {id:"don_was",    name:"Don Was",                      tier:4,cost:26000, qB:44, genres:["Country","Blues"],repReq:82, fanReq:80000,specialty:"Bonnie Raitt's Right Hand",bio:"President of Blue Note. Works with Stones, Dylan, Raitt. Doesn't suffer fools.", real:true},
  {id:"rubin",      name:"Rick Rubin",                   tier:4,cost:30000, qB:46, genres:["Country","Blues"],repReq:90, fanReq:100000,specialty:"Everything & Nothing", bio:"Records barefoot in Malibu. Made Cash's American Recordings. Charges accordingly.", real:true},
  {id:"dowd_mem",   name:"Tom Dowd Memorial Sessions",   tier:4,cost:24000, qB:43, genres:["Blues"],         repReq:78, fanReq:65000,specialty:"Atlantic Records Heritage",bio:"His former engineers run sessions in his honor. Aretha, Allmans, Clapton — that lineage.", real:true},
];

// ─── PRODUCER ↔ THEME SYNERGIES ───────────────────────────
// Each producer's specialty maps to one or more album themes they naturally excel at.
// Recording an album of a matching theme with that producer gives a small quality bonus.
// Producers not listed here just don't get a specialty bonus — they still work fine.
export const PRODUCER_THEMES: Record<string, string[]> = {
  // Tier 1
  earl:        ["hometown","nostalgia"],
  dottie:      ["hometown","heartbreak"],
  ray_lee:     ["loss","heartbreak"],
  porch_house: ["nostalgia","hometown"],
  clarence:    ["whiskey","loss"],
  cassie_bloom:["heartbreak","love"],
  beau_hardin: ["nostalgia","outlaw"],
  junebug:     ["hometown","faith"],
  two_step:    ["whiskey","outlaw"],
  otis_mae:    ["loss","workingman"],
  lila_h:      ["heartbreak","loss"],
  cyrus_tate:  ["whiskey","loss"],
  // Tier 2
  mama_reed:   ["heartbreak","love"],
  hank_prod:   ["nostalgia","heartbreak"],
  shoals:      ["hometown","redemption"],
  grace:       ["loss","redemption"],
  lonesome:    ["outlaw","road"],
  muddy:       ["loss","whiskey"],
  harlan:      ["love","heartbreak"],
  roxy:        ["whiskey","outlaw"],
  jed:         ["hometown","road"],
  nora_v:      ["loss","redemption"],
  silas_b:     ["workingman","hometown"],
  marigold:    ["love","heartbreak"],
  rusty_t:     ["whiskey","road"],
  shooter:     ["outlaw","freedom"],
  vance:       ["workingman","outlaw"],
  // Tier 3
  rca_b:       ["nostalgia","heartbreak"],
  ardent:      ["loss","redemption"],
  pres_hall:   ["loss","faith"],
  sound_emp:   ["love","redemption"],
  auggie:      ["loss","redemption"],
  della:       ["heartbreak","love"],
  ramsey_k:    ["redemption","freedom"],
  frank_l:     ["outlaw","freedom"],
  buddy_c:     ["outlaw","road"],
  jay_joyce:   ["freedom","heartbreak"],
  joe_h:       ["loss","redemption"],
  // Tier 4 — legends bend to most themes
  dave_cobb:   ["outlaw","redemption","hometown"],
  tbone:       ["loss","faith","redemption"],
  don_was:     ["loss","redemption","freedom"],
  rubin:       ["redemption","faith","freedom"],
  dowd_mem:    ["loss","heartbreak","redemption"],
};

export const PRODUCER_SPECIALTY_QUALITY_BONUS = 4;

// ─── RECORD LABELS ────────────────────────────────────────
// Eight labels with distinct personalities. Each has an A&R rep voice,
// a stylistic preference (genre + favorite themes), eligibility gates,
// and contract terms (advance, cuts, marketing boost, length).

// ═══════════════════════════════════════════════════════════════
// RECORD LABELS — REALISTIC CONTRACT SYSTEM
// ═══════════════════════════════════════════════════════════════
// Replaces the old simple label system with a full contract simulation:
// • Advances & recoupment tracking
// • Recording funds (separate budget per album)
// • Royalty rates (points) paid AFTER recoupment
// • 360-deal cuts: streaming, tour gross, merch, sync, publishing
// • Legal clauses: cross-collateralization, controlled composition,
//   suspension rights, key-person, creative control, approval rights
// • Term structure: albums committed + options
// • Marketing commitment & performance boost
// • Risk assessment and lawyer-review flavor on every offer
// ═══════════════════════════════════════════════════════════════

export type LabelType = "major" | "americana" | "indie" | "boutique" | "specialty";
export type DealRisk = "low" | "moderate" | "high" | "predatory";

export interface Label {
  id: string;
  name: string;
  exec: string;
  type: LabelType;
  city: string;
  blurb: string;
  pitch: string;
  genrePref: ("Country" | "Blues" | "Both")[];
  themePrefs: string[];

  // ── Eligibility Gates ──
  minFame: number;
  minRep: number;
  minFans: number;

  // ── Financial Terms ──
  advanceMin: number;
  advanceMax: number;
  recordingFundMin: number;
  recordingFundMax: number;
  royaltyRate: number;        // 0.10 = 10% — paid AFTER recoupment
  recoupRate: number;         // usually 1.0 (100% of label share recoups)

  // ── 360 Deal Cuts (what label takes OFF THE TOP of each stream) ──
  streamingCut: number;      // 0..1
  tourGrossCut: number;        // 0..1 — of tour GROSS revenue
  merchCut: number;          // 0..1
  syncCut: number;           // 0..1
  publishingCut: number;     // 0..1 — of songwriting/publishing income

  // ── Marketing ──
  marketingCommitmentMin: number;
  marketingCommitmentMax: number;
  marketingBoost: number;    // release performance multiplier

  // ── Contract Structure ──
  albumsCommitted: number;   // must deliver
  options: number;           // label can pick up
  optionWeeks: number;       // weeks per option period
  termWeeks: number;         // hard cap on contract length

  // ── Legal Clauses ──
  crossCollateralization: boolean;  // all albums recoup together?
  controlledComposition: number;     // % of statutory mechanical (0.75 = 75%)
  controlledCompositionCap: number;  // max songs affected
  suspensionRights: boolean;        // can label suspend contract?
  keyPersonClause: boolean;         // tied to specific A&R exec?
  creativeControl: number;          // 0..100 (artist control %)
  approvalRights: string[];         // e.g. ["producer","artwork","singles"]

  perks: string[];
  real?: boolean;
}

export interface LabelOffer {
  labelId: string;
  // Financial
  advance: number;
  recordingFund: number;
  royaltyRate: number;
  recoupRate: number;
  // 360 cuts
  streamingCut: number;
  tourGrossCut: number;
  merchCut: number;
  syncCut: number;
  publishingCut: number;
  // Marketing
  marketingCommitment: number;
  marketingBoost: number;
  // Contract
  albumsCommitted: number;
  options: number;
  optionWeeks: number;
  termWeeks: number;
  // Legal
  crossCollateralization: boolean;
  controlledComposition: number;
  controlledCompositionCap: number;
  suspensionRights: boolean;
  keyPersonClause: boolean;
  creativeControl: number;
  approvalRights: string[];
  // Presentation
  fitNote: string;
  riskLevel: DealRisk;
  dealScore: number;        // 0-100 computed attractiveness
  lawyerNote: string;       // flavor text from "your attorney"
}

export interface SignedLabel {
  labelId: string;
  name: string;
  exec: string;
  type: LabelType;

  // Financial tracking
  advance: number;              // original advance amount
  advanceRecouped: number;        // how much paid back so far
  recordingFund: number;          // original recording fund
  recordingFundUsed: number;      // how much spent
  royaltyRate: number;
  recoupRate: number;

  // 360 cuts
  streamingCut: number;
  tourGrossCut: number;
  merchCut: number;
  syncCut: number;
  publishingCut: number;

  // Marketing
  marketingCommitment: number;
  marketingBoost: number;
  marketingSpendYTD: number;

  // Contract tracking
  albumsCommitted: number;
  albumsDelivered: number;
  optionsRemaining: number;
  optionWeeks: number;
  weeksLeft: number;
  totalWeeks: number;
  signedAtWeek: number;

  // Legal
  crossCollateralization: boolean;
  controlledComposition: number;
  controlledCompositionCap: number;
  suspensionRights: boolean;
  keyPersonClause: boolean;
  creativeControl: number;
  approvalRights: string[];

  // Status
  isRecouped: boolean;
  perks: string[];
}

// ── LABEL DATABASE ─────────────────────────────────────────
export const LABELS: Label[] = [
  // ═══════════════════════════════════════════════════════
  // MAJORS
  // ═══════════════════════════════════════════════════════
  {
    id: "big_wheel",
    name: "Big Wheel Records",
    exec: "Carl Roosevelt",
    type: "major",
    city: "Nashville, TN",
    blurb: "Music Row machine. Spins gold from co-writes and radio plays. The advance is real; the fine print is longer.",
    pitch: "We can put you on every truck radio between here and Tulsa. We just need to make a few... adjustments. Read the deal carefully — our lawyers did.",
    genrePref: ["Country"],
    themePrefs: ["love", "hometown", "road", "heartbreak"],
    minFame: 25, minRep: 15, minFans: 5000,
    // Financial
    advanceMin: 80000, advanceMax: 250000,
    recordingFundMin: 40000, recordingFundMax: 100000,
    royaltyRate: 0.13, recoupRate: 1.0,
    // 360 cuts — heavy
    streamingCut: 0.25, tourGrossCut: 0.15, merchCut: 0.15,
    syncCut: 0.20, publishingCut: 0.15,
    // Marketing
    marketingCommitmentMin: 60000, marketingCommitmentMax: 150000,
    marketingBoost: 1.65,
    // Contract
    albumsCommitted: 3, options: 4, optionWeeks: 78, termWeeks: 312,
    // Legal — major-label aggressive
    crossCollateralization: true,
    controlledComposition: 0.75, controlledCompositionCap: 10,
    suspensionRights: true,
    keyPersonClause: false,
    creativeControl: 25,
    approvalRights: ["singles"],
    perks: [
      "Guaranteed radio promotion",
      "Full marketing department",
      "Tour booking support",
      "In-house sync team",
      "Heavy creative input expected",
      "Cross-collateralization across all albums",
    ],
  },
  {
    id: "hard_country",
    name: "Hard Country Records",
    exec: "Mitchell \"Mitch\" Lavoie",
    type: "major",
    city: "Nashville, TN",
    blurb: "Mid-major with arena ambitions. Polished. Aggressive. Cuts you a real check — then takes a real cut.",
    pitch: "You've got the hooks. We've got the machine. Let's go make some money together. Just understand: we make money first, you make money second.",
    genrePref: ["Country"],
    themePrefs: ["love", "road", "freedom", "heartbreak"],
    minFame: 30, minRep: 18, minFans: 8000,
    advanceMin: 120000, advanceMax: 400000,
    recordingFundMin: 60000, recordingFundMax: 150000,
    royaltyRate: 0.11, recoupRate: 1.0,
    streamingCut: 0.28, tourGrossCut: 0.18, merchCut: 0.18,
    syncCut: 0.25, publishingCut: 0.20,
    marketingCommitmentMin: 80000, marketingCommitmentMax: 200000,
    marketingBoost: 1.80,
    albumsCommitted: 4, options: 5, optionWeeks: 78, termWeeks: 364,
    crossCollateralization: true,
    controlledComposition: 0.75, controlledCompositionCap: 10,
    suspensionRights: true,
    keyPersonClause: false,
    creativeControl: 20,
    approvalRights: ["producer", "singles"],
    perks: [
      "Major radio push",
      "Arena tour booking",
      "Brand deal pipeline",
      "Significant creative input",
      "360 participation on all revenue streams",
      "Controlled composition clause (75% rate cap)",
    ],
  },

  // ═══════════════════════════════════════════════════════
  // SPECIALTY
  // ═══════════════════════════════════════════════════════
  {
    id: "crossroads",
    name: "Crossroads Blues",
    exec: "Doris Mae Holloway",
    type: "specialty",
    city: "Memphis, TN",
    blurb: "Blues-only. Run by an 80-year-old woman who knew Albert King personally. Old-school terms, no 360 nonsense.",
    pitch: "We don't make pop. We don't make crossover. We make blues records that'll still mean something in fifty years. And we don't touch your touring money.",
    genrePref: ["Blues"],
    themePrefs: ["loss", "whiskey", "redemption", "heartbreak"],
    minFame: 15, minRep: 25, minFans: 3000,
    advanceMin: 15000, advanceMax: 60000,
    recordingFundMin: 8000, recordingFundMax: 25000,
    royaltyRate: 0.18, recoupRate: 1.0,
    streamingCut: 0.12, tourGrossCut: 0.03, merchCut: 0.0,
    syncCut: 0.08, publishingCut: 0.0,
    marketingCommitmentMin: 12000, marketingCommitmentMax: 35000,
    marketingBoost: 1.22,
    albumsCommitted: 2, options: 2, optionWeeks: 52, termWeeks: 156,
    crossCollateralization: false,
    controlledComposition: 1.0, controlledCompositionCap: 12,
    suspensionRights: false,
    keyPersonClause: true,
    creativeControl: 75,
    approvalRights: ["producer", "artwork", "singles", "release date"],
    perks: [
      "Blues press connections",
      "Festival booking circuit",
      "Vinyl-first releases",
      "Full creative control",
      "No merch or touring cuts",
      "Key-person clause (Doris is your A&R)",
    ],
  },

  // ═══════════════════════════════════════════════════════
  // AMERICANA
  // ═══════════════════════════════════════════════════════
  {
    id: "smokehouse",
    name: "Smokehouse Recordings",
    exec: "Wyatt Pearce",
    type: "americana",
    city: "East Nashville, TN",
    blurb: "Americana darling. Distributes through a Brooklyn warehouse and a prayer. Fair splits, modest reach.",
    pitch: "You make the records you want to make. We just make sure they get heard by the right people. Our cut is moderate because our reach is moderate.",
    genrePref: ["Country", "Blues"],
    themePrefs: ["hometown", "road", "outlaw", "nostalgia", "redemption"],
    minFame: 12, minRep: 18, minFans: 2500,
    advanceMin: 12000, advanceMax: 50000,
    recordingFundMin: 10000, recordingFundMax: 30000,
    royaltyRate: 0.16, recoupRate: 1.0,
    streamingCut: 0.15, tourGrossCut: 0.08, merchCut: 0.08,
    syncCut: 0.12, publishingCut: 0.10,
    marketingCommitmentMin: 15000, marketingCommitmentMax: 45000,
    marketingBoost: 1.28,
    albumsCommitted: 2, options: 3, optionWeeks: 52, termWeeks: 182,
    crossCollateralization: true,
    controlledComposition: 0.90, controlledCompositionCap: 11,
    suspensionRights: true,
    keyPersonClause: false,
    creativeControl: 60,
    approvalRights: ["producer", "artwork"],
    perks: [
      "Indie credibility",
      "NPR & AAA press",
      "Festival circuit",
      "Moderate creative control",
      "Cross-collateralization (albums only)",
    ],
  },

  // ═══════════════════════════════════════════════════════
  // INDIE
  // ═══════════════════════════════════════════════════════
  {
    id: "two_step_rec",
    name: "Two-Step Records",
    exec: "Buck Hennessey",
    type: "indie",
    city: "Austin, TX",
    blurb: "Outlaw country revival. Office is the upstairs of a honky tonk. Artist-friendly terms, artist-sized reach.",
    pitch: "Half this town wants to make Nashville pop. We don't. Come make a real damn country record. We take a small cut because we don't have a tower downtown.",
    genrePref: ["Country"],
    themePrefs: ["outlaw", "whiskey", "freedom", "road", "workingman"],
    minFame: 10, minRep: 20, minFans: 2000,
    advanceMin: 8000, advanceMax: 35000,
    recordingFundMin: 5000, recordingFundMax: 18000,
    royaltyRate: 0.20, recoupRate: 1.0,
    streamingCut: 0.12, tourGrossCut: 0.05, merchCut: 0.05,
    syncCut: 0.10, publishingCut: 0.0,
    marketingCommitmentMin: 8000, marketingCommitmentMax: 22000,
    marketingBoost: 1.15,
    albumsCommitted: 1, options: 2, optionWeeks: 52, termWeeks: 130,
    crossCollateralization: false,
    controlledComposition: 1.0, controlledCompositionCap: 12,
    suspensionRights: false,
    keyPersonClause: true,
    creativeControl: 85,
    approvalRights: ["producer", "artwork", "singles", "release date"],
    perks: [
      "Texas circuit booking",
      "Outlaw cred",
      "Vinyl runs guaranteed",
      "Total creative control",
      "No publishing cut",
      "No cross-collateralization",
    ],
  },

  // ═══════════════════════════════════════════════════════
  // BOUTIQUE
  // ═══════════════════════════════════════════════════════
  {
    id: "magnolia",
    name: "Magnolia House",
    exec: "June Hartwell",
    type: "boutique",
    city: "Asheville, NC",
    blurb: "Singer-songwriter boutique. Three employees and a candle budget. The deal is gentle; the reach is intimate.",
    pitch: "We sign songwriters. Just songwriters. If you've got something to say, we'll help you say it. We won't make you rich overnight, but you won't wake up owing us your house.",
    genrePref: ["Country", "Blues"],
    themePrefs: ["heartbreak", "loss", "love", "faith", "redemption"],
    minFame: 8, minRep: 15, minFans: 1500,
    advanceMin: 5000, advanceMax: 25000,
    recordingFundMin: 3000, recordingFundMax: 12000,
    royaltyRate: 0.22, recoupRate: 1.0,
    streamingCut: 0.10, tourGrossCut: 0.03, merchCut: 0.05,
    syncCut: 0.08, publishingCut: 0.05,
    marketingCommitmentMin: 5000, marketingCommitmentMax: 15000,
    marketingBoost: 1.10,
    albumsCommitted: 1, options: 2, optionWeeks: 52, termWeeks: 104,
    crossCollateralization: false,
    controlledComposition: 1.0, controlledCompositionCap: 12,
    suspensionRights: false,
    keyPersonClause: true,
    creativeControl: 90,
    approvalRights: ["producer", "artwork", "singles", "release date", "tour routing"],
    perks: [
      "Songwriter publishing help",
      "NPR/AAA press",
      "Listening-room tour circuit",
      "All creative control",
      "Low 360 participation",
      "June manages your A&R personally",
    ],
  },
  {
    id: "coal_holler",
    name: "Coal Holler Music",
    exec: "Ezra Tibbs",
    type: "indie",
    city: "Bristol, VA/TN",
    blurb: "Working-class roots label. Founder's daddy worked the Pittston mines. Honest splits for honest music.",
    pitch: "We make records for people who work for a living. And we pay our artists like it. No 360. No cross-collateralization. Just a straight deal.",
    genrePref: ["Country", "Blues"],
    themePrefs: ["workingman", "hometown", "faith", "loss", "whiskey"],
    minFame: 6, minRep: 12, minFans: 1000,
    advanceMin: 3000, advanceMax: 15000,
    recordingFundMin: 2000, recordingFundMax: 8000,
    royaltyRate: 0.25, recoupRate: 1.0,
    streamingCut: 0.08, tourGrossCut: 0.0, merchCut: 0.0,
    syncCut: 0.05, publishingCut: 0.0,
    marketingCommitmentMin: 3000, marketingCommitmentMax: 10000,
    marketingBoost: 1.08,
    albumsCommitted: 1, options: 1, optionWeeks: 52, termWeeks: 78,
    crossCollateralization: false,
    controlledComposition: 1.0, controlledCompositionCap: 12,
    suspensionRights: false,
    keyPersonClause: false,
    creativeControl: 95,
    approvalRights: ["producer", "artwork", "singles", "release date", "tour routing", "merch design"],
    perks: [
      "Honest 50/50 publishing splits",
      "Appalachian press network",
      "Bluegrass festival circuit",
      "Creative control",
      "NO 360 cuts (no tour, no merch, no publishing)",
      "No cross-collateralization",
    ],
  },
  {
    id: "front_porch",
    name: "Front Porch Records",
    exec: "Lanie Winslow",
    type: "boutique",
    city: "Athens, GA",
    blurb: "Heartbreak ballad specialists. Roster is mostly women under thirty-five. Fair deal, strong playlist team.",
    pitch: "You're writing some of the best heartbreak songs I've heard all year. Let us be the home for them. We'll push them to the right ears.",
    genrePref: ["Country", "Blues"],
    themePrefs: ["heartbreak", "love", "loss"],
    minFame: 8, minRep: 14, minFans: 1800,
    advanceMin: 6000, advanceMax: 28000,
    recordingFundMin: 4000, recordingFundMax: 15000,
    royaltyRate: 0.19, recoupRate: 1.0,
    streamingCut: 0.13, tourGrossCut: 0.06, merchCut: 0.08,
    syncCut: 0.10, publishingCut: 0.08,
    marketingCommitmentMin: 8000, marketingCommitmentMax: 22000,
    marketingBoost: 1.18,
    albumsCommitted: 2, options: 2, optionWeeks: 52, termWeeks: 130,
    crossCollateralization: false,
    controlledComposition: 0.95, controlledCompositionCap: 12,
    suspensionRights: false,
    keyPersonClause: true,
    creativeControl: 70,
    approvalRights: ["producer", "artwork", "singles"],
    perks: [
      "Strong female artist roster",
      "Streaming playlist push",
      "Targeted demographic marketing",
      "Creative freedom",
      "Moderate 360 participation",
    ],
  },
];

// ── HELPERS ────────────────────────────────────────────────

export function getLabel(id: string): Label | undefined {
  return LABELS.find((l) => l.id === id);
}
export function getManager(id: string): Manager | undefined { return MANAGERS.find(m => m.id === id); }

export function getRiskLabel(risk: DealRisk): { text: string; color: string; icon: string } {
  switch (risk) {
    case "low":    return { text: "Artist-Friendly", color: "var(--sage)", icon: "🟢" };
    case "moderate": return { text: "Standard Terms", color: "var(--amber)", icon: "🟡" };
    case "high":   return { text: "Label-Favorable", color: "var(--rust)", icon: "🟠" };
    case "predatory": return { text: "Heavy — Lawyer Up", color: "#c0392b", icon: "🔴" };
  }
}

// Compute a 0-100 deal-attractiveness score from the artist's perspective.
// Higher = better for the artist.
export function scoreDeal(offer: LabelOffer): number {
  let score = 50;
  // Advance generosity (normalized against a $200k baseline)
  score += (offer.advance / 200000) * 15;
  // Recording fund
  score += (offer.recordingFund / 80000) * 10;
  // Royalty rate (18% is neutral; each point away shifts 4)
  score += (offer.royaltyRate - 0.18) * 400;
  // 360 cuts — each percentage point costs 1.5 score
  score -= offer.streamingCut * 150;
  score -= offer.tourGrossCut * 200;
  score -= offer.merchCut * 200;
  score -= offer.syncCut * 120;
  score -= offer.publishingCut * 180;
  // Marketing
  score += (offer.marketingCommitment / 100000) * 8;
  score += (offer.marketingBoost - 1.0) * 20;
  // Creative control
  score += (offer.creativeControl - 50) * 0.4;
  // Legal protections
  if (!offer.crossCollateralization) score += 8;
  if (!offer.suspensionRights) score += 5;
  if (offer.keyPersonClause) score += 3;
  if (offer.controlledComposition >= 1.0) score += 5;
  // Term length (shorter is better)
  score -= (offer.termWeeks / 52) * 1.5;
  return clamp(score, 0, 100);
}

// Determine risk level from offer terms.
export function assessRisk(offer: LabelOffer): DealRisk {
  let redFlags = 0;
  if (offer.crossCollateralization) redFlags += 2;
  if (offer.suspensionRights) redFlags += 1;
  if (offer.tourGrossCut > 0.12) redFlags += 2;
  if (offer.merchCut > 0.12) redFlags += 2;
  if (offer.publishingCut > 0.12) redFlags += 2;
  if (offer.streamingCut > 0.22) redFlags += 1;
  if (offer.royaltyRate < 0.13) redFlags += 2;
  if (offer.creativeControl < 30) redFlags += 1;
  if (offer.controlledComposition < 0.85) redFlags += 1;
  if (offer.termWeeks > 260) redFlags += 1;

  if (redFlags >= 7) return "predatory";
  if (redFlags >= 4) return "high";
  if (redFlags >= 2) return "moderate";
  return "low";
}

// Generate lawyer flavor text based on offer terms.
export function generateLawyerNote(offer: LabelOffer): string {
  const notes: string[] = [];
  if (offer.advance > 150000) notes.push("Big advance, but remember — it's all recoupable.");
  else if (offer.advance < 15000) notes.push("Small advance means low risk, but you'll need tour money elsewhere.");

  if (offer.royaltyRate >= 0.20) notes.push("Strong royalty rate. You'll see back-end money faster once recouped.");
  else if (offer.royaltyRate <= 0.12) notes.push("Low royalty rate. You'll be unrecouped for a long time.");

  if (offer.crossCollateralization) notes.push("CROSS-COLLATERALIZATION: Every album pays for every other album. Dangerous.");
  if (offer.suspensionRights) notes.push("SUSPENSION RIGHTS: They can freeze you indefinitely.");
  if (offer.tourGrossCut > 0.10) notes.push(`Tour gross cut of ${Math.round(offer.tourGrossCut*100)}% — they'll take a bite before you pay your crew.`);
  if (offer.merchCut > 0.10) notes.push(`Merch cut of ${Math.round(offer.merchCut*100)}% — your table revenue isn't fully yours.`);
  if (offer.publishingCut > 0.10) notes.push(`Publishing cut of ${Math.round(offer.publishingCut*100)}% — they want your songwriting money too.`);
  if (offer.creativeControl < 35) notes.push("Low creative control. Expect notes on your mixes, your look, and your singles.");
  if (offer.keyPersonClause) notes.push("Key-person clause: if your A&R leaves, you may have an exit window.");
  if (offer.controlledComposition < 1.0) notes.push(`Controlled composition: mechanical rates capped at ${Math.round(offer.controlledComposition*100)}%. Songwriters get less.`);

  if (notes.length === 0) return "Clean deal. Nothing here that'll keep me up at night.";
  return notes.join(" ");
}

// ── OFFER GENERATION ───────────────────────────────────────

export function generateLabelOffers(s: GameState): LabelOffer[] {
  const sig = getSignatureTheme(s.themeCounts);
  const eligible = LABELS.filter(
    (L) =>
      s.fame >= L.minFame &&
      s.rep >= L.minRep &&
      s.fans >= L.minFans &&
      ((L.genrePref as string[]).includes(s.genre) || (L.genrePref as string[]).includes("Both"))
  );
  if (!eligible.length) return [];

  const scored = eligible
    .map((L) => {
      let score = 1;
      if (sig && L.themePrefs.includes(sig.themeId)) score += 1.5;
      if ((L.genrePref as string[]).includes(s.genre)) score += 0.5;
      score += Math.max(0, 1 - Math.abs(L.minFame - s.fame) / 40);
      score += Math.random() * 0.7;
      return { L, score };
    })
    .sort((a, b) => b.score - a.score);

  const picks = scored.slice(0, Math.min(3, scored.length));

  return picks.map(({ L }) => {
    const adv = Math.floor(L.advanceMin + Math.random() * (L.advanceMax - L.advanceMin));
    const recFund = Math.floor(L.recordingFundMin + Math.random() * (L.recordingFundMax - L.recordingFundMin));
    const mkCommit = Math.floor(L.marketingCommitmentMin + Math.random() * (L.marketingCommitmentMax - L.marketingCommitmentMin));

    // Slight variance on cuts based on player leverage (fame/rep)
    const leverage = clamp((s.fame + s.rep * 2) / 100, 0, 1); // 0..1
    const cutDiscount = leverage * 0.04; // up to 4% better cuts

    const offer: LabelOffer = {
      labelId: L.id,
      advance: adv,
      recordingFund: recFund,
      royaltyRate: L.royaltyRate,
      recoupRate: L.recoupRate,
      streamingCut: clamp(L.streamingCut - cutDiscount, 0.02, 0.40),
      tourGrossCut: clamp(L.tourGrossCut - cutDiscount, 0, 0.30),
      merchCut: clamp(L.merchCut - cutDiscount, 0, 0.25),
      syncCut: clamp(L.syncCut - cutDiscount, 0, 0.30),
      publishingCut: clamp(L.publishingCut - cutDiscount, 0, 0.25),
      marketingCommitment: mkCommit,
      marketingBoost: L.marketingBoost,
      albumsCommitted: L.albumsCommitted,
      options: L.options,
      optionWeeks: L.optionWeeks,
      termWeeks: L.termWeeks,
      crossCollateralization: L.crossCollateralization,
      controlledComposition: L.controlledComposition,
      controlledCompositionCap: L.controlledCompositionCap,
      suspensionRights: L.suspensionRights,
      keyPersonClause: L.keyPersonClause,
      creativeControl: L.creativeControl,
      approvalRights: [...L.approvalRights],
      fitNote: "",
      riskLevel: "moderate",
      dealScore: 0,
      lawyerNote: "",
    };

    // Fit note
    const fitParts: string[] = [];
    if (sig && L.themePrefs.includes(sig.themeId))
      fitParts.push(`your ${sig.theme.name.toLowerCase()} catalog`);
    fitParts.push(`your ${s.genre.toLowerCase()} sound`);
    if (s.fame >= L.minFame + 12) fitParts.push("your visibility");
    offer.fitNote = `They love ${fitParts.join(" and ")}.`;

    // Assessments
    offer.riskLevel = assessRisk(offer);
    offer.dealScore = Math.round(scoreDeal(offer));
    offer.lawyerNote = generateLawyerNote(offer);

    return offer;
  });
}

export function generateManagerOffers(s: GameState): ManagerOffer[] {
  const eligible = MANAGERS.filter(m => s.fame >= m.minFame && s.rep >= m.minRep);
  if (!eligible.length) return [];
  const scored = eligible.map(m => ({ m, score: Math.random() + (m.minFame <= s.fame ? 0.3 : 0) }))
    .sort((a,b)=>b.score-a.score);
  const picks = scored.slice(0, Math.min(3, scored.length));
  return picks.map(({m}) => ({
    managerId: m.id,
    weeklyFee: m.weeklyFee,
    showRevPct: m.showRevPct,
    brandDealBoost: m.brandDealBoost,
    repPerWeek: m.repPerWeek,
    fitNote: m.type === "legend"     ? "She's heard your material and is making an exception."
           : m.type === "aggressive" ? "He's been watching your numbers and wants in."
           : m.type === "boutique"   ? "She loves your songwriting and would manage you personally."
           :                            "He thinks you've got the makings of a real career.",
  }));
}

export interface Manager {
  id: string;
  name: string;
  type: "old_school" | "aggressive" | "boutique" | "legend";
  city: string;
  blurb: string;
  pitch: string;
  minFame: number;
  minRep: number;
  weeklyFee: number;            // $ per week deducted from your account
  showRevPct: number;           // bonus to show net (0..1)
  brandDealBoost: number;       // multiplier on weekly brand deal income (1.0 = none)
  repPerWeek: number;           // small rep accrual each week
  perks: string[];              // Human-readable perks for the offer card
}

export const MANAGERS: Manager[] = [
  { id:"earl_tex", name:"Earl 'Tex' McAllister", type:"old_school", city:"Nashville, TN",
    minFame:5, minRep:8,
    blurb:"Forty years in the business. Steady, conservative, doesn't suffer foolishness.",
    pitch:"Look — I'm not flashy. I won't book you opening for some pop star. But I'll get you respectable shows and a real career.",
    weeklyFee:75, showRevPct:0.15, brandDealBoost:1.0, repPerWeek:0.10,
    perks:["+15% show net revenue","Steady venue booking","Respected industry network","Slow & steady rep growth"] },
  { id:"june_b", name:"June Buchanan", type:"boutique", city:"Asheville, NC",
    minFame:6, minRep:12,
    blurb:"Manages four artists, two of them her cousins. Means it when she says she'll fight for you.",
    pitch:"I take a small roster on purpose. If I sign you, you get my whole attention. Always.",
    weeklyFee:90, showRevPct:0.18, brandDealBoost:1.0, repPerWeek:0.15,
    perks:["+18% show net revenue","Personal attention","Songwriter circle access","+0.15 rep/week"] },
  { id:"bobby2p", name:"Bobby 'Two-Phones' Crandall", type:"aggressive", city:"Nashville, TN",
    minFame:12, minRep:5,
    blurb:"Calls everyone 'pal'. Knows everyone. Probably owes them money. Gets it done anyway.",
    pitch:"You don't need a saint, pal — you need somebody who answers when the phone rings at 2am. That's me.",
    weeklyFee:120, showRevPct:0.22, brandDealBoost:1.10, repPerWeek:0,
    perks:["+22% show net revenue","Aggressive label pitching","+10% brand deal income","Rumored shady connections"] },
  { id:"marisol", name:"Marisol Quinn", type:"aggressive", city:"Nashville, TN",
    minFame:18, minRep:10,
    blurb:"Young, hungry, on every A&R rep's speed dial. Texts eighteen hours a day.",
    pitch:"You're sitting on a moment and you're not pressing it. That changes today. I'll have brands calling by Friday.",
    weeklyFee:200, showRevPct:0.20, brandDealBoost:1.25, repPerWeek:0.15,
    perks:["+20% show net revenue","+25% brand deal income","Major label introductions","Aggressive press push"] },
  { id:"patricia_v", name:"Patricia Vance", type:"legend", city:"Nashville, TN",
    minFame:45, minRep:35,
    blurb:"Three decades of country royalty on her client list. Charges accordingly.",
    pitch:"I don't take new clients. Somebody played me your record and I made an exception. Let's discuss.",
    weeklyFee:600, showRevPct:0.25, brandDealBoost:1.50, repPerWeek:0.40,
    perks:["+25% show net revenue","+50% brand deal income","+0.4 rep/week","Open door to anyone in town"] },
];

// ─── OFFER + CONTRACT TYPES ─────────────────────────────── (defined above)
export interface ManagerOffer {
  managerId: string;
  weeklyFee: number;
  showRevPct: number;
  brandDealBoost: number;
  repPerWeek: number;
  fitNote: string;
}

export interface SignedManager {
  managerId: string;
  name: string;
  weeklyFee: number;
  showRevPct: number;
  brandDealBoost: number;
  repPerWeek: number;
  signedAtWeek: number;
}




// ── RECOUPMENT & REVENUE MATH ─────────────────────────────

export interface WeeklyLabelAccounting {
  // Raw revenue that hit this week
  streamingRevenue: number;
  tourGrossRevenue: number;
  merchRevenue: number;
  syncRevenue: number;
  publishingRevenue: number;

  // Label's share (the 360 cuts)
  labelStreamingShare: number;
  labelTourShare: number;
  labelMerchShare: number;
  labelSyncShare: number;
  labelPublishingShare: number;
  totalLabelShare: number;

  // Artist's immediate keep (revenue minus label cut)
  artistStreamingKeep: number;
  artistTourKeep: number;
  artistMerchKeep: number;
  artistSyncKeep: number;
  artistPublishingKeep: number;
  totalArtistKeep: number;

  // Recoupment
  advanceRemainingBefore: number;
  recoupedThisWeek: number;
  advanceRemainingAfter: number;
  isRecouped: boolean;

  // Royalty bonus (only if recouped)
  royaltyBonus: number;

  // Net to artist this week
  artistNetThisWeek: number;
}

// Run weekly accounting for a signed label contract.
// Returns how much the ARTIST actually gets paid this week.
export function runLabelAccounting(
  label: SignedLabel,
  streamingRev: number,
  tourGrossRev: number,
  merchRev: number,
  syncRev: number,
  publishingRev: number
): WeeklyLabelAccounting {
  const lblStreaming = streamingRev * label.streamingCut;
  const lblTour = tourGrossRev * label.tourGrossCut;
  const lblMerch = merchRev * label.merchCut;
  const lblSync = syncRev * label.syncCut;
  const lblPublishing = publishingRev * label.publishingCut;
  const totalLabelShare = lblStreaming + lblTour + lblMerch + lblSync + lblPublishing;

  const artStreaming = streamingRev - lblStreaming;
  const artTour = tourGrossRev - lblTour;
  const artMerch = merchRev - lblMerch;
  const artSync = syncRev - lblSync;
  const artPublishing = publishingRev - lblPublishing;
  const totalArtistKeep = artStreaming + artTour + artMerch + artSync + artPublishing;

  const remainingBefore = label.advance - label.advanceRecouped;
  const recoupThisWeek = Math.min(totalLabelShare * label.recoupRate, remainingBefore);
  const remainingAfter = remainingBefore - recoupThisWeek;
  const nowRecouped = remainingAfter <= 0;

  // Royalty bonus: after recoupment, artist gets royaltyRate % of label's share
  let royaltyBonus = 0;
  if (nowRecouped) {
    const excess = totalLabelShare - recoupThisWeek; // if label share > remaining balance
    const royaltyBase = excess > 0 ? excess : totalLabelShare;
    royaltyBonus = royaltyBase * label.royaltyRate;
  }

  return {
    streamingRevenue: streamingRev,
    tourGrossRevenue: tourGrossRev,
    merchRevenue: merchRev,
    syncRevenue: syncRev,
    publishingRevenue: publishingRev,
    labelStreamingShare: lblStreaming,
    labelTourShare: lblTour,
    labelMerchShare: lblMerch,
    labelSyncShare: lblSync,
    labelPublishingShare: lblPublishing,
    totalLabelShare,
    artistStreamingKeep: artStreaming,
    artistTourKeep: artTour,
    artistMerchKeep: artMerch,
    artistSyncKeep: artSync,
    artistPublishingKeep: artPublishing,
    totalArtistKeep,
    advanceRemainingBefore: remainingBefore,
    recoupedThisWeek: recoupThisWeek,
    advanceRemainingAfter: Math.max(0, remainingAfter),
    isRecouped: nowRecouped,
    royaltyBonus,
    artistNetThisWeek: totalArtistKeep + royaltyBonus,
  };
}

// Build a SignedLabel from an offer and the current game state.
export function signLabel(offer: LabelOffer, state: GameState): SignedLabel {
  const def = getLabel(offer.labelId)!;
  return {
    labelId: offer.labelId,
    name: def.name,
    exec: def.exec,
    type: def.type,
    advance: offer.advance,
    advanceRecouped: 0,
    recordingFund: offer.recordingFund,
    recordingFundUsed: 0,
    royaltyRate: offer.royaltyRate,
    recoupRate: offer.recoupRate,
    streamingCut: offer.streamingCut,
    tourGrossCut: offer.tourGrossCut,
    merchCut: offer.merchCut,
    syncCut: offer.syncCut,
    publishingCut: offer.publishingCut,
    marketingCommitment: offer.marketingCommitment,
    marketingBoost: offer.marketingBoost,
    marketingSpendYTD: 0,
    albumsCommitted: offer.albumsCommitted,
    albumsDelivered: 0,
    optionsRemaining: offer.options,
    optionWeeks: offer.optionWeeks,
    weeksLeft: offer.termWeeks,
    totalWeeks: offer.termWeeks,
    signedAtWeek: state.week,
    crossCollateralization: offer.crossCollateralization,
    controlledComposition: offer.controlledComposition,
    controlledCompositionCap: offer.controlledCompositionCap,
    suspensionRights: offer.suspensionRights,
    keyPersonClause: offer.keyPersonClause,
    creativeControl: offer.creativeControl,
    approvalRights: [...offer.approvalRights],
    isRecouped: false,
    perks: [...def.perks],
  };
}

// ── PRESENTATION HELPERS ─────────────────────────────────

export function fmtPercent(n: number): string {
  return Math.round(n * 100) + "%";
}

export function fmtDuration(weeks: number): string {
  const years = weeks / 52;
  if (years >= 1) return `${years.toFixed(1)} year${years >= 2 ? "s" : ""}`;
  return `${weeks} weeks`;
}

export function recoupProgress(label: SignedLabel): {
  pct: number;
  formatted: string;
  status: string;
} {
  const pct = clamp(label.advanceRecouped / label.advance, 0, 1);
  const formatted = `${fmtMoney(label.advanceRecouped)} / ${fmtMoney(label.advance)}`;
  const status = label.isRecouped
    ? "✓ FULLY RECOUPED — royalties now paying"
    : pct > 0.75
    ? "Almost there"
    : pct > 0.4
    ? "Midway"
    : pct > 0
    ? "Just started"
    : "Not yet recouped";
  return { pct, formatted, status };
}

export function get360Summary(offer: LabelOffer | SignedLabel): {
  totalCut: number;
  severity: "light" | "moderate" | "heavy" | "crushing";
  color: string;
} {
  const total = offer.streamingCut + offer.tourGrossCut + offer.merchCut + offer.syncCut + offer.publishingCut;
  if (total < 0.15) return { totalCut: total, severity: "light", color: "var(--sage)" };
  if (total < 0.35) return { totalCut: total, severity: "moderate", color: "var(--amber)" };
  if (total < 0.60) return { totalCut: total, severity: "heavy", color: "var(--rust)" };
  return { totalCut: total, severity: "crushing", color: "#c0392b" };
}

// ─── PRODUCER RELATIONSHIPS ───────────────────────────────
// Repeated work with the same producer builds a relationship that
// (a) gives a small fee discount and (b) yields a small quality bonus.
// The Home Studio ("self") is excluded — there's no relationship to build.
export interface ProducerRelationship {
  count: number;
  tier: 0 | 1 | 2 | 3;
  label: string;          // "Working Relationship" / "Trusted Collaborator" / "Lifelong Partner"
  discountPct: number;    // 0..1 — fraction off the producer fee
  qBonus: number;         // flat quality points added at finish
}

export function getProducerRelationship(producerId: string, counts: Record<string, number> | undefined | null): ProducerRelationship {
  if (producerId === "self") return { count:0, tier:0, label:"", discountPct:0, qBonus:0 };
  const n = counts?.[producerId] ?? 0;
  if (n >= 10) return { count:n, tier:3, label:"Lifelong Partner",      discountPct:0.15, qBonus:4 };
  if (n >= 5)  return { count:n, tier:2, label:"Trusted Collaborator",  discountPct:0.10, qBonus:2 };
  if (n >= 2)  return { count:n, tier:1, label:"Working Relationship",  discountPct:0.05, qBonus:1 };
  return { count:n, tier:0, label:"", discountPct:0, qBonus:0 };
}

// Effective producer fee after relationship discount (rounded down to nearest dollar).
export function getProducerEffectiveCost(producer: Producer, counts: Record<string, number> | undefined | null): number {
  const rel = getProducerRelationship(producer.id, counts);
  return Math.floor(producer.cost * (1 - rel.discountPct));
}

// ── RECORDING STUDIOS ──────────────────────────────────────
export interface Studio {
  id: string; name: string; city: string; tier: number;
  perWeek: number;     // weekly rental cost
  qB: number;          // small quality bonus stacked with producer
  vibe: string;        // 1-line vibe
  bio: string;         // longer description
  repReq: number; fanReq: number;
  real?: boolean;
}

export const STUDIOS: Studio[] = [
  // ── Tier 0: Free / Cheap ──
  {id:"home_studio",   name:"Home Studio",            city:"Your house",        tier:0, perWeek:0,    qB:0,  vibe:"DIY",                bio:"A laptop, a SM58, and a bedroom rug pinned to the wall. Free, always.", repReq:0,  fanReq:0 },
  {id:"garage",        name:"The Garage",             city:"Your driveway",     tier:0, perWeek:75,   qB:1,  vibe:"Loud & Cheap",       bio:"You moved the lawnmower. The neighbors aren't thrilled.",                  repReq:0,  fanReq:0 },

  // ── Tier 1: Indie Rooms (mostly fictional) ──
  {id:"holler_room",   name:"Holler Tape Room",       city:"Knoxville, TN",     tier:1, perWeek:300,  qB:3,  vibe:"Lo-Fi Warmth",       bio:"One Tascam 388, one Wurlitzer, one extremely loud HVAC unit.",            repReq:0,  fanReq:0 },
  {id:"drifter_den",   name:"Drifter's Den",          city:"Bowling Green, KY", tier:1, perWeek:400,  qB:4,  vibe:"Songwriter Friendly",bio:"Run by an ex-touring guitarist. Half-price coffee, full-time mood.",       repReq:0,  fanReq:200 },
  {id:"crescent_moon", name:"Crescent Moon Recording",city:"Memphis, TN",       tier:1, perWeek:550,  qB:4,  vibe:"After-Hours Blues",  bio:"Opens at 8 p.m. Closes when you're done. Cash preferred.",                 repReq:5,  fanReq:400 },
  {id:"bayou_tape",    name:"Bayou Tape Co.",         city:"Lafayette, LA",     tier:1, perWeek:600,  qB:5,  vibe:"Swampy & Humid",     bio:"Built into a former crawfish processing plant. The hum is part of the sound.", repReq:6, fanReq:600 },
  {id:"cabin_pines",   name:"The Cabin in the Pines", city:"Boone, NC",         tier:1, perWeek:700,  qB:5,  vibe:"Mountain Retreat",   bio:"You drive an hour up a dirt road. Then you don't leave for three weeks.",  repReq:8,  fanReq:800 },
  {id:"east_nash_porch",name:"East Nashville Porch",  city:"East Nashville, TN",tier:1, perWeek:650,  qB:5,  vibe:"Hipster Country",    bio:"Three rooms, four cats, an acoustic baffle made of old quilts. It works.", repReq:5,  fanReq:500 },

  // ── Tier 2: Regional Pros (mix) ──
  {id:"sam_phillips",  name:"Sam Phillips Recording", city:"Memphis, TN",       tier:2, perWeek:600,  qB:9,  vibe:"Rock & Roll Origin", bio:"Sam Phillips opened it after he sold Sun. The console is older than your parents.", repReq:18, fanReq:3500, real:true },
  {id:"capricorn",     name:"Capricorn Sound",        city:"Macon, GA",         tier:2, perWeek:650,  qB:10, vibe:"Southern Rock Holy Ground",bio:"The Allman Brothers' mothership. Recently restored, fully operational.",  repReq:20, fanReq:4000, real:true },
  {id:"sunset_sound",  name:"Sunset Sound",           city:"Hollywood, CA",     tier:2, perWeek:800,  qB:11, vibe:"Sunshine Pop Sheen",  bio:"Doors, Beach Boys, Stones recorded here. The plate reverb still works.",  repReq:22, fanReq:5000, real:true },
  {id:"ocean_way_n",   name:"Ocean Way Nashville",    city:"Nashville, TN",     tier:2, perWeek:750,  qB:11, vibe:"Tracking Hall",      bio:"Built inside a former church. Live strings sound like the ceiling itself sings.", repReq:24, fanReq:5500, real:true },
  {id:"ardent_studio", name:"Ardent Studios",         city:"Memphis, TN",       tier:2, perWeek:700,  qB:10, vibe:"Big Star Lineage",   bio:"ZZ Top, Big Star, REM, the Replacements. Everyone passes through eventually.", repReq:22, fanReq:5000, real:true },
  {id:"swamp_compound",name:"Swamp Compound",         city:"Tupelo, MS",        tier:2, perWeek:450,  qB:8,  vibe:"Hill Country Trance",bio:"R.L. Burnside used to drink here. The shack across the lot is for napping.",repReq:16, fanReq:3000 },
  {id:"hatch_collective",name:"Hatch Collective",     city:"Nashville, TN",     tier:2, perWeek:550,  qB:9,  vibe:"Modern Tracking",    bio:"Three rooms, a Neve, and a coffee bar. Booked solid through next March.",  repReq:18, fanReq:3500 },

  // ── Tier 3: World-Famous Rooms ──
  {id:"sun_studio",    name:"Sun Studio",             city:"Memphis, TN",       tier:3, perWeek:1400, qB:18, vibe:"Where Rock Was Born",bio:"Elvis, Cash, Lewis, Perkins. Tourists by day, sessions by night. You can feel it.", repReq:40, fanReq:12000, real:true },
  {id:"fame_studios",  name:"FAME Studios",           city:"Muscle Shoals, AL", tier:3, perWeek:1500, qB:18, vibe:"Muscle Shoals Sound",bio:"Aretha cut 'I Never Loved a Man' here. The Swampers still answer the phone.",repReq:42, fanReq:13000, real:true },
  {id:"ms_sound",      name:"Muscle Shoals Sound",    city:"Sheffield, AL",     tier:3, perWeek:1700, qB:19, vibe:"Rhythm Section Cathedral",bio:"3614 Jackson Highway. Where the Stones cut 'Brown Sugar' and 'Wild Horses'.",  repReq:44, fanReq:14000, real:true },
  {id:"sound_emporium",name:"Sound Emporium Nashville",city:"Nashville, TN",    tier:3, perWeek:2000, qB:20, vibe:"Cobb's Home Field",  bio:"Where Stapleton's 'Traveller' was tracked. Dave Cobb basically lives here.", repReq:48, fanReq:18000, real:true },
  {id:"electric_lady", name:"Electric Lady Studios",  city:"New York, NY",      tier:3, perWeek:2000, qB:21, vibe:"Hendrix's Cathedral",bio:"Jimi built it. Stevie Wonder lived in it. The downstairs lounge is unchanged.",repReq:55, fanReq:22000, real:true },

  // ── Studios in newly-added cities ──
  {id:"sugarhill_houston",name:"SugarHill Recording Studios",city:"Houston, TX",   tier:2, perWeek:650,  qB:9,  vibe:"Texas Tradition",      bio:"Oldest continuously operating studio in Texas. Lightnin' Hopkins, Freddy Fender, Beyoncé.", repReq:18, fanReq:3500, real:true },
  {id:"bluecat_satx",     name:"Blue Cat Studios",          city:"San Antonio, TX",tier:1, perWeek:850,  qB:6,  vibe:"South Texas Roots",    bio:"Run by Joe \"King\" Carrasco's old crew. Tex-Mex, conjunto, swamp rock.",                  repReq:8,  fanReq:1000, real:true },
  {id:"caldwell_lub",     name:"Caldwell Recording",        city:"Lubbock, TX",    tier:1, perWeek:700,  qB:5,  vibe:"West Texas Wind",      bio:"Tucked in a row of warehouses near Buddy Holly's grave. Dust on every fader.",            repReq:5,  fanReq:600 },
  {id:"dockside_la",      name:"Dockside Studio",           city:"Lafayette, LA",  tier:2, perWeek:750,  qB:11, vibe:"Cypress-Lined Bayou",  bio:"A residential studio on the Vermilion. BB King, Dr. John, the Allmans all stayed here.",  repReq:24, fanReq:5500, real:true },
  {id:"echo_mountain_avl",name:"Echo Mountain Recording",   city:"Asheville, NC",  tier:2, perWeek:700,  qB:11, vibe:"Mountain Cathedral",   bio:"A converted 1920s church in downtown Asheville. The room itself is the secret weapon.",  repReq:22, fanReq:5000, real:true },
  {id:"delta_cultural_hel",name:"Delta Cultural Center Sessions",city:"Helena, AR",tier:2, perWeek:500,  qB:9,  vibe:"King Biscuit Heritage",bio:"Where 'King Biscuit Time' broadcasts from. Sonny Boy Williamson's ghost engineers.",      repReq:18, fanReq:3500, real:true },
  {id:"weed_okc",         name:"Weed Recording",            city:"Oklahoma City, OK",tier:1,perWeek:800, qB:6,  vibe:"Red Dirt HQ",          bio:"Cody Canada and Stoney LaRue both cut early demos here. Wood paneling for days.",        repReq:6,  fanReq:700 },

  // ── Tier 4: Once-in-a-Career ──
  {id:"rca_studio_b",  name:"RCA Studio B",           city:"Nashville, TN",     tier:4, perWeek:9500, qB:30, vibe:"The Nashville Sound",bio:"Where Elvis cut 'Are You Lonesome Tonight'. Now a museum that occasionally records.",repReq:75, fanReq:50000, real:true },
  {id:"blackbird",     name:"Blackbird Studio",       city:"Berry Hill, TN",    tier:4, perWeek:11000,qB:32, vibe:"Mic Cabinet of Dreams",bio:"John McBride's mic collection alone is worth the visit. Nine rooms, every era.", repReq:80, fanReq:60000, real:true },
  {id:"shangri_la",    name:"Shangri-La Studio",      city:"Malibu, CA",        tier:4, perWeek:14000,qB:34, vibe:"Rubin's Beach House", bio:"The Band's old place. Now Rick Rubin's. Records itself, basically.",        repReq:90, fanReq:90000, real:true },
];
export function getStudio(id?: string | null): Studio | undefined {
  return STUDIOS.find(st => st.id === (id ?? "home_studio"));
}

// ── FEATURES ───────────────────────────────────────────────
// Each feature artist has personality, a hometown, a vibe, theme preferences,
// and a "voice" — the line they say when they reach out to ask YOU to guest
// on their record. Tiers: 1 newcomer, 2 touring act, 3 star, 4 legend.
export type FeatureType = "newcomer" | "touring" | "star" | "legend";
export interface Feature {
  id: string; name: string; tier: 1|2|3|4; type: FeatureType;
  city: string;
  cost: number;                      // What YOU pay them when they guest on your track
  fameR: number; repR: number; fanR: number;   // Gates to ASK them
  fB: number; qB: number;            // Fan/quality boost added to your release
  genres: ("Country"|"Blues")[];
  themePrefs: string[];              // Themes they gravitate toward (matches THEMES.id)
  bio: string;                       // 1-line public-facing reputation
  vibe: string;                      // Working-with-them flavor
  pitch: string;                     // What they say in their inbound feature request
}

export const FEATURES: Feature[] = [
  // ── TIER 1 — LOCAL & UP-AND-COMERS ─────────────────────────────
  {id:"huckleberry", name:"Huckleberry Jones", tier:1, type:"newcomer", city:"Nashville, TN",
    cost:350, fameR:0, repR:0, fanR:0, fB:200, qB:3, genres:["Country","Blues"],
    themePrefs:["whiskey","road","hometown"],
    bio:"Open-mic regular with a loyal local following. Hungry to be on a record.",
    vibe:"Eager, slightly green, would do it for free if you asked",
    pitch:"Hey man — I'm cutting a little EP and I'd love your voice on the chorus. Can't pay much but I'll buy the beer."},
  {id:"pearl_mae", name:"Pearl Mae", tier:1, type:"newcomer", city:"Knoxville, TN",
    cost:500, fameR:4, repR:0, fanR:400, fB:350, qB:4, genres:["Country"],
    themePrefs:["heartbreak","love","hometown"],
    bio:"Smoky voice, small-town charm. Her TikTok covers get good numbers.",
    vibe:"Sweet, sharper than she lets on, knows her worth",
    pitch:"My label rep heard your single — they want me on something with you for visibility. I'll bring my pedal steel guy."},
  {id:"bo_swamp", name:"Bo Swamp", tier:1, type:"newcomer", city:"Clarksdale, MS",
    cost:450, fameR:0, repR:0, fanR:0, fB:280, qB:3, genres:["Blues"],
    themePrefs:["whiskey","loss","road"],
    bio:"Delta harmonica player. Shows up wherever the music is real.",
    vibe:"Wordless and exact — speaks through the harp",
    pitch:"Heard your record. Got a juke joint blues thing I'm laying down. Want you on the second verse if you're around."},
  {id:"callie_rae", name:"Callie Rae", tier:1, type:"newcomer", city:"Nashville, TN",
    cost:600, fameR:5, repR:4, fanR:600, fB:420, qB:4, genres:["Country"],
    themePrefs:["heartbreak","love","road"],
    bio:"Nashville newcomer with two self-released EPs. Has real fans.",
    vibe:"Driven, organized, knows every booking agent in town",
    pitch:"Working on my third EP and my producer specifically asked for your voice. We can pay a flat rate plus splits."},
  {id:"rev_thomas", name:"Rev. Thomas Blue", tier:1, type:"newcomer", city:"Birmingham, AL",
    cost:500, fameR:3, repR:5, fanR:500, fB:380, qB:4, genres:["Blues","Country"],
    themePrefs:["faith","redemption","loss"],
    bio:"Preacher by Sunday, bluesman by Saturday. Gospel-tinged guitar.",
    vibe:"Gentle, deeply spiritual, picks his collaborations carefully",
    pitch:"The Lord put your voice in my head while I was writing this hymn-blues thing. I'd be honored if you'd lay something down on it."},
  {id:"wade_keller", name:"Wade Keller", tier:1, type:"newcomer", city:"Bakersfield, CA",
    cost:400, fameR:2, repR:2, fanR:200, fB:300, qB:4, genres:["Country"],
    themePrefs:["workingman","whiskey","outlaw"],
    bio:"Honky-tonk piano player. Bakersfield-revival sound, perpetually broke.",
    vibe:"Loud, friendly, tells the same three stories every time",
    pitch:"Got a barroom song that needs another voice. Cheap rate, free beer, and you'll have a good time. Promise."},
  {id:"miss_lorraine", name:"Miss Lorraine Pickett", tier:1, type:"newcomer", city:"Memphis, TN",
    cost:550, fameR:4, repR:6, fanR:400, fB:340, qB:5, genres:["Blues"],
    themePrefs:["faith","loss","redemption","love"],
    bio:"Church choir alto turned gospel-blues singer. Twenty-two years old, voice of an angel.",
    vibe:"Quiet, devout, surprisingly steely about contracts",
    pitch:"My pastor said it's time I sang something for someone outside the church. I'd like that someone to be you."},

  // ── TIER 2 — MID-CAREER TOURING ACTS ────────────────────────────
  {id:"jessie_wade", name:"Jessie Wade", tier:2, type:"touring", city:"Lubbock, TX",
    cost:2800, fameR:15, repR:10, fanR:3500, fB:2400, qB:7, genres:["Country"],
    themePrefs:["outlaw","whiskey","freedom","road"],
    bio:"Outlaw country darling with two charting singles. Her fans are ride-or-die.",
    vibe:"Sharp tongue, bigger heart, will out-drink you and out-write you",
    pitch:"My next album's about leaving my husband. You're writing the kind of stuff I'm trying to write. Get on a track with me."},
  {id:"mama_cora", name:"Mama Cora", tier:2, type:"touring", city:"Clarksdale, MS",
    cost:3200, fameR:18, repR:14, fanR:4000, fB:2800, qB:8, genres:["Blues"],
    themePrefs:["loss","whiskey","redemption"],
    bio:"60-year-old blues queen from Clarksdale. A feature from her is a stamp of legitimacy.",
    vibe:"Royalty energy, doesn't suffer phonies, calls everyone 'baby'",
    pitch:"Baby — somebody played me your song. You sound like you mean it. I want you on this record I'm cutting."},
  {id:"dex_hollis", name:"Dex Hollis", tier:2, type:"touring", city:"Asheville, NC",
    cost:3500, fameR:20, repR:12, fanR:5000, fB:3000, qB:7, genres:["Country","Blues"],
    themePrefs:["road","hometown","nostalgia","redemption"],
    bio:"Roots and Americana crossover. Has opened for big names on the festival circuit.",
    vibe:"Easygoing road dog, three guitars and a van, loves to harmonize",
    pitch:"I'm in the studio next month and your sound is exactly what this song needs. Let's get you a flight out."},
  {id:"june_cross", name:"June Cross", tier:2, type:"touring", city:"Nashville, TN",
    cost:4000, fameR:22, repR:16, fanR:6000, fB:3500, qB:8, genres:["Country"],
    themePrefs:["love","heartbreak","hometown"],
    bio:"Radio-friendly country pop. Her fans stream millions per month.",
    vibe:"Polished, savvy, knows every brand rep, never says yes without her manager",
    pitch:"My team and your team should talk. I think a duet between us would do real numbers — radio-friendly, both fanbases happy."},
  {id:"blind_sam", name:"Blind Sam Tatum", tier:2, type:"touring", city:"Chicago, IL",
    cost:4500, fameR:25, repR:20, fanR:7000, fB:4000, qB:9, genres:["Blues"],
    themePrefs:["loss","whiskey","redemption","faith"],
    bio:"Living legend of the electric blues circuit. A co-sign that cannot be bought easily.",
    vibe:"Dry humor, never raises his voice, plays harder than men half his age",
    pitch:"Son — I don't usually do features. But somebody played me yours and I want my Telecaster on it. We'll talk fee after I hear the demo."},
  {id:"cody_burr", name:"Cody Burr", tier:2, type:"touring", city:"Bristol, VA",
    cost:3000, fameR:16, repR:13, fanR:4200, fB:2600, qB:8, genres:["Country","Blues"],
    themePrefs:["hometown","faith","workingman","nostalgia"],
    bio:"Fiddle-driven bluegrass. Won a Grammy for an instrumental album nobody outside the genre noticed.",
    vibe:"Quiet craftsman, never plays a wrong note, can't make small talk to save his life",
    pitch:"Got a track that needs strings and a country voice. Yours fits. Standard session rate plus a small co-write split."},
  {id:"zeke_st_pierre", name:"Zeke St. Pierre", tier:2, type:"touring", city:"Lafayette, LA",
    cost:3300, fameR:17, repR:14, fanR:4500, fB:2700, qB:8, genres:["Blues","Country"],
    themePrefs:["whiskey","outlaw","road","loss"],
    bio:"Cajun/swamp blues. Records in his garage, sells out theaters across the South.",
    vibe:"Cigarette voice, elbow-grease producer, half French",
    pitch:"Cher — I cut a swamp ballad and I need somebody who can sing the heartbreak proper. You free for a weekend in Louisiana?"},

  // ── TIER 3 — STARS ─────────────────────────────────────────────
  {id:"lila_dawn", name:"Lila Dawn", tier:3, type:"star", city:"Nashville, TN",
    cost:11000, fameR:48, repR:35, fanR:28000, fB:16000, qB:13, genres:["Country"],
    themePrefs:["love","heartbreak","redemption","faith"],
    bio:"3 CMA nominations. Her features move units and add chart credibility.",
    vibe:"Industry royalty, knows the rules, plays them perfectly",
    pitch:"My A&R rep flagged your last single. I think we'd chart together. My team will reach out to yours about logistics."},
  {id:"duke_rivers", name:"Duke Rivers", tier:3, type:"star", city:"Memphis, TN",
    cost:13000, fameR:52, repR:40, fanR:35000, fB:20000, qB:14, genres:["Blues","Country"],
    themePrefs:["redemption","loss","road","outlaw"],
    bio:"Blues Hall of Fame inductee. Retired-ish but still working with artists he believes in.",
    vibe:"Mythological, warm in person, signed a guitar for Eric Clapton once",
    pitch:"Young blood — heard your record. Reminded me of why I started. Want you on a song I'm finally finishing after twelve years."},
  {id:"scarlett_mae", name:"Scarlett Mae", tier:3, type:"star", city:"Nashville, TN",
    cost:14000, fameR:55, repR:38, fanR:40000, fB:22000, qB:13, genres:["Country"],
    themePrefs:["love","heartbreak","freedom"],
    bio:"Biggest voice in Nashville right now. Impossible to get, but it would change your career.",
    vibe:"Generational talent, surprisingly humble, exhausted-looking",
    pitch:"I usually pass on features but my husband won't shut up about your album. Send me the track and I'll see what I can do."},
  {id:"hank_calloway", name:"Hank Calloway", tier:3, type:"star", city:"Houston, TX",
    cost:13500, fameR:50, repR:32, fanR:32000, fB:18000, qB:13, genres:["Country"],
    themePrefs:["outlaw","whiskey","freedom","workingman"],
    bio:"Stadium country headliner. Texas drawl, pickup-truck anthems, sells out arenas.",
    vibe:"Big personality, big spender, surprisingly kind, calls everyone 'partner'",
    pitch:"Partner — I'm doing a duets album and your name came up. We don't need to talk numbers, my people will handle that. Just say yes."},

  // ── TIER 4 — LEGENDS ───────────────────────────────────────────
  {id:"cole_winston", name:"Cole Winston", tier:4, type:"legend", city:"Nashville, TN",
    cost:32000, fameR:70, repR:55, fanR:120000, fB:50000, qB:18, genres:["Country"],
    themePrefs:["outlaw","whiskey","road","redemption","nostalgia"],
    bio:"Country Hall of Fame. Forty-year career. The kind of name that makes radio playlists move.",
    vibe:"Crusty, generous, smokes during sessions, prefers handshake deals",
    pitch:"Listen — I don't do features for money. But I heard yours and it got to me. If you'll have me, I'd like to sing on it."},
  {id:"ruby_heart", name:"Ruby Heart Jenkins", tier:4, type:"legend", city:"Memphis, TN",
    cost:35000, fameR:68, repR:60, fanR:110000, fB:48000, qB:18, genres:["Blues"],
    themePrefs:["loss","redemption","faith","whiskey","love"],
    bio:"60 years on the blues circuit. Two Lifetime Achievement Grammys. Doesn't need the money.",
    vibe:"Royalty, calls everyone 'darlin'', tells stories about Muddy Waters in 1968",
    pitch:"Darlin' — my granddaughter played me your record and I cried. Come to Memphis. Let's cut a song my grandmother could've sung."},
  {id:"eli_swain", name:"Eli Swain", tier:4, type:"legend", city:"Austin, TX",
    cost:42000, fameR:75, repR:55, fanR:140000, fB:55000, qB:19, genres:["Country","Blues"],
    themePrefs:["road","freedom","outlaw","redemption"],
    bio:"Genre-crossing legend. Country Hall of Fame and Blues Hall of Fame. Eight Grammys. Still tours.",
    vibe:"Quiet legend, never gives interviews, keeps his own counsel",
    pitch:"My manager will hate me for this — I want to feature on your next single. Don't ask why. Just send me the file when it's ready."},
  {id:"jp_morrison", name:"J.P. Morrison", tier:4, type:"legend", city:"Athens, GA",
    cost:38000, fameR:65, repR:65, fanR:90000, fB:45000, qB:19, genres:["Country","Blues"],
    themePrefs:["loss","heartbreak","love","redemption","nostalgia"],
    bio:"Songwriter's songwriter. Wrote four songs every country fan knows by heart.",
    vibe:"Bookish, slow-spoken, cuts straight through small talk",
    pitch:"I've been listening to your record for two weeks. I'd like to write something with you and put my voice on it. Come to Georgia."},
];

// ─── FEATURE OFFERS / GUEST CREDITS / RELATIONSHIP ────────────
// When other artists reach out asking YOU to guest on their track.
// Generated periodically once you're on their radar.
export interface FeatureRequest {
  featureId: string;
  trackTitle: string;        // Their track that wants you on it
  fee: number;               // What THEY pay YOU (one-time)
  fameBonus: number;
  repBonus: number;
  fanBonus: number;
  themeId: string;           // The thematic vibe of the track
  weeksToRespond: number;    // Auto-expires when this hits zero
  fitNote: string;
}
// A historical record of your guest appearances on others' work.
export interface GuestCredit {
  featureId: string;
  artistName: string;
  trackTitle: string;
  week: number;
  fee: number;
  themeId: string;
}
// Repeated collabs build a relationship: discount on their fee for YOUR releases.
export interface FeatureRelationship {
  count: number; tier: 0|1|2; label: string; discountPct: number;
}
export function getFeature(id: string): Feature | undefined {
  return FEATURES.find(f => f.id === id);
}
export function getFeatureRelationship(
  id: string,
  counts: Record<string, number> | undefined | null,
): FeatureRelationship {
  const c = counts?.[id] ?? 0;
  if (c >= 4) return { count:c, tier:2, label:"Frequent collaborator", discountPct:0.30 };
  if (c >= 2) return { count:c, tier:1, label:"Worked together before", discountPct:0.15 };
  return { count:c, tier:0, label:"", discountPct:0 };
}
export function getFeatureEffectiveCost(
  f: Feature,
  counts: Record<string, number> | undefined | null,
  archMult: number = 1,
): number {
  const rel = getFeatureRelationship(f.id, counts);
  return Math.floor(f.cost * archMult * (1 - rel.discountPct));
}

// Generate ONE inbound feature request — an artist reaches out asking you to guest.
// Eligibility: track player's fame against tier thresholds; bias toward similar-tier artists
// and theme-matching artists. Returns null if no eligible artists exist.
export function generateFeatureRequest(s: GameState): FeatureRequest | null {
  const sig = getSignatureTheme(s.themeCounts);
  const TIER_GATES = [0, 8, 22, 45, 65];          // Min player fame they reach out at
  const TIER_IDEAL = [0, 12, 28, 55, 75];         // Sweet spot — similar-tier artists collab
  const TIER_FEES  = [0, 350, 2200, 9000, 28000]; // What they pay you, base
  const eligible = FEATURES.filter(f =>
    (f.genres as string[]).includes(s.genre) &&
    s.fame >= TIER_GATES[f.tier] &&
    s.totalReleases >= 1
  );
  if (!eligible.length) return null;
  const scored = eligible.map(f => {
    let score = 1;
    score += Math.max(0, 1 - Math.abs(TIER_IDEAL[f.tier] - s.fame) / 30);
    if (sig && f.themePrefs.includes(sig.themeId)) score += 1.0;
    score += Math.random() * 0.8;
    return { f, score };
  }).sort((a,b)=>b.score-a.score);
  const f = scored[0].f;
  const baseFee = TIER_FEES[f.tier];
  const fee = Math.floor(baseFee * (0.7 + Math.random() * 0.6));
  const fameBonus = Math.max(1, Math.floor(f.tier * 1.6 + Math.random() * f.tier));
  const repBonus  = Math.max(1, Math.floor(f.tier + 1 + Math.random() * 2));
  const fanBonus  = Math.floor(f.fB * 0.45 * (0.7 + Math.random() * 0.6));
  const themeId = f.themePrefs[Math.floor(Math.random() * f.themePrefs.length)] || "road";
  const trackTitle = genTrackName();
  const fitParts: string[] = [];
  if (sig && f.themePrefs.includes(sig.themeId)) fitParts.push(`your ${sig.theme.name.toLowerCase()} catalog`);
  fitParts.push(`your ${s.genre.toLowerCase()} sound`);
  const fitNote = `They want you specifically for ${fitParts.join(" and ")}.`;
  return {
    featureId: f.id, trackTitle, fee,
    fameBonus, repBonus, fanBonus,
    themeId, weeksToRespond: 4, fitNote,
  };
}

// ── GRIND ACTIONS ──────────────────────────────────────────
export interface GrindEffect {
  fame?: number; rep?: number; hype?: number; fans?: number;
  money?: number; money_pct?: number; playlist?: boolean; sync_chance?: boolean;
  festival_chance?: boolean; radio?: boolean; satReduce?: number;
}
export interface GrindReq {
  fame?: number; rep?: number; fans?: number; releases?: number; money?: number;
}
export interface GrindAction {
  id: string; name: string; desc: string;
  e: number; cd: number; mc?: number;
  eff: GrindEffect; req: GrindReq;
}

export const GRIND_ACTIONS: GrindAction[] = [
  {id:"social",    name:"Post on Social Media",         desc:"Share a clip, a lyric, a moment. Small fame bump and hype tick.",              e:5,  cd:1, eff:{fame:0.4,hype:3},               req:{}},
  {id:"lessons",   name:"Give Music Lessons",           desc:"Teach guitar and songwriting to locals. Steady income and a little rep.",        e:15, cd:2, eff:{money:200,rep:0.5},               req:{}},
  {id:"busk",      name:"Busk on the Strip",            desc:"Play wherever people walk by. Build real local fans the old way. Tips help.",    e:15, cd:2, eff:{fans:80,rep:2,fame:0.5,money:75}, req:{}},
  {id:"practice",  name:"Woodshed Session",             desc:"Hours alone with your instrument. Pure craft improvement.",                     e:20, cd:1, eff:{rep:1.5,hype:3},                  req:{}},
  {id:"open_mic",  name:"Play an Open Mic",             desc:"Small live performance. Rep and local fans the honest way.",                    e:25, cd:2, eff:{fans:90,rep:2,fame:0.5},          req:{}},
  {id:"collab",    name:"Sit in with a Band",           desc:"Guest with a local act. Networking and rep.",                                   e:30, cd:3, eff:{rep:3,fans:130},                   req:{}},
  {id:"blog",      name:"Music Blog Interview",         desc:"A roots music blog writes you up. Modest fame and rep gain.",                   e:10, cd:4, eff:{fame:2,rep:5,fans:350},            req:{fame:5}},
  {id:"playlist",  name:"Submit to Playlists",          desc:"Pitch your music to country and blues curators.",                               e:10, cd:3, eff:{hype:9,playlist:true},             req:{releases:1}},
  {id:"music_vid", name:"Record a Music Video",         desc:"Costs money but gets you seen. Hype and fame return.",                          e:30, cd:4, mc:2000, eff:{fame:6,rep:4,hype:22,fans:900}, req:{money:2000,releases:1}},
  {id:"radio",     name:"Pitch to Country/Blues Radio", desc:"Get airplay. Big rep if they pick it up.",                                      e:15, cd:5, eff:{fame:7,rep:6,fans:700,radio:true},req:{fame:12,releases:1}},
  {id:"podcast",   name:"Roots Music Podcast",          desc:"Americana and blues podcasts. Great credibility.",                              e:10, cd:4, eff:{fame:4,rep:7,fans:450},            req:{fame:8}},
  {id:"livestream",name:"Live Stream a Session",        desc:"Online performance. Fan engagement and discovery.",                             e:20, cd:2, eff:{fans:280,fame:2,hype:12},          req:{fans:200}},
  {id:"magazine",  name:"Roots Magazine Feature",       desc:"American Songwriter, No Depression, etc. Real credibility.",                    e:20, cd:8, eff:{fame:11,rep:13,fans:2200},         req:{fame:25,rep:20}},
  {id:"tv",        name:"Late Night TV Performance",    desc:"National exposure. Major fame spike.",                                           e:15, cd:10,eff:{fame:16,rep:9,fans:5500},          req:{fame:40}},
  {id:"merch",     name:"Merch Table Drop",             desc:"Sell vinyl, tees, and hats to your fans.",                                      e:10, cd:6, eff:{money_pct:0.08},                   req:{fans:500}},
  {id:"sync",      name:"Pitch for Sync License",       desc:"Get your song in a film, TV show, or ad.",                                      e:15, cd:8, eff:{sync_chance:true},                 req:{releases:1,rep:15}},
  {id:"festival",  name:"Apply to a Festival",          desc:"Submit to regional music festivals. Big exposure if accepted.",                  e:20, cd:6, eff:{festival_chance:true},             req:{fame:15,releases:1}},
  {id:"lay_low",   name:"Lay Low — Let It Breathe",    desc:"Step back from releasing. Give the market time to miss you. Drops saturation fast.", e:10, cd:3, eff:{satReduce:22},                req:{}},
];

// ── BRAND DEALS ────────────────────────────────────────────
export interface BrandDeal {
  id: string; name: string; fameReq: number; repReq: number;
  weeklyIncome: number; duration: number; desc: string; rep?: number; famePerk?: number;
}
export const BRAND_DEALS: BrandDeal[] = [
  {id:"boot_barn",    name:"Boot Barn Co-op",       fameReq:12, repReq:0,  weeklyIncome:300,   duration:8,  desc:"Local western wear store wants you to post wearing their boots.", rep:2},
  {id:"wrangler",     name:"Wrangler Jeans",         fameReq:22, repReq:8,  weeklyIncome:800,   duration:12, desc:"The classic denim brand. Authenticity is the whole pitch.", rep:3},
  {id:"martin_guitar",name:"Martin Guitar",          fameReq:28, repReq:22, weeklyIncome:1400,  duration:10, desc:"Endorsement from the most storied name in acoustic guitars.", rep:5, famePerk:3},
  {id:"bourbon_brand",name:"Two-Lane Bourbon",       fameReq:35, repReq:20, weeklyIncome:2500,  duration:12, desc:"Craft bourbon with a country soul. Your face on the bottle.", rep:2, famePerk:5},
  {id:"chevy_trucks", name:"Chevy Trucks",           fameReq:50, repReq:28, weeklyIncome:6000,  duration:16, desc:"The most country ad deal possible. Massive fame bump.", rep:1, famePerk:10},
  {id:"gibson",       name:"Gibson Custom Shop",     fameReq:60, repReq:45, weeklyIncome:10000, duration:20, desc:"Gibson puts your name on a signature guitar. Legendary.", rep:8, famePerk:5},
];

// ── CAREER TIERS ─────────────────────────────────────────────
export interface CareerTierDef {
  idx: number;
  name: string;
  fameReq: number;
  color: string;
  icon: string;
  tagline: string;
  flavor: string;
  unlocks: string[];
}
export const CAREER_TIERS: CareerTierDef[] = [
  { idx:0, name:"Local Picker",     fameReq:0,  color:"#8a6d3a", icon:"🪕", tagline:"Every legend starts somewhere.",           flavor:"The regulars know your name. The tip jar fills a little faster each week.",                       unlocks:["Open mic slots","Tier 1 local venues"] },
  { idx:1, name:"Regional Act",     fameReq:20, color:"#6a8d5a", icon:"🎸", tagline:"Your name is spreading down the highway.",  flavor:"Other towns are starting to call. The van's got a few more miles in it.",                          unlocks:["Tier 2 venues","Regional tours","Studio collabs"] },
  { idx:2, name:"Touring Artist",   fameReq:40, color:"#5a8da8", icon:"🚐", tagline:"The road is your home now.",                flavor:"You've got a real fan base on both sides of the Mississippi. The crew trusts you.",                 unlocks:["Tier 3 theaters","Full multi-city tours","Label interest"] },
  { idx:3, name:"National Act",     fameReq:60, color:"#d4a820", icon:"🌟", tagline:"Coast to coast, they know the name.",       flavor:"Radio plays your singles. Journalists call for interviews. The next level is in sight.",            unlocks:["Tier 4-5 large venues","Major label offers","Brand partnerships"] },
  { idx:4, name:"Headliner",        fameReq:80, color:"#c0442c", icon:"🔥", tagline:"You don't open for anyone anymore.",        flavor:"Festivals want you at the top of the bill. Your records move without a push.",                      unlocks:["Arena & stadium venues","Grammy eligibility","Signature gear deals"] },
  { idx:5, name:"Legend",           fameReq:95, color:"#a47bb8", icon:"👑", tagline:"The music speaks for itself now.",          flavor:"They name venues after people like you. The story isn't finished — it's being written.",           unlocks:["Historical studio access","Hall of Fame consideration","Legacy status"] },
];
export function getCareerTierIdx(fame: number): number {
  let idx = 0;
  for (const t of CAREER_TIERS) { if (fame >= t.fameReq) idx = t.idx; }
  return idx;
}

// ── AWARDS ─────────────────────────────────────────────────
export interface Award {
  id: string; name: string; fameReq: number; repReq: number;
  desc: string; famePerk: number; repPerk: number; money: number;
}
export const AWARDS: Award[] = [
  {id:"local_pick",    name:"Local Roots Favorite",                fameReq:12, repReq:18, desc:"Your city's music community voted you their favorite.",        famePerk:5,  repPerk:10, money:500},
  {id:"americana_nod", name:"Americana Music Award Nomination",    fameReq:22, repReq:28, desc:"National recognition from the Americana community.",           famePerk:10, repPerk:18, money:2000},
  {id:"breakthrough",  name:"Breakthrough Artist of the Year",     fameReq:38, repReq:32, desc:"You're officially on every industry radar.",                  famePerk:18, repPerk:20, money:8000},
  {id:"critics_choice",name:"Critics' Choice — Best Album",        fameReq:32, repReq:52, desc:"The critics only give this to the real ones.",                famePerk:8,  repPerk:28, money:5000},
  {id:"cma_nom",       name:"CMA Award Nomination",                fameReq:52, repReq:55, desc:"Country Music Association recognition. Career-defining.",      famePerk:22, repPerk:30, money:20000},
  {id:"grammy",        name:"Grammy Award",                        fameReq:70, repReq:65, desc:"The ultimate. Your name is in music history.",               famePerk:30, repPerk:35, money:50000},
];

// ── CRITIC REVIEWS ─────────────────────────────────────────
export const CRITIC_REVIEWS = [
  {min:0,  max:30, headlines:["Lacks Authenticity","Sounds Like a Caricature","Misses the Soul","Uninspired and Forgettable","Tries Too Hard"],rep:-8},
  {min:30, max:50, headlines:["Shows Some Promise","Rough Around the Edges","A Work in Progress","Has Its Moments","Decent but Uneven"],rep:-2},
  {min:50, max:65, headlines:["Solid Americana Effort","Worth a Listen","Genuine Feeling, Needs Polish","A Good Showing","Growing Into Something Real"],rep:3},
  {min:65, max:78, headlines:["Earthy and Compelling","Authentically Southern","One of the Better Records This Year","Stands Out in a Crowded Field","Has Real Soul"],rep:8},
  {min:78, max:88, headlines:["Essential Listening","A Modern Classic","Deeply Felt and Masterfully Made","Don't Sleep On This Record","The Real Deal"],rep:15},
  {min:88, max:101,headlines:["A Masterpiece of American Music","Career-Defining","This Is Why Country and Blues Still Matter","Timeless","The Best Record I've Heard in Years"],rep:25},
];

// ── FAN REVIEWS ────────────────────────────────────────────
export interface FanReview {
  handle: string;
  text: string;
  stars: number;
}

const FAN_HANDLES = ["DeltaGravel","NashvilleRoots","HonkyTonkMike","BackroadsBeth","BluesGroove","SteelStringSam","JukeboxJunior","PorchsidePaul","TallgrassT","MarlowJane","RiverBendRita","BuckyTulsa","CrossroadsCal","MemphisMorgan","TennesseeTodd","GritAndGravy","SoulfulSusan","BottleBlues","FiddleReed","LonePineLou","SagebrushSal","DirtRoadDave","HollerHank","WillowWanda","RustyStringBob","Dusty_W","BackwoodsBlues","HonestHymns","FrontPorchFan","RoadhouseRex","ClaydaleBlues","HighwayHollow","PickinPorch","TinRoofTed","SwampRootsSue"];

const FAN_TEXTS: Record<string, string[]> = {
  Viral: [
    "Played this three times before it even finished.",
    "This one's going in the vault. My grandfather would have loved this.",
    "I haven't felt this way about a record in years.",
    "Drove three hours to see them last month. This is exactly why.",
    "The kind of thing you're still humming a week later.",
    "Sent this to everyone I know. They all needed to hear it.",
    "Cried twice. I regret nothing.",
    "This is why I still believe in this music.",
    "Hasn't left my truck stereo since it dropped.",
  ],
  Hit: [
    "Really solid. Gets better every listen.",
    "This is exactly what the genre needs right now.",
    "Honest music. Nothing to complain about.",
    "Not flashy but it sticks. That's the whole point.",
    "This one earns its place in the catalog.",
    "Bought the vinyl. That says enough.",
    "Listened straight through twice. That's a good sign.",
    "Feels real. That's harder to find than people think.",
  ],
  Moderate: [
    "Has some good moments. Maybe it grows on you.",
    "Not what I was expecting but I don't hate it.",
    "A few tracks land really well. Others need work.",
    "I'll give it a few more spins. There's something there.",
    "Decent. Shows what they're capable of.",
    "Some moments that really click. Just not the whole thing.",
  ],
  Flop: [
    "Felt a bit rushed. Some good ideas, not fully cooked.",
    "Not sure this one's for me. Hoping the next one clicks.",
    "I love what they're going for but this didn't land.",
    "Has its moments but never quite arrives.",
    "Maybe next time.",
    "Expected more from them. Still rooting for it.",
  ],
};

export function genFanReviews(outcome: string): FanReview[] {
  const starsMap: Record<string, number[]> = {
    Viral: [5,5,5,5], Hit: [4,5,4,5], Moderate: [3,3,4,3], Flop: [2,2,3,1],
  };
  const texts = FAN_TEXTS[outcome] ?? FAN_TEXTS["Moderate"];
  const handles = [...FAN_HANDLES].sort(() => Math.random() - 0.5);
  const stars = starsMap[outcome] ?? [3,3,3];
  const count = 3 + (Math.random() < 0.5 ? 1 : 0);
  const picked: string[] = [];
  return Array.from({ length: count }, (_, i) => {
    let t = texts[Math.floor(Math.random() * texts.length)];
    let tries = 0;
    while (picked.includes(t) && tries < 10) { t = texts[Math.floor(Math.random() * texts.length)]; tries++; }
    picked.push(t);
    return { handle: handles[i], text: t, stars: stars[i % stars.length] };
  });
}

export interface ReleasePresentation {
  title: string;
  type: ReleaseType;
  outcome: ReleaseOutcome;
  quality: number;
  revenue: number;
  fansGained: number;
  fameDelta: number;
  repDelta: number;
  peakStreams: number;
  criticHeadline: string;
  lifecycle: SongLifecycle;
  week: number;
  genre: Genre;
  tracks: TrackEntry[];
  fanReviews: FanReview[];
}

// ── TOUR WRAP PRESENTATION ────────────────────────────────
export interface TourWrapShow {
  city: string;
  venue: string;
  attendancePct: number;
  net: number;
}

export interface TourWrapPresentation {
  tourName: string;
  cities: string[];
  completedShows: number;
  cancelledShows: number;
  grossRevenue: number;
  totalExpenses: number;
  netProfit: number;
  avgFill: number;
  bestShow: TourWrapShow | null;
  worstShow: TourWrapShow | null;
  week: number;
}

// ── AWARD PRESENTATION ────────────────────────────────────
export interface AwardPresentation {
  id: string;
  name: string;
  desc: string;
  famePerk: number;
  repPerk: number;
  money: number;
  week: number;
}

// ── CAREER MILESTONE PRESENTATION ────────────────────────
export interface CareerMilestonePresentation {
  tier: CareerTierDef;
  fans: number;
  fame: number;
  rep: number;
  week: number;
}

// ── SIGNING PRESENTATION ─────────────────────────────────
export interface SigningTerm {
  label: string;
  value: string;
  isGood: boolean;
}

export interface SigningPresentation {
  kind: "label" | "manager";
  name: string;
  exec?: string;
  city: string;
  accentColor: string;
  advance?: number;
  weeklyFee?: number;
  terms: SigningTerm[];
  perks: string[];
  quote: string;
  week: number;
}

// ── INTERACTIVE RANDOM SCENARIOS ───────────────────────────
export interface ScenarioEffect {
  money?: number; fans?: number; fame?: number; rep?: number;
  energy?: number; hype?: number; qualityBase?: number; saturation?: number;
  // Extended for #3 Burnout + #5 Story Arcs (added in v1.x). Optional and
  // ignored by legacy scenario resolver — only ArcChoice currently uses these.
  burnout?: number; superfans?: number;
}
export interface ScenarioChoice {
  label: string;
  sub: string;
  result: string;
  effect: ScenarioEffect;
  roll?: { chance: number; onSuccess: ScenarioEffect; successMsg: string; onFail: ScenarioEffect; failMsg: string; };
  req?: { money?: number; fame?: number; rep?: number; fans?: number; hasManager?: boolean; };
}
export interface RandomEventScenario {
  id: string; emoji: string; title: string; body: string; weight: number;
  trigger?: { minFame?: number; maxFame?: number; minReleases?: number; minMoney?: number; minFans?: number; minRep?: number; hasLabel?: boolean; };
  choices: ScenarioChoice[];
}

export const RANDOM_SCENARIOS: RandomEventScenario[] = [
  {
    id:"bar_bet", emoji:"🤠", weight:8, title:"The Bar Bet",
    body:"Late set at a roadhouse, a leathery cowboy slides $500 across the bar. 'Play me Hank's \"I'm So Lonesome I Could Cry\" — note for note, every verse. No wobbles. Miss one word, you buy rounds for the house.' The bartender is already watching.",
    choices:[
      { label:"Take the bet", sub:"High stakes. Own the room or lose it.",result:"You nailed every verse cold. The bar went silent, then erupted. The cowboy paid up and shook your hand hard.",effect:{rep:5,money:500},
        roll:{chance:0.65,onSuccess:{rep:7,money:500},successMsg:"You nailed every verse cold. The bar went silent, then erupted. The cowboy shook your hand hard.",onFail:{rep:-5,money:-200},failMsg:"You blanked on verse three. The bar laughed — mostly with you, partly at you. Cost you more than $200."}},
      { label:"Laugh it off, buy him a round", sub:"Costs $50. Keeps the room friendly and the ego intact.",result:"You raise your glass, buy his round, and play something else. The room relaxes. Solid move.",effect:{money:-50,rep:3}},
      { label:"Play a song about a man who makes bad bets", sub:"Make the moment yours without taking the bait.",result:"You riffed something on the spot about gamblers and losers. Nobody called it out — they just listened.",effect:{hype:9,rep:6,fans:60}},
    ]
  },
  {
    id:"ar_letter", emoji:"📬", weight:5, title:"The A&R Letter", trigger:{minFame:5},
    body:"Backstage after a set, there's a handwritten note on the dressing room table. A Nashville indie label — the one that signed three acts you actually respect. They want a meeting next week. They sign one act a year.",
    choices:[
      { label:"Fly out and make your case", sub:"Big investment, big exposure — if you impress them.",result:"The meeting was real. You left your recordings and a handshake. Something's cooking.",effect:{energy:-20,rep:5,fame:8}},
      { label:"Schedule a call first — feel it out", sub:"Lower stakes, better information.",result:"The call went well. You agreed to meet in person next month. Smart.",effect:{rep:3,fame:3}},
      { label:"Ignore it — you're not ready to give up control", sub:"Keeps your independence, for now.",result:"The letter went in a drawer. You kept building your way. Maybe the right call.",effect:{rep:5,hype:6}},
    ]
  },
  {
    id:"opening_slot", emoji:"🎤", weight:6, title:"The Opening Slot", trigger:{minReleases:1,minFame:7},
    body:"A call from a booking agent. A legitimate touring act with 60k fans just had their opener pull out. Three weeks on the road, real markets, real venues. They need you to leave in two days.",
    choices:[
      { label:"Drop everything and take it", sub:"You'll blow off current commitments, but this exposure is real.",result:"Three weeks on the road with a real touring act. You watched how the pros move. The exposure was everything.",effect:{fame:13,fans:2400,energy:-35,hype:9}},
      { label:"Negotiate to join midway through the run", sub:"Less ideal, but keeps your current obligations intact.",result:"You caught up with the tour in week two. Less exposure, but you didn't burn anything down to get there.",effect:{fame:6,fans:900,energy:-15}},
      { label:"Stay home — the record comes first", sub:"Your current project doesn't get derailed.",result:"You turned it down. The music gets finished. You hope you made the right call.",effect:{hype:5,rep:4}},
    ]
  },
  {
    id:"wedding_gig", emoji:"💒", weight:7, title:"The Wedding Gig",
    body:"A wealthy rancher tracked down your number. His daughter's getting married on a Saturday. He'll pay $3,000 cash — no contracts, no rider. Problem is, that's your scheduled recording day.",
    choices:[
      { label:"Take the money, postpone recording", sub:"It's $3,000 cash. The record can wait a week.",result:"You played the wedding, pocketed the cash, and dealt with the delay. Hard to argue with $3,000.",effect:{money:3000,hype:-4}},
      { label:"Decline — you're on a deadline", sub:"The schedule holds. Nothing gained, nothing lost.",result:"You said no respectfully. Got back to the studio. Some things you just don't trade.",effect:{rep:2}},
      { label:"Accept, but treat it like a real show", sub:"Bring your best set and charge the room.",result:"You treated it like a headliner slot. The guests were floored. A few became real fans.",effect:{money:2200,fans:130,rep:5}},
    ]
  },
  {
    id:"songwriter_beef", emoji:"⚖️", weight:5, title:"The Accusation", trigger:{minReleases:1},
    body:"An old acquaintance posted on a roots music forum: you stole the hook of your recent single from a demo they sent you two years ago. The post has 200 comments and half of them know your name.",
    choices:[
      { label:"Reach out privately and settle it", sub:"Costs money, but the story goes away quietly.",result:"You called him. Wrote a check. He took the post down by evening. Ugly but done.",effect:{money:-2000,rep:3},req:{money:2000}},
      { label:"Respond publicly and deny it", sub:"Risky — turns a small fire into a public debate.",result:"Your response went up. The comments doubled. Some people believe you. Others don't. The music press noticed.",effect:{hype:9,rep:-10}},
      { label:"Offer him a co-write credit going forward", sub:"Costs nothing but pride — and builds real goodwill.",result:"You reached out, offered a credit on the next thing. He was surprised. Most of the comments called it class.",effect:{rep:8,hype:4}},
    ]
  },
  {
    id:"van_breakdown", emoji:"🚐", weight:5, title:"Van Down in the Desert",
    body:"Three hours before the biggest show on this run, the van dies on a stretch of I-40 with nothing in either direction. Triple-A is four hours out. The venue is 80 miles east. The show goes on in three hours.",
    choices:[
      { label:"Rent every car within 20 miles and drive", sub:"Expensive and chaotic, but the show goes on.",result:"You scattered across three rental cars, drove like hell, and hit the stage twelve minutes late. Nobody left.",effect:{money:-600,rep:6},req:{money:600}},
      { label:"Call the venue and cancel", sub:"The honest move — but your rep takes a real hit.",result:"You called it. The promoter wasn't happy. The fans who drove two hours weren't either.",effect:{rep:-9,money:-300}},
      { label:"Hitchhike and make the story part of the show", sub:"Total gamble — could be legendary, could be a disaster.",result:"You rolled in on the back of a flatbed. Told the whole story on stage.",effect:{},
        roll:{chance:0.65,onSuccess:{rep:11,fans:350},successMsg:"You rolled in on the back of a flatbed, told the story on stage, and the crowd lost it. A photographer was there.",onFail:{rep:-5,energy:-20},failMsg:"You made it barely. The set was rough. The story doesn't redeem a bad performance."}},
    ]
  },
  {
    id:"radio_6am", emoji:"📻", weight:6, title:"The 6am Radio Call", trigger:{minFame:5},
    body:"Your phone lights up at 6:11am. A producer from a country station you've actually listened to — 45,000 listeners across three markets. They want you live on air at 7. That's 49 minutes from now.",
    choices:[
      { label:"Get up, get dressed, get there", sub:"Rough morning. Real opportunity.",result:"You showed up rough around the edges and it came through as honest. The DJ loved it. The phones lit up.",effect:{energy:-25,fame:10,fans:750}},
      { label:"Do the interview from your phone right now", sub:"Not ideal, but you showed up in some form.",result:"You talked for eight minutes from your pillow. It worked better than it had any right to.",effect:{energy:-5,fame:4,fans:280}},
      { label:"Decline and go back to sleep", sub:"The energy stays. The slot goes to someone else.",result:"They said maybe and hung up. You didn't hear back. The window closed.",effect:{energy:10}},
    ]
  },
  {
    id:"vintage_guitar", emoji:"🎸", weight:4, title:"The 1952 Martin", trigger:{minMoney:1500},
    body:"Your friend who runs a pawn shop on the edge of town calls during dinner. A 1952 Martin D-28 came in this afternoon. First dibs for $2,200. It won't last past tomorrow morning.",
    choices:[
      { label:"Buy it without hesitation", sub:"It'll cost you, but this guitar changes how you play.",result:"You drove over and held it for thirty seconds. Then you wrote the check. Worth every dollar.",effect:{money:-2200,qualityBase:5},req:{money:2200}},
      { label:"Talk her down and see what happens", sub:"She might say yes. Or she might hold firm.",result:"You made your case.",effect:{},req:{money:1600},
        roll:{chance:0.55,onSuccess:{money:-1600,qualityBase:4},successMsg:"She went to $1,600. You walked out with a piece of history.",onFail:{},failMsg:"She held at $2,200. You said you'd think about it. By morning it was gone."}},
      { label:"Pass — can't afford the distraction", sub:"The money stays. The guitar goes to someone else.",result:"You said no. She sold it the next morning. You don't think about it. (You think about it.)",effect:{}},
    ]
  },
  {
    id:"blog_feud", emoji:"✍️", weight:5, title:"The Blog Piece", trigger:{minReleases:1},
    body:"A respected Americana blog just published 'The Problem With [Your Name]': 1,400 words calling your music 'nostalgia tourism for people who never lived it.' It's getting shared in circles that matter.",
    choices:[
      { label:"Write a thoughtful public response", sub:"Engage seriously — might earn respect from the right people.",result:"Your response took 45 minutes and three rewrites. People called it measured, fair, and real. The blogger didn't respond.",effect:{rep:7,fans:450}},
      { label:"Post a song title and nothing else", sub:"Let the music talk. Cryptic burns hit differently.",result:"You posted just a song title. It read like a shot. The comments lit up. The blogger screenshotted it.",effect:{hype:11,rep:-5}},
      { label:"Say nothing — silence is its own answer", sub:"Let it pass. Some things aren't worth dignifying.",result:"You let it breathe. The post cycled out of the feed in three days. You kept working.",effect:{rep:3}},
    ]
  },
  {
    id:"collab_dm", emoji:"💬", weight:6, title:"The Collab DM", trigger:{minReleases:1},
    body:"A musician with 220k followers DMs you. They've been listening to your record for months and want to make something weird together — completely different sounds, probably polarizing. But they seem genuine.",
    choices:[
      { label:"Yes — send me a track", sub:"High upside. Unpredictable outcome. Their audience is huge.",result:"What you made together was genuinely surprising.",effect:{hype:8,fans:400},
        roll:{chance:0.60,onSuccess:{hype:14,fans:900},successMsg:"What you made together was genuinely surprising. Their fans found your page. Some of yours were confused. Worth it.",onFail:{hype:5,rep:-4},failMsg:"The collab was interesting but not cohesive. Their audience didn't cross over. Your core fans had questions."}},
      { label:"Ask to hear their music first", sub:"Cautious. Respectable. Slightly less exciting.",result:"You listened for an hour and sent a voice memo back. The conversation is still going.",effect:{rep:4,hype:5}},
      { label:"Thank them, but decline", sub:"Keeps your focus. Closes a door.",result:"You thanked them and explained where you were. They were cool about it.",effect:{rep:2}},
    ]
  },
  {
    id:"festival_waitlist", emoji:"🎪", weight:5, title:"Festival Waitlist", trigger:{minFame:5,minReleases:1},
    body:"The coordinator for a 3,500-person regional festival emails you directly: you're #2 on the waitlist and someone just wavered. Pay the $600 entry fee today and your slot is locked if they drop.",
    choices:[
      { label:"Pay the fee and lock the slot", sub:"60% chance you're in. 40% chance you're out $600.",result:"You paid. You waited.",effect:{money:-600},req:{money:600},
        roll:{chance:0.60,onSuccess:{fame:14,fans:2000},successMsg:"They dropped. You were in. You played to the biggest crowd you'd ever seen from a real stage.",onFail:{},failMsg:"The other act confirmed. Your $600 is gone. Painful."}},
      { label:"Counter-offer: waive the fee, you'll promote hard", sub:"Unlikely to work, but costs nothing to ask.",result:"You made your pitch.",effect:{},
        roll:{chance:0.25,onSuccess:{fame:9,fans:1000},successMsg:"They laughed, then said yes. You promoted hard and earned the slot.",onFail:{},failMsg:"They said no. Still on the waitlist with no leverage."}},
      { label:"Wait for them to call you", sub:"Low risk. Probably nothing happens.",result:"You didn't hear back. The other act played the slot. That's how it goes.",effect:{}},
    ]
  },
  {
    id:"burnout_warning", emoji:"🛌", weight:6, title:"Burnout Warning",
    body:"Your closest road companion sits you down after a show that should have felt good but didn't. 'When's the last time you slept more than five hours? When did this stop being fun?' You've been pushing hard the whole run.",
    choices:[
      { label:"Take the whole week off — truly off", sub:"Full recovery. You lose a week but come back yourself.",result:"You slept. You cooked something. You didn't open the recording software. You came back different — in the right way.",effect:{energy:65,rep:2}},
      { label:"Take one day and push through", sub:"Partial recovery. The grind continues, somewhat.",result:"You took Sunday. Monday you were back at it. The tank isn't full, but it's better.",effect:{energy:28,hype:3}},
      { label:"See your doctor before it gets worse", sub:"Costs money. Recovers meaningful energy.",result:"The doctor said nothing you didn't already know. But you listened this time.",effect:{money:-300,energy:50},req:{money:300}},
    ]
  },
  {
    id:"bootleg", emoji:"📼", weight:4, title:"The Bootleg", trigger:{minReleases:1},
    body:"Someone's been selling a Bandcamp bootleg of your Nashville show last March for $6 a download. 190 sales. The recording is actually good — better than good. And your name is on it.",
    choices:[
      { label:"Send a takedown — it's your name, your show", sub:"It goes away, but so does a conversation happening around it.",result:"Bandcamp complied. The listing is down. It's over.",effect:{rep:-2}},
      { label:"Reach out and negotiate a revenue split", sub:"Could turn into something. Could go nowhere.",result:"You sent the message.",effect:{},
        roll:{chance:0.55,onSuccess:{money:900,rep:4},successMsg:"They agreed immediately. You now have a legitimate split on a live recording you didn't plan.",onFail:{rep:-2},failMsg:"They ghosted you and quietly deleted the listing. You lost the angle."}},
      { label:"Officially adopt it as a live release", sub:"Turns their hustle into your catalog. Unconventional, but yours.",result:"You reached out, licensed it for a flat fee, and listed it as an official live recording. The roots press appreciated the honesty.",effect:{money:-300,rep:8,fans:350,hype:6},req:{money:300}},
    ]
  },
  {
    id:"journalist_profile", emoji:"📰", weight:4, title:"The Full Profile", trigger:{minFame:15,minReleases:1},
    body:"A writer from a respected Americana publication — not a blog, the real thing — wants a week on the road with you. Full access. The piece runs regardless of what they find.",
    choices:[
      { label:"Say yes — nothing to hide", sub:"Big upside if it goes well. Real exposure if it doesn't.",result:"The piece ran.",effect:{fame:7,rep:5},
        roll:{chance:0.65,onSuccess:{fame:14,rep:10,fans:1400},successMsg:"The piece ran with a full-page photo and a headline they deserved. One of the best things written about you.",onFail:{rep:-9,fame:4},failMsg:"The writer was fair — that was the problem. A fair accounting of a week you weren't at your best."}},
      { label:"Agree but set ground rules", sub:"Less risk. Probably less reward.",result:"The piece was good. Controlled and measured, like you.",effect:{fame:6,rep:5}},
      { label:"Not right now — the timing isn't right", sub:"Protect the moment. The story isn't ready.",result:"You declined politely. They said they'd reach back out. You mean to be ready by then.",effect:{rep:3}},
    ]
  },
  {
    id:"exec_dinner", emoji:"🍽️", weight:3, title:"The Exec Dinner", trigger:{minFame:28,minReleases:2},
    body:"A senior exec from a major imprint's roots division is in town. His assistant called you directly — not your manager, you. He's having dinner at a restaurant you've driven past but never entered. Tonight at eight.",
    choices:[
      { label:"Go, be yourself, talk about music", sub:"Low pretense. Your best self. Real chance of something real.",result:"You talked for three hours.",effect:{fame:7,rep:4},
        roll:{chance:0.42,onSuccess:{fame:12,rep:8,fans:600},successMsg:"You talked for three hours. He picked up the check and said he'd be in touch. His assistant called Monday.",onFail:{fame:4},failMsg:"He was pleasant, said he'd follow your work, and handed you a business card. That was that."}},
      { label:"Bring your press kit and pitch professionally", sub:"Less chemistry. Better paper trail.",result:"You presented like a business meeting. He listened carefully. No commitment, but he had your package.",effect:{fame:5,rep:-2}},
      { label:"Decline — you're not in the business of dinners", sub:"Keeps your integrity, at real cost.",result:"You said no thank you. Word got around that you turned it down. Some people found that interesting.",effect:{rep:8,hype:5}},
    ]
  },
  {
    id:"heckler", emoji:"🎙️", weight:7, title:"The Heckler",
    body:"Twenty minutes into your set, a drunk guy two tables back won't stop talking. Loud enough that the front row is looking at each other. The rest of the room is watching you, not him. This is your moment.",
    choices:[
      { label:"Call him out — \"Friend, this one's for you\"", sub:"Land it and you're a legend. Miss it and it's uncomfortable.",result:"You addressed him from the stage.",effect:{},
        roll:{chance:0.62,onSuccess:{rep:11,fans:180},successMsg:"The line landed perfectly. The room laughed, then went completely quiet. You played the rest of the set to the best attention you'd had all year.",onFail:{rep:-5},failMsg:"The line didn't land. He laughed too. It took you two songs to get the room back."}},
      { label:"Stop, stare him down, restart from the top", sub:"No words. Just presence. High risk, high reward.",result:"You stopped cold. The silence was uncomfortable. Then you started over, slower. The room got completely still.",effect:{rep:8,hype:7}},
      { label:"Let the music answer for you", sub:"The quiet professional move. Respectable.",result:"You played through it. You played harder. By the fourth song he was watching too.",effect:{rep:5}},
    ]
  },
  {
    id:"sample_request", emoji:"🎛️", weight:4, title:"The Sample Request", trigger:{minReleases:1},
    body:"An electronic producer with 1.8M followers wants to sample the opening eight bars of your most-streamed song. They'll clear it properly. Their audience is as far from yours as you can get.",
    choices:[
      { label:"License it for $1,500 — take the money", sub:"Clean revenue. New ears. Your core fans will notice.",result:"The track dropped. 40,000 people heard your intro and wondered who you were. Some became fans.",effect:{money:1500,fans:700,rep:-4,hype:7}},
      { label:"Offer a full collab instead — or nothing", sub:"Risky counteroffer. Could blow up into something bigger.",result:"You made the counter.",effect:{},
        roll:{chance:0.45,onSuccess:{hype:14,fans:1100},successMsg:"They said yes to a collab. What came out surprised everyone, including you.",onFail:{},failMsg:"They thanked you and went with a different sample. You held your ground. The door closed."}},
      { label:"Let them have it — just credit you right", sub:"No money, but your name goes to 1.8 million people.",result:"The track blew up. Your name was in the liner notes. Two hundred thousand people saw it.",effect:{fans:1100,rep:6,fame:5}},
    ]
  },
  {
    id:"session_legend", emoji:"🪕", weight:3, title:"The Session Legend", trigger:{minReleases:1,minRep:15},
    body:"A Nashville session musician — 40 years, hundreds of credits — left a voicemail. He heard your record through a friend of a friend. He wants to play on your next session. For free. Because he likes what you're doing.",
    choices:[
      { label:"Say yes immediately", sub:"His playing will change the record. He'll have opinions about how.",result:"He showed up and played for six hours. The tracks sounded like something you couldn't have made alone.",effect:{qualityBase:7,rep:5}},
      { label:"Say yes, but run the session yourself", sub:"His talent, your vision. Could mean friction.",result:"You held the wheel.",effect:{},
        roll:{chance:0.65,onSuccess:{qualityBase:5,rep:3},successMsg:"He respected the direction. The result was yours, elevated.",onFail:{qualityBase:2},failMsg:"He had stronger opinions than expected. The session ended early. You used some of what he played."}},
      { label:"Thank him but keep the record yours", sub:"Complete ownership. No compromise.",result:"You called him back and explained. He said he understood. He meant it.",effect:{rep:3,hype:4}},
    ]
  },
  {
    id:"fan_letter", emoji:"✉️", weight:8, title:"The Fan Letter",
    body:"A real letter in a real envelope, forwarded to you by a venue. A veteran who lost his best friend three years ago. Your music was the first thing that didn't feel fake to him. He's asking if you'll dedicate a song.",
    choices:[
      { label:"Write him back and honor it at your next show", sub:"Takes nothing but time. Means everything to him.",result:"You wrote two pages back. At the next show, you told the story without names. Three people in the front row were crying. One of them was you.",effect:{rep:9,fans:120,hype:3}},
      { label:"Post about it publicly — let the story spread", sub:"Reaches more people. Might feel bigger than the moment.",result:"You posted about it.",effect:{},
        roll:{chance:0.68,onSuccess:{fame:7,rep:5,fans:500},successMsg:"He'd said it was okay to share. The post went further than you expected. Thousands of people responded.",onFail:{rep:-5},failMsg:"He'd asked you to keep it private. You didn't see that line until after you posted. You deleted it and called him."}},
      { label:"Keep it private — it means more that way", sub:"No audience. No gain. Just the right thing.",result:"You wrote back. You honored it at the next show. Nobody else knows. That's exactly the point.",effect:{rep:11}},
    ]
  },
  {
    id:"playlist_surprise", emoji:"📈", weight:5, title:"Unexpected Playlist", trigger:{minReleases:1},
    body:"A song you don't love — one you almost cut — just got added to a Spotify editorial playlist without any request from your team. It has 200,000 more streams than anything else you've made this month.",
    choices:[
      { label:"Ride it — promote the track everywhere", sub:"Streams are streams. Let the algorithm work.",result:"You promoted it hard. The numbers climbed. Your core audience raised an eyebrow but followed along.",effect:{fans:900,hype:9,saturation:12,rep:-3}},
      { label:"Let it grow without your fingerprints on it", sub:"Organic discovery. Steady and honest.",result:"You stayed out of its way. It peaked and settled into your catalog quietly.",effect:{fans:450,hype:5}},
      { label:"Rerecord it the right way — make it the song it should have been", sub:"Costs studio time and money. Reclaims the art.",result:"You rerecorded it correctly. The response was better than the original. Some people preferred the first version, but you didn't.",effect:{money:-800,fans:650,rep:7,qualityBase:2},req:{money:800}},
    ]
  },
  {
    id:"merch_disaster", emoji:"👕", weight:5, title:"The Merch Disaster", trigger:{minFans:300},
    body:"You hyped the shirt drop on Instagram for two weeks. Tonight the merch arrives: every box is wrong size, wrong design, somehow for a band you've never heard of. Forty fans are already at the merch table.",
    choices:[
      { label:"Comp every fan and issue full refunds", sub:"Costs you. Earns you something better than money.",result:"You refunded every pre-order and gave away what little you had left. The comments called it class.",effect:{money:-350,rep:9},req:{money:350}},
      { label:"Sell lyric sheets, Polaroids, whatever you have", sub:"Hustle your way out of it — unexpected charm.",result:"You grabbed a Sharpie, started signing notebook pages and selling them for $8. Sold out in twenty minutes.",effect:{money:280,hype:9,fans:90}},
      { label:"Blame the vendor publicly", sub:"Shifts responsibility. Might start a different fire.",result:"You posted the vendor's name. Your fans were sympathetic. The vendor replied. It got complicated.",effect:{hype:5,rep:-7,money:150}},
    ]
  },
  {
    id:"genre_question", emoji:"🤔", weight:6, title:"The Genre Question", trigger:{minReleases:1},
    body:"Mid-interview, the journalist leans forward and asks the question that's going to end up in the headline: 'Is this still country music, or are you chasing something else? Be honest with me.'",
    choices:[
      { label:"\"I don't think about genres — I think about truth\"", sub:"Philosophical. Likely to be quoted exactly.",result:"She wrote it down word for word. It led the piece. Half your audience loved it. Half called it pretentious.",effect:{rep:8,fans:350,hype:5}},
      { label:"\"It's the most country thing I've ever done\"", sub:"Leans into the identity. Broadens the mainstream appeal.",result:"The headline was 'Proving Country Can Still Mean Something.' It played well across the right stations.",effect:{fame:6,rep:3,fans:550}},
      { label:"\"Call it whatever you want — just listen to it\"", sub:"A little edgy. Memorable.",result:"She used it as the kicker. The piece ran with an edge. The comments were split and very active.",effect:{hype:10,rep:4,fame:4}},
    ]
  },
  {
    id:"label_renegotiation", emoji:"📋", weight:2, title:"The Label Renegotiation", trigger:{hasLabel:true},
    body:"Your label's A&R contact reaches out. They want to talk about your next album deal — better advance, more marketing support, but an exclusivity clause and a tighter delivery timeline. Their lawyer is already involved.",
    choices:[
      { label:"Negotiate hard — push for full creative control", sub:"Could get you more. Could cool the relationship.",result:"You negotiated.",effect:{},
        roll:{chance:0.50,onSuccess:{money:5000,rep:5},successMsg:"They blinked. You got the clause removed and a $5k advance bump. Your lawyer earned their fee.",onFail:{rep:-4},failMsg:"They held firm. You signed anyway, slightly worse off than before. The relationship has a new temperature."}},
      { label:"Accept the terms — stability matters right now", sub:"Less risk. Less leverage next time.",result:"You signed. The advance arrived the following week. The timeline is real now.",effect:{money:2000,rep:2}},
      { label:"Walk away from the renegotiation entirely", sub:"Keeps your current terms. Sends a message.",result:"You told them your current deal was fine. The room went quiet. They said they'd be in touch. Word travels.",effect:{rep:7,hype:6}},
    ]
  },
  {
    id:"church_revival", emoji:"⛪", weight:5, title:"The Church Revival",
    body:"A small Baptist church an hour outside town wants you to play their Sunday revival. No money, no door split — but the pastor says half the county will be there, including a few people who 'work in music up in Nashville.' His mother makes the cornbread.",
    choices:[
      { label:"Play it free, do it right", sub:"No money, just the room. The old way.",result:"You played three gospel-leaning numbers and one of your own. The cornbread was as advertised. Two of the 'music people' actually were.",effect:{rep:7,fans:280,hype:4}},
      { label:"Ask for a small honorarium — gas money at least", sub:"Modest ask. Shows respect both ways.",result:"They handed you $150 in an envelope after the service. The pastor's wife said you were welcome any Sunday.",effect:{money:150,rep:5,fans:140}},
      { label:"Politely decline — Sundays are for sleeping", sub:"You keep the day. The room moves on without you.",result:"They thanked you for considering it. Someone else played. You heard later it was packed.",effect:{energy:8}},
    ]
  },
  {
    id:"songwriter_round", emoji:"🪑", weight:7, title:"The Writers Round", trigger:{minRep:8},
    body:"Bluebird-style writers round at a venue in town. Three other writers, one mic each, take turns playing a song and telling the story behind it. Two of the others have cuts on the radio. The fourth chair is yours if you want it.",
    choices:[
      { label:"Sit in and play your most personal song", sub:"All craft. Eyes wide open.",result:"You opened with the one you almost didn't write. The room got real quiet. One of the others reached over and squeezed your shoulder when you finished.",effect:{rep:10,hype:5,fans:120}},
      { label:"Bring your most commercial song", sub:"Read the room. Play to win.",result:"You played the hooky one. It went over fine. One of the radio writers asked who your publisher was.",effect:{rep:5,fame:4,fans:90}},
      { label:"Try a brand new one nobody's heard yet", sub:"Risky. Could be a moment. Could fall flat.",result:"You tried it cold.",effect:{},
        roll:{chance:0.55,onSuccess:{rep:13,hype:11,qualityBase:1},successMsg:"It worked. The other writers were leaning in by the second verse. You felt the song find its shape in real time.",onFail:{rep:-3},failMsg:"It wasn't ready. You knew by the bridge. Polite applause and a long ride home."}},
    ]
  },
  {
    id:"producer_feud", emoji:"🎚️", weight:4, title:"Producer Disagreement", trigger:{minReleases:1},
    body:"Mid-mix on the next single, your producer wants to bury the pedal steel and push the drums forward — make it punch on phone speakers. You wrote the song around that pedal steel. He says the song is bigger than your attachment to it.",
    choices:[
      { label:"Hold the line — your record, your call", sub:"Your vision intact. The relationship has a new edge.",result:"He sighed, made the change back, and said nothing for the rest of the session. The mix was yours.",effect:{rep:4,qualityBase:2,hype:3}},
      { label:"Try his version, then yours, pick honestly", sub:"The professional move. Time-consuming.",result:"You did both. Listened side by side. Picked a hybrid that was better than either. He thanked you for the patience.",effect:{qualityBase:4,rep:5,energy:-10}},
      { label:"Let him have it — trust the man you hired", sub:"Cede control. Hope he's right.",result:"You backed off. The mix landed somewhere you wouldn't have gone. Some of your fans noticed. Some new ones did too.",effect:{fame:4,fans:250,rep:-2}},
    ]
  },
  {
    id:"sync_request", emoji:"📺", weight:4, title:"The Sync Placement", trigger:{minReleases:2},
    body:"A music supervisor for a streaming series — small but well-reviewed — wants one of your songs for the season finale. They're offering $4,200 for a non-exclusive sync. The scene is good. The show isn't anything you'd watch.",
    choices:[
      { label:"Take the check, sign the paper", sub:"Clean money. Wider exposure.",result:"The episode aired. The song popped on streaming for two weeks. The check cleared.",effect:{money:4200,fans:600,fame:5,saturation:6}},
      { label:"Ask for double — the song is doing them a favor too", sub:"Confidence move. Could bounce.",result:"You countered.",effect:{},
        roll:{chance:0.45,onSuccess:{money:8000,fans:600,fame:5},successMsg:"They came back at $7,500 plus a soundtrack credit. You took it. Best phone call of the month.",onFail:{},failMsg:"They went with a different artist. Cleaner price, less ego. Your loss."}},
      { label:"Pass — the show isn't your scene", sub:"Keep the catalog clean. Money walks away.",result:"You declined politely. The supervisor said she'd remember you for the right project. People say that.",effect:{rep:3}},
    ]
  },
  {
    id:"family_emergency", emoji:"📞", weight:6, title:"The Phone Call",
    body:"Your sister calls at 11pm. Mom's in the hospital. Nothing critical yet, but it could be. You're three states away with two club shows this weekend that are already sold out. Refunds would take a chunk.",
    choices:[
      { label:"Cancel the shows, fly home tonight", sub:"Family first. The career holds.",result:"You were at her bedside by morning. She squeezed your hand. The promoters were understanding. Most of them.",effect:{money:-1500,rep:-3,energy:-15}},
      { label:"Play the shows, drive home Monday", sub:"Hold the obligations. Hope it's not the worst.",result:"You played both nights. You weren't fully there. By Monday morning Mom was stable. Your sister was tired.",effect:{rep:2,hype:-4}},
      { label:"Move the Sunday show to a livestream", sub:"Compromise. Costs less, costs something.",result:"You played Saturday in person, streamed Sunday from a hotel room near the hospital. Smaller crowd online but real.",effect:{money:-400,rep:5,fans:180}},
    ]
  },
  {
    id:"award_nom", emoji:"🥇", weight:3, title:"The Nomination", trigger:{minFame:30,minReleases:2},
    body:"An Americana Music Association nomination just hit your inbox. The ceremony is in three weeks, in Nashville. You'd need to fly your band in, rent suits, sit at a table. Most people don't win the first time they're nominated.",
    choices:[
      { label:"Show up with the band, do it properly", sub:"Costs real money. Looks like an artist who belongs.",result:"You all wore actual suits.",effect:{money:-1800},req:{money:1800},
        roll:{chance:0.30,onSuccess:{fame:18,rep:10,fans:1500},successMsg:"You won. Your speech was thirty-two seconds and you didn't cry until backstage. The whole industry saw you.",onFail:{fame:6,rep:5,fans:400},failMsg:"You didn't win. You clapped for the winner like you meant it. You did mean it. The room knew you belonged."}},
      { label:"Go alone, keep it cheap", sub:"You're there. Less spectacle.",result:"You sat at a table of strangers, ate a chicken dinner, and clapped for someone else. Met two people worth knowing.",effect:{money:-400,fame:4,rep:3}},
      { label:"Skip it — let the work speak", sub:"Saves money. Looks like indifference.",result:"You stayed home and worked on the next record. Some people noticed. Most people didn't.",effect:{rep:4,hype:3}},
    ]
  },
  {
    id:"tour_bus_offer", emoji:"🚌", weight:3, title:"Used Tour Bus", trigger:{minMoney:8000,minFame:20},
    body:"A roots act that just broke up is selling their tour bus. Sleeps eight, runs okay, has a story. They want $9,000 cash. Your van has 240,000 miles on it. The bus would change how you tour, for better and worse.",
    choices:[
      { label:"Buy the bus", sub:"Real upgrade. Real cost. Real maintenance ahead.",result:"You drove it home that night. Slept in the bunk. Already felt different.",effect:{money:-9000,rep:6,energy:8},req:{money:9000}},
      { label:"Lowball them at $6,000", sub:"They're motivated. Could work.",result:"You made the offer.",effect:{},req:{money:6000},
        roll:{chance:0.45,onSuccess:{money:-6000,rep:5,energy:6},successMsg:"They took it. The drive home in the bus felt like a different career.",onFail:{},failMsg:"They held firm. You shook hands and walked away. Felt like the right call by morning."}},
      { label:"Keep the van — diesel is expensive", sub:"Stay lean. The romance of the van survives.",result:"You drove your van home one more time. It coughed at the second hill. You patted the dashboard.",effect:{rep:3}},
    ]
  },
  {
    id:"streaming_payout", emoji:"💸", weight:4, title:"The Streaming Statement", trigger:{minReleases:1},
    body:"Your distributor sends the quarterly payout statement. The numbers are smaller than they should be. There's a line item for 'platform adjustment fees' you don't recognize. It's $480 they say you owe them, not the other way around.",
    choices:[
      { label:"Lawyer up — this is theft, plain and simple", sub:"Costs $1,200 in fees. Could recover much more.",result:"Your lawyer wrote a letter that did real damage. The statement was reissued, with apology.",effect:{money:1800,rep:4},req:{money:1200}},
      { label:"Email the distributor and demand an explanation", sub:"Cost-free. Less leverage.",result:"They responded with three paragraphs of jargon and a partial refund.",effect:{money:200,energy:-5}},
      { label:"Switch distributors and let it go", sub:"Move on cleanly. Eat the loss.",result:"You moved your catalog. The new distributor was straightforward. The $480 stayed gone.",effect:{rep:3,hype:2}},
    ]
  },
  {
    id:"film_doc", emoji:"🎬", weight:2, title:"The Documentary Pitch", trigger:{minFame:35,minReleases:3},
    body:"A young filmmaker — credentialed, intense, slightly broke — wants to follow you around for two years and make a documentary. She has $40k in grant money and a small crew. She's done one previous film about a folk singer. It was good.",
    choices:[
      { label:"Yes — give her real access", sub:"A filmed life. Long-term gamble. Could be career-defining.",result:"She moved into your spare room for a week to start. The cameras stopped feeling weird around month four.",effect:{rep:5,hype:8,fame:4,energy:-8}},
      { label:"Limited access — shows and interviews only", sub:"Some of you stays private. Less interesting film.",result:"She agreed reluctantly. The film, when it came, was good but felt held back. So did you, watching it.",effect:{rep:3,fame:3,hype:4}},
      { label:"Politely no — your life isn't a documentary", sub:"Privacy preserved. Story untold.",result:"You declined. She made the film about someone else. It won an award. You watched it on a plane.",effect:{rep:4}},
    ]
  },
  {
    id:"open_mic_kid", emoji:"👦", weight:6, title:"The Kid at the Open Mic",
    body:"Open mic night, you're not playing — just listening. A kid, maybe sixteen, gets up with a beat-up acoustic and plays a song he wrote. It's better than it has any right to be. After his set, he walks straight up to your table.",
    choices:[
      { label:"Buy him a Coke and talk shop for an hour", sub:"Pay it forward. Costs nothing but time.",result:"You talked songwriting until the bar closed. He had a real ear. You gave him your number. He'll use it.",effect:{rep:8,hype:3}},
      { label:"Offer to put him on as your opener next month", sub:"Real leg up. A small bet on a stranger.",result:"He nearly cried. Showed up early, played a tight set, sold three tapes. He'll be okay.",effect:{rep:11,fans:90}},
      { label:"Compliment his song and excuse yourself", sub:"You've got your own work. Keep moving.",result:"You said the right things and went home. He played the next week and the week after. You'll see him again.",effect:{energy:4,rep:1}},
    ]
  },
  {
    id:"social_callout", emoji:"📱", weight:5, title:"The Callout Post", trigger:{minFame:18},
    body:"A tweet quoting an old interview of yours is going around with the words 'aged poorly' attached. You said something glib about a genre you respect now. The tweet has 8,000 retweets and growing. Your phone won't stop buzzing.",
    choices:[
      { label:"Apologize publicly — own the growth", sub:"Costs pride. Earns respect from people whose opinion matters.",result:"You posted three honest paragraphs. No defensiveness. The replies were mostly kind. Some weren't. The story died in a week.",effect:{rep:8,hype:-3,fans:200}},
      { label:"Quote-tweet with a joke", sub:"Cool under fire. Could land. Could escalate.",result:"You posted the joke.",effect:{},
        roll:{chance:0.55,onSuccess:{hype:14,rep:5},successMsg:"The joke went viral on its own terms. Even the original poster laughed. You came out ahead.",onFail:{rep:-9,hype:6},failMsg:"The joke read defensive. The pile-on doubled. You deleted it three hours later. Already screenshotted."}},
      { label:"Log off for a week — let it pass", sub:"Refuse the cycle. Lose the narrative.",result:"You put the phone in a drawer and made breakfast. By the time you logged back in, it was someone else's turn.",effect:{energy:10,rep:2}},
    ]
  },
  {
    id:"vinyl_pressing", emoji:"💿", weight:4, title:"Vinyl Pressing Window", trigger:{minReleases:1,minFans:800},
    body:"A small pressing plant in Memphis has an open slot in their schedule. Normally a year wait — they can press 500 copies of any of your records in three weeks. But you have to commit by Friday and pay upfront.",
    choices:[
      { label:"Press your debut — collectors will want it", sub:"$3,400 upfront. Slow, satisfying revenue over time.",result:"You handed them the masters. Three weeks later you had 500 records in your kitchen. Sold half by month's end.",effect:{money:-3400,fans:400,rep:6,hype:8},req:{money:3400}},
      { label:"Press a special live edition", sub:"Cheaper to make, faster to sell, less of a legacy item.",result:"You compiled a single live LP from your best radio sessions. Fans loved it. Critics shrugged.",effect:{money:-2000,fans:250,rep:4},req:{money:2000}},
      { label:"Pass — the digital catalog is doing fine", sub:"Save the cash. Skip the romance.",result:"You let the slot go. The romance kept whispering at you for weeks.",effect:{}},
    ]
  },
  {
    id:"radio_dj_request", emoji:"📡", weight:5, title:"The DJ's Request", trigger:{minRep:12},
    body:"A long-time roots music DJ in Tulsa — small audience, fierce loyalty — wants to do a one-hour deep-dive on your catalog. He'd like you to send him your B-sides, demos, and unreleased songs to spin on air.",
    choices:[
      { label:"Send him everything — let him build the hour", sub:"Trust earned. Material lost from your control.",result:"He played a twenty-minute medley of your demos. The episode is the most-shared roots show of the month. You felt seen.",effect:{rep:11,fans:550,hype:6}},
      { label:"Send him a curated selection", sub:"Safer. Controlled story.",result:"He worked with what you sent. The episode was tight and respectful. You're glad you did it.",effect:{rep:6,fans:300,hype:3}},
      { label:"Schedule a phone interview instead", sub:"Talk on air, no demos.",result:"You talked for an hour. He asked good questions. The audience grew slightly.",effect:{rep:4,fans:180}},
    ]
  },
  {
    id:"superfan_tattoo", emoji:"🖋️", weight:5, title:"The Tattoo", trigger:{minFans:1500},
    body:"A fan posts a photo of a fresh tattoo: a lyric from your most-streamed song, in their own handwriting, across their forearm. They've tagged you. The post has 2,000 likes and a few hundred comments saying 'wait, who is this artist?'",
    choices:[
      { label:"Repost with thanks and tell them what the line meant", sub:"Heartfelt. Public. Earns new ears.",result:"Your story behind the lyric — they hadn't heard it. Neither had your audience. The post outperformed any of yours that month.",effect:{fans:850,hype:9,rep:6}},
      { label:"DM them directly — keep it personal", sub:"Quiet kindness. No public boost.",result:"You sent a long voice memo and a guitar pick in the mail. They posted about that, too. You hadn't asked them to.",effect:{rep:9,fans:200}},
      { label:"Like the post and move on", sub:"Acknowledged. Boundary intact.",result:"You hit the heart and went back to your day. They appreciated it. So did you.",effect:{rep:2,fans:50}},
    ]
  },
  {
    id:"copyright_notice", emoji:"📑", weight:3, title:"Copyright Notice", trigger:{minReleases:2},
    body:"A YouTube creator with 1.2M subscribers used 90 seconds of your song under a montage in a video that's now sitting at 4 million views. They didn't license it. Your distributor flagged the upload. You can claim it, demand removal, or strike a deal.",
    choices:[
      { label:"Claim the revenue — let YouTube cut you the check", sub:"Standard play. Steady payout from a big video.",result:"The claim went through. The creator was annoyed in the comments. The royalties kept coming.",effect:{money:1100,fans:400,rep:-2}},
      { label:"Demand removal — protect the song", sub:"Punitive. Costs the goodwill, gains the principle.",result:"They took it down with a passive-aggressive caption. The fans noticed. Some sided with you, some didn't.",effect:{rep:-5,hype:4}},
      { label:"Reach out and propose a real collab video", sub:"Turn the conflict into something both of you benefit from.",result:"You jumped on a call. Recorded a duet performance for their channel two weeks later. 600,000 views.",effect:{fans:1800,fame:6,hype:8}},
    ]
  },
  {
    id:"songbook_offer", emoji:"📖", weight:3, title:"The Songbook Deal", trigger:{minReleases:3,minRep:20},
    body:"A music publisher wants to put out an official songbook of your catalog — chord charts, lyric sheets, your handwritten notes if you'll share them. $2,000 advance, modest royalties, your name on a real book.",
    choices:[
      { label:"Sign — see your songs in print", sub:"Lasting artifact. Modest income. Real legacy.",result:"You spent two weeks pulling together the notes. The book came out beautiful. Your mother bought twelve copies.",effect:{money:2000,rep:8,fame:4,fans:200}},
      { label:"Counter for a higher royalty rate", sub:"Push harder. Risk the deal.",result:"You countered.",effect:{},
        roll:{chance:0.55,onSuccess:{money:2500,rep:10,fame:5},successMsg:"They agreed. The book did better than expected. Songbooks have long tails.",onFail:{rep:-2},failMsg:"They walked. Said they'd revisit when you had more catalog. You're still waiting."}},
      { label:"Decline — songs aren't for static pages", sub:"Keep the music breathing only on stage.",result:"You said no with respect. The publisher signed someone else. You don't think about it often.",effect:{rep:3}},
    ]
  },
  {
    id:"festival_clash", emoji:"⚔️", weight:4, title:"The Festival Clash", trigger:{minFame:25},
    body:"You're booked for a festival slot at the same hour as one of the biggest acts on the lineup. Roughly 80% of the crowd will be at the main stage. The festival booker calls — would you trade slots with a smaller act for a less prime time but a guaranteed crowd?",
    choices:[
      { label:"Take the trade — empty stages aren't worth playing", sub:"Smaller slot, real audience.",result:"You moved to the 4pm slot on a smaller stage. Played to 1,200 people who actually stayed. Sold out of merch.",effect:{fame:7,fans:1500,money:600}},
      { label:"Hold your slot — make it count anyway", sub:"Pride play. Could pay off, could embarrass.",result:"You played to about 80 stragglers.",effect:{},
        roll:{chance:0.40,onSuccess:{fame:10,rep:10,fans:1000},successMsg:"You played like the stage was full. By song five it nearly was — fans drifting from the main stage. The booker noticed.",onFail:{rep:-4,fame:3,fans:150},failMsg:"You played to a half-empty field. Did your job. The booker didn't book you again that year."}},
      { label:"Cancel and ask for a better slot next year", sub:"Bold move. Probably burns the bridge.",result:"You pulled out. The booker was diplomatic on the phone, less so to her colleagues. You weren't on next year's announcement.",effect:{rep:-6,hype:6}},
    ]
  },
  {
    id:"writer_room_invite", emoji:"📝", weight:4, title:"The Co-Write Invitation", trigger:{minRep:15,minReleases:1},
    body:"A working Nashville songwriter — three #1 country radio cuts, no artist career — invites you to her writers room for a Thursday session. She wants to write something together with no specific destination. 'Bring whatever's bothering you.'",
    choices:[
      { label:"Show up with a real, half-written song", sub:"Workmanlike. Most likely to result in something good.",result:"You finished it together in four hours. She told you which lines to keep. They were the right ones. The song is real.",effect:{qualityBase:5,rep:7}},
      { label:"Show up with nothing — write fresh in the room", sub:"Higher ceiling. Higher floor risk.",result:"You started from a chord progression and a phrase she'd been carrying. By 6pm you had a song neither of you would have written alone.",effect:{},
        roll:{chance:0.65,onSuccess:{qualityBase:7,rep:9,hype:5},successMsg:"It was the kind of song you didn't know you could write. She wanted to demo it next week. You said yes immediately.",onFail:{rep:2},failMsg:"You wrote two verses and a chorus that didn't quite click. She called it 'a sketch worth coming back to.' You both knew."}},
      { label:"Reschedule — you're not in the right headspace", sub:"Honest move. Closes a window.",result:"She was understanding. The reschedule never quite happened. Some doors stay cracked, not open.",effect:{rep:1}},
    ]
  },
  {
    id:"gear_theft", emoji:"🔓", weight:5, title:"The Break-In",
    body:"You come out of the truck stop and the side window of the van is shattered. They got your secondary acoustic, two pedals, and the cash box from last night. The good guitar was inside with you. Small mercies.",
    choices:[
      { label:"File the report, replace the gear, move on", sub:"Real money out. Real time back on the road.",result:"You spent the morning at the police station, the afternoon at a music store. Behind on the schedule but functional by sundown.",effect:{money:-1400,energy:-12,rep:3},req:{money:1400}},
      { label:"Post about it — fans might have leads", sub:"Long shot. Solidarity if nothing else.",result:"You posted photos of the missing pedals. A pawn shop owner three states away DM'd you a week later. You drove out.",effect:{},
        roll:{chance:0.40,onSuccess:{money:-200,fans:400,rep:7},successMsg:"You got two of the pedals back and the story made the local news. Bittersweet, but a win.",onFail:{},failMsg:"Nothing came of it. The post sat in the feed. You bought the pedals again."}},
      { label:"Cancel the rest of the run, head home", sub:"Cut losses. Recover. Eat the kill fees.",result:"You called every promoter. Most were sympathetic. A few weren't. The kill fees added up. You slept in your own bed by Tuesday.",effect:{money:-2000,rep:-4,energy:20}},
    ]
  },
  {
    id:"podcast_invite", emoji:"🎧", weight:5, title:"The Podcast Booking", trigger:{minRep:10},
    body:"A roots music podcast with 35,000 weekly listeners — the kind that books two-hour conversations, not soundbites — wants you on. The host is known for asking the real questions and waiting through the silences.",
    choices:[
      { label:"Say yes — be honest about the hard stuff", sub:"Costs nothing but vulnerability. Could be definitive.",result:"You talked for two hours and forty minutes. He didn't cut anything. The episode is the most listened to of his year.",effect:{rep:11,fans:1100,fame:7}},
      { label:"Yes, but stick to the music", sub:"Polished. Less risk. Less impact.",result:"The episode was good. You came across well. It didn't break anything new.",effect:{rep:5,fans:500,fame:3}},
      { label:"Decline — the timing isn't right", sub:"Window closes. He'll ask again. Maybe.",result:"You said maybe later. He booked someone else for the slot. The episode came out and was fine without you.",effect:{rep:1}},
    ]
  },
  {
    id:"merch_designer", emoji:"🎨", weight:4, title:"The Designer Pitch",
    body:"A young designer slides into your DMs with three mockups of merch — actually beautiful, hand-drawn, totally on-brand. She's asking for $400 to develop a full line. No royalty, just the flat fee. Her portfolio is real.",
    choices:[
      { label:"Hire her on the spot", sub:"Real investment in the brand.",result:"The merch line dropped six weeks later. The shirts looked like art, not promo. Sold out of the first run inside a month.",effect:{money:-400,rep:6,fans:300,hype:7},req:{money:400}},
      { label:"Counter — flat fee plus royalties going forward", sub:"Aligns interests. Slows the deal.",result:"She accepted a smaller flat fee plus 8% on what she designed. Both of you ended up making more.",effect:{money:-200,rep:8,fans:400},req:{money:200}},
      { label:"Pass — you'll keep the look DIY", sub:"Keep it homemade. Keep the look amateur.",result:"You declined. She took the work to another act and built them a stunning visual identity. You noticed.",effect:{}},
    ]
  },
  {
    id:"old_band_reunion", emoji:"🎵", weight:3, title:"The Old Band", trigger:{minFame:20,minReleases:2},
    body:"The drummer from your first band — the one that fell apart in your twenties — calls out of nowhere. He's organizing a one-night reunion at the bar where you all started. No money. Just the four of you, the old songs, and probably some old wounds.",
    choices:[
      { label:"Show up — close the loop", sub:"Sentimental. Worth it for reasons stats don't measure.",result:"You played the old songs. They sounded better than you remembered. You all hugged on stage. Two of you went home together to talk for hours.",effect:{rep:5,energy:-8,hype:4}},
      { label:"Show up, but keep it strictly business", sub:"Boundaries up. Heart half-closed.",result:"You played the show, shook hands, and drove home. The drummer texted later. You haven't responded yet.",effect:{rep:3,energy:-5}},
      { label:"Decline — that part of your life is closed", sub:"Protect the present. Lose the past.",result:"You said no. He understood. The reunion happened without you. They closed the show with one of yours.",effect:{rep:2}},
    ]
  },
  {
    id:"hometown_honor", emoji:"🏅", weight:3, title:"Hometown Honor", trigger:{minFame:25,minReleases:2},
    body:"Your hometown wants to put on 'Day' for you — a parade, a key to the city, a free concert in the park. The mayor calls personally. He'd like you to be there in three weeks. He says your high school music teacher is alive and would love to see you.",
    choices:[
      { label:"Go all in — full day, full show", sub:"Costs a tour day. Means everything to home.",result:"You played the park, hugged your music teacher, and rode in a parade in the back of a pickup. Half the town was there. So was your sister.",effect:{rep:10,fans:600,fame:6,energy:-12,money:-500}},
      { label:"Show up for the ceremony, skip the concert", sub:"Honored. Not exhausted.",result:"You did the parade and the speeches and went home. The teacher cried. So did you, a little.",effect:{rep:6,fans:200,fame:3,energy:-5}},
      { label:"Send a video and a thank-you", sub:"Keep the road. Lose the moment.",result:"They played your video at the ceremony. The crowd applauded. The mayor never quite returned your next call.",effect:{rep:2,fame:1}},
    ]
  },
];

// ── MERCH SHOP ─────────────────────────────────────────────
export type MerchType = "T-Shirt"|"Hoodie"|"Hat"|"Tote Bag"|"Poster"|"Vinyl"|"CD"|"Cassette"|"Sticker Pack"|"Coffee Mug"|"Bandana";
export interface MerchReview { week: number; handle: string; text: string; stars: number; }
export interface MerchItem {
  id: string;
  type: MerchType;
  name: string;
  emoji: string;
  tiedToReleaseId: string | null;
  tiedToReleaseTitle: string | null;
  price: number;
  cost: number;
  releasedWeek: number;
  weeklySales: number[];
  totalSold: number;
  totalRevenue: number;
  reviews: MerchReview[];
  active: boolean;
  // pressings (physical formats only)
  variantName?: string;     // e.g. "Translucent Blue", "Picture Disc"
  variantColor?: string;    // CSS color for the swatch
  editionLabel?: string;    // e.g. "Limited Edition", "Deluxe Box Set"
}

export interface PressingVariant {
  name: string;
  color: string;
  priceMod: number;
  costMod: number;
  popularityMod: number;
  rarityCopy?: string;
}
export const VINYL_VARIANTS: PressingVariant[] = [
  { name:"Standard Black",     color:"#1a1a1a", priceMod:0,  costMod:0, popularityMod:1.00 },
  { name:"Translucent Blue",   color:"#3a6fa6", priceMod:5,  costMod:2, popularityMod:0.75, rarityCopy:"limited color pressing" },
  { name:"Forest Green",       color:"#3d6b3a", priceMod:5,  costMod:2, popularityMod:0.75, rarityCopy:"limited color pressing" },
  { name:"Sunburst Splatter",  color:"#d4952a", priceMod:8,  costMod:3, popularityMod:0.55, rarityCopy:"hand-poured splatter, /500" },
  { name:"Cherry Red",         color:"#a83232", priceMod:6,  costMod:2, popularityMod:0.70, rarityCopy:"limited color pressing" },
  { name:"Picture Disc",       color:"#c0a060", priceMod:12, costMod:5, popularityMod:0.45, rarityCopy:"art printed on the disc, /300" },
  { name:"Gold Foil Edition",  color:"#d4a820", priceMod:15, costMod:5, popularityMod:0.30, rarityCopy:"signed sleeve, /100" },
];
export const CD_VARIANTS: PressingVariant[] = [
  { name:"Standard Jewel Case", color:"#bfbfbf", priceMod:0, costMod:0, popularityMod:1.00 },
  { name:"Digipak",             color:"#7a8d5c", priceMod:3, costMod:1, popularityMod:0.80, rarityCopy:"recycled card sleeve" },
  { name:"Hand-Numbered",       color:"#d4a820", priceMod:6, costMod:1, popularityMod:0.55, rarityCopy:"signed & numbered" },
];
export const CASSETTE_VARIANTS: PressingVariant[] = [
  { name:"Black Shell",        color:"#1a1a1a", priceMod:0, costMod:0, popularityMod:1.00 },
  { name:"Translucent Amber",  color:"#d4952a", priceMod:2, costMod:1, popularityMod:0.80, rarityCopy:"see-through shell" },
  { name:"Glow-in-the-Dark",   color:"#b8e0a0", priceMod:4, costMod:2, popularityMod:0.55, rarityCopy:"genuinely glows" },
];

export interface MerchEdition {
  name: string;
  priceMod: number;
  costMod: number;
  popularityMod: number;
  blurb: string;
}
export const MERCH_EDITIONS: MerchEdition[] = [
  { name:"Standard",        priceMod:0,  costMod:0,  popularityMod:1.00, blurb:"The everyday pressing." },
  { name:"Limited Edition", priceMod:8,  costMod:2,  popularityMod:0.60, blurb:"Numbered run with alt cover art." },
  { name:"Deluxe Box Set",  priceMod:30, costMod:11, popularityMod:0.30, blurb:"Bonus tracks, lyric booklet, etched B-side." },
];

export function getPressingVariants(type: MerchType): PressingVariant[] {
  if (type === "Vinyl")    return VINYL_VARIANTS;
  if (type === "CD")       return CD_VARIANTS;
  if (type === "Cassette") return CASSETTE_VARIANTS;
  return [];
}
export function isPhysicalFormat(type: MerchType): boolean {
  return type === "Vinyl" || type === "CD" || type === "Cassette";
}

// Price elasticity: cheaper = more buyers, pricier = fewer.
// Ratio r = price / expectedBasePrice.
//   r = 0.5 → ~1.40 (40% more buyers)
//   r = 0.7 → ~1.24
//   r = 1.0 → 1.00
//   r = 1.3 → ~0.69
//   r = 1.6 → ~0.49
//   r = 2.0 → ~0.33
//   r = 3.0 → ~0.17 (floor)
export function priceDemandMultiplier(price: number, basePrice: number): number {
  if (basePrice <= 0) return 1;
  const r = price / basePrice;
  if (r <= 1) return 1 + (1 - r) * 0.8;
  return Math.max(0.15, Math.pow(r, -1.6));
}
export function priceDemandLabel(mult: number): { text: string; color: string } {
  if (mult >= 1.30) return { text: "bargain — flying off the shelf",  color: "var(--sage)" };
  if (mult >= 1.10) return { text: "cheap — extra buyers",             color: "var(--sage)" };
  if (mult >= 0.92) return { text: "fair price",                       color: "var(--ink)"  };
  if (mult >= 0.65) return { text: "premium — slower sales",           color: "var(--amber)" };
  if (mult >= 0.40) return { text: "pricey — only superfans",          color: "var(--rust)" };
  return { text: "absurd — almost nobody bites", color: "var(--rust)" };
}
export interface MerchTemplate {
  type: MerchType;
  emoji: string;
  basePrice: number;
  baseCost: number;
  popularity: number;
  needsRelease: boolean;
  blurb: string;
  defaultName: (release: string | null, artist: string) => string;
}
export const MERCH_TEMPLATES: MerchTemplate[] = [
  { type:"T-Shirt",      emoji:"👕", basePrice:25, baseCost:7,  popularity:1.00, needsRelease:false, blurb:"Heavyweight cotton tee. The bread and butter of any merch table.",
    defaultName: (r, a) => r ? `${r} Tour Tee` : `${a} Logo Tee` },
  { type:"Hoodie",       emoji:"🧥", basePrice:48, baseCost:18, popularity:0.55, needsRelease:false, blurb:"Pricier, lower volume — but a bigger ticket and a fan favorite in winter.",
    defaultName: (r, a) => r ? `${r} Hoodie` : `${a} Heavyweight Hoodie` },
  { type:"Hat",          emoji:"🧢", basePrice:28, baseCost:9,  popularity:0.85, needsRelease:false, blurb:"Trucker cap with embroidered patch. Sells fast at outdoor shows.",
    defaultName: (_, a) => `${a} Trucker Cap` },
  { type:"Tote Bag",     emoji:"👜", basePrice:20, baseCost:5,  popularity:0.45, needsRelease:false, blurb:"Canvas tote with a screen-printed logo. Niche but loyal buyers.",
    defaultName: (r, a) => r ? `${r} Tote` : `${a} Canvas Tote` },
  { type:"Poster",       emoji:"🖼️", basePrice:15, baseCost:3,  popularity:0.65, needsRelease:false, blurb:"Letterpress show poster. Cheap to print, easy to sign.",
    defaultName: (r, a) => r ? `${r} Show Poster` : `${a} Tour Poster` },
  { type:"Vinyl",        emoji:"💿", basePrice:30, baseCost:9,  popularity:0.70, needsRelease:true,  blurb:"Pressed 12\" LP. Choose a color and edition. Collectors love it.",
    defaultName: (r) => `${r ?? "Album"} (LP)` },
  { type:"CD",           emoji:"📀", basePrice:14, baseCost:3,  popularity:0.55, needsRelease:true,  blurb:"Compact disc. Cheap to press, easy to sign at the merch table.",
    defaultName: (r) => `${r ?? "Album"} (CD)` },
  { type:"Cassette",     emoji:"📼", basePrice:12, baseCost:3,  popularity:0.45, needsRelease:true,  blurb:"Cassette tape. Niche but devoted — the indie collector special.",
    defaultName: (r) => `${r ?? "Album"} (Tape)` },
  { type:"Sticker Pack", emoji:"🏷️", basePrice:8,  baseCost:1,  popularity:0.95, needsRelease:false, blurb:"5 vinyl stickers. Tiny margin, big volume.",
    defaultName: (_, a) => `${a} Sticker Pack` },
  { type:"Coffee Mug",   emoji:"☕", basePrice:18, baseCost:5,  popularity:0.40, needsRelease:false, blurb:"Ceramic diner-style mug. A slow seller, but charming.",
    defaultName: (_, a) => `${a} Diner Mug` },
  { type:"Bandana",      emoji:"🪢", basePrice:16, baseCost:4,  popularity:0.50, needsRelease:false, blurb:"Cotton paisley bandana. A signature road-life item.",
    defaultName: (_, a) => `${a} Bandana` },
];

const MERCH_REVIEW_POOL: Record<"great"|"good"|"mixed"|"bad", string[]> = {
  great: [
    "Quality is unreal — soft, heavy, made to last. Worth every dollar.",
    "Already wear it twice a week. Three compliments at the bar last night.",
    "Wife stole it. Ordering another. Thank you for caring about the print.",
    "Shipping was fast and the packaging felt like a gift. Real artist behavior.",
    "The fit is exactly right. No skimping on the cotton. Bless.",
    "Bought it at the show, wear it everywhere. Strangers ask who you are.",
    "First piece of artist merch I haven't been embarrassed to wear in public.",
    "Print is dead-on. Colors are right. Built to last a decade.",
    "This is the merch I'll still own in twenty years.",
  ],
  good: [
    "Solid. Fits true to size. Good print quality.",
    "Pleased with it. Took two weeks to ship but worth the wait.",
    "Good cotton, good cut. Nothing flashy, just done right.",
    "Looks just like the photo. Happy with the purchase.",
    "Wore it to the show, the artist signed it. Great memory.",
    "Comfortable. Print hasn't faded after a few washes.",
    "Honest product. Honest price. Hard to ask for more.",
  ],
  mixed: [
    "Runs small. Order a size up.",
    "Print is nice but the fabric is thinner than I expected.",
    "Took six weeks to arrive. Quality made up for it. Mostly.",
    "Color is slightly off from the website photo. Still good.",
    "Decent, but a little steep for what it is. Love the artist though.",
    "Not bad, not great. Would buy a tee but maybe not this one.",
  ],
  bad: [
    "Cracked in the wash after two cycles. Disappointing.",
    "Ordered a medium, got something I could fit two of me in.",
    "Print started peeling within a month. Expected better.",
    "Refund process was a mess. Won't be ordering again.",
    "Cheap material. Felt like a gas station tee for a premium price.",
    "Charged me twice and customer service ghosted. Brutal.",
  ],
};

const MERCH_FAN_HANDLES = ["@nashvilledoll","@porchpicker","@dustyboot","@neondreamr","@hollergirl","@whiskeywren","@tinroofTN","@ridgelinejake","@gravelroadgirl","@delta_blue","@honkytonkmom","@diveBarSam","@boxcarbette","@frontporchkim","@ramblinrose","@coalcountrycam","@willowbendmom","@truckstopjess","@steelguitardad","@bluesrunner"];

export function generateMerchReview(mood: "great"|"good"|"mixed"|"bad", week: number): MerchReview {
  const stars = mood === "great" ? 5 : mood === "good" ? 4 : mood === "mixed" ? 3 : Math.random() < 0.5 ? 2 : 1;
  const pool = MERCH_REVIEW_POOL[mood];
  return {
    week,
    handle: MERCH_FAN_HANDLES[Math.floor(Math.random() * MERCH_FAN_HANDLES.length)],
    text: pool[Math.floor(Math.random() * pool.length)],
    stars,
  };
}

// ── WORD BANKS ─────────────────────────────────────────────
const TW = {
  adj:["Cold","Dark","Dusty","Faded","Heavy","Hollow","Lost","Lonesome","Low","Midnight","Rainy","Red","Rusty","Silent","Smoky","Stormy","Sunburned","Thunder","Yellow","Pale","Angry","Bitter","Broken","Burning","Crying","Crooked","Desperate","Drunk","Empty","Fading","Forgotten","Golden","Gone","Grieving","Guilty","Hard","Haunted","Heartless","Hurting","Jealous","Barefoot","Backroads","Cotton","Copper","Cracked","Gravel","Iron","Muddy","Neon","Painted","Porch","Ragged","River","Rustic","Scarred","Steel","Stone","Tangled","Tin","Worn","Ancient","Dead","Early","Final","Last","Late","Long","Old","Slow","Still","Wicked","Wild","Weary","Wayward","Wandering","Tender","Troubled","Twisted","Unnamed","Crooked"],
  noun:["Bayou","Creek","Delta","Dirt","Dust","Fields","Fog","Gravel","Hollow","Holler","Mountain","Mud","Pines","Rain","River","Road","Smoke","Storm","Swamp","Thunder","Barn","Bridge","Church","County","Crossroads","Front Porch","Highway","Jailhouse","Junction","Kitchen","Levee","Mill","Midnight","Old Town","Pasture","Railyard","Roadhouse","Saloon","Shack","Watering Hole","Blood","Bones","Ghost","Hands","Heart","Memory","Mind","Shadow","Skin","Soul","Spirit","Spine","Tears","Voice","Wound","Scar","Breath","Silence","Dream","Prayer","Bible","Bottle","Fiddle","Fire","Flame","Guitar","Grave","Lantern","Letter","Moon","Pistol","Rope","Saddle","Train","Whiskey","Wings","Wire","Wreath","Crown","Cross","Blues","Burden","Darkness","Debt","Faith","Freedom","Glory","Grace","Grief","Heaven","Hell","Hope","Justice","Kindness","Longing","Mercy","Pride","Promise","Regret","Sorrow"],
  verb:["Aching","Bleeding","Breaking","Burning","Carrying","Chasing","Crawling","Crying","Drifting","Drinking","Driving","Drowning","Dying","Fading","Falling","Fighting","Gambling","Grieving","Haunting","Healing","Hiding","Holding","Howling","Hurting","Leaving","Lying","Missing","Moaning","Mourning","Paying","Preaching","Praying","Reckoning","Riding","Rising","Rolling","Running","Singing","Sleeping","Swearing","Walking","Wandering","Wishing","Working","Worrying","Screaming","Searching","Settling","Shaking","Trembling"],
  place:["Alabama","Appalachia","Arkansas","Bakersfield","Beaumont","Biloxi","Clarksdale","Crossville","Deep East Texas","East Nashville","Georgia","Highway 61","Huntsville","Jackson","Kentucky","Louisiana","Memphis","Mississippi","Nashville","New Orleans","Natchez","Oklahoma","Piedmont","Red River","Shreveport","Tennessee","Tupelo","Yazoo"],
  name:["Annie","Bobby","Carla","Darlene","Earl","Ellie Mae","Frank","Gracie","Hank","Iris","Jesse","Jolene","Kay","Lena","Luther","Mae","Mabel","Nora","Otis","Pearl","Ramona","Rosie","Ruby","Sally","Sonny","Stella","Tommy","Vera","Wanda","Willie"],
  phrase:["After Dark","All Night Long","At the Crossroads","Back Down Home","Better Days","Between the Lines","By the River","Cold and Gone","Come Sundown","Deep in My Soul","Don't Look Back","Down the Line","Far From Here","For Good","From the Bottle","Gone to Ground","Gravel in My Bones","Hard Times","Heading South","In My Blood","In the Dark","Last Call","Last Ride","Left Behind","Letting Go","Long Gone","Lord Have Mercy","No Good Reason","No Turning Back","On My Way","On the Road","One More Night","Out in the Rain","Over the Mountain","Past Midnight","Raising Hell","Six Feet Deep","Six Strings Down","Still Here","Stone Cold","Straight to Hell","The Devil Knows","The Hard Way","The Long Way Home","Through the Fire","Til the Wheels Fall Off","Too Far Gone","Way Down South","When the Lights Go Down","Where I Come From","Whiskey Talking","Without a Prayer","Years Behind Me"],
};

const ANAME = {
  pre:["Lonesome","Dusty","Hard","Golden","Midnight","Lost","Southern","Raw","Hollow","Last","First","Heavy","Deep","Low","Crooked","Broken","Fading","Troubled","Wandering","Restless","Backroads","Bleeding","Burning","Dark","Dead","Devil's","Drunk","Forgotten","Gravel","Iron"],
  noun:["Miles","Highway","River","Fields","Gospel","Bottle","Porch","Smoke","Crossroads","Delta","Gravel","Holler","County","Blues","Dirt","Road","Hymns","Letters","Nights","Prayer","Confessions","Dispatches","Sermons","Sunsets","Thunder","Regrets","Revelations","Whiskey","Wire","Years"],
  suf:["Vol. 1","Vol. 2","Sessions","Recordings","Live","Acoustic","The Album","Tape","Archives","Collection","Revisited","Uncut","Deluxe","From the Road","From the Porch","Remastered","The Lost Tapes","After Midnight","At the Crossroads","Down Home"],
};

// ── ARTIST NAME GENERATOR ──────────────────────────────────
const AN = {
  first: ["Hank","Waylon","Willie","Merle","Buck","Earl","Chet","Roy","Lefty","Tex","Bo","Luke","Cody","Beau","Clay","Wade","Clyde","Otis","Johnny","Dale","Slim","Dock","Floyd","Garth","Glen","Ray","Charlie","Emmett","Luther","Junior","Buddy","Harlan","Deke","Zeke","Homer","Rufus","Beauregard","Jessie","Travis","Lyle","Porter","Stonewall","Muddy","Howlin","Lightnin","Blind","Little","Big","Leadbelly","Son","Delta","Rev","Elmore","Buddy","Sonny","Magic","Guitar"],
  last: ["Monroe","Rhodes","Cash","Jennings","Travis","Haggard","Tucker","Jones","Williams","Price","Stone","Cross","Lane","King","Waters","Johnson","Dixon","Turner","Walker","Brown","Davis","Hayes","Webb","Cobb","Doss","Holt","Boone","Sims","Poe","Gentry","Sayles","Colter","Frizzell","Tillis","Owens","Macon","Parsons","Clark","Ritter","Autry","Acuff","Foley","Tubb","Wills","Wells","Lynn","Cline","Lovett","Earle","Croce","Rawlings"],
  prefix: ["Blind","Lonesome","Dusty","Lucky","Mississippi","Reverend","Ol'","Big","Little","Muddy","Slim","Tex","Iron","Smoky"],
  band: ["& the Hellbenders","& the Road Dogs","& the Honky Tonk Boys","& the Southern Cross","& the Delta Kings","& the Crossroad Blues Band","& the Backroads","& the Midnight Riders","& the Gospel Train","& the Bottle Rockets","& the Rambling Ghosts","& the Dust Devils"],
  single: ["Leadbelly","Moonshine","Cattail","Gravel","Crossroads","Rawhide","Saddleback","Tumbleweed","Copperhead","Ironwood","Blackwater","Redbird","Riverbed","Boxcar","Holler","Ridgeline","Lonesome","Hardscrabble","Plainsman"],
};

export function genArtistName(): string {
  const r = Math.random();
  if (r < 0.10) return rnd(AN.single);
  if (r < 0.22) return rnd(AN.prefix) + " " + rnd(AN.last);
  if (r < 0.38) return rnd(AN.first) + " " + rnd(AN.last) + " " + rnd(AN.band);
  if (r < 0.55) return rnd(AN.prefix) + " " + rnd(AN.first) + " " + rnd(AN.last);
  return rnd(AN.first) + " " + rnd(AN.last);
}

// ── HELPERS ────────────────────────────────────────────────
export function rnd<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }
export function roll(mn: number, mx: number): number { return mn + Math.random() * (mx - mn); }
export function clamp(v: number, mn: number, mx: number): number { return Math.max(mn, Math.min(mx, v)); }

// ── STREAMING PLATFORM SYSTEM ─────────────────────────────────────────────
export interface StreamingPlatform {
  id: string;
  name: string;
  ratePerStream: number;
  rateRange: [number, number];
  marketShare: number;
  premiumOnly: boolean;
  discoveryWeight: number;
}

export const STREAMING_PLATFORMS: StreamingPlatform[] = [
  { id: "spotify",  name: "Spotify",       ratePerStream: 0.0042, rateRange: [0.003, 0.0058],  marketShare: 0.52, premiumOnly: false, discoveryWeight: 1.0 },
  { id: "apple",    name: "Apple Music",   ratePerStream: 0.0085, rateRange: [0.007, 0.010],   marketShare: 0.22, premiumOnly: true,  discoveryWeight: 0.6 },
  { id: "amazon",   name: "Amazon Music",  ratePerStream: 0.0055, rateRange: [0.004, 0.008],   marketShare: 0.12, premiumOnly: false, discoveryWeight: 0.4 },
  { id: "youtube",  name: "YouTube Music", ratePerStream: 0.0020, rateRange: [0.0005, 0.003],  marketShare: 0.09, premiumOnly: false, discoveryWeight: 0.7 },
  { id: "tidal",    name: "Tidal",         ratePerStream: 0.0130, rateRange: [0.012, 0.015],   marketShare: 0.02, premiumOnly: true,  discoveryWeight: 0.3 },
  { id: "deezer",   name: "Deezer",        ratePerStream: 0.0055, rateRange: [0.004, 0.006],   marketShare: 0.02, premiumOnly: false, discoveryWeight: 0.2 },
  { id: "pandora",  name: "Pandora",       ratePerStream: 0.0014, rateRange: [0.0013, 0.0015], marketShare: 0.01, premiumOnly: false, discoveryWeight: 0.3 },
];

export const BASE_STREAMING_RATE = 0.0048;

export const GEO_RATE_MODIFIERS: Record<string, number> = {
  "US": 1.15, "UK": 1.08, "CA": 1.05, "DE": 1.02, "AU": 1.00,
  "FR": 0.95, "BR": 0.72, "MX": 0.68, "IN": 0.28, "other": 0.85,
};

export const DEFAULT_GEO_DIST: Record<string, number> = {
  "US": 0.62, "UK": 0.08, "CA": 0.05, "DE": 0.03, "AU": 0.02,
  "FR": 0.02, "BR": 0.03, "MX": 0.02, "IN": 0.01, "other": 0.12,
};

export const PREMIUM_SPLIT: Record<string, number> = {
  spotify: 0.58, apple: 1.00, amazon: 0.65, youtube: 0.35,
  tidal: 1.00, deezer: 0.55, pandora: 0.25,
};

export const PREMIUM_MULTIPLIER = 3.2;

export const SPOTIFY_MIN_STREAMS = 1000;

export function fmt(n: number): string { return n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "k" : Math.floor(n).toString(); }
export function fmtMoney(n: number): string {
  const abs = Math.abs(Math.round(n));
  const sign = n < 0 ? "−$" : "$";
  return sign + (abs >= 1000 ? abs.toLocaleString() : abs);
}

const TPATS: (() => string)[] = [
  () => rnd(TW.adj) + " " + rnd(TW.noun),
  () => rnd(TW.noun) + " " + rnd(TW.phrase),
  () => rnd(TW.verb) + " " + rnd(TW.noun),
  () => rnd(TW.adj) + " " + rnd(TW.adj) + " " + rnd(TW.noun),
  () => "No " + rnd(TW.noun),
  () => "The " + rnd(TW.noun),
  () => rnd(TW.noun) + " & " + rnd(TW.noun),
  () => rnd(TW.adj) + " " + rnd(TW.verb),
  () => rnd(TW.adj) + " " + rnd(TW.noun) + " Blues",
  () => rnd(TW.noun) + " Blues",
  () => rnd(TW.noun) + " of " + rnd(TW.noun),
  () => rnd(TW.place) + " " + rnd(TW.noun),
  () => rnd(TW.name) + "'s " + rnd(TW.noun),
  () => rnd(TW.phrase),
  () => "My " + rnd(TW.adj) + " " + rnd(TW.noun),
  () => "I Ain't " + rnd(TW.verb),
  () => "Lord, I'm " + rnd(TW.verb),
  () => "Old " + rnd(TW.noun),
  () => rnd(TW.adj) + " " + rnd(TW.name),
  () => "Devil " + rnd(TW.verb) + " " + rnd(TW.noun),
  () => "When the " + rnd(TW.noun) + " " + rnd(TW.verb),
];

export function genTrackName(): string { return rnd(TPATS)(); }
export function genAlbumName(artistName = ""): string {
  const pats = [
    () => rnd(ANAME.pre) + " " + rnd(ANAME.noun),
    () => rnd(ANAME.noun) + " " + rnd(ANAME.suf),
    () => rnd(ANAME.pre) + " " + rnd(ANAME.noun) + " " + rnd(ANAME.suf),
    () => (artistName ? artistName + "'s " : "") + rnd(ANAME.noun),
  ];
  return rnd(pats)();
}

export function getCareerLabel(fame: number, fans: number, rep: number): string {
  if (fame >= 80 || fans >= 500000) return "Legend";
  if (fame >= 60 || fans >= 100000) return "Headliner";
  if (fame >= 40 || fans >= 30000)  return "Touring Act";
  if (fame >= 25 || fans >= 8000)   return "Regional Name";
  if (fame >= 12 || fans >= 2000)   return "Local Circuit";
  if (rep >= 10)                    return "Bar Regular";
  return "Unknown";
}

// ── GAME STATE TYPES ───────────────────────────────────────
export interface TrackEntry {
  name: string;
  featId?: string;
  quality?: number;
  // ── Songwriting choices (set when track is added). All optional so legacy
  // tracks fall back to "catchy" + "heartfelt" defaults at finish-time. ──
  hook?: HookStyle;
  lyric?: LyricStyle;
  // Co-writer is a feature artist who shaped the song with you (you still sing
  // it). FREE — no fee — but counts toward the feature relationship counter
  // (so 4 co-writes with the same artist still earns the 30% feature discount).
  // Mutually exclusive with `featId` on the same track.
  cowriterId?: string;
}

// ── SONGWRITING: HOOKS ─────────────────────────────────────
// Each track gets a hook style. Hook drives baseline quality, variance, and
// stream multiplier at release. Catchy = reliable mainstream lift. Experimental
// = high variance, high rep ceiling on the hits.
export type HookStyle = "safe" | "catchy" | "experimental";
export interface HookDef {
  id: HookStyle;
  name: string;
  icon: string;
  blurb: string;
  qBonus: number;
  qVariance: number;
  streamMult: number;
  critRepBonus: number;
}
export const HOOKS: HookDef[] = [
  { id:"safe",         name:"Safe",         icon:"🎯", blurb:"Reliable structure, no surprises. Hard to flop.",   qBonus:0, qVariance:1, streamMult:1.03, critRepBonus:0  },
  { id:"catchy",       name:"Catchy",       icon:"🪝", blurb:"Built around the hook. Radio-ready.",                qBonus:3, qVariance:3, streamMult:1.10, critRepBonus:-1 },
  { id:"experimental", name:"Experimental", icon:"🌶️", blurb:"High risk, high reward. Could land or fall flat.",   qBonus:2, qVariance:8, streamMult:0.98, critRepBonus:2  },
];

// ── SONGWRITING: LYRICS ────────────────────────────────────
// Lyric depth steers the album's audience: party = mainstream/streams,
// literary = critic darling/slow burn, heartfelt = balanced.
export type LyricStyle = "party" | "heartfelt" | "literary";
export interface LyricDef {
  id: LyricStyle;
  name: string;
  icon: string;
  blurb: string;
  qBonus: number;
  streamMult: number;
  critRepBonus: number;
  fanMult: number;
}
export const LYRICS: LyricDef[] = [
  { id:"party",     name:"Party",     icon:"🥃", blurb:"Drinking songs, road songs, anthems. Sells.",          qBonus:-1, streamMult:1.08, critRepBonus:-2, fanMult:1.10 },
  { id:"heartfelt", name:"Heartfelt", icon:"💔", blurb:"Earnest. Hits the gut. The country/blues bedrock.",     qBonus:1,  streamMult:1.00, critRepBonus:1,  fanMult:1.00 },
  { id:"literary",  name:"Literary",  icon:"📖", blurb:"Writerly, layered. Press loves these. Slow-burn legacy.", qBonus:2,  streamMult:0.94, critRepBonus:4,  fanMult:0.92 },
];

export function getHook(id?: string): HookDef | undefined { return HOOKS.find(h => h.id === id); }
export function getLyric(id?: string): LyricDef | undefined { return LYRICS.find(l => l.id === id); }

// Per-track writing-quality contribution. Returns a deterministic mean delta
// plus a variance window (caller draws actual roll). Cowriter adds a flat +2.
export function computeTrackWritingQuality(track: TrackEntry): { delta: number; variance: number } {
  // Legacy tracks (from before the songwriting feature) default to the
  // CONSERVATIVE baseline — "safe" hook + "heartfelt" lyric — so old saves
  // don't get a free retroactive quality buff after the feature lands.
  const h = getHook(track.hook ?? "safe");
  const l = getLyric(track.lyric ?? "heartfelt");
  const cw = track.cowriterId ? 1 : 0;
  return {
    delta: (h?.qBonus ?? 0) + (l?.qBonus ?? 0) + cw,
    variance: h?.qVariance ?? 1,
  };
}

// Album-wide release multipliers from the track palette. Averaged across
// tracks so one literary cut on a party album doesn't tank everything.
export function computeAlbumWritingMix(tracks: TrackEntry[]): {
  streamMult: number;
  critRepBonus: number;
  fanMult: number;
  dominantLyric: LyricStyle | null;
  dominantHook: HookStyle | null;
} {
  if (!tracks.length) return { streamMult:1, critRepBonus:0, fanMult:1, dominantLyric:null, dominantHook:null };
  let stream = 0, crit = 0, fan = 0;
  const lyricCount: Record<string, number> = {};
  const hookCount: Record<string, number> = {};
  for (const t of tracks) {
    const hk = getHook(t.hook ?? "safe")!;
    const ly = getLyric(t.lyric ?? "heartfelt")!;
    stream += hk.streamMult * ly.streamMult;
    crit   += hk.critRepBonus + ly.critRepBonus;
    fan    += ly.fanMult;
    lyricCount[ly.id] = (lyricCount[ly.id] ?? 0) + 1;
    hookCount[hk.id]  = (hookCount[hk.id]  ?? 0) + 1;
  }
  const n = tracks.length;
  const dominantLyric = (Object.entries(lyricCount).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? null) as LyricStyle | null;
  const dominantHook  = (Object.entries(hookCount).sort((a,b)=>b[1]-a[1])[0]?.[0]  ?? null) as HookStyle  | null;
  return {
    streamMult: stream / n,
    critRepBonus: Math.round(crit / n),
    fanMult: fan / n,
    dominantLyric,
    dominantHook,
  };
}

// Does this producer's specialty resonate with the track's hook/lyric choices?
// Small per-track quality bonus that adds up across an album.
export function producerStyleBonus(producer: Producer | undefined, track: TrackEntry): number {
  if (!producer) return 0;
  const sp = producer.specialty.toLowerCase();
  let bonus = 0;
  // Commercial / Nashville / radio-shaped producers reward Catchy hooks
  if (track.hook === "catchy" && /nashville|swing|honky|electric|chicago|pop|radio|polished/.test(sp)) bonus += 2;
  // Songwriter / folk / lo-fi / americana producers reward Literary lyrics
  if (track.lyric === "literary" && /songwriter|folk|lo.?fi|tape|warmth|americana|delta|hill|swamp|acoustic/.test(sp)) bonus += 2;
  // Heartfelt cuts always get a small lift from soulful/vocal producers
  if (track.lyric === "heartfelt" && /vocal|soul|arrangement/.test(sp)) bonus += 1;
  // Tier 2-3 elite producers tame Experimental risk (they know how to land it)
  if (track.hook === "experimental" && producer.tier >= 2) bonus += 2;
  return bonus;
}

export interface RecordingProject {
  type: ReleaseType;
  title: string;
  genre: Genre;
  producerId: string;
  studioId: string;
  themeId?: string;
  tracks: TrackEntry[];
  weeksLeft: number;
  totalWeeks: number;
  minTracks: number;
  maxTracks: number;
  marketingBudget: number;
  studioBreakThisWeek?: boolean;
  pushThroughThisWeek?: boolean;
  pushThroughCount?: number;
}

export interface UnreleasedProject {
  id: string;
  type: ReleaseType;
  title: string;
  genre: Genre;
  producerId: string;
  studioId?: string;
  themeId?: string;
  tracks: TrackEntry[];
  avgQuality: number;
  hypeSnapshot: number;
  marketingBudget: number;
}

export interface DiscographyEntry {
  id: string;
  type: ReleaseType;
  title: string;
  genre: Genre;
  themeId?: string;
  tracks: TrackEntry[];
  avgQuality: number;
  outcome: ReleaseOutcome;
  revenue: number;
  fansGained: number;
  fameDelta: number;
  repDelta: number;
  releasedWeek: number;
  peakStreams: number;
  criticHeadline: string;
  lifecycle: SongLifecycle;
  hasMusicVideo: boolean;
}

// ─── ALBUM THEMES ─────────────────────────────────────────
// Players can give a project a thematic identity. Repeated themes
// build a "signature" that gives small recurring bonuses, and the
// Nashville scene cycles through trending themes that boost matching releases.
export interface Theme {
  id: string;
  name: string;
  icon: string;
  blurb: string;
}

export const THEMES: Theme[] = [
  { id:"heartbreak",  name:"Heartbreak",   icon:"💔", blurb:"Lost love, ringless hands, bar-stool ballads." },
  { id:"whiskey",     name:"Whiskey",      icon:"🥃", blurb:"Bottles, neon, late nights and bad decisions." },
  { id:"hometown",    name:"Hometown",     icon:"🏚",  blurb:"Small towns, big feelings, the place that made you." },
  { id:"road",        name:"Road",         icon:"🛣",  blurb:"Highways, motels, and the songs in between." },
  { id:"faith",       name:"Faith",        icon:"✝",  blurb:"Sunday mornings, prayer, redemption hymns." },
  { id:"loss",        name:"Loss",         icon:"🪦", blurb:"Eulogies, empty chairs, songs that hurt to write." },
  { id:"outlaw",      name:"Outlaw",       icon:"🤠", blurb:"Rebels, bad men, and the law one step behind." },
  { id:"workingman",  name:"Working Man",  icon:"🔨", blurb:"Time clocks, calloused hands, blue-collar pride." },
  { id:"love",        name:"Love",         icon:"❤", blurb:"Sweet ones — porch swings, slow dances, vows." },
  { id:"nostalgia",   name:"Nostalgia",    icon:"📻", blurb:"Old radios, dusty pickups, the way it used to be." },
  { id:"redemption",  name:"Redemption",   icon:"🌅", blurb:"Climbing out of the hole. Second chances." },
  { id:"freedom",     name:"Freedom",      icon:"🦅", blurb:"Open roads, untied hands, nobody's boss but the sky." },
];

export function getTheme(id: string | undefined | null): Theme | undefined {
  if (!id) return undefined;
  return THEMES.find(t => t.id === id);
}

export interface SignatureTheme {
  themeId: string;
  theme: Theme;
  count: number;
  tier: 1 | 2 | 3;          // 1=Establishing, 2=Known For, 3=Synonymous With
  label: string;             // human-readable line
  scoreMult: number;         // applied to release score when theme matches
  fanMult: number;           // applied to fan gain when theme matches
}

// Returns the player's dominant theme — only once they've made enough work
// in a single theme for the public to actually associate them with it.
export function getSignatureTheme(themeCounts: Record<string, number> | undefined | null): SignatureTheme | null {
  if (!themeCounts) return null;
  let bestId = ""; let best = 0;
  for (const [id, n] of Object.entries(themeCounts)) {
    if (n > best) { best = n; bestId = id; }
  }
  if (!bestId || best < 3) return null;
  const theme = getTheme(bestId);
  if (!theme) return null;
  if (best >= 12) return { themeId:bestId, theme, count:best, tier:3,
    label:`Synonymous with ${theme.name.toLowerCase()} songs`,
    scoreMult:1.18, fanMult:1.15 };
  if (best >= 6)  return { themeId:bestId, theme, count:best, tier:2,
    label:`Known for ${theme.name.toLowerCase()} songs`,
    scoreMult:1.10, fanMult:1.07 };
  return { themeId:bestId, theme, count:best, tier:1,
    label:`Building a reputation for ${theme.name.toLowerCase()} songs`,
    scoreMult:1.05, fanMult:1.03 };
}

// Trend theme bonus when the release theme matches what's hot in Nashville right now.
export const TREND_THEME_SCORE_MULT = 1.12;
export const TREND_THEME_FAN_MULT   = 1.08;

// Pick a new trending theme that isn't the same as the current one, when possible.
export function pickTrendTheme(current: string | null | undefined): string {
  const pool = THEMES.map(t => t.id).filter(id => id !== current);
  return pool[Math.floor(Math.random() * pool.length)];
}

export interface CatalogEntry {
  id: string;
  title: string;
  type: ReleaseType;
  genre: Genre;
  quality: number;
  outcome: ReleaseOutcome;
  lifecycle: SongLifecycle;
  decayRate: number;
  streamFloor: number;
  weeklyStreams: number;
  peakStreams: number;
  totalStreams: number;
  releasedWeek: number;
  weeksActive: number;
  promoted: boolean;
  comebackCooldown: number;
  tracks: TrackEntry[];
  hasMusicVideo: boolean;
  // ── Streaming v2.0 tracking ──
  platformMix?: Record<string, number>;
  geoDist?: Record<string, number>;
  premiumRatio?: number;
  effectiveRate?: number;
  lifetimeRevenue?: number;
  weeklyRevenue?: number;
  revenueHistory?: number[];
  streamStats?: {
    totalStreams: number;
    weeklyStreams: number;
    peakStreams: number;
    totalRevenue: number;
    weeklyRevenue: number;
    platformBreakdown: Record<string, number>;
    geoBreakdown: Record<string, number>;
    effectiveRate: number;
    premiumRatio: number;
    usShare: number;
    hitThreshold: boolean;
    revenueHistory: number[];
  };
}

export interface TourStop {
  cityName: string;
  venueName: string;
  venueCap: number;
  venueCost: number;
  venueTier: number;
  travelCost: number;
  region: string;
  genreMod: Record<string, number>;
}

export interface ActiveTour {
  shows: TourStop[];
  progress: number;
  ticketMult: number;
  demandDecayIndex: number;
}

export interface ShowResult {
  week: number;
  cityName: string;
  venueName: string;
  venueCap: number;
  seats: number;
  attendancePct: number;
  ticket: number;
  gross: number;
  crew: number;
  travelCost: number;
  labelCut: number;
  net: number;
}

export interface ActiveBrandDeal {
  id: string; name: string; weeklyIncome: number; weeksLeft: number;
}

export interface LogEntry {
  week: number; msg: string; type: "good" | "bad" | "great" | "neutral";
}

export interface CriticReview {
  week: number; headline: string; title: string; score: number;
}

export interface PendingEvent {
  msg: string; type: string;
}

export interface ModalData {
  title: string;
  body: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  cancelLabel?: string;
}

// ── BURNOUT (#3) ───────────────────────────────────────────
// A persistent stress meter, distinct from per-action `energy`. It accumulates
// from intense weeks (back-to-back shows, recording crunches, heavy press) and
// only meaningfully recovers on rest weeks or by taking a Vacation. Crossing
// tiers has cascading consequences: quality dings, show fill drops, scandal
// risk, and at the top, forced cancellations.
export interface BurnoutTier {
  min: number;
  label: string;
  color: "sage" | "amber" | "rust";
  desc: string;
}
export const BURNOUT_TIERS: BurnoutTier[] = [
  { min: 0,  label: "Steady",       color: "sage",  desc: "You feel solid. Days flow easy." },
  { min: 30, label: "Tired",        color: "amber", desc: "The grind is starting to show. Sleep is shorter." },
  { min: 50, label: "Worn down",    color: "amber", desc: "Recordings feel like work. Shows feel longer." },
  { min: 70, label: "Burning out",  color: "rust",  desc: "Cancellations creeping in. People are starting to notice." },
  { min: 88, label: "Crisis",       color: "rust",  desc: "Body and mind say stop. Right now." },
];

export function getBurnoutTier(b: number) {
  let chosen = BURNOUT_TIERS[0];
  for (const t of BURNOUT_TIERS) if (b >= t.min) chosen = t;
  return chosen;
}
export function burnoutQualityPenalty(b: number): number {
  if (b >= 88) return -8;
  if (b >= 70) return -5;
  if (b >= 50) return -3;
  if (b >= 30) return -1;
  return 0;
}
export function burnoutShowMult(b: number): number {
  if (b >= 88) return 0.55;
  if (b >= 70) return 0.78;
  if (b >= 50) return 0.90;
  return 1.0;
}
export function burnoutCancelChance(b: number): number {
  if (b >= 88) return 0.32;
  if (b >= 70) return 0.12;
  if (b >= 50) return 0.04;
  return 0;
}
export function burnoutScandalMult(b: number): number {
  if (b >= 88) return 1.7;
  if (b >= 70) return 1.4;
  if (b >= 50) return 1.15;
  return 1.0;
}

// ── RIVALS (#4) ────────────────────────────────────────────
// Other artists running their own careers in parallel. They release, tour,
// chart, win awards, and have opinions about you. Some hostile, some friendly,
// some indifferent. The Nashville Times reports on them. A good chart battle
// against a friendly rival is fun; against a hostile one, it's war.
export interface RivalArtist {
  id: string;
  name: string;
  archetype: string;
  genre: Genre;
  personality: "friendly" | "neutral" | "competitive" | "hostile";
  bio: string;
  // Starting numbers (rival.fame = clamp(player.fame + offset, 0..100))
  startFameOffset: number;
  startFans: number;
  // Bias for their releases — affects average quality of rival drops
  craftBias: number; // -8..+8 added to rival release quality roll
}

export const RIVALS: RivalArtist[] = [
  { id:"jolene_marie", name:"Jolene Marie", archetype:"Country Legend",
    genre:"Country", personality:"friendly",
    bio:"Three Grammys, twenty years in. Holds court at the Bluebird every Tuesday. If she likes you, doors open.",
    startFameOffset:+30, startFans:140000, craftBias:+5 },
  { id:"cole_whitaker", name:"Cole Whitaker", archetype:"Bro-Country Heir",
    genre:"Country", personality:"competitive",
    bio:"Trucks, beer, blondes — hits all the buttons. Major-label money behind him. Sees you as the problem.",
    startFameOffset:+12, startFans:75000, craftBias:-1 },
  { id:"reverend_sims", name:"Reverend Sims", archetype:"Delta Patriarch",
    genre:"Blues", personality:"neutral",
    bio:"Born in Clarksdale. Plays a 1947 National. Doesn't post. Critics genuflect.",
    startFameOffset:+18, startFans:48000, craftBias:+6 },
  { id:"ruby_cain", name:"Ruby Cain", archetype:"Crossover Climber",
    genre:"Blues", personality:"competitive",
    bio:"Country-blues hybrid sound, Calvin Klein in her captions. Hungry. Strategic. Always one step ahead.",
    startFameOffset:+2, startFans:38000, craftBias:+1 },
  { id:"jake_holloway", name:"Jake Holloway", archetype:"Roadhouse Disciple",
    genre:"Country", personality:"hostile",
    bio:"Plays 200 shows a year. Hates streaming, hates labels, hates anyone with more buzz than him. Especially you.",
    startFameOffset:-6, startFans:18000, craftBias:0 },
];

export interface RivalState {
  id: string;
  fame: number;
  fans: number;
  rep: number;
  relationship: number;     // -100..+100 with player
  weeksSinceRelease: number;
  releasesCount: number;
  lastReleaseTitle: string | null;
  lastReleaseQuality: number;
  lastReleaseWeek: number;
  awardsWon: number;
  beefHeat: number;         // 0..100, high = active feud
}

const RIVAL_TITLES_COUNTRY = [
  "Backroad Hymn","Tin Roof Sundays","Whiskey Hours","The Long Drive Home","Empty Pew",
  "Diesel Heart","Last Call Lullaby","Rosebush Lane","Cold Truck Ignition","Blue Ridge Letter",
  "Honest Liar","Two-Lane Sermon","Cottonwood Cathedral","Nashville Goodbye","Half a Hallelujah",
];
const RIVAL_TITLES_BLUES = [
  "Crow Black Morning","Train Out of Tupelo","Levee at Dusk","Mississippi Echo","Six-String Sermon",
  "Bottle Tree Boogie","Shotgun Shack","Devil at the Crossroads","Lonesome County Line","Catfish Holler",
  "Walking Stick","Front Porch Devil","Burnt Pine Blues","Howlin' at Noon","Last Cigarette",
];
export function pickRivalTitle(genre: Genre, rng: () => number): string {
  const pool = genre === "Blues" ? RIVAL_TITLES_BLUES : RIVAL_TITLES_COUNTRY;
  return pool[Math.floor(rng() * pool.length)];
}

// ── MULTI-WEEK STORY ARCS (#5) ─────────────────────────────
// Branching narratives spanning multiple weeks. Each step pops a choice modal
// when its `fireOnWeek` arrives; the choice picks the next step (or ends the
// arc) and applies effects. Steps can also have passive weekly effects while
// they're "ticking down." Triggers fire arcs based on game state milestones.
export interface ArcChoice {
  label: string;
  sub: string;
  result: string;
  effect: ScenarioEffect;
  // Where to go after this choice. If undefined → end the arc cleanly.
  // -1 also means end. Otherwise a step index.
  nextStep?: number;
  // Optional weekly delay before next step fires (default 1).
  delay?: number;
  // Optional: arc-final flag for narration
  finale?: boolean;
  // Optional inline RNG roll. If present, the resolver picks success/fail and
  // overrides `result` / `effect` accordingly. Used for arc finales like
  // "Hear the verdict" where the outcome is decided at choice-time.
  roll?: {
    chance: number; // 0..1 success probability
    onSuccess: ScenarioEffect;
    onFail: ScenarioEffect;
    successResult: string;
    failResult: string;
  };
}
export interface ArcStep {
  emoji: string;
  title: string;
  body: string;
  // Default weekly delay before this step fires after spawning / previous step.
  delay: number;
  // Passive weekly effect while this step is pending (per week, applied during arc tick).
  passive?: ScenarioEffect;
  // Choices for this step. Empty array → narration-only auto-advance to nextStep.
  choices: ArcChoice[];
  // For narration-only steps, where to go next (default: end).
  autoNext?: number;
}
export interface StoryArc {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  trigger?: {
    minFame?: number; maxFame?: number;
    minReleases?: number; minRep?: number;
    minBurnout?: number; minWeek?: number;
    hasManager?: boolean; hasEvergreen?: boolean;
  };
  weight: number;
  steps: ArcStep[];
}
export interface ArcInstance {
  arcId: string;
  startedWeek: number;
  currentStep: number; // -1 = complete
  fireOnWeek: number;
  choicePath: string[]; // "stepIdx:choiceIdx" entries — richer than raw indices for debugging/replay
}

export const STORY_ARCS: StoryArc[] = [
  // ── ARC 1: The Manager's Lawsuit ─────────────────────────
  { id:"managers_lawsuit", title:"The Manager's Lawsuit", subtitle:"An old contract comes back",
    emoji:"⚖️", weight:5,
    trigger:{ hasManager:true, minRep:25, minWeek:30 },
    steps:[
      { emoji:"📨", title:"The Letter", delay:1,
        body:"A certified envelope. Your old manager — the one who hustled for you when nobody else would, then disappeared during the rough year — is suing you for back commissions on every dollar earned since the split. His lawyer's name is on the letterhead. It's real.",
        choices:[
          { label:"Settle quietly. Pay him out.", sub:"$5,000 · Story dies. Rep holds.",
            result:"You sent the check Monday. By Friday his lawyer had filed the dismissal. Nobody outside the lawyers ever heard about it.",
            effect:{ money:-5000, rep:+1 }, nextStep:-1, finale:true },
          { label:"Fight it. Get your own lawyer.", sub:"$2,500 retainer · 4 weeks in court · risky verdict.",
            result:"You hired Marsha Coleman, the entertainment attorney everyone whispers about. She read the contract, raised an eyebrow, and said \"we have a case.\" Court date set.",
            effect:{ money:-2500 }, nextStep:1, delay:4 },
          { label:"Ignore it. Bluff that he won't follow through.", sub:"Risky — could escalate fast.",
            result:"You shoved the letter in a drawer and went on with your week. The drawer is heavier than it looks.",
            effect:{}, nextStep:2, delay:2 },
        ] },
      { emoji:"⚖️", title:"The Verdict", delay:4,
        passive:{ energy:-5 },
        body:"Four weeks of depositions, hostile texts dredged up, your old voicemails read aloud. Today the judge rules. Marsha says it's 60/40 your way but warns you: judges are mortals.",
        choices:[
          { label:"Hear the verdict.", sub:"65% chance you walk clean. 35% chance you owe big.",
            result:"The judge ruled.",
            effect:{},
            roll:{
              chance:0.65,
              successResult:"Marsha was right. The judge ruled in your favor — contract void, no commissions owed. You walked out into the daylight a free woman.",
              failResult:"The judge sided with him. You owe back commissions plus his legal fees. Marsha said \"I'm sorry\" and meant it.",
              onSuccess:{ rep:+4, fame:+2 },
              onFail:{ money:-18000, rep:-3, burnout:+8 },
            },
            nextStep:-1, finale:true },
        ] },
      { emoji:"📰", title:"The Story Breaks", delay:2,
        body:"You ignored him. He went to a music industry blog. Now there's a 3,000-word piece running tomorrow titled \"The Star Who Forgot Who Made Them.\" Your phone won't stop.",
        choices:[
          { label:"Settle now — pay double to make it go away.", sub:"$12,000 · Story partially buried.",
            result:"You paid. The piece ran shorter and softer. Damage controlled, but the bruise is there.",
            effect:{ money:-12000, rep:-4, fame:+2 }, nextStep:-1, finale:true },
          { label:"Counter-sue for defamation.", sub:"$8,000 · Roll the dice. Could vindicate you or end you.",
            result:"You went on the offensive.",
            effect:{ money:-8000 }, nextStep:1, delay:4 },
          { label:"Let the story run. Address it on stage.", sub:"No money. Big rep gamble.",
            result:"At Friday's show you talked about it. Honest. Raw. The crowd listened. The internet split.",
            effect:{ rep:-3, hype:+15, fame:+3 }, nextStep:-1, finale:true },
        ] },
    ] },

  // ── ARC 2: The Documentary Crew ──────────────────────────
  { id:"documentary", title:"The Documentary Crew", subtitle:"Cameras follow you for weeks",
    emoji:"🎬", weight:4,
    trigger:{ minFame:25, minReleases:1, minWeek:25 },
    steps:[
      { emoji:"🎥", title:"The Pitch", delay:1,
        body:"Two filmmakers in the green room — they made the well-reviewed Sturgill doc. They want six weeks of access: studio, road, kitchen table, hard conversations. Distribution is loosely lined up. They're asking for your trust.",
        choices:[
          { label:"Full access. No editorial control.", sub:"Trust them. Could be career-defining or disastrous.",
            result:"You signed the release. The cameras started Monday. They're already in your house.",
            effect:{ rep:+2 }, nextStep:1, delay:3 },
          { label:"Limited access. Studio only, no personal life.", sub:"Safer. Smaller payoff.",
            result:"You drew lines. They were polite about it. The doc will exist but feel managed.",
            effect:{}, nextStep:3, delay:5 },
          { label:"Pass. You don't need this.", sub:"Walk away clean.",
            result:"You said no. They were disappointed but professional. You went back to work.",
            effect:{ rep:+1 }, nextStep:-1, finale:true },
        ] },
      { emoji:"😬", title:"The Argument On Camera", delay:3,
        passive:{ energy:-3 },
        body:"They got your worst day on tape. A real argument with someone who matters. The director showed you the rough cut. It's powerful. It's also brutal. They're asking your blessing.",
        choices:[
          { label:"Let them use it. The truth is the truth.", sub:"Big risk. Big reward.",
            result:"You signed off. The honesty will land hard either way.",
            effect:{ rep:-2 }, nextStep:2, delay:3 },
          { label:"Threaten lawsuit if they include it.", sub:"They'll comply. Trust evaporates.",
            result:"They cut the scene. The rest of the doc went smaller after that.",
            effect:{ rep:-1, fame:-3 }, nextStep:-1, finale:true },
          { label:"Pay for an exclusive cut they keep.", sub:"$15,000 · Erases the moment.",
            result:"You wrote the check. The footage went into a drawer somewhere. You both pretended it was fine.",
            effect:{ money:-15000 }, nextStep:2, delay:3, finale:false },
        ] },
      { emoji:"🎞️", title:"Premiere Week", delay:4,
        body:"The doc premiered Thursday at SXSW. Reviews are starting to land. Your phone is buzzing in two directions at once.",
        choices:[
          { label:"See how it lands.", sub:"Reviews are 60/40 your way. Big if it works.",
            result:"The reviews came in.",
            effect:{},
            roll:{
              chance:0.60,
              successResult:"It landed. Variety called it \"the rare music doc that earns its honesty.\" The phone is ringing in three time zones.",
              failResult:"Reviews were mixed at best. Pitchfork called it \"a portrait that flatters its subject.\" The buzz fizzled in a week.",
              onSuccess:{ fame:+12, fans:+3500, rep:+6, hype:+25 },
              onFail:{ fame:+2, fans:+400, rep:-2, hype:+5 },
            },
            nextStep:-1, finale:true },
        ] },
      { emoji:"🎞️", title:"The Quieter Cut", delay:2,
        body:"The limited-access version premiered. Polite reviews. \"Solid musician portrait\" — solid being a word reviewers use when they have nothing better to say.",
        choices:[
          { label:"Take what you can.", sub:"Modest bump.",
            result:"It got 80,000 views. Good for the catalog. Not earth-shaking.",
            effect:{ fame:+3, fans:+800, hype:+8 }, nextStep:-1, finale:true },
        ] },
    ] },

  // ── ARC 3: The Sync Opportunity ──────────────────────────
  { id:"sync_deal", title:"The Sync Opportunity", subtitle:"Hollywood wants your song",
    emoji:"🎬", weight:5,
    trigger:{ hasEvergreen:true, minWeek:20 },
    steps:[
      { emoji:"📞", title:"The Call", delay:1,
        body:"A music supervisor for a Western film phoned. They want your evergreen track for the trailer. Wide release, big director, theaters everywhere. Standard offer: $15,000 flat, no points.",
        choices:[
          { label:"Take the flat fee. Cash now.", sub:"$15,000 · Streams will spike when the trailer drops.",
            result:"Deal signed Tuesday. Trailer drops in three weeks. Cash is in escrow.",
            effect:{ money:+15000 }, nextStep:2, delay:3 },
          { label:"Counter for back-end points.", sub:"Aggressive — could pay 3× or kill the deal.",
            result:"You sent the counter through your lawyer. They said \"interesting.\" Now you wait.",
            effect:{}, nextStep:1, delay:2 },
          { label:"Refuse — you don't license to studios.", sub:"Pure principle play. Rep gain.",
            result:"You declined politely. Your publicist will spin it as integrity. It might be.",
            effect:{ rep:+5 }, nextStep:-1, finale:true },
        ] },
      { emoji:"💼", title:"The Negotiation", delay:2,
        body:"The supervisor came back. He wants to know if you'll close at $25K + 0.5 points of trailer-attributed streams. His tone says it's the final offer.",
        choices:[
          { label:"Accept the back-end deal.", sub:"50/50 — could be huge or could go nowhere.",
            result:"Signed. The check cleared and the trailer drops in three weeks.",
            effect:{ money:+25000 }, nextStep:2, delay:3 },
          { label:"Hold firm at original counter.", sub:"He walks. Deal dies.",
            result:"He said \"sorry, no\" and hung up gracefully. The deal is dead.",
            effect:{ rep:-1 }, nextStep:-1, finale:true },
        ] },
      { emoji:"🎞️", title:"Trailer Drops", delay:3,
        body:"The trailer dropped at midnight. Your song is 90 seconds in, behind a slow-motion horse and a man with a gun. The internet is reacting.",
        choices:[
          { label:"See the numbers.", sub:"The streaming bump hits.",
            result:"Streams of the licensed song doubled overnight. New listeners poured in.",
            effect:{ fans:+2200, fame:+5, hype:+18 }, nextStep:-1, finale:true },
        ] },
    ] },

  // ── ARC 4: The Comeback Story ────────────────────────────
  { id:"comeback", title:"The Comeback Story", subtitle:"Climbing back from the wall",
    emoji:"🌅", weight:4,
    trigger:{ minBurnout:65, minWeek:35 },
    steps:[
      { emoji:"🗞️", title:"The \"What Happened\" Piece", delay:1,
        body:"A respected long-form journalist wants to write the comeback piece — assuming you're coming back. Honest interview. Six months of access. She's done this for three other artists; two of them rebuilt careers, one didn't.",
        choices:[
          { label:"Sit down. Be honest.", sub:"Vulnerable. Could be powerful.",
            result:"You talked for four hours. About the burnout. About what broke. She listened.",
            effect:{ rep:+3 }, nextStep:1, delay:3 },
          { label:"Sit down, but spin it.", sub:"Safer. Less rewarding.",
            result:"You hit your talking points. She wrote the piece anyway.",
            effect:{ rep:-1, fame:+2 }, nextStep:2, delay:3 },
          { label:"Refuse the interview.", sub:"Quiet rebuild. No narrative help.",
            result:"You told her not yet. She said she understood. Maybe.",
            effect:{}, nextStep:-1, finale:true },
        ] },
      { emoji:"🎤", title:"First Show Back", delay:3,
        passive:{ energy:-2 },
        body:"Small room. 200 seats. Sold out, partly out of curiosity. You're sober, you're ready, and you're terrified.",
        choices:[
          { label:"Play the old hits straight.", sub:"Safe set. Crowd gets what they want.",
            result:"You played the catalog. The room was warm. You felt the floor again.",
            effect:{ fans:+400, hype:+10, energy:-10 }, nextStep:-1, finale:true },
          { label:"Open with the new song about hitting bottom.", sub:"All-or-nothing. Could anchor the comeback.",
            result:"Dead silence for the first verse. By the chorus, every phone was up. Three reviews already.",
            effect:{ fame:+6, fans:+1200, rep:+5, hype:+22, energy:-15 }, nextStep:-1, finale:true },
        ] },
      { emoji:"📰", title:"The Piece Runs", delay:3,
        body:"The article published. \"How [you] Found Their Way Back\" — 8,000 words. The headline alone is being shared.",
        choices:[
          { label:"Read it.", sub:"Narrative redemption.",
            result:"It's the best thing anyone's written about you. Sympathetic, smart, true. The phone is ringing differently now.",
            effect:{ fame:+8, fans:+1800, rep:+8, hype:+15 }, nextStep:-1, finale:true },
        ] },
    ] },
];

export function getStoryArc(id: string): StoryArc | undefined {
  return STORY_ARCS.find(a => a.id === id);
}

export interface GameState {
  screen: GameScreen;
  hasSave: boolean;
  // player
  artistName: string;
  genre: Genre;
  city: string;
  archetype: string;
  week: number;
  money: number;
  fans: number;
  // Subset of `fans` who are deeply loyal — they don't churn from inactivity,
  // they buy MUCH more merch, and they reliably show up to tour stops in their
  // region. Casual fans = fans - superfans. Always satisfies superfans <= fans
  // (clamped at the end of every advance() call).
  superfans: number;
  fame: number;
  rep: number;
  energy: number;
  hype: number;
  qualityBase: number;
  // streaming
  catalog: CatalogEntry[];
  totalStreams: number;
  streamHistory: number[];
  peakWeeklyStreams: number;
  // market saturation
  marketSaturation: number;
  // economy
  weeklyExpenses: number;
  totalEarned: number;
  // releases
  project: RecordingProject | null;
  unreleased: UnreleasedProject[];
  discography: DiscographyEntry[];
  totalReleases: number;
  weeksSinceRelease: number;
  // charts
  chartPosition: number | null;
  peakChart: number | null;
  // touring
  tourQueue: TourStop[];
  tourActive: ActiveTour | null;
  tourVenue: number;
  tourTicketMult: number;
  tourFatigue: number;
  totalShows: number;
  tourHistory: ShowResult[];
  regional: Record<string, number>;
  // meta
  cooldowns: Record<string, number>;
  trends: Record<string, number>;
  // Album-theme identity system
  themeCounts: Record<string, number>;
  currentTrendTheme: string | null;
  // Producer relationships (count of completed projects with each producer id)
  producerWorkCounts: Record<string, number>;
  // Active label / manager contracts (null when unsigned)
  currentLabel: SignedLabel | null;
  currentManager: SignedManager | null;
  // Pending offers waiting for player decision (queued from pitch attempts)
  pendingLabelOffers: LabelOffer[];
  pendingManagerOffers: ManagerOffer[];
  // Feature artists — inbound requests asking YOU to guest, plus history & relationships
  pendingFeatureRequests: FeatureRequest[];
  guestCredits: GuestCredit[];
  featureWorkCounts: Record<string, number>;
  log: LogEntry[];
  // flags
  hasManager: boolean;
  labelSigned: boolean;
  activeBrandDeals: ActiveBrandDeal[];
  awardsWon: string[];
  playlistBoost: number;
  criticReviews: CriticReview[];
  revenueHistory: Record<string, { week: number; streams: number; income: number }[]>;
  // notifications
  pendingEvent: PendingEvent | null;
  modal: ModalData | null;
  releasePresentation: ReleasePresentation | null;
  tourWrapPresentation: TourWrapPresentation | null;
  signingPresentation: SigningPresentation | null;
  awardPresentation: AwardPresentation | null;
  milestonePresentation: CareerMilestonePresentation | null;
  lastCareerTierIdx: number;
  pendingScenarioId: string | null;
  pendingNewspaperJson: string | null;
  newspaperArchive: string[];
  // merch
  merchShop: MerchItem[];
  totalMerchRevenue: number;
  pendingPressing: { releaseId: string; releaseTitle: string; releaseType: ReleaseType } | null;
  // ── #3 Burnout — persistent stress meter (see BURNOUT_TIERS) ──
  burnout: number;
  vacationCooldown: number; // weeks until you can take another vacation
  // ── #4 Rivals — parallel-career artists in the scene ──
  rivals: RivalState[];
  // ── #5 Multi-week story arcs — branching narratives spanning weeks ──
  activeArcs: ArcInstance[];
  completedArcs: string[]; // arc ids that already played out (don't re-fire)
  pendingArcChoice: { arcId: string; stepIndex: number } | null;
  // game over
  gameOverReason?: string;
  // ── Streaming v2.0 platform/geographic tracking ──
  platformMix: Record<string, number>;
  geoDist: Record<string, number>;
  premiumRatio: number;
}

export const INITIAL_STATE: GameState = {
  screen: "menu",
  hasSave: false,
  artistName: "",
  genre: "Country",
  city: "Nashville, TN",
  archetype: "outlaw",
  week: 1,
  money: 1500,
  fans: 0,
  superfans: 0,
  fame: 0,
  rep: 0,
  energy: 100,
  hype: 0,
  qualityBase: 35,
  catalog: [],
  totalStreams: 0,
  streamHistory: [],
  peakWeeklyStreams: 0,
  marketSaturation: 0,
  weeklyExpenses: 100,
  totalEarned: 0,
  project: null,
  unreleased: [],
  discography: [],
  totalReleases: 0,
  weeksSinceRelease: 99,
  chartPosition: null,
  peakChart: null,
  tourQueue: [],
  tourActive: null,
  tourVenue: 1,
  tourTicketMult: 1.0,
  tourFatigue: 0,
  totalShows: 0,
  tourHistory: [],
  regional: {},
  cooldowns: {},
  trends: { Country: 1.0, Blues: 1.0 },
  themeCounts: {},
  currentTrendTheme: "heartbreak",
  producerWorkCounts: {},
  currentLabel: null,
  currentManager: null,
  pendingLabelOffers: [],
  pendingManagerOffers: [],
  pendingFeatureRequests: [],
  guestCredits: [],
  featureWorkCounts: {},
  log: [],
  hasManager: false,
  labelSigned: false,
  activeBrandDeals: [],
  awardsWon: [],
  playlistBoost: 0,
  criticReviews: [],
  revenueHistory: {},
  pendingEvent: null,
  modal: null,
  releasePresentation: null,
  tourWrapPresentation: null,
  signingPresentation: null,
  awardPresentation: null,
  milestonePresentation: null,
  lastCareerTierIdx: 0,
  pendingScenarioId: null,
  pendingNewspaperJson: null,
  newspaperArchive: [],
  merchShop: [],
  totalMerchRevenue: 0,
  pendingPressing: null,
  burnout: 0,
  vacationCooldown: 0,
  rivals: [],
  activeArcs: [],
  completedArcs: [],
  pendingArcChoice: null,
  // ── Streaming v2.0 defaults ──
  platformMix: { spotify: 0.52, apple: 0.22, amazon: 0.12, youtube: 0.09, tidal: 0.02, deezer: 0.02, pandora: 0.01 },
  geoDist: { US: 0.62, UK: 0.08, CA: 0.05, DE: 0.03, AU: 0.02, FR: 0.02, BR: 0.03, MX: 0.02, IN: 0.01, other: 0.12 },
  premiumRatio: 0.45,
};

// ── CHART DATA (for StreamingTab) ──────────────────────────
const CHART_ARTISTS = [
  {name:"Morgan Wallen",    songs:["Last Night","You Proof","Thought You Should Know","One Thing at a Time","Sand in My Boots"],           tier:3},
  {name:"Luke Combs",       songs:["Fast Car","Beautiful Crazy","When It Rains It Pours","Beer Never Broke My Heart","Doin' This"],         tier:3},
  {name:"Zach Bryan",       songs:["Something in the Orange","I Remember Everything","Open the Gate","Heading South","Heavy Eyes"],          tier:3},
  {name:"Chris Stapleton",  songs:["Tennessee Whiskey","Starting Over","Joy of My Life","White Horse","Broken Halos"],                      tier:3},
  {name:"Lainey Wilson",    songs:["Heart Like a Truck","Things a Man Oughta Know","Watermelon Moonshine","Grease","Hang Tight Honey"],      tier:3},
  {name:"Beyoncé",          songs:["Texas Hold 'Em","16 Carriages","Jolene","Cowboy Carter","Sweet Honey Buckiin"],                         tier:3},
  {name:"Kacey Musgraves",  songs:["Rainbow","Golden Hour","Butterflies","Happy & Sad","Slow Burn"],                                        tier:2},
  {name:"Tyler Childers",   songs:["In Your Love","Lady May","Feathered Indians","White House Road","Nose on the Grindstone"],               tier:2},
  {name:"Waxahatchee",      songs:["Right Back to It","Burns Out at Midnight","You're Still Here","St. Cloud","Sparks Fly"],                 tier:2},
  {name:"Sierra Ferrell",   songs:["Jeremiah","Lucky","Dollar Bill Bar","Silver Dollar","Bells of Every Chapel"],                           tier:2},
  {name:"Robert Cray",      songs:["Smoking Gun","Nothin But a Woman","Right Next Door","Strong Persuader","I Guess I Showed Her"],          tier:2},
  {name:"Gary Clark Jr.",   songs:["This Land","Bright Lights","When My Train Pulls In","Grinder","Don't Owe You a Thang"],                  tier:2},
  {name:"Joe Bonamassa",    songs:["Different Shades of Blue","Dust Bowl","Hummingbird","So It's Like That","You Better Watch Yourself"],    tier:1},
  {name:"Charley Crockett", songs:["Lil' Darlin","I'm Just a Clown","Jamestown Ferry","5 Leaf Clover","Welcome to Hard Times"],             tier:1},
  {name:"Amythyst Kiah",    songs:["Black Myself","Wild Turkey","Hangover Blues","Fancy Digs","Gilded"],                                    tier:1},
  {name:"Yola",             songs:["Stand for Myself","Diamond Studded Shoes","Lonely Tonight","Dancing Away in Tears","Faraway Look"],      tier:1},
  {name:"Jimmie Allen",     songs:["Best Shot","Make Me Want To","Freedom Was a Highway","This Is Us","Down Home"],                          tier:1},
  {name:"Ingrid Andress",   songs:["More Hearts Than Mine","Waste of Tears","Lady Like","Wishful Drinking","The Knife"],                     tier:1},
  {name:"Hailey Whitters",  songs:["Ten Year Town","Boys Back Home","Everything She Ain't","Country Music Made Me","Fillin' My Cup"],        tier:1},
  {name:"Flatland Cavalry", songs:["She Loves Me Like Jesus Does","Humble Rodeo","A Life Where We Work Out","Losing Lois","Come Back Down"],tier:1},
];

export interface ChartEntry {
  pos: number; title: string; artist: string; streams: number;
  isMe: boolean; id?: string; lifecycle?: SongLifecycle;
}

export function buildChart(catalog: CatalogEntry[], week: number): ChartEntry[] {
  const entries: ChartEntry[] = [];
  // Generate 100 chart songs from real artists
  const seen = new Set<string>();
  for (let i = 0; i < 200 && entries.length < 95; i++) {
    const a = CHART_ARTISTS[Math.floor(Math.random() * CHART_ARTISTS.length)];
    const song = a.songs[Math.floor(Math.random() * a.songs.length)];
    const key = a.name + "|" + song;
    if (seen.has(key)) continue;
    seen.add(key);
    const base = a.tier === 3 ? roll(5000000, 18000000) : a.tier === 2 ? roll(800000, 5000000) : roll(80000, 800000);
    const wobble = 0.7 + Math.sin(week * 0.37 + entries.length * 1.1) * 0.3;
    entries.push({ pos: 0, title: song, artist: a.name, streams: Math.floor(base * wobble), isMe: false });
  }
  // Insert my songs
  catalog.forEach(c => {
    if (c.weeklyStreams > 0) {
      entries.push({ pos: 0, title: c.title, artist: "You", streams: c.weeklyStreams, isMe: true, id: c.id, lifecycle: c.lifecycle });
    }
  });
  // Sort descending
  entries.sort((a, b) => b.streams - a.streams);
  entries.forEach((e, i) => e.pos = i + 1);
  return entries.slice(0, 100);
}
