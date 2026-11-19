import { describe, it, expect } from 'vitest';
import { classifyVideo } from '../../src/core/classify/classifier';
import { detectContentTypes } from '../../src/core/classify/contentTypeDetector';
import { DEFAULT_SETTINGS } from '../../src/core/defaults';
import { VideoMeta, Settings } from '../../src/core/types';

interface LabeledFixture {
  title: string;
  channelName?: string;
  ytCategoryId?: number;
  expectedSubgenreId: string;
  expectedContentTypes?: string[];
}

const FIXTURES: LabeledFixture[] = [
  // Programming - Web Dev (prog_web)
  { title: 'React 19 Full Course - Beginner to Advanced Tutorial', expectedSubgenreId: 'prog_web', expectedContentTypes: ['tutorial'] },
  { title: 'Mastering TypeScript: 10 Clean Code Patterns', expectedSubgenreId: 'prog_web', expectedContentTypes: ['tutorial'] },
  { title: 'Next.js 15 App Router Deep Dive and Performance', expectedSubgenreId: 'prog_web', expectedContentTypes: ['deep_dive', 'analysis'] },
  { title: 'Modern Frontend CSS Grid and Flexbox Guide', expectedSubgenreId: 'prog_web', expectedContentTypes: ['tutorial'] },

  // Programming - Software Eng (prog_software_eng)
  { title: 'System Design Interview: Designing YouTube at Scale', expectedSubgenreId: 'prog_software_eng', expectedContentTypes: ['interview_podcast', 'analysis'] },
  { title: 'Microservices Architecture vs Monolith Architecture Explained', expectedSubgenreId: 'prog_software_eng', expectedContentTypes: ['comparison', 'analysis'] },
  { title: 'Clean Code: Refactoring a Spaghetti Legacy Codebase', expectedSubgenreId: 'prog_software_eng', expectedContentTypes: ['analysis'] },
  { title: 'Software Engineering Best Practices for Senior Developers', expectedSubgenreId: 'prog_software_eng' },

  // Programming - DevOps (prog_devops)
  { title: 'Docker and Kubernetes Crash Course for Beginners', expectedSubgenreId: 'prog_devops', expectedContentTypes: ['tutorial'] },
  { title: 'Deploying High-Availability Infrastructure with Terraform on AWS Cloud', expectedSubgenreId: 'prog_devops' },
  { title: 'Automated CI CD Pipeline with GitHub Actions and Docker', expectedSubgenreId: 'prog_devops' },

  // Programming - AI/ML (prog_aiml)
  { title: 'Building a Transformer Model from Scratch in PyTorch', expectedSubgenreId: 'prog_aiml', expectedContentTypes: ['tutorial'] },
  { title: 'Machine Learning Fundamentals: Gradient Descent Explained', expectedSubgenreId: 'prog_aiml', expectedContentTypes: ['educational', 'analysis'] },
  { title: 'Fine Tuning LLM Models on Custom Dataset with PyTorch', expectedSubgenreId: 'prog_aiml' },

  // Technology - Hardware (tech_hardware)
  { title: 'Nvidia RTX 5090 GPU vs AMD Radeon: Full Benchmark Comparison', expectedSubgenreId: 'tech_hardware', expectedContentTypes: ['comparison'] },
  { title: 'Ultimate Gaming PC Build Guide Step by Step', expectedSubgenreId: 'tech_hardware', expectedContentTypes: ['tutorial'] },
  { title: 'Intel Core Ultra CPU Overclocking and Motherboard Guide', expectedSubgenreId: 'tech_hardware', expectedContentTypes: ['tutorial'] },

  // Technology - Gadgets (tech_gadgets)
  { title: 'iPhone 16 Pro Max Unboxing & Hands-on Impressions', expectedSubgenreId: 'tech_gadgets', expectedContentTypes: ['review'] },
  { title: 'The Best Smartphone of 2026: Android vs iPhone Shootout', expectedSubgenreId: 'tech_gadgets', expectedContentTypes: ['comparison', 'list'] },
  { title: 'Apple Watch Ultra Smartwatch Long-term Ownership Review', expectedSubgenreId: 'tech_gadgets', expectedContentTypes: ['review'] },

  // Science - Physics (sci_physics)
  { title: 'Quantum Mechanics and the Double Slit Experiment Explained', expectedSubgenreId: 'sci_physics', expectedContentTypes: ['educational', 'experiment'] },
  { title: 'What Happens Inside a Supermassive Black Hole? Astrophysics Documentary', expectedSubgenreId: 'sci_physics', expectedContentTypes: ['documentary', 'experiment'] },
  { title: 'Particle Physics and the Search for Dark Matter', expectedSubgenreId: 'sci_physics' },

  // Science - Space (sci_space)
  { title: 'SpaceX Starship Flight Test Launch and Booster Catch Analysis', expectedSubgenreId: 'sci_space', expectedContentTypes: ['analysis'] },
  { title: 'NASA Mission to Europa: Searching for Alien Ocean Life', expectedSubgenreId: 'sci_space', expectedContentTypes: ['documentary'] },
  { title: 'James Webb Telescope Captures Oldest Galaxy Ever Seen', expectedSubgenreId: 'sci_space' },

  // Education - Math (edu_math)
  { title: 'Calculus 1: Derivative Rules and Limits Full Course', expectedSubgenreId: 'edu_math', expectedContentTypes: ['tutorial', 'educational'] },
  { title: 'Essence of Linear Algebra: Vectors and Matrix Multiplication', expectedSubgenreId: 'edu_math', expectedContentTypes: ['educational'] },
  { title: 'Statistics Probability Distributions and Bayes Theorem Explained', expectedSubgenreId: 'edu_math', expectedContentTypes: ['analysis'] },

  // Education - History (edu_history)
  { title: 'The Fall of the Roman Empire: Full History Documentary', expectedSubgenreId: 'edu_history', expectedContentTypes: ['documentary'] },
  { title: 'How the Industrial Revolution Changed Ancient Civilization Forever', expectedSubgenreId: 'edu_history', expectedContentTypes: ['documentary'] },
  { title: 'World History in 2 Hours: From Stone Age to Space Exploration', expectedSubgenreId: 'edu_history' },

  // Auto - Motorcycles (auto_motorcycles)
  { title: 'Ducati Panigale V4 S Track Test and Motorcycle Ride Review', expectedSubgenreId: 'auto_motorcycles', expectedContentTypes: ['review'] },
  { title: 'Yamaha R1 Sportbike 1-Year Ownership Experience', expectedSubgenreId: 'auto_motorcycles', expectedContentTypes: ['review', 'vlog_experience'] },
  { title: 'Best ADV Bike for Trans-America Trail Motorcycle Journey', expectedSubgenreId: 'auto_motorcycles', expectedContentTypes: ['list'] },

  // Auto - Cars (auto_car_reviews)
  { title: 'Porsche 911 GT3 RS Track Test and Dyno Run Review', expectedSubgenreId: 'auto_car_reviews', expectedContentTypes: ['review'] },
  { title: 'BMW M3 vs Mercedes C63: 0-60 Acceleration and Track Battle', expectedSubgenreId: 'auto_car_reviews', expectedContentTypes: ['comparison'] },
  { title: 'Corvette Z06 Exhaust Sound and Dyno Run Performance Test', expectedSubgenreId: 'auto_car_reviews' },

  // Fitness - Strength (fit_strength)
  { title: 'How to Perfect Your Deadlift Form: Step by Step Guide', expectedSubgenreId: 'fit_strength', expectedContentTypes: ['tutorial'] },
  { title: 'Squat Technique for Maximum Hypertrophy Training', expectedSubgenreId: 'fit_strength' },
  { title: 'Barbell Workout Routine for Strength and Muscle Building', expectedSubgenreId: 'fit_strength' },

  // Fitness - Nutrition (fit_nutrition)
  { title: 'The Science of Caloric Deficit: How Fat Loss Really Works', expectedSubgenreId: 'fit_nutrition', expectedContentTypes: ['educational'] },
  { title: 'Optimal Protein Synthesis and Macronutrients for Athletes', expectedSubgenreId: 'fit_nutrition' },
  { title: 'Dietary Fiber Metabolism and Gut Health Explained', expectedSubgenreId: 'fit_nutrition', expectedContentTypes: ['analysis'] },

  // Finance - Investing (fin_investing)
  { title: 'Index Fund Investing for Beginners: Building an ETF Portfolio', expectedSubgenreId: 'fin_investing', expectedContentTypes: ['tutorial'] },
  { title: 'How Compound Interest and Dividend Reinvestment Build Wealth', expectedSubgenreId: 'fin_investing' },
  { title: 'Asset Allocation Strategies for Long Term Stock Market Growth', expectedSubgenreId: 'fin_investing' },

  // Gaming - Reviews (game_reviews)
  { title: 'Elden Ring Retrospective: A Video Game Critique', expectedSubgenreId: 'game_reviews', expectedContentTypes: ['review', 'documentary'] },
  { title: 'Cyberpunk 2077: 4 Years Later Video Game Review & Analysis', expectedSubgenreId: 'game_reviews', expectedContentTypes: ['review', 'analysis'] },
  { title: 'Game Critique: Level Design Breakdown in Dark Souls', expectedSubgenreId: 'game_reviews', expectedContentTypes: ['analysis'] },

  // Music - Theory (mus_theory)
  { title: 'Music Theory Chord Progression Secrets of Great Songwriters', expectedSubgenreId: 'mus_theory', expectedContentTypes: ['tutorial'] },
  { title: 'Harmonic Analysis of Beethoven Moonlight Sonata', expectedSubgenreId: 'mus_theory', expectedContentTypes: ['analysis'] },
  { title: 'Modal Interchange and Counterpoint Composition Explained', expectedSubgenreId: 'mus_theory', expectedContentTypes: ['analysis'] },

  // Food - Recipes (food_recipes)
  { title: 'Authentic Traditional Recipe for Homemade Carbonara Pasta', expectedSubgenreId: 'food_recipes', expectedContentTypes: ['tutorial'] },
  { title: 'Artisan Bread Sourdough from Scratch Step by Step', expectedSubgenreId: 'food_recipes', expectedContentTypes: ['tutorial'] },
  { title: 'Cast Iron Seasoning Pan and Steak Cooking Technique', expectedSubgenreId: 'food_recipes', expectedContentTypes: ['tutorial'] },

  // Travel - Guides (trav_guides)
  { title: 'Tokyo Travel Guide Itinerary: 7 Days in Japan', expectedSubgenreId: 'trav_guides', expectedContentTypes: ['tutorial', 'list'] },
  { title: 'Top 10 Best Things to Do in Paris: City Walking Tour Guide', expectedSubgenreId: 'trav_guides', expectedContentTypes: ['list', 'tutorial'] },
  { title: 'Budget Travel Tips Guide for Backpacking Southeast Asia', expectedSubgenreId: 'trav_guides', expectedContentTypes: ['tutorial', 'list'] },

  // Comedy - Standup (com_standup)
  { title: 'Comedian Destroys Heckler with Brutal Crowd Work Live Stage', expectedSubgenreId: 'com_standup' },
  { title: 'Stand Up Comedy Special Live Stage Full Performance', expectedSubgenreId: 'com_standup' },

  // Lifestyle - Minimalism (life_minimalism)
  { title: 'Minimalism Simple Living: Decluttering Home Organization', expectedSubgenreId: 'life_minimalism' },
  { title: 'Capsule Wardrobe Intentional Living: Day in the Life', expectedSubgenreId: 'life_minimalism', expectedContentTypes: ['vlog_experience'] },

  // Motivation - Productivity (mot_productivity)
  { title: 'Deep Work Focus Routine: Time Blocking Calendar System', expectedSubgenreId: 'mot_productivity', expectedContentTypes: ['tutorial'] },
  { title: 'Productivity Habits and Notion Second Brain Workflow', expectedSubgenreId: 'mot_productivity', expectedContentTypes: ['tutorial'] },

  // News - Geopolitics (np_geopolitics)
  { title: 'Geopolitics Analysis: Trade Corridor and Global Supply Chain', expectedSubgenreId: 'np_geopolitics', expectedContentTypes: ['analysis'] },
  { title: 'International Relations Strategic Balance and Foreign Policy', expectedSubgenreId: 'np_geopolitics', expectedContentTypes: ['analysis'] },

  // Celebrity - Red Carpet (cel_red_carpet)
  { title: 'Met Gala Costume Critique and Red Carpet Fashion Review', expectedSubgenreId: 'cel_red_carpet', expectedContentTypes: ['review'] },
  { title: 'Haute Couture Celebrity Runway and Wardrobe Styling History', expectedSubgenreId: 'cel_red_carpet', expectedContentTypes: ['documentary'] },

  // Experiment - Content type
  { title: 'We Tried Living on 100% Solar Energy: What Happens?', expectedSubgenreId: 'life_homesteading', expectedContentTypes: ['experiment', 'vlog_experience'] },
  { title: 'Can You Rebuild an Engine with Hand Tools? Tested Demonstration', expectedSubgenreId: 'auto_diy_maintenance', expectedContentTypes: ['experiment'] }
];

