import wordData from "@/data/words.json";
import type { WordEntry } from "@/types/game";
import type { IconName } from "@/components/ui/Icon";
import { normalizeCategory } from "@/lib/game/words";

/**
 * Editorial layer over `src/data/words.json`. The raw file is just
 * `{ word, topic, category }` rows; this module groups them by pack and adds
 * the hand-written intro / strategy / sample-round copy that the public
 * `/packs` pages render. Keeping it in one file means the pack list, the pack
 * pages, and the sitemap never disagree about what exists.
 */

export interface PackEditorial {
  /** One or two sentences describing the flavour of the pack. */
  intro: string;
  /** How the crew should pitch clues for this pack. */
  crewTip: string;
  /** How the impostor should bluff when they only see the pack name. */
  impostorTip: string;
  /** A worked example round using a real word from the pack. */
  sampleRound: {
    word: string;
    crewClues: string[];
    impostorClue: string;
    tell: string;
  };
}

export type PackTone = "brand" | "heat" | "cream" | "surface";

export interface Pack extends PackEditorial {
  slug: string;
  name: string;
  /** True when every word in the pack is behind Imposter+. */
  premium: boolean;
  words: { word: string; topic: string }[];
  /** Distinct sub-themes ("Ocean Animals", "Big Cats", …) inside the pack. */
  themes: string[];
  /** Icon + colour for the pack's tile, matching the home page pack grid. */
  icon: IconName;
  tone: PackTone;
}

