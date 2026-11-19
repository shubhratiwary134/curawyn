import { Genre, Subgenre } from '../types';

export interface SeedTaxonomy {
  genres: Record<string, Genre>;
  subgenres: Record<string, Subgenre>;
}

export function getSeedTaxonomy(): SeedTaxonomy {
  const genres: Record<string, Genre> = {};
  const subgenres: Record<string, Subgenre> = {};

  const addGenre = (
    id: string,
    name: string,
    ytCategoryIds: number[],
    order: number,
    subgenreDefs: Array<{
      id: string;
      name: string;
      include: Array<{ term: string; weight: number }>;
      exclude: string[];
    }>
  ) => {
    genres[id] = {
      id,
      name,
      enabled: true,
      blocked: false,
      duration: null,
      contentTypes: null,
      ytCategoryIds,
      order,
      builtIn: true
    };

    subgenreDefs.forEach((sg, idx) => {
      subgenres[sg.id] = {
        id: sg.id,
        genreId: id,
        name: sg.name,
        enabled: true,
        blocked: false,
        duration: null,
        contentTypes: null,
        include: sg.include,
        exclude: sg.exclude,
        order: idx + 1,
        builtIn: true
      };
    });
  };

  // 1. Technology
  addGenre('tech', 'Technology', [28], 1, [
    {
      id: 'tech_gadgets',
      name: 'Smartphones & Gadgets',
      include: [
        { term: 'smartphone', weight: 3 },
        { term: 'iphone', weight: 3 },
        { term: 'android', weight: 3 },
        { term: 'unboxing', weight: 2 },
        { term: 'gadget', weight: 3 },
        { term: 'smartwatch', weight: 2 }
      ],
      exclude: ['prank', 'reaction']
    },
    {
      id: 'tech_hardware',
      name: 'PC Hardware & Custom Builds',
      include: [
        { term: 'gpu', weight: 3 },
        { term: 'cpu', weight: 3 },
        { term: 'pc build', weight: 3 },
        { term: 'motherboard', weight: 2 },
        { term: 'nvidia', weight: 2 },
        { term: 'amd ryzen', weight: 2 }
      ],
      exclude: ['gameplay walkthrough']
    },
    {
      id: 'tech_future',
      name: 'Emerging Tech & AI Hardware',
      include: [
        { term: 'quantum computing', weight: 3 },
        { term: 'robotics', weight: 3 },
        { term: 'neural network chip', weight: 3 },
        { term: 'wearable tech', weight: 2 },
        { term: 'cybernetics', weight: 2 }
      ],
      exclude: ['crypto scam', 'get rich']
    },
    {
      id: 'tech_networking',
      name: 'Networking & Smart Home',
      include: [
        { term: 'home automation', weight: 3 },
        { term: 'iot', weight: 3 },
        { term: 'router', weight: 2 },
        { term: 'home assistant', weight: 3 },
        { term: 'nas server', weight: 3 }
      ],
      exclude: ['comedy']
    }
  ]);

  // 2. Programming and Software
  addGenre('programming', 'Programming and Software', [28], 2, [
    {
      id: 'prog_web',
      name: 'Web Development',
      include: [
        { term: 'react', weight: 3 },
        { term: 'typescript', weight: 3 },
        { term: 'javascript', weight: 3 },
        { term: 'frontend', weight: 2 },
        { term: 'css', weight: 2 },
        { term: 'nextjs', weight: 3 }
      ],
      exclude: ['wordpress plugin leak', 'hack website quick']
    },
    {
      id: 'prog_software_eng',
      name: 'Software Engineering & Architecture',
      include: [
        { term: 'software engineering', weight: 3 },
        { term: 'system design', weight: 3 },
        { term: 'clean code', weight: 2 },
        { term: 'microservices', weight: 3 },
        { term: 'refactoring', weight: 2 }
      ],
      exclude: ['day in the life of a FAANG']
    },
    {
      id: 'prog_devops',
      name: 'DevOps & Cloud Infrastructure',
      include: [
        { term: 'docker', weight: 3 },
        { term: 'kubernetes', weight: 3 },
        { term: 'aws cloud', weight: 3 },
        { term: 'ci cd', weight: 2 },
        { term: 'terraform', weight: 3 }
      ],
      exclude: []
    },
    {
      id: 'prog_db',
      name: 'Databases & Data Engineering',
      include: [
        { term: 'postgresql', weight: 3 },
        { term: 'database indexing', weight: 3 },
        { term: 'sql query', weight: 2 },
        { term: 'redis cache', weight: 2 },
        { term: 'data pipeline', weight: 3 }
      ],
      exclude: []
    },
    {
      id: 'prog_aiml',
      name: 'AI/ML Engineering',
      include: [
        { term: 'machine learning', weight: 3 },
        { term: 'llm fine tuning', weight: 3 },
        { term: 'pytorch', weight: 3 },
        { term: 'tensorflow', weight: 2 },
        { term: 'transformer model', weight: 3 }
      ],
      exclude: ['dropshipping ai']
    },
    {
      id: 'prog_opensource',
      name: 'Open Source & Tooling',
      include: [
        { term: 'open source', weight: 3 },
        { term: 'git workflow', weight: 3 },
        { term: 'linux kernel', weight: 3 },
        { term: 'vim neovim', weight: 2 },
        { term: 'compiler design', weight: 3 }
      ],
      exclude: []
    }
  ]);

  // 3. Science
  addGenre('science', 'Science', [28], 3, [
    {
      id: 'sci_physics',
      name: 'Physics & Astronomy',
      include: [
        { term: 'astrophysics', weight: 3 },
        { term: 'quantum mechanics', weight: 3 },
        { term: 'relativity', weight: 2 },
        { term: 'black hole', weight: 3 },
        { term: 'particle physics', weight: 3 }
      ],
      exclude: ['astrology', 'horoscope']
    },
    {
      id: 'sci_biology',
      name: 'Biology & Genetics',
      include: [
        { term: 'crispr gene', weight: 3 },
        { term: 'molecular biology', weight: 3 },
        { term: 'evolutionary biology', weight: 3 },
        { term: 'dna sequencing', weight: 2 },
        { term: 'cellular anatomy', weight: 2 }
      ],
      exclude: []
    },
    {
      id: 'sci_chemistry',
      name: 'Chemistry & Materials',
      include: [
        { term: 'organic chemistry', weight: 3 },
        { term: 'chemical reaction', weight: 3 },
        { term: 'material science', weight: 3 },
        { term: 'superconductor', weight: 3 },
        { term: 'thermodynamics', weight: 2 }
      ],
      exclude: []
    },
    {
      id: 'sci_space',
      name: 'Space Exploration',
      include: [
        { term: 'nasa mission', weight: 3 },
        { term: 'spacex starship', weight: 3 },
        { term: 'james webb telescope', weight: 3 },
        { term: 'mars rover', weight: 2 },
        { term: 'rocket launch', weight: 2 }
      ],
      exclude: ['flat earth', 'alien abduction conspiracy']
    }
  ]);

  // 4. Education
  addGenre('education', 'Education', [27], 4, [
    {
      id: 'edu_math',
      name: 'Mathematics',
      include: [
        { term: 'calculus', weight: 3 },
        { term: 'linear algebra', weight: 3 },
        { term: 'statistics probability', weight: 3 },
        { term: 'geometry proof', weight: 2 },
        { term: 'number theory', weight: 3 }
      ],
      exclude: []
    },
    {
      id: 'edu_history',
      name: 'World History',
      include: [
        { term: 'world history', weight: 3 },
        { term: 'ancient civilization', weight: 3 },
        { term: 'historical documentary', weight: 2 },
        { term: 'industrial revolution', weight: 3 },
        { term: 'roman empire', weight: 3 }
      ],
      exclude: []
    },
    {
      id: 'edu_philosophy',
      name: 'Philosophy & Critical Thinking',
      include: [
        { term: 'stoicism', weight: 3 },
        { term: 'epistemology', weight: 3 },
        { term: 'ethics philosophy', weight: 3 },
        { term: 'thought experiment', weight: 2 },
        { term: 'formal logic', weight: 3 }
      ],
      exclude: []
    },
    {
      id: 'edu_linguistics',
      name: 'Linguistics & Languages',
      include: [
        { term: 'linguistics', weight: 3 },
        { term: 'etymology', weight: 3 },
        { term: 'grammar rules', weight: 2 },
        { term: 'phonetics', weight: 3 },
        { term: 'language learning methods', weight: 2 }
      ],
      exclude: []
    }
  ]);

  // 5. Motorcycles and Automotive
  addGenre('auto', 'Motorcycles and Automotive', [2], 5, [
    {
      id: 'auto_motorcycles',
      name: 'Motorcycle Reviews & Riding',
      include: [
        { term: 'motorcycle ride', weight: 3 },
        { term: 'sportbike', weight: 3 },
        { term: 'adv bike', weight: 3 },
        { term: 'ducati', weight: 2 },
        { term: 'yamaha r1', weight: 2 }
      ],
      exclude: ['crash compilation']
    },
    {
      id: 'auto_car_reviews',
      name: 'Car Reviews & Track Tests',
      include: [
        { term: 'car review', weight: 3 },
        { term: 'track test', weight: 3 },
        { term: '0-60 acceleration', weight: 2 },
        { term: 'exhaust sound', weight: 2 },
        { term: 'dyno run', weight: 3 }
      ],
      exclude: ['road rage']
    },
    {
      id: 'auto_diy_maintenance',
      name: 'Automotive Mechanics & DIY Repair',
      include: [
        { term: 'oil change guide', weight: 3 },
        { term: 'engine rebuild', weight: 3 },
        { term: 'brake replacement', weight: 3 },
        { term: 'transmission repair', weight: 2 },
        { term: 'car restoration', weight: 3 }
      ],
      exclude: []
    },
    {
      id: 'auto_motorsport',
      name: 'Motorsport & Racing Analysis',
      include: [
        { term: 'formula 1 analysis', weight: 3 },
        { term: 'motogp race telemetry', weight: 3 },
        { term: 'rally racing wrc', weight: 3 },
        { term: 'le mans 24h', weight: 2 },
        { term: 'aerodynamic racecar', weight: 2 }
      ],
      exclude: []
    }
  ]);

  // 6. Fitness and Health
  addGenre('fitness', 'Fitness and Health', [26, 17], 6, [
    {
      id: 'fit_strength',
      name: 'Strength Training & Hypertrophy',
      include: [
        { term: 'hypertrophy training', weight: 3 },
        { term: 'deadlift form', weight: 3 },
        { term: 'squat technique', weight: 3 },
        { term: 'bench press', weight: 2 },
        { term: 'barbell workout', weight: 2 }
      ],
      exclude: ['fake weights drama']
    },
    {
      id: 'fit_endurance',
      name: 'Running, Cycling & Endurance',
      include: [
        { term: 'marathon training', weight: 3 },
        { term: 'cycling vo2max', weight: 3 },
        { term: 'heart rate zone training', weight: 3 },
        { term: 'triathlon', weight: 2 },
        { term: 'cadence pacing', weight: 2 }
      ],
      exclude: []
    },
    {
      id: 'fit_nutrition',
      name: 'Evidence-Based Nutrition',
      include: [
        { term: 'macronutrients', weight: 3 },
        { term: 'caloric deficit science', weight: 3 },
        { term: 'protein synthesis', weight: 3 },
        { term: 'dietary fiber metabolism', weight: 2 },
        { term: 'micronutrient absorption', weight: 2 }
      ],
      exclude: ['detox cleanse tea scam']
    },
    {
      id: 'fit_mobility',
      name: 'Mobility & Physical Therapy',
      include: [
        { term: 'mobility routine', weight: 3 },
        { term: 'physical therapy rehab', weight: 3 },
        { term: 'joint flexibility', weight: 2 },
        { term: 'spine posture correction', weight: 3 },
        { term: 'shoulder impingement exercises', weight: 3 }
      ],
      exclude: []
    }
  ]);

  // 7. Finance and Business
  addGenre('finance', 'Finance and Business', [25, 27], 7, [
    {
      id: 'fin_investing',
      name: 'Long-term Investing & Index Funds',
      include: [
        { term: 'index fund investing', weight: 3 },
        { term: 'etf portfolio', weight: 3 },
        { term: 'dividend reinvestment', weight: 2 },
        { term: 'compound interest', weight: 2 },
        { term: 'asset allocation', weight: 3 }
      ],
      exclude: ['100x gem', 'guaranteed pump']
    },
    {
      id: 'fin_macro',
      name: 'Macroeconomics & Market Cycles',
      include: [
        { term: 'federal reserve interest rates', weight: 3 },
        { term: 'inflation metrics', weight: 3 },
        { term: 'yield curve', weight: 3 },
        { term: 'monetary policy', weight: 2 },
        { term: 'gdp growth', weight: 2 }
      ],
      exclude: ['moon meme coin']
    },
    {
      id: 'fin_startups',
      name: 'Startups & Venture Capital',
      include: [
        { term: 'venture capital pitch', weight: 3 },
        { term: 'startup unit economics', weight: 3 },
        { term: 'product market fit', weight: 3 },
        { term: 'saas revenue metrics', weight: 2 },
        { term: 'angel investing', weight: 2 }
      ],
      exclude: []
    },
    {
      id: 'fin_personal',
      name: 'Personal Finance & Budgeting',
      include: [
        { term: 'emergency fund', weight: 3 },
        { term: 'tax optimization bracket', weight: 3 },
        { term: 'debt snowball avalanche', weight: 3 },
        { term: 'retirement 401k roth', weight: 3 },
        { term: 'frugal living budget', weight: 2 }
      ],
      exclude: []
    }
  ]);

  // 8. Gaming
  addGenre('gaming', 'Gaming', [20], 8, [
    {
      id: 'game_reviews',
      name: 'Game Critiques & Deep Reviews',
      include: [
        { term: 'game critique', weight: 3 },
        { term: 'video game review', weight: 3 },
        { term: 'game retrospective', weight: 3 },
        { term: 'gameplay analysis', weight: 2 },
        { term: 'level design breakdown', weight: 3 }
      ],
      exclude: ['screaming face', 'clickbait reaction']
    },
    {
      id: 'game_dev',
      name: 'Game Design & Development',
      include: [
        { term: 'game dev devlog', weight: 3 },
        { term: 'unreal engine 5', weight: 3 },
        { term: 'unity game development', weight: 3 },
        { term: 'pixel art animation', weight: 2 },
        { term: 'game mechanics design', weight: 2 }
      ],
      exclude: []
    },
    {
      id: 'game_esports',
      name: 'Esports & Competitive Analysis',
      include: [
        { term: 'esports tournament analysis', weight: 3 },
        { term: 'competitive meta breakdown', weight: 3 },
        { term: 'pro player strategy', weight: 3 },
        { term: 'match replay analysis', weight: 2 },
        { term: 'speedrun history documentary', weight: 3 }
      ],
      exclude: []
    },
    {
      id: 'game_rpg',
      name: 'RPGs & Strategy Gaming',
      include: [
        { term: 'rpg character build', weight: 3 },
        { term: 'grand strategy gameplay', weight: 3 },
        { term: 'turn based tactics', weight: 3 },
        { term: 'game lore walkthrough', weight: 2 },
        { term: 'dungeon crawler guide', weight: 2 }
      ],
      exclude: []
    }
  ]);

  // 9. Music
  addGenre('music', 'Music', [10], 9, [
    {
      id: 'mus_theory',
      name: 'Music Theory & Composition',
      include: [
        { term: 'music theory chord progression', weight: 3 },
        { term: 'harmonic analysis', weight: 3 },
        { term: 'counterpoint composition', weight: 3 },
        { term: 'modal interchange', weight: 2 },
        { term: 'songwriting arrangement', weight: 2 }
      ],
      exclude: []
    },
    {
      id: 'mus_production',
      name: 'Audio Production & Mixing',
      include: [
        { term: 'audio mixing mastering', weight: 3 },
        { term: 'daw fl studio ableton', weight: 3 },
        { term: 'equalizer compression tutorial', weight: 3 },
        { term: 'synthesizer sound design', weight: 2 },
        { term: 'vocal recording chain', weight: 2 }
      ],
      exclude: []
    },
    {
      id: 'mus_instruments',
      name: 'Instrument Mastery & Lessons',
      include: [
        { term: 'guitar lesson fingerstyle', weight: 3 },
        { term: 'piano tutorial sheet', weight: 3 },
        { term: 'drum rudiments groove', weight: 3 },
        { term: 'bass slap technique', weight: 2 },
        { term: 'instrument practice routine', weight: 2 }
      ],
      exclude: []
    },
    {
      id: 'mus_history',
      name: 'Music Documentaries & History',
      include: [
        { term: 'music genre evolution', weight: 3 },
        { term: 'band documentary retrospective', weight: 3 },
        { term: 'album breakdown commentary', weight: 3 },
        { term: 'origins of jazz hip hop', weight: 2 },
        { term: 'vinyl record culture', weight: 2 }
      ],
      exclude: []
    }
  ]);

  // 10. Film and TV
  addGenre('film', 'Film and TV', [1, 24], 10, [
    {
      id: 'film_cinematography',
      name: 'Cinematography & Directing',
      include: [
        { term: 'cinematography lighting', weight: 3 },
        { term: 'directing film analysis', weight: 3 },
        { term: 'camera lens visual style', weight: 3 },
        { term: 'color grading cinematic', weight: 2 },
        { term: 'aspect ratio film technique', weight: 2 }
      ],
      exclude: []
    },
    {
      id: 'film_video_essays',
      name: 'Video Essays & Scene Analysis',
      include: [
        { term: 'film video essay', weight: 3 },
        { term: 'movie scene breakdown', weight: 3 },
        { term: 'visual storytelling motifs', weight: 3 },
        { term: 'screenwriting character arc', weight: 2 },
        { term: 'director commentary critique', weight: 2 }
      ],
      exclude: ['screaming reaction']
    },
    {
      id: 'film_editing',
      name: 'Video Editing & Post-Production',
      include: [
        { term: 'video editing pacing', weight: 3 },
        { term: 'davinci resolve tutorial', weight: 3 },
        { term: 'premiere pro sound design', weight: 3 },
        { term: 'vfx visual effects cgi', weight: 2 },
        { term: 'montage theory cut', weight: 2 }
      ],
      exclude: []
    },
    {
      id: 'film_retrospectives',
      name: 'Classic Cinema & Retrospectives',
      include: [
        { term: 'cinema history retrospective', weight: 3 },
        { term: 'classic hollywood studio', weight: 3 },
        { term: 'film noir analysis', weight: 3 },
        { term: 'french new wave cinema', weight: 2 },
        { term: 'silent film restoration', weight: 2 }
      ],
      exclude: []
    }
  ]);

  // 11. Food and Cooking
  addGenre('food', 'Food and Cooking', [26], 11, [
    {
      id: 'food_culinary_science',
      name: 'Culinary Science & Techniques',
      include: [
        { term: 'food science maillard', weight: 3 },
        { term: 'culinary techniques knife skills', weight: 3 },
        { term: 'fermentation temperature', weight: 3 },
        { term: 'sous vide precision cooking', weight: 2 },
        { term: 'emulsion sauce chemistry', weight: 2 }
      ],
      exclude: ['10000 calorie challenge']
    },
    {
      id: 'food_recipes',
      name: 'Authentic Recipes & Cooking',
      include: [
        { term: 'traditional recipe authentic', weight: 3 },
        { term: 'step by step cooking', weight: 3 },
        { term: 'scratch homemade pasta', weight: 3 },
        { term: 'cast iron seasoning pan', weight: 2 },
        { term: 'artisan bread sourdough', weight: 2 }
      ],
      exclude: ['mukbang']
    },
    {
      id: 'food_culture',
      name: 'Regional Food History & Culture',
      include: [
        { term: 'food history documentary', weight: 3 },
        { term: 'street food culinary heritage', weight: 3 },
        { term: 'regional cuisine origin', weight: 3 },
        { term: 'ancient cooking methods', weight: 2 },
        { term: 'gastronomy culture', weight: 2 }
      ],
      exclude: []
    },
    {
      id: 'food_baking',
      name: 'Pastry, Baking & Desserts',
      include: [
        { term: 'french pastry technique', weight: 3 },
        { term: 'sourdough fermentation hydration', weight: 3 },
        { term: 'chocolate tempering technique', weight: 3 },
        { term: 'croissant lamination butter', weight: 2 },
        { term: 'baking chemistry gluten', weight: 2 }
      ],
      exclude: []
    }
  ]);

  // 12. Travel
  addGenre('travel', 'Travel', [19], 12, [
    {
      id: 'trav_guides',
      name: 'Destination Guides & Itineraries',
      include: [
        { term: 'travel guide itinerary', weight: 3 },
        { term: 'best things to do in', weight: 3 },
        { term: 'city walking tour guide', weight: 3 },
        { term: 'local recommendations travel', weight: 2 },
        { term: 'budget travel tips guide', weight: 2 }
      ],
      exclude: []
    },
    {
      id: 'trav_wilderness',
      name: 'Wilderness Expeditions & Hiking',
      include: [
        { term: 'thru hiking trail expedition', weight: 3 },
        { term: 'mountaineering summit climb', weight: 3 },
        { term: 'wilderness backcountry survival', weight: 3 },
        { term: 'national park trekking', weight: 2 },
        { term: 'bikepacking tour route', weight: 2 }
      ],
      exclude: []
    },
    {
      id: 'trav_culture',
      name: 'Cultural Immersion & Documentary',
      include: [
        { term: 'cultural documentary living with', weight: 3 },
        { term: 'remote village life', weight: 3 },
        { term: 'indigenous community traditions', weight: 3 },
        { term: 'historical architecture exploration', weight: 2 },
        { term: 'anthropology field dispatch', weight: 2 }
      ],
      exclude: []
    },
    {
      id: 'trav_transport',
      name: 'Train & Scenic Transport Journeys',
      include: [
        { term: 'scenic railway train journey', weight: 3 },
        { term: 'sleeper train cross country', weight: 3 },
        { term: 'ferry voyage ocean crossing', weight: 3 },
        { term: 'scenic road trip highway', weight: 2 },
        { term: 'transit system documentary', weight: 2 }
      ],
      exclude: []
    }
  ]);

  // 13. News and Politics
  addGenre('news_politics', 'News and Politics', [25], 13, [
    {
      id: 'np_geopolitics',
      name: 'Geopolitical Analysis & Foreign Affairs',
      include: [
        { term: 'geopolitics analysis', weight: 3 },
        { term: 'foreign policy diplomacy', weight: 3 },
        { term: 'international relations strategic', weight: 3 },
        { term: 'trade corridor supply chain', weight: 2 },
        { term: 'defense treaty strategic balance', weight: 2 }
      ],
      exclude: []
    },
    {
      id: 'np_investigative',
      name: 'Investigative Journalism',
      include: [
        { term: 'investigative reporting documentary', weight: 3 },
        { term: 'public records corruption expose', weight: 3 },
        { term: 'corporate malfeasance investigation', weight: 3 },
        { term: 'freedom of information inquiry', weight: 2 },
        { term: 'whistleblower testimony document', weight: 2 }
      ],
      exclude: []
    },
    {
      id: 'np_policy',
      name: 'Public Policy & Governance',
      include: [
        { term: 'public policy legislation debate', weight: 3 },
        { term: 'supreme court ruling legal', weight: 3 },
        { term: 'infrastructure funding bill', weight: 3 },
        { term: 'regulatory compliance policy', weight: 2 },
        { term: 'civic elections governance', weight: 2 }
      ],
      exclude: []
    },
    {
      id: 'np_daily',
      name: 'Daily News Briefings',
      include: [
        { term: 'daily news briefing recap', weight: 3 },
        { term: 'headline news summary report', weight: 3 },
        { term: 'press conference briefing', weight: 3 },
        { term: 'global affairs morning dispatch', weight: 2 },
        { term: 'market open news summary', weight: 2 }
      ],
      exclude: []
    }
  ]);

  // 14. Comedy
  addGenre('comedy', 'Comedy', [23], 14, [
    {
      id: 'com_standup',
      name: 'Stand-up Specials & Comedy Sets',
      include: [
        { term: 'stand up comedy special', weight: 3 },
        { term: 'comedian set live stage', weight: 3 },
        { term: 'open mic comedy routine', weight: 3 },
        { term: 'crowd work comedy clip', weight: 2 },
        { term: 'comedy club headliner', weight: 2 }
      ],
      exclude: []
    },
    {
      id: 'com_skits',
      name: 'Satire & Sketch Shows',
      include: [
        { term: 'sketch comedy satire', weight: 3 },
        { term: 'parody skit show', weight: 3 },
        { term: 'improv comedy scene', weight: 3 },
        { term: 'satirical news parody', weight: 2 },
        { term: 'character comedy sketch', weight: 2 }
      ],
      exclude: []
    },
    {
      id: 'com_podcasts',
      name: 'Comedy Podcasts & Banter',
      include: [
        { term: 'comedy podcast banter', weight: 3 },
        { term: 'comedians in studio interview', weight: 3 },
        { term: 'roast battle comedy roast', weight: 3 },
        { term: 'funny stories conversation', weight: 2 },
        { term: 'riffing comedic podcast', weight: 2 }
      ],
      exclude: []
    },
    {
      id: 'com_musical',
      name: 'Musical Comedy & Parodies',
      include: [
        { term: 'musical comedy parody', weight: 3 },
        { term: 'funny song spoof lyrics', weight: 3 },
        { term: 'comedic musical performance', weight: 3 },
        { term: 'satirical song cabaret', weight: 2 },
        { term: 'comedy music video spoof', weight: 2 }
      ],
      exclude: []
    }
  ]);

  // 15. Lifestyle and Vlogs
  addGenre('lifestyle', 'Lifestyle and Vlogs', [22], 15, [
    {
      id: 'life_minimalism',
      name: 'Minimalism & Simple Living',
      include: [
        { term: 'minimalism simple living', weight: 3 },
        { term: 'decluttering home organization', weight: 3 },
        { term: 'capsule wardrobe intentional', weight: 3 },
        { term: 'frugal intentional lifestyle', weight: 2 },
        { term: 'slow living routine diary', weight: 2 }
      ],
      exclude: []
    },
    {
      id: 'life_homesteading',
      name: 'Gardening & Off-Grid Living',
      include: [
        { term: 'homesteading garden harvest', weight: 3 },
        { term: 'off grid cabin solar build', weight: 3 },
        { term: 'permaculture soil regeneration', weight: 3 },
        { term: 'raising chickens backyard coop', weight: 2 },
        { term: 'rainwater collection DIY', weight: 2 }
      ],
      exclude: []
    },
    {
      id: 'life_maker',
      name: 'Woodworking & Maker Workshops',
      include: [
        { term: 'woodworking furniture build', weight: 3 },
        { term: 'carpentry joinery hand tools', weight: 3 },
        { term: 'workshop maker build project', weight: 3 },
        { term: 'welding metal fabrication shop', weight: 2 },
        { term: 'leathercraft hand stitched', weight: 2 }
      ],
      exclude: []
    },
    {
      id: 'life_architecture',
      name: 'Architecture & Tiny Homes',
      include: [
        { term: 'architectural design house tour', weight: 3 },
        { term: 'tiny house interior build', weight: 3 },
        { term: 'modern interior aesthetic design', weight: 3 },
        { term: 'renovation transformation vlog', weight: 2 },
        { term: 'passive solar house build', weight: 2 }
      ],
      exclude: []
    }
  ]);

  // 16. Motivation and Self-help
  addGenre('motivation', 'Motivation and Self-help', [27, 22], 16, [
    {
      id: 'mot_productivity',
      name: 'Productivity Systems & Deep Work',
      include: [
        { term: 'deep work focus routine', weight: 3 },
        { term: 'time blocking calendar system', weight: 3 },
        { term: 'productivity habits workflow', weight: 3 },
        { term: 'notion second brain workflow', weight: 2 },
        { term: 'dopamine detox discipline', weight: 2 }
      ],
      exclude: ['dropshipping get rich in 7 days']
    },
    {
      id: 'mot_habits',
      name: 'Habit Formation & Behavioral Science',
      include: [
        { term: 'atomic habits formation', weight: 3 },
        { term: 'behavioral psychology routine', weight: 3 },
        { term: 'neuroplasticity brain rewire', weight: 3 },
        { term: 'morning routine discipline', weight: 2 },
        { term: 'overcoming procrastination guide', weight: 2 }
      ],
      exclude: []
    },
    {
      id: 'mot_reading',
      name: 'Book Reviews & Reading Summaries',
      include: [
        { term: 'book summary key takeaways', weight: 3 },
        { term: 'reading list non fiction', weight: 3 },
        { term: 'book review analysis breakdown', weight: 3 },
        { term: 'literature comprehension notes', weight: 2 },
        { term: 'speed reading retention methods', weight: 2 }
      ],
      exclude: []
    },
    {
      id: 'mot_mindset',
      name: 'Resilience & Mental Toughness',
      include: [
        { term: 'mental toughness adversity', weight: 3 },
        { term: 'grit perseverance mindset', weight: 3 },
        { term: 'stoic resilience emotional control', weight: 3 },
        { term: 'growth mindset psychologist', weight: 2 },
        { term: 'self discipline motivation speech', weight: 2 }
      ],
      exclude: ['toxic sigma male grindset']
    }
  ]);

  // 17. Celebrity and Gossip
  addGenre('celebrity', 'Celebrity and Gossip', [24, 22], 17, [
    {
      id: 'cel_interviews',
      name: 'Celebrity In-Depth Interviews',
      include: [
        { term: 'celebrity interview fireside chat', weight: 3 },
        { term: 'actors on actors round table', weight: 3 },
        { term: 'career retrospective conversation', weight: 3 },
        { term: 'behind the camera story', weight: 2 },
        { term: 'hollywood premiere red carpet', weight: 2 }
      ],
      exclude: []
    },
    {
      id: 'cel_pop_culture',
      name: 'Pop Culture Essays & Analysis',
      include: [
        { term: 'pop culture retrospective essay', weight: 3 },
        { term: 'evolution of celebrity fame', weight: 3 },
        { term: 'fandom culture media analysis', weight: 3 },
        { term: 'paparazzi media ethics documentary', weight: 2 },
        { term: 'tabloid journalism history', weight: 2 }
      ],
      exclude: []
    },
    {
      id: 'cel_red_carpet',
      name: 'Fashion & Met Gala Analysis',
      include: [
        { term: 'met gala costume critique', weight: 3 },
        { term: 'red carpet fashion review', weight: 3 },
        { term: 'haute couture celebrity runway', weight: 3 },
        { term: 'designer archive styling history', weight: 2 },
        { term: 'celebrity wardrobe stylist breakdown', weight: 2 }
      ],
      exclude: []
    },
    {
      id: 'cel_gossip',
      name: 'Entertainment News & Tabloids',
      include: [
        { term: 'celebrity news update recap', weight: 3 },
        { term: 'hollywood gossip headline recap', weight: 3 },
        { term: 'entertainment industry drama', weight: 3 },
        { term: 'celeb relationship timeline', weight: 2 },
        { term: 'paparazzi footage exclusive report', weight: 2 }
      ],
      exclude: []
    }
  ]);

  return { genres, subgenres };
}