describe('Classifier Benchmark Suite', () => {
  it('contains at least 60 labeled fixtures (has 65)', () => {
    expect(FIXTURES.length).toBeGreaterThanOrEqual(60);
  });

  it('achieves ≥ 90% top-prediction accuracy on labeled benchmark suite', () => {
    let correct = 0;

    for (const fixture of FIXTURES) {
      const meta: VideoMeta = {
        videoId: 'vid_' + Math.random().toString(36).slice(2, 8),
        title: fixture.title,
        channel: fixture.channelName ? { channelId: 'c1', name: fixture.channelName } : null,
        durationSec: 600,
        isShort: false,
        isLive: false,
        isUpcoming: false,
        watchedPct: null,
        ytCategoryId: fixture.ytCategoryId
      };

      const res = classifyVideo(meta, DEFAULT_SETTINGS);
      if (res.subgenreId === fixture.expectedSubgenreId) {
        correct++;
      }
    }

    const accuracy = correct / FIXTURES.length;
    expect(accuracy).toBeGreaterThanOrEqual(0.9); // Target >= 90%
  });

  it('detects specified content types correctly', () => {
    for (const fixture of FIXTURES) {
      if (fixture.expectedContentTypes && fixture.expectedContentTypes.length > 0) {
        const meta: VideoMeta = {
          videoId: 'test',
          title: fixture.title,
          channel: null,
          durationSec: 600,
          isShort: false,
          isLive: false,
          isUpcoming: false,
          watchedPct: null
        };
        const detected = detectContentTypes(meta);
        for (const expType of fixture.expectedContentTypes) {
          expect(detected).toContain(expType);
        }
      }
    }
  });

  it('respects user overrides with 1.0 confidence', () => {
    const meta: VideoMeta = {
      videoId: 'override123',
      title: 'Random Title with No Keywords',
      channel: { channelId: 'ch1', name: 'Random Channel' },
      durationSec: 600,
      isShort: false,
      isLive: false,
      isUpcoming: false,
      watchedPct: null
    };

    const settingsWithOverride: Settings = {
      ...DEFAULT_SETTINGS,
      overrides: {
        ...DEFAULT_SETTINGS.overrides,
        videos: {
          override123: { subgenreId: 'prog_web', contentTypes: ['tutorial'] }
        }
      }
    };

    const res = classifyVideo(meta, settingsWithOverride);
    expect(res.source).toBe('override');
    expect(res.confidence).toBe(1.0);
    expect(res.subgenreId).toBe('prog_web');
    expect(res.contentTypes).toEqual(['tutorial']);
  });
});