export function slugifyPack(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Tile icon per pack. Falls back to `dice` for anything unmapped. */
const PACK_ICON: Record<string, IconName> = {
  animals: "eye",
  food: "flame",
  sports: "trophy",
  movies: "play",
  places: "globe",
  "household-items": "chair",
  nature: "flame",
  technology: "bolt",
  music: "bolt",
  vehicles: "send",
  clothing: "shield",
  jobs: "users",
  games: "dice",
  "body-parts": "eye",
  drinks: "flame",
  "kitchen-tools": "chair",
  "school-supplies": "chat",
  toys: "star",
  "at-the-beach": "globe",
  camping: "flame",
  tools: "bolt",
  "in-the-garden": "flame",
  "birthday-party": "star",
  space: "star",
  insects: "eye",
  birds: "eye",
  fruit: "flame",
  "tv-shows": "play",
  "video-game-worlds": "dice",
  superheroes: "shield",
  "cartoon-characters": "chat",
  "world-landmarks": "globe",
  countries: "globe",
  "world-cities": "globe",
  "mythical-creatures": "ghost",
  "fairy-tales": "star",
  dinosaurs: "target",
  "pizza-toppings": "flame",
  "ice-cream-flavors": "star",
  "tabletop-games": "dice",
  candy: "star",
  halloween: "ghost",
  pirates: "ghost",
  circus: "crown",
};

const TONE_CYCLE: PackTone[] = ["brand", "heat", "cream", "surface"];

export const PACK_TILE_TONE: Record<PackTone, string> = {
  brand: "bg-brand text-brand-ink",
  heat: "bg-heat text-heat-ink",
  cream: "bg-cream text-ink",
  surface: "bg-surface-2 text-foreground",
};

const EDITORIAL: Record<string, PackEditorial> = {
  animals: {
    intro:
      "Creatures from the savannah, the deep ocean, the back garden and the polar ice. A friendly pack for new tables — the words are easy to picture, which makes the impostor's job of faking a mental image genuinely hard.",
    crewTip:
      "Lean on senses and habitat rather than the name. \"Sleek\", \"pod\", \"echolocation\" all point at a dolphin without handing it over. Avoid clues that only work if you already know the word, like \"Flipper\".",
    impostorTip:
      "Animal clues live or die on specificity. Open with a safe register — \"wild\", \"fast\", \"grey\" — and let the early crew clues tell you whether the table is thinking land, air or water before you commit.",
    sampleRound: {
      word: "Octopus",
      crewClues: ["tentacles", "ink", "camouflage"],
      impostorClue: "slippery",
      tell: "\"Slippery\" fits an eel, a fish or a bar of soap. Against three clues that all screamed cephalopod, it was the only vague one at the table.",
    },
  },
  food: {
    intro:
      "Street food, sweets, breakfast staples and things served on a stick. Everyone has an opinion and a memory attached to food, so clues get personal fast — which is exactly where impostors slip.",
    crewTip:
      "Describe how it's eaten or where you'd order it, not the taste alone. \"Folded\", \"Tuesday\", \"hard shell\" walk right up to a taco. \"Delicious\" tells the table nothing and marks you as unsure.",
    impostorTip:
      "Stay in a cuisine or a meal slot without naming a dish. \"Handheld\", \"cheap\", \"late night\" could cover half the pack. Only narrow once two crew clues agree on a direction.",
    sampleRound: {
      word: "Ramen",
      crewClues: ["broth", "slurp", "egg"],
      impostorClue: "warm",
      tell: "Soup is warm, tea is warm, a radiator is warm. Next to \"broth\" and \"slurp\" it was a clue that avoided committing to noodles.",
    },
  },
  sports: {
    intro:
      "Court games, combat sports, winter sports and endurance events. The pack rewards players who watch sport and quietly buries players who don't — a good stress test for the impostor.",
    crewTip:
      "Point at equipment, scoring or venue. \"Net\", \"love\", \"grass\" corner tennis without saying racket. Steer clear of a player's name — that's an instant giveaway on both sides.",
    impostorTip:
      "\"Team\", \"ball\", \"tournament\" are almost always safe openers. Listen for whether the crew mentions a court, a pitch, a ring or a track, then echo that surface back a turn later.",
    sampleRound: {
      word: "Boxing",
      crewClues: ["gloves", "rounds", "corner"],
      impostorClue: "tough",
      tell: "Every combat sport is \"tough\". The crew had already fenced the answer into a ring; the impostor was still describing a vibe.",
    },
  },
  movies: {
    intro:
      "Blockbusters, franchises and animated classics almost everyone has seen. An Imposter+ pack. Because the titles are so famous, a single lazy clue like \"space\" can hand the impostor a free pass — precision matters.",
    crewTip:
      "Reference a scene, a line or an object, not the genre. \"Iceberg\", \"door\", \"necklace\" all say Titanic to anyone who's seen it. \"Sad\" or \"long\" could be half of cinema.",
    impostorTip:
      "You only get the theme — \"Romantic Disaster Films\", \"Space Opera Franchises\". Speak to mood and scale: \"epic\", \"sequel\", \"iconic\". Let the crew's first two clues tell you which blockbuster you're supposed to know.",
    sampleRound: {
      word: "Jurassic Park",
      crewClues: ["fence", "amber", "roar"],
      impostorClue: "franchise",
      tell: "\"Franchise\" is a clue about the movie business, not the movie. Everyone who'd seen it was talking about the island; the impostor was talking about box office.",
    },
  },
  places: {
    intro:
      "Cities, landmarks and the everyday buildings you pass through — the library, the airport, the zoo. Because these are locations you can walk around in, the best clues describe what you'd do there.",
    crewTip:
      "Describe the activity, the sound or the smell of the place. \"Quiet\", \"stamp\", \"overdue\" all point at a library. Naming a city or a country when the word is a building type gives you away.",
    impostorTip:
      "\"Public\", \"indoors\", \"you queue\" cover a lot of this pack. Anchor to whether the crew is describing somewhere you visit for fun or somewhere you have to go, then match that tone.",
    sampleRound: {
      word: "Airport",
      crewClues: ["gate", "delay", "passport"],
      impostorClue: "busy",
      tell: "A mall is busy. A hospital is busy. \"Busy\" was the one clue that didn't involve travel while everyone else was clearly at a terminal.",
    },
  },
  "household-items": {
    intro:
      "The objects within arm's reach right now — a pillow, a microwave, a vacuum, a spoon. The words are mundane, so the game becomes about finding the one detail that's specific to that object and nothing else.",
    crewTip:
      "Give the object's job or its spot in the house. \"Reheat\", \"beep\", \"turntable\" land on a microwave. \"Useful\" or \"plastic\" describes almost everything in the pack.",
    impostorTip:
      "Room and material are your friends: \"kitchen\", \"metal\", \"everyday\". The crew will usually reveal whether it's an appliance, furniture or a utensil within a turn — follow their lead, don't set it.",
    sampleRound: {
      word: "Vacuum",
      crewClues: ["carpet", "suction", "cord"],
      impostorClue: "loud",
      tell: "A blender is loud, a hairdryer is loud. \"Loud\" dodged the cleaning theme that the other three clues had already locked in.",
    },
  },
  nature: {
    intro:
      "Weather, landscapes and the big geological events — a thunderstorm, a glacier, an aurora, an earthquake. Half the pack is things you see and half is things that happen, which keeps clue-giving varied.",
    crewTip:
      "Describe what it does or where it forms. \"Rumble\", \"flash\", \"shelter\" corner a thunderstorm. \"Beautiful\" or \"powerful\" is true of most of the pack and helps no one.",
    impostorTip:
      "Scale and location carry you: \"huge\", \"cold climate\", \"sky\". Work out whether the crew is describing weather, water or land before you say anything concrete.",
    sampleRound: {
      word: "Glacier",
      crewClues: ["ice", "slow", "carves"],
      impostorClue: "chilly",
      tell: "\"Chilly\" is a Tuesday in October. The crew were describing a river of ice moving through a valley; the impostor was describing a light jacket.",
    },
  },
  technology: {
    intro:
      "The gadgets on your desk and in your bag — a laptop, a router, a drone, a printer. Because everyone owns most of these, clues about how the thing frustrates you are often more useful than clues about what it does.",
    crewTip:
      "Name a port, a button, a failure mode. \"Blinking\", \"password\", \"wifi\" all say router. \"Electronic\" or \"modern\" fits the entire pack.",
    impostorTip:
      "\"Device\", \"charge\", \"screen\" are safe until proven otherwise. Listen for whether the crew talks about the internet, photos, or printing, then borrow that vocabulary a beat later.",
    sampleRound: {
      word: "Drone",
      crewClues: ["propellers", "hover", "aerial"],
      impostorClue: "gadget",
      tell: "\"Gadget\" is a category, not a clue. Three people were clearly describing something that flies and films; one person was reading a product label.",
    },
  },
  music: {
    intro:
      "Instruments, gear and the culture around live music — a violin, a vinyl record, a DJ, karaoke. An Imposter+ pack. The spread from \"orchestral strings\" to \"electronic dance culture\" means the impostor really can't guess blind.",
    crewTip:
      "Describe how the sound is made or where you'd hear it. \"Bow\", \"chin\", \"orchestra\" point at a violin. \"Musical\" is not a clue — everything here is musical.",
    impostorTip:
      "You get a theme like \"Percussion\" or \"Physical Music Media\". Talk about setting and role: \"live\", \"loud\", \"crowd\". Let the crew establish whether it's an instrument, a format or an event.",
    sampleRound: {
      word: "Vinyl Record",
      crewClues: ["groove", "crackle", "sleeve"],
      impostorClue: "retro",
      tell: "A typewriter is retro. A film camera is retro. \"Retro\" sidestepped the fact that everyone else was describing a spinning black disc.",
    },
  },
  vehicles: {
    intro:
      "Ways to get around — a bicycle, a submarine, a helicopter, a skateboard. The pack splits cleanly into land, sea and air, so the first clue usually tells the whole table which third of the pack you're in.",
    crewTip:
      "Describe how it moves and where. \"Rotor\", \"vertical\", \"landing pad\" corner a helicopter. \"Fast\" is true of most of the pack and hands nothing over.",
    impostorTip:
      "\"Transport\", \"engine\", \"wheels\" (or pointedly no wheels) are your openers. Nail down land / sea / air from the crew before you narrow to a specific craft.",
    sampleRound: {
      word: "Submarine",
      crewClues: ["dive", "periscope", "pressure"],
      impostorClue: "vehicle",
      tell: "\"Vehicle\" restated the category. The crew were clearly underwater; the impostor hadn't figured out which element yet.",
    },
  },
  clothing: {
    intro:
      "What's in the wardrobe — sneakers, a scarf, jeans, a swimsuit. Everyone dresses themselves, so this pack is forgiving for the crew and punishing for an impostor who reaches for \"comfortable\" one time too many.",
    crewTip:
      "Say where on the body it goes and when you'd wear it. \"Neck\", \"winter\", \"wrap\" all point at a scarf. \"Fashion\" or \"soft\" covers the whole drawer.",
    impostorTip:
      "Body zone and season are safe: \"warm\", \"outdoor\", \"everyday\". Wait for the crew to reveal feet / legs / torso / head before you say anything that could be checked.",
    sampleRound: {
      word: "Swimsuit",
      crewClues: ["pool", "tight", "sunscreen"],
      impostorClue: "casual",
      tell: "\"Casual\" describes half a wardrobe. The other three clues had everyone at the beach; the impostor was still at brunch.",
    },
  },
  jobs: {
    intro:
      "Careers you'd recognise from a kid's picture book — doctor, pilot, firefighter, farmer. An Imposter+ pack. The impostor only sees the field (\"Healthcare Jobs\", \"Aviation Careers\"), so a confident wrong guess is a real risk.",
    crewTip:
      "Describe a tool, a uniform or a place of work. \"Cockpit\", \"altitude\", \"announcement\" land on a pilot. \"Hard work\" or \"important\" fits every job in the pack.",
    impostorTip:
      "Talk about the workplace and the stakes: \"trained\", \"uniform\", \"emergency\". Let two crew clues agree on an industry before you commit to a role.",
    sampleRound: {
      word: "Firefighter",
      crewClues: ["hose", "ladder", "alarm"],
      impostorClue: "brave",
      tell: "A soldier is brave. A lifeguard is brave. \"Brave\" was the only clue that didn't involve a burning building.",
    },
  },
  games: {
    intro:
      "Board games, party games and video games — chess, charades, Minecraft, bingo. An Imposter+ pack. \"Classic Board Games\" and \"Battle Royale Video Games\" are miles apart, so the impostor is genuinely guessing.",
    crewTip:
      "Describe a piece, a rule or how you win. \"Checkmate\", \"bishop\", \"64 squares\" all say chess. \"Fun\" is not a clue in a pack that is entirely fun.",
    impostorTip:
      "\"Play\", \"win\", \"turns\" are safe. Figure out from the crew whether it's a board, a screen or a room full of people acting things out, then match the format.",
    sampleRound: {
      word: "Charades",
      crewClues: ["mime", "silent", "guess"],
      impostorClue: "party",
      tell: "Twister is a party game. Bingo is a party game. \"Party\" avoided the one detail — no talking, all acting — that the crew had made obvious.",
    },
  },
  "body-parts": {
    intro:
      "The overlooked bits of human anatomy — an elbow, an eyelash, a fingerprint, an earlobe. An Imposter+ pack, and a sneaky one: the words are so small and specific that a broad clue stands out immediately.",
    crewTip:
      "Give the location and what it does. \"Bend\", \"arm\", \"funny bone\" corner an elbow without naming it. \"Part of you\" describes the entire pack.",
    impostorTip:
      "Anchor to a region — \"face\", \"hand\", \"lower body\" — and stay there. The crew will usually reveal how small and specific the target is; don't guess a major organ when they're describing an eyelash.",
    sampleRound: {
      word: "Fingerprint",
      crewClues: ["unique", "ink", "identity"],
      impostorClue: "hand",
      tell: "\"Hand\" is a whole area, not a feature. The crew were describing something used to identify you; the impostor named the neighbourhood, not the address.",
    },
  },

  // ---------------- Free packs ----------------
  drinks: {
    intro:
      "Everything you'd pour into a glass or a mug — water, coffee, lemonade, a milkshake. A warm-up pack: the words are things you've had today, so clues get specific fast and a vague one really shows.",
    crewTip:
      "Say when you drink it or what it comes in. \"Morning\", \"mug\", \"beans\" all land on coffee. \"Tasty\" or \"liquid\" is true of the whole pack and hands nothing over.",
    impostorTip:
      "Temperature and time of day are safe openers — \"cold\", \"breakfast\", \"refreshing\". Listen for whether the crew is describing something hot, fizzy or sweet before you commit.",
    sampleRound: {
      word: "Hot Chocolate",
      crewClues: ["marshmallows", "cocoa", "fireside"],
      impostorClue: "warm",
      tell: "Tea is warm. Soup is warm. \"Warm\" was the one clue that skipped the chocolate the other three were all circling.",
    },
  },
  "kitchen-tools": {
    intro:
      "The gadgets in the utensil drawer — a whisk, a grater, a rolling pin, a ladle. Small, single-purpose objects, which makes the game about naming the one job each of them does.",
    crewTip:
      "Describe the task, not the shape. \"Beat\", \"eggs\", \"airy\" all point at a whisk. \"Metal\" or \"kitchen\" fits the whole drawer.",
    impostorTip:
      "\"Cooking\", \"handheld\", \"you grip it\" are safe until the crew narrows things. Work out whether they're describing something for mixing, cutting or serving, then echo that.",
    sampleRound: {
      word: "Rolling Pin",
      crewClues: ["dough", "flatten", "flour"],
      impostorClue: "wooden",
      tell: "A spoon is wooden. A cutting board is wooden. \"Wooden\" dodged the baking that the other three clues had already locked in.",
    },
  },
  "school-supplies": {
    intro:
      "What's in the pencil case and the backpack — pencils, erasers, glue sticks, rulers. A friendly all-ages pack; the words are things everyone has handled, so honest clues come easily.",
    crewTip:
      "Say what it's for in class. \"Mistakes\", \"rub\", \"crumbs\" corner an eraser. \"School\" or \"useful\" describes the entire pack.",
    impostorTip:
      "Anchor to the subject — \"writing\", \"art class\", \"measuring\" — and stay there. The crew's first clues usually reveal whether it's for making marks, fixing them or carrying things.",
    sampleRound: {
      word: "Glue Stick",
      crewClues: ["sticky", "collage", "twist-up"],
      impostorClue: "supplies",
      tell: "\"Supplies\" restated the pack name. Everyone else was gluing paper together; the impostor was reading the aisle sign.",
    },
  },
  toys: {
    intro:
      "The toy box — a teddy bear, a kite, a yo-yo, building blocks. Half the pack is things you hold and half is things you do, which keeps clue-giving varied and forgiving for newer players.",
    crewTip:
      "Describe how you play with it. \"String\", \"wind\", \"outdoors\" land on a kite. \"Fun\" is not a clue in a pack that is entirely fun.",
    impostorTip:
      "\"Kids\", \"play\", \"colourful\" get you through an early turn. Figure out from the crew whether it's cuddly, mechanical or something you build before you narrow.",
    sampleRound: {
      word: "Yo-Yo",
      crewClues: ["string", "tricks", "spins"],
      impostorClue: "plaything",
      tell: "\"Plaything\" is a synonym for the pack, not a clue. The crew were describing a spinning disc on a string; the impostor was describing the category.",
    },
  },
  "at-the-beach": {
    intro:
      "A day on the sand — a sandcastle, a beach umbrella, flip-flops, a lifeguard. Everything here belongs to one place, so the best clues describe what you'd be doing rather than the object alone.",
    crewTip:
      "Describe the activity or the spot. \"Dig\", \"moat\", \"bucket\" all point at a sandcastle. Saying \"beach\" when the whole pack is the beach gives you away.",
    impostorTip:
      "You already know it's the beach, so don't say \"beach\". Lean on \"summer\", \"sand\", \"you'd bring it\" and let the crew reveal whether it's gear, a person or something you build.",
    sampleRound: {
      word: "Lifeguard",
      crewClues: ["whistle", "rescue", "tower"],
      impostorClue: "seaside",
      tell: "\"Seaside\" described the setting everyone already had. The crew were describing a person who watches the water; the impostor was describing the postcard.",
    },
  },
  camping: {
    intro:
      "A weekend in the woods — a tent, a campfire, a sleeping bag, a compass. The pack splits into shelter, warmth, navigation and food, so the first clue usually tells the whole table which corner you're in.",
    crewTip:
      "Describe its job on the trip. \"Zip\", \"poles\", \"pegs\" corner a tent. \"Outdoors\" or \"useful\" fits everything you'd pack.",
    impostorTip:
      "\"Wilderness\", \"you pack it\", \"overnight\" are safe. Work out whether the crew is describing something you sleep in, cook with or navigate by, then match it a turn later.",
    sampleRound: {
      word: "Compass",
      crewClues: ["needle", "north", "bearings"],
      impostorClue: "handy",
      tell: "A flashlight is handy. A cooler is handy. \"Handy\" avoided the navigation the other three clues had made obvious.",
    },
  },
  tools: {
    intro:
      "The contents of a toolbox — a hammer, a wrench, a drill, a tape measure. Plain, functional objects, so the game becomes about the one action each tool performs.",
    crewTip:
      "Name the action or the thing it acts on. \"Nail\", \"swing\", \"claw\" all say hammer. \"Hardware\" or \"heavy\" describes half the box.",
    impostorTip:
      "\"Fixing\", \"garage\", \"you hold it\" get you through a turn. Listen for whether the crew is describing something for hitting, turning, cutting or measuring, then follow.",
    sampleRound: {
      word: "Tape Measure",
      crewClues: ["retract", "inches", "snap"],
      impostorClue: "toolbox",
      tell: "\"Toolbox\" named where it lives, not what it does. The crew were describing something that measures length; the impostor pointed at the shelf.",
    },
  },
  "in-the-garden": {
    intro:
      "Out among the beds and the borders — a hose, a wheelbarrow, a watering can, a greenhouse. The pack mixes tools you swing with structures you walk into, so clues stay varied.",
    crewTip:
      "Describe what it does for the plants. \"Water\", \"spray\", \"coil\" all point at a hose. \"Green\" or \"outdoor\" fits the whole garden.",
    impostorTip:
      "\"Plants\", \"backyard\", \"you'd find it in a shed\" are safe openers. Work out whether the crew is describing a hand tool, something you push or a building.",
    sampleRound: {
      word: "Wheelbarrow",
      crewClues: ["one wheel", "haul", "tip"],
      impostorClue: "gardening",
      tell: "\"Gardening\" restated the pack. Three people were describing a thing you push with a single wheel; one was reading the category.",
    },
  },
  "birthday-party": {
    intro:
      "Everything on the table at a kid's party — cake, balloons, a piñata, goodie bags. The words all belong to one event, so the strongest clues describe the moment each one shows up.",
    crewTip:
      "Describe when it appears in the party. \"Candles\", \"slice\", \"sing\" all land on the cake. \"Party\" or \"fun\" describes the whole pack.",
    impostorTip:
      "You know it's a party, so don't say \"party\". Use \"celebration\", \"kids\", \"you'd see it at one\" and let the crew reveal whether it's food, decoration or a game.",
    sampleRound: {
      word: "Piñata",
      crewClues: ["blindfold", "stick", "swing"],
      impostorClue: "festive",
      tell: "A balloon is festive. Confetti is festive. \"Festive\" skipped the hitting-it-with-a-stick that the crew had made unmistakable.",
    },
  },
  space: {
    intro:
      "Out past the atmosphere — planets, rockets, astronauts, comets. Half the pack is things that are up there and half is things we send up, which gives clue-givers two clear directions.",
    crewTip:
      "Describe where it is or what it does. \"Orbit\", \"tail\", \"streak\" corner a comet. \"Space\" or \"far away\" is true of everything in the pack.",
    impostorTip:
      "\"Sky\", \"NASA\", \"you'd need a telescope\" are safe. Nail down whether the crew is describing a natural object or a spacecraft before you commit.",
    sampleRound: {
      word: "Satellite",
      crewClues: ["orbit", "signal", "launched"],
      impostorClue: "cosmic",
      tell: "\"Cosmic\" is a vibe, not a clue. The crew were describing a machine we put in orbit; the impostor was describing the mood lighting.",
    },
  },
  insects: {
    intro:
      "The small six-legged crowd — ants, bees, ladybugs, fireflies. The words are things you've watched up close in a garden, so clues about behaviour beat clues about looks.",
    crewTip:
      "Describe what it does. \"Glow\", \"dusk\", \"blink\" all say firefly. \"Bug\" or \"tiny\" describes the whole jar.",
    impostorTip:
      "\"Garden\", \"crawls\", \"you'd swat it\" get you through a turn. Listen for whether the crew is describing something that flies, jumps, bites or glows.",
    sampleRound: {
      word: "Firefly",
      crewClues: ["glow", "dusk", "jar"],
      impostorClue: "insect",
      tell: "\"Insect\" restated the pack. Three clues were about a bug that lights up at night; one just confirmed it had six legs.",
    },
  },
  birds: {
    intro:
      "From the garden feeder to the tropics — a robin, an owl, a flamingo, a peacock. Easy to picture, which makes the impostor's job of faking a mental image hard.",
    crewTip:
      "Describe the sound, the habitat or one standout feature. \"Pink\", \"one leg\", \"lagoon\" all point at a flamingo. \"Feathers\" fits every bird there is.",
    impostorTip:
      "\"Wings\", \"nest\", \"beak\" are safe openers. Work out from the crew whether it's a common garden bird, a bird of the water, or something flightless and unusual.",
    sampleRound: {
      word: "Flamingo",
      crewClues: ["pink", "one leg", "shallow water"],
      impostorClue: "feathered",
      tell: "\"Feathered\" is true of a pigeon and a penguin. It was the only clue that didn't involve standing on one leg in a lagoon.",
    },
  },
  fruit: {
    intro:
      "The fruit bowl and the market stall — bananas, grapes, watermelon, mango. The words are things you've peeled or sliced, so clues about how you eat them land well.",
    crewTip:
      "Describe the peel, the seeds or how you cut it. \"Slippery skin\", \"bunch\", \"monkey\" all say banana. \"Sweet\" or \"healthy\" fits the whole bowl.",
    impostorTip:
      "\"Fruit\" is off the table. Use \"juicy\", \"summer\", \"you peel it\" and let the crew reveal whether it's a berry, a melon or something tropical.",
    sampleRound: {
      word: "Watermelon",
      crewClues: ["seeds", "rind", "picnic"],
      impostorClue: "refreshing",
      tell: "A grape is refreshing. A slice of mango is refreshing. \"Refreshing\" avoided the size and the rind that the crew had made obvious.",
    },
  },

  // ---------------- Imposter+ packs ----------------
  "tv-shows": {
    intro:
      "Shows almost everyone has at least heard of — Friends, The Office, Stranger Things, Breaking Bad. An Imposter+ pack. The impostor only gets a genre like \"Workplace Comedies\", so a confident wrong guess is a real risk.",
    crewTip:
      "Reference a character, a setting or a running joke — not the genre. \"Paper company\", \"Scranton\", \"documentary crew\" all say The Office. \"Funny\" or \"popular\" could be half of television.",
    impostorTip:
      "You get the genre. Talk about format and mood: \"binge\", \"seasons\", \"cliffhanger\". Let the crew's first two clues tell you which show you're supposed to know inside out.",
    sampleRound: {
      word: "Stranger Things",
      crewClues: ["Hawkins", "the Upside Down", "bikes"],
      impostorClue: "streaming",
      tell: "\"Streaming\" is a clue about how you watch it, not what it is. Everyone who'd seen it was in a small 80s town fighting a monster; the impostor was describing a subscription.",
    },
  },
  "video-game-worlds": {
    intro:
      "The franchises even non-gamers can name — Mario, Zelda, Pokemon, Tetris. An Imposter+ pack. \"Arcade Classics\" and \"Creature Collectors\" are worlds apart, so the impostor is genuinely guessing.",
    crewTip:
      "Name a character, an item or a core mechanic. \"Plumber\", \"mushroom\", \"princess\" all point at Mario. \"Video game\" is true of the entire pack.",
    impostorTip:
      "\"Levels\", \"controller\", \"you beat the boss\" are safe. Work out whether the crew is describing a platformer, a puzzle or a shooter, then match the era and the vibe.",
    sampleRound: {
      word: "Pac-Man",
      crewClues: ["maze", "ghosts", "pellets"],
      impostorClue: "console",
      tell: "\"Console\" is where you'd play it, not what it is. The crew were describing a yellow circle eating dots in a maze; the impostor named the machine.",
    },
  },
  superheroes: {
    intro:
      "The capes everyone knows — Batman, Spider-Man, Superman, the Hulk. An Imposter+ pack. The impostor only sees \"DC\" or \"Marvel\", so naming the wrong hero from the right studio is an easy trap.",
    crewTip:
      "Reference the origin, the city or the power — not just \"hero\". \"Gotham\", \"no powers\", \"detective\" all say Batman. \"Strong\" or \"saves people\" fits every hero in the pack.",
    impostorTip:
      "You get the studio. Talk in general terms: \"mask\", \"villain\", \"movie franchise\". Let two crew clues agree on a power set before you commit to a name.",
    sampleRound: {
      word: "The Hulk",
      crewClues: ["green", "anger", "smash"],
      impostorClue: "Marvel",
      tell: "\"Marvel\" named the studio the impostor was handed. The crew were describing a green rage monster; the impostor read the logo.",
    },
  },
  "cartoon-characters": {
    intro:
      "Faces from Saturday mornings and prime time — SpongeBob, Bugs Bunny, Scooby-Doo, Homer Simpson. An Imposter+ pack. \"Disney Classics\" and \"Prime-Time Cartoons\" barely overlap, so the impostor can't guess blind.",
    crewTip:
      "Describe the character's world or catchphrase. \"Pineapple\", \"underwater\", \"fry cook\" all land on SpongeBob. \"Cartoon\" describes the whole pack.",
    impostorTip:
      "You get the era. Use \"animated\", \"long-running\", \"kids know it\" and let the crew reveal whether it's a talking animal, a Disney lead or a sitcom family.",
    sampleRound: {
      word: "Scooby-Doo",
      crewClues: ["Mystery Machine", "great dane", "unmasking"],
      impostorClue: "animated",
      tell: "\"Animated\" is true of the entire pack. It was the only clue that didn't involve a van, a dog, or pulling a mask off a villain.",
    },
  },
  "world-landmarks": {
    intro:
      "Structures you'd recognise from a postcard — the Eiffel Tower, the Pyramids, the Colosseum, Big Ben. An Imposter+ pack. The impostor gets a region like \"European Landmarks\", which narrows it but doesn't hand it over.",
    crewTip:
      "Describe what it looks like or what happened there. \"Iron lattice\", \"proposal spot\", \"lights up\" all point at the Eiffel Tower. \"Famous\" or \"tourists\" fits every landmark.",
    impostorTip:
      "You get the continent. Talk about scale and age: \"you'd queue to see it\", \"in every guidebook\", \"old\". Let the crew reveal whether it's ancient, a tower, or a modern icon.",
    sampleRound: {
      word: "Colosseum",
      crewClues: ["gladiators", "Rome", "ruins"],
      impostorClue: "landmark",
      tell: "\"Landmark\" restated the pack. The crew were standing in a Roman amphitheatre; the impostor was reading the category.",
    },
  },
  countries: {
    intro:
      "Countries from every continent — Japan, Brazil, Egypt, Norway. An Imposter+ pack. \"Asian Countries\" still leaves a dozen options, so the impostor has to listen hard before naming one.",
    crewTip:
      "Reference a food, a landmark, a flag or a shape — not the continent. \"Fjords\", \"northern lights\", \"oil\" all say Norway. \"Country\" or \"has a flag\" is true of the whole pack.",
    impostorTip:
      "You get the region. Talk about climate and reputation: \"warm\", \"big\", \"tourists go there\". Let the crew's clues tell you which country before you guess.",
    sampleRound: {
      word: "Egypt",
      crewClues: ["Nile", "pharaohs", "desert"],
      impostorClue: "African",
      tell: "\"African\" named the region the impostor was given. The crew were describing pyramids and a river; the impostor pointed at the map.",
    },
  },
  "world-cities": {
    intro:
      "Cities that anchor a country in your head — Tokyo, London, New York, Rome. An Imposter+ pack, and a close cousin of Countries: the trick is a clue that fits the city and not just the nation around it.",
    crewTip:
      "Name a neighbourhood, a landmark or a transit system. \"Shibuya crossing\", \"bullet train\", \"neon\" all say Tokyo. \"Big city\" fits every entry.",
    impostorTip:
      "You get the region. Use \"skyline\", \"millions of people\", \"you'd fly there\" and let the crew reveal which specific city they're all picturing.",
    sampleRound: {
      word: "London",
      crewClues: ["the Tube", "double-decker", "the Thames"],
      impostorClue: "European",
      tell: "\"European\" was the region on the impostor's card. The crew were riding a red bus over a grey river; the impostor named the continent.",
    },
  },
  "mythical-creatures": {
    intro:
      "Beasts from legend — a dragon, a unicorn, a kraken, a minotaur. An Imposter+ pack. The impostor gets a family like \"Sea Legends\", so the wrong monster from the right myth is an easy slip.",
    crewTip:
      "Describe the body and the story. \"Horn\", \"forest\", \"pure\" all point at a unicorn. \"Mythical\" or \"not real\" describes the entire pack.",
    impostorTip:
      "You get the family. Talk about vibe: \"scary\", \"ancient story\", \"you'd read about it in a legend\". Let the crew reveal whether it's a sea beast, a hybrid or a Greek monster.",
    sampleRound: {
      word: "Kraken",
      crewClues: ["tentacles", "ships", "the deep"],
      impostorClue: "legendary",
      tell: "\"Legendary\" is true of the whole pack. It was the only clue that didn't involve a giant squid dragging a ship under.",
    },
  },
  "fairy-tales": {
    intro:
      "Stories read aloud at bedtime — Cinderella, Rapunzel, Hansel and Gretel, Jack and the Beanstalk. An Imposter+ pack. Themes like \"Woodland Tales\" cover several stories, so the impostor still has to work.",
    crewTip:
      "Reference an object or a moment from the story. \"Glass slipper\", \"midnight\", \"pumpkin\" all say Cinderella. \"Fairy tale\" or \"once upon a time\" fits every entry.",
    impostorTip:
      "You get the theme. Use \"children's story\", \"there's a lesson\", \"old\". Let the crew's clues reveal which tale — a tower, a witch's house, a magic bean — before you commit.",
    sampleRound: {
      word: "Hansel and Gretel",
      crewClues: ["breadcrumbs", "candy house", "oven"],
      impostorClue: "storybook",
      tell: "\"Storybook\" restated the pack. The crew were lost in a forest at a house made of sweets; the impostor was describing the book it's printed in.",
    },
  },
  dinosaurs: {
    intro:
      "The dinosaurs a six-year-old can name — T. rex, Triceratops, Stegosaurus, Velociraptor. An Imposter+ pack. The impostor gets a group like \"Horned Dinosaurs\", which helps, but there's more than one.",
    crewTip:
      "Describe the body — plates, horns, claws, neck. \"Tiny arms\", \"apex\", \"bite\" all point at T. rex. \"Extinct\" or \"prehistoric\" fits every dinosaur.",
    impostorTip:
      "You get the group. Talk about size and diet: \"huge\", \"plant-eater\", \"fossil\". Let the crew reveal whether it walked on two legs or four, and what it had on its head.",
    sampleRound: {
      word: "Stegosaurus",
      crewClues: ["back plates", "spiked tail", "small head"],
      impostorClue: "Jurassic",
      tell: "\"Jurassic\" named the period, not the animal. The crew were describing the plates down its spine; the impostor was describing the era.",
    },
  },
  "pizza-toppings": {
    intro:
      "What goes on before it hits the oven — pepperoni, mushrooms, pineapple, anchovies. An Imposter+ pack, and an argument-friendly one: half the table has strong feelings about pineapple.",
    crewTip:
      "Describe the taste, the texture or the debate. \"Divisive\", \"sweet\", \"Hawaiian\" all say pineapple. \"Topping\" or \"goes on pizza\" is true of the whole pack.",
    impostorTip:
      "You get \"Meat Toppings\" or \"Vegetable Toppings\". Use \"you either love it or hate it\", \"extra\", \"on the side\" and let the crew tell you whether it's meat, veg or cheese.",
    sampleRound: {
      word: "Anchovies",
      crewClues: ["salty", "fishy", "polarising"],
      impostorClue: "topping",
      tell: "\"Topping\" restated the pack. Three clues were about a tiny salty fish nobody's neutral about; one just confirmed it goes on pizza.",
    },
  },
  "ice-cream-flavors": {
    intro:
      "What you'd point at behind the glass — vanilla, mint chocolate chip, cookie dough, pistachio. An Imposter+ pack. \"Nutty Flavors\" and \"Dessert Flavors\" are close enough that the impostor can nearly bluff it.",
    crewTip:
      "Name the mix-in or the colour. \"Green\", \"chips\", \"toothpaste\" all point at mint chocolate chip. \"Cold\" or \"scoop\" describes every flavour.",
    impostorTip:
      "You get the family. Use \"a scoop of it\", \"in a cone\", \"popular\" and let the crew reveal whether it's a plain classic, something with chunks in it, or a nut flavour.",
    sampleRound: {
      word: "Cookie Dough",
      crewClues: ["raw", "chunks", "chocolate chips"],
      impostorClue: "dessert",
      tell: "\"Dessert\" is true of the whole freezer. The crew were describing lumps of unbaked cookie in vanilla; the impostor named the course.",
    },
  },
  "tabletop-games": {
    intro:
      "Games from the hall cupboard — Scrabble, Clue, Jenga, Battleship. An Imposter+ pack, and a sibling to Games: the words are the boxes you'd pull out on a rainy afternoon.",
    crewTip:
      "Describe a piece, a rule or how you win. \"Tiles\", \"triple word score\", \"letters\" all say Scrabble. \"Board game\" is true of most of the pack.",
    impostorTip:
      "\"Players take turns\", \"there's a winner\", \"family night\" are safe. Work out whether the crew is describing a word game, a mystery, a wobbly tower or a guessing game.",
    sampleRound: {
      word: "Jenga",
      crewClues: ["wooden blocks", "pull", "collapse"],
      impostorClue: "boardgame",
      tell: "\"Boardgame\" restated the pack — and there's no board. The crew were describing a tower you pull blocks from until it falls.",
    },
  },
  candy: {
    intro:
      "The pick-and-mix wall — lollipops, gummy bears, taffy, candy canes. An Imposter+ pack. The sub-themes (\"Hard Candy\", \"Chewy Candy\") narrow it, but there's more than one of each.",
    crewTip:
      "Describe the texture and how you eat it. \"Stick\", \"lick\", \"lasts ages\" all point at a lollipop. \"Sweet\" or \"sugar\" fits the entire wall.",
    impostorTip:
      "You get the texture family. Use \"a treat\", \"bad for your teeth\", \"kids love it\" and let the crew reveal whether it's hard, chewy or chocolate.",
    sampleRound: {
      word: "Cotton Candy",
      crewClues: ["spun", "fairground", "melts"],
      impostorClue: "sugary",
      tell: "A jawbreaker is sugary. Taffy is sugary. \"Sugary\" skipped the spun-on-a-cone-at-a-fair that the crew had made obvious.",
    },
  },
  halloween: {
    intro:
      "Everything that appears on the last night of October — pumpkins, ghosts, cobwebs, candy corn. An Imposter+ pack. The words all belong to one night, so the strongest clues describe where each one turns up.",
    crewTip:
      "Describe what you do with it or where it sits. \"Carve\", \"porch\", \"candle inside\" all say pumpkin. \"Spooky\" or \"October\" describes the whole pack.",
    impostorTip:
      "You know it's Halloween, so don't say \"Halloween\". Use \"decoration\", \"you'd see it on a doorstep\", \"creepy\" and let the crew reveal whether it's a figure, a decoration or a treat.",
    sampleRound: {
      word: "Candy Corn",
      crewClues: ["tri-colour", "divisive", "handful"],
      impostorClue: "spooky",
      tell: "A skeleton is spooky. A cobweb is spooky. \"Spooky\" was the one clue that wasn't about the little orange-and-white sweet everyone argues about.",
    },
  },
  pirates: {
    intro:
      "The whole pirate kit — a treasure chest, a parrot, an eyepatch, a Jolly Roger. An Imposter+ pack. The words orbit one idea, so the game is about the specific object, not the theme.",
    crewTip:
      "Describe the object and its job aboard ship. \"Buried\", \"X marks it\", \"gold\" all point at the treasure chest. \"Pirate\" is the theme, not a clue.",
    impostorTip:
      "You already have \"pirate\". Use \"you'd see it in a pirate film\", \"old-fashioned\", \"on a ship\" and let the crew reveal whether it's loot, a companion, a weapon or a flag.",
    sampleRound: {
      word: "Jolly Roger",
      crewClues: ["skull", "flies high", "black"],
      impostorClue: "swashbuckling",
      tell: "\"Swashbuckling\" is a mood word. The crew were describing the skull-and-crossbones flag; the impostor was describing the genre.",
    },
  },
  circus: {
    intro:
      "Under the big top — a clown, a tightrope, a ringmaster, a human cannonball. An Imposter+ pack. Half the words are performers and half are the acts they do, which gives clue-givers two clear lanes.",
    crewTip:
      "Describe the act or the costume. \"Red nose\", \"tiny car\", \"honk\" all say clown. \"Circus\" or \"under the big top\" is the setting, not a clue.",
    impostorTip:
      "You have \"circus\" already. Use \"performer\", \"the crowd gasps\", \"you'd see it in the ring\" and let the crew reveal whether it's a person or one of the acts.",
    sampleRound: {
      word: "Ringmaster",
      crewClues: ["top hat", "announces", "in charge"],
      impostorClue: "big top",
      tell: "\"Big top\" named the tent, not the person in it. The crew were describing the one who introduces every act; the impostor described the venue.",
    },
  },
};

const FALLBACK_EDITORIAL: PackEditorial = {
  intro:
    "A hand-built pack of words the whole table can picture. Everyone but the impostor sees the exact word — the impostor only gets the pack name.",
  crewTip:
    "Describe the thing without naming it or any of its obvious nicknames. Aim for a clue that only makes sense if you know the word.",
  impostorTip:
    "Start broad, stay calm, and let the crew's early clues tell you which direction the word is in before you say anything specific.",
  sampleRound: {
    word: "",
    crewClues: [],
    impostorClue: "",
    tell: "The vaguest clue at a table where everyone else is being specific is usually the impostor.",
  },
};

let cache: Pack[] | null = null;

/** All packs, in a stable display order (free packs first, then Imposter+). */
export function getPacks(): Pack[] {
  if (cache) return cache;

  const rows = wordData as WordEntry[];
  const byCategory = new Map<string, WordEntry[]>();
  for (const row of rows) {
    const name = normalizeCategory(row.category);
    const list = byCategory.get(name) ?? [];
    list.push(row);
    byCategory.set(name, list);
  }

  const packs: Pack[] = [];
  for (const [name, list] of byCategory) {
    const slug = slugifyPack(name);
    const editorial = EDITORIAL[slug] ?? FALLBACK_EDITORIAL;
    const themes = [...new Set(list.map((w) => w.topic))];
    packs.push({
      slug,
      name,
      premium: list.every((w) => w.premium === true),
      words: list.map((w) => ({ word: w.word, topic: w.topic })),
      themes,
      icon: PACK_ICON[slug] ?? "dice",
      tone: "brand",
      ...editorial,
    });
  }

  packs.sort((a, b) => {
    if (a.premium !== b.premium) return a.premium ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  // Assign the tile colour after sorting so it cycles evenly down the grid.
  packs.forEach((pack, i) => {
    pack.tone = TONE_CYCLE[i % TONE_CYCLE.length];
  });

  cache = packs;
  return packs;
}

export function getPack(slug: string): Pack | undefined {
  return getPacks().find((p) => p.slug === slug);
}

export function packWordCount(): number {
  return (wordData as WordEntry[]).length;
}
