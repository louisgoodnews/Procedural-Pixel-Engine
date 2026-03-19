/**
 * Interactive tutorial system
 * Provides step-by-step interactive tutorials and examples
 */

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  content: TutorialContent;
  validation?: TutorialValidation;
  hints?: TutorialHint[];
  expectedOutput?: string;
  estimatedTime: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface TutorialContent {
  type: 'text' | 'code' | 'interactive' | 'video' | 'exercise';
  data: string | InteractiveTutorialData;
  language?: string;
  interactive?: InteractiveTutorialData;
  code?: {
    runnable: boolean;
    editable: boolean;
    initialCode: string;
    expectedCode?: string;
  };
}

export interface InteractiveTutorialData {
  type: 'canvas' | 'code-editor' | 'quiz' | 'drag-drop' | 'simulation';
  config: any;
  initialData?: any;
  expectedState?: any;
}

export interface TutorialValidation {
  type: 'code' | 'output' | 'state' | 'custom';
  validator: (data: any) => boolean | Promise<boolean>;
  successMessage: string;
  failureMessage: string;
  allowSkip?: boolean;
}

export interface TutorialHint {
  type: 'text' | 'code' | 'visual';
  content: string;
  cost?: number; // points deducted for using hint
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
  prerequisites: string[];
  learningObjectives: string[];
  steps: TutorialStep[];
  resources: TutorialResource[];
  author: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TutorialResource {
  type: 'link' | 'file' | 'video' | 'documentation';
  title: string;
  url?: string;
  content?: string;
  description: string;
}

export interface TutorialProgress {
  tutorialId: string;
  stepId: string;
  completed: boolean;
  score: number;
  hintsUsed: number;
  timeSpent: number;
  attempts: number;
  completedAt?: Date;
}

export interface TutorialSession {
  id: string;
  tutorial: Tutorial;
  progress: Map<string, TutorialProgress>;
  startTime: Date;
  endTime?: Date;
  totalScore: number;
  completed: boolean;
}

export interface TutorialConfig {
  enableHints: boolean;
  enableScoring: boolean;
  enableProgressSaving: boolean;
  maxHintsPerStep: number;
  hintPenalty: number;
  skipPenalty: number;
  completionThreshold: number;
  autoSave: boolean;
  saveInterval: number; // milliseconds
}

export class TutorialSystem {
  private tutorials = new Map<string, Tutorial>();
  private sessions = new Map<string, TutorialSession>();
  private currentSession: TutorialSession | null = null;
  private config: TutorialConfig;

  constructor(config: Partial<TutorialConfig> = {}) {
    this.config = {
      enableHints: true,
      enableScoring: true,
      enableProgressSaving: true,
      maxHintsPerStep: 3,
      hintPenalty: 10,
      skipPenalty: 25,
      completionThreshold: 80,
      autoSave: true,
      saveInterval: 30000, // 30 seconds
      ...config,
    };
  }

  /**
   * Register a tutorial
   */
  registerTutorial(tutorial: Tutorial): void {
    this.tutorials.set(tutorial.id, tutorial);
  }

  /**
   * Get all tutorials
   */
  getTutorials(): Tutorial[] {
    return Array.from(this.tutorials.values());
  }

  /**
   * Get tutorial by ID
   */
  getTutorial(id: string): Tutorial | undefined {
    return this.tutorials.get(id);
  }

  /**
   * Get tutorials by category
   */
  getTutorialsByCategory(category: string): Tutorial[] {
    return this.getTutorials().filter(tutorial => tutorial.category === category);
  }

  /**
   * Get tutorials by difficulty
   */
  getTutorialsByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): Tutorial[] {
    return this.getTutorials().filter(tutorial => tutorial.difficulty === difficulty);
  }

  /**
   * Search tutorials
   */
  searchTutorials(query: string): Tutorial[] {
    const lowerQuery = query.toLowerCase();
    return this.getTutorials().filter(tutorial => 
      tutorial.title.toLowerCase().includes(lowerQuery) ||
      tutorial.description.toLowerCase().includes(lowerQuery) ||
      tutorial.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      tutorial.category.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Start a tutorial session
   */
  async startTutorial(tutorialId: string): Promise<TutorialSession> {
    const tutorial = this.tutorials.get(tutorialId);
    if (!tutorial) {
      throw new Error(`Tutorial '${tutorialId}' not found`);
    }

    const sessionId = this.generateSessionId();
    const session: TutorialSession = {
      id: sessionId,
      tutorial,
      progress: new Map<string, TutorialProgress>(),
      startTime: new Date(),
      totalScore: 0,
      completed: false,
    };

    // Initialize progress for each step
    for (const step of tutorial.steps) {
      session.progress.set(step.id, {
        tutorialId,
        stepId: step.id,
        completed: false,
        score: 0,
        hintsUsed: 0,
        timeSpent: 0,
        attempts: 0,
      });
    }

    this.sessions.set(sessionId, session);
    this.currentSession = session;

    if (this.config.autoSave) {
      this.startAutoSave(sessionId);
    }

    return session;
  }

  /**
   * Get current session
   */
  getCurrentSession(): TutorialSession | null {
    return this.currentSession;
  }

  /**
   * Complete a tutorial step
   */
  async completeStep(stepId: string, data?: any): Promise<boolean> {
    if (!this.currentSession) {
      throw new Error('No active tutorial session');
    }

    const step = this.currentSession.tutorial.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error(`Step '${stepId}' not found in current tutorial`);
    }

    const progress = this.currentSession.progress.get(stepId);
    if (!progress) {
      throw new Error(`No progress found for step '${stepId}'`);
    }

    progress.attempts++;
    progress.timeSpent += Date.now() - this.currentSession.startTime.getTime();

    // Validate step completion
    if (step.validation) {
      let isValid = false;
      try {
        isValid = await step.validation.validator(data);
      } catch (error) {
        console.error('Step validation error:', error);
        isValid = false;
      }

      if (isValid) {
        progress.completed = true;
        progress.completedAt = new Date();
        
        // Calculate score
        if (this.config.enableScoring) {
          const baseScore = 100;
          const hintDeduction = progress.hintsUsed * this.config.hintPenalty;
          const attemptDeduction = Math.max(0, (progress.attempts - 1) * 5);
          progress.score = Math.max(0, baseScore - hintDeduction - attemptDeduction);
          this.currentSession.totalScore += progress.score;
        }

        console.log(`Step '${step.title}' completed! Score: ${progress.score}`);
        return true;
      } else {
        console.log(`Step validation failed: ${step.validation.failureMessage}`);
        return false;
      }
    } else {
      // No validation required, mark as completed
      progress.completed = true;
      progress.completedAt = new Date();
      progress.score = 100;
      this.currentSession.totalScore += progress.score;
      return true;
    }
  }

  /**
   * Get hint for current step
   */
  getHint(stepId: string, hintIndex: number): TutorialHint | null {
    if (!this.currentSession || !this.config.enableHints) {
      return null;
    }

    const step = this.currentSession.tutorial.steps.find(s => s.id === stepId);
    if (!step || !step.hints || hintIndex >= step.hints.length) {
      return null;
    }

    const progress = this.currentSession.progress.get(stepId);
    if (!progress || progress.hintsUsed >= this.config.maxHintsPerStep) {
      return null;
    }

    progress.hintsUsed++;
    return step.hints[hintIndex];
  }

  /**
   * Skip current step
   */
  skipStep(stepId: string): boolean {
    if (!this.currentSession) {
      return false;
    }

    const step = this.currentSession.tutorial.steps.find(s => s.id === stepId);
    if (!step || !step.validation?.allowSkip) {
      return false;
    }

    const progress = this.currentSession.progress.get(stepId);
    if (!progress) {
      return false;
    }

    progress.completed = true;
    progress.completedAt = new Date();
    progress.score = Math.max(0, 100 - this.config.skipPenalty);
    this.currentSession.totalScore += progress.score;

    console.log(`Step '${step.title}' skipped. Score: ${progress.score}`);
    return true;
  }

  /**
   * Check if tutorial is completed
   */
  isTutorialCompleted(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const allStepsCompleted = session.tutorial.steps.every(step => {
      const progress = session.progress.get(step.id);
      return progress?.completed || false;
    });

    if (allStepsCompleted && !session.completed) {
      session.completed = true;
      session.endTime = new Date();
      
      const averageScore = session.totalScore / session.tutorial.steps.length;
      const passed = averageScore >= this.config.completionThreshold;
      
      console.log(`Tutorial '${session.tutorial.title}' completed!`);
      console.log(`Total Score: ${session.totalScore}, Average: ${averageScore.toFixed(1)}`);
      console.log(`Status: ${passed ? 'PASSED' : 'FAILED'}`);
    }

    return allStepsCompleted;
  }

  /**
   * Get tutorial progress
   */
  getProgress(sessionId: string): Map<string, TutorialProgress> | null {
    const session = this.sessions.get(sessionId);
    return session ? session.progress : null;
  }

  /**
   * Save session progress
   */
  async saveProgress(sessionId: string): Promise<void> {
    if (!this.config.enableProgressSaving) return;

    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      // In a real implementation, this would save to localStorage or backend
      const progressData = {
        sessionId,
        tutorialId: session.tutorial.id,
        progress: Array.from(session.progress.entries()),
        totalScore: session.totalScore,
        completed: session.completed,
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem(`tutorial_progress_${sessionId}`, JSON.stringify(progressData));
      console.log(`Progress saved for session ${sessionId}`);
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }

  /**
   * Load session progress
   */
  async loadProgress(sessionId: string): Promise<Map<string, TutorialProgress> | null> {
    if (!this.config.enableProgressSaving) return null;

    try {
      const savedData = localStorage.getItem(`tutorial_progress_${sessionId}`);
      if (!savedData) return null;

      const progressData = JSON.parse(savedData);
      const progress = new Map<string, TutorialProgress>(progressData.progress);
      
      // Update existing session or create new one
      if (this.sessions.has(sessionId)) {
        this.sessions.get(sessionId)!.progress = progress;
      } else {
        // Need to reload tutorial to create session
        const tutorialId = progressData.tutorialId;
        const tutorial = this.tutorials.get(tutorialId);
        if (tutorial) {
          const session: TutorialSession = {
            id: sessionId,
            tutorial,
            progress,
            startTime: new Date(progressData.savedAt),
            totalScore: progressData.totalScore,
            completed: progressData.completed,
          };
          this.sessions.set(sessionId, session);
        }
      }

      console.log(`Progress loaded for session ${sessionId}`);
      return progress;
    } catch (error) {
      console.error('Failed to load progress:', error);
      return null;
    }
  }

  /**
   * Get current step
   */
  getCurrentStep(): TutorialStep | null {
    if (!this.currentSession) return null;

    for (const step of this.currentSession.tutorial.steps) {
      const progress = this.currentSession.progress.get(step.id);
      if (!progress?.completed) {
        return step;
      }
    }

    return null;
  }

  /**
   * Get next step
   */
  getNextStep(): TutorialStep | null {
    if (!this.currentSession) return null;

    const currentStep = this.getCurrentStep();
    if (!currentStep) return null;

    const currentIndex = this.currentSession.tutorial.steps.findIndex(s => s.id === currentStep.id);
    return this.currentSession.tutorial.steps[currentIndex + 1] || null;
  }

  /**
   * Get previous step
   */
  getPreviousStep(): TutorialStep | null {
    if (!this.currentSession) return null;

    const currentStep = this.getCurrentStep();
    if (!currentStep) return null;

    const currentIndex = this.currentSession.tutorial.steps.findIndex(s => s.id === currentStep.id);
    return currentIndex > 0 ? this.currentSession.tutorial.steps[currentIndex - 1] : null;
  }

  /**
   * End current session
   */
  endSession(): void {
    if (!this.currentSession) return;

    this.currentSession.endTime = new Date();
    this.saveProgress(this.currentSession.id);
    
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    console.log(`Session '${this.currentSession.id}' ended`);
    this.currentSession = null;
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const completedSteps = Array.from(session.progress.values()).filter(p => p.completed).length;
    const totalSteps = session.tutorial.steps.length;
    const completionPercentage = (completedSteps / totalSteps) * 100;
    const totalTime = session.endTime ? 
      session.endTime.getTime() - session.startTime.getTime() : 
      Date.now() - session.startTime.getTime();

    return {
      sessionId,
      tutorialTitle: session.tutorial.title,
      completedSteps,
      totalSteps,
      completionPercentage,
      totalTime,
      totalScore: session.totalScore,
      averageScore: totalSteps > 0 ? session.totalScore / totalSteps : 0,
      hintsUsed: Array.from(session.progress.values()).reduce((sum, p) => sum + p.hintsUsed, 0),
      isCompleted: session.completed,
    };
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start auto-save interval
   */
  private startAutoSave(sessionId: string): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = setInterval(() => {
      this.saveProgress(sessionId);
    }, this.config.saveInterval);
  }

  private autoSaveInterval: NodeJS.Timeout | null = null;
}

// Built-in tutorials
export const BUILTIN_TUTORIALS: Tutorial[] = [
  {
    id: 'getting-started',
    title: 'Getting Started with the Engine',
    description: 'Learn the basics of setting up and running your first engine instance',
    category: 'basics',
    tags: ['beginner', 'setup', 'introduction'],
    difficulty: 'beginner',
    estimatedTime: 15,
    prerequisites: [],
    learningObjectives: [
      'Understand engine architecture',
      'Create a basic engine instance',
      'Run a simple rendering loop',
    ],
    steps: [
      {
        id: 'setup',
        title: 'Project Setup',
        description: 'Set up your development environment and create your first engine project',
        content: {
          type: 'text',
          data: `
# Project Setup

Welcome to the Procedural Pixel Engine! This tutorial will guide you through setting up your first project.

## Prerequisites
- Modern web browser with JavaScript support
- Basic knowledge of JavaScript/TypeScript
- Text editor or IDE

## Step 1: Create Project Structure

Create a new folder for your project and add the following files:

\`\`\`
my-engine-project/
├── index.html
├── src/
│   ├── main.js
│   └── engine.js
└── assets/
    └── images/
\`\`\`

## Step 2: Basic HTML Setup

Create an index.html file with the following content:

\`\`\`html
<!DOCTYPE html>
<html>
<head>
    <title>My Engine Project</title>
    <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
        canvas { border: 1px solid #ccc; }
    </style>
</head>
<body>
    <h1>Procedural Pixel Engine</h1>
    <canvas id="gameCanvas" width="800" height="600"></canvas>
    <script src="src/main.js"></script>
</body>
</html>
\`\`\`

Click "Next" when you're ready to continue.
          `,
        },
        estimatedTime: 5,
        difficulty: 'beginner',
      },
      {
        id: 'engine-init',
        title: 'Initialize the Engine',
        description: 'Create and configure your first engine instance',
        content: {
          type: 'code',
          data: `
// src/main.js
import { Engine } from './engine.js';

// Create engine instance
const engine = new Engine({
  canvas: document.getElementById('gameCanvas'),
  width: 800,
  height: 600,
  backgroundColor: '#1a1a1a'
});

// Start the engine
engine.start();

console.log('Engine started successfully!');
          `,
          code: {
            runnable: true,
            editable: true,
            initialCode: `// Import the engine
import { Engine } from './engine.js';

// Create engine instance
const engine = new Engine({
  canvas: document.getElementById('gameCanvas'),
  width: 800,
  height: 600,
  backgroundColor: '#1a1a1a'
});

// Start the engine
engine.start();`,
          },
        },
        validation: {
          type: 'custom',
          validator: (data) => {
            // Check if engine was created and started
            return data && data.includes('new Engine') && data.includes('engine.start()');
          },
          successMessage: 'Great! You\'ve successfully initialized the engine.',
          failureMessage: 'Make sure you create an engine instance and call start().',
        },
        hints: [
          {
            type: 'text',
            content: 'Remember to import the Engine class from your engine module',
            cost: 5,
          },
          {
            type: 'code',
            content: 'const engine = new Engine({ canvas: document.getElementById("gameCanvas") });',
            cost: 10,
          },
        ],
        estimatedTime: 8,
        difficulty: 'beginner',
      },
      {
        id: 'first-render',
        title: 'Your First Render',
        description: 'Create and render your first pixel entity',
        content: {
          type: 'interactive',
          data: {
            type: 'canvas',
            config: {
              width: 800,
              height: 600,
              backgroundColor: '#1a1a1a',
            },
          } as InteractiveTutorialData,
        },
        validation: {
          type: 'output',
          validator: (data) => {
            // Check if canvas shows content
            return data && data.includes('pixel') || data.includes('render');
          },
          successMessage: 'Excellent! You\'ve rendered your first pixel!',
          failureMessage: 'Try creating a pixel entity and adding it to the engine',
        },
        estimatedTime: 10,
        difficulty: 'beginner',
      },
    ],
    resources: [
      {
        type: 'documentation',
        title: 'Engine API Reference',
        description: 'Complete API documentation for the engine',
        url: '/docs/api',
      },
      {
        type: 'video',
        title: 'Video Tutorial',
        description: 'Watch a video walkthrough of this tutorial',
        url: '/tutorials/getting-started-video',
      },
    ],
    author: 'Engine Team',
    version: '1.0.0',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'pixel-art-basics',
    title: 'Pixel Art Basics',
    description: 'Learn how to create and manipulate pixel art in the engine',
    category: 'art',
    tags: ['pixel-art', 'graphics', 'intermediate'],
    difficulty: 'intermediate',
    estimatedTime: 30,
    prerequisites: ['getting-started'],
    learningObjectives: [
      'Create pixel art entities',
      'Understand pixel matrices',
      'Apply colors and patterns',
      'Animate pixel art',
    ],
    steps: [
      {
        id: 'pixel-matrix',
        title: 'Understanding Pixel Matrices',
        description: 'Learn how pixel matrices work in the engine',
        content: {
          type: 'code',
          data: `
// Creating a simple 8x8 pixel art
const pixelArt = {
  width: 8,
  height: 8,
  matrix: [
    ['#', '#', '#', '#', '#', '#', '#', '#', '#'],
    ['#', '#', '#', '#', '#', '#', '#', '#'],
    ['#', '#', '#', '#', '#', '#', '#', '#'],
    ['#', '#', '#', '#', '#', '#', '#', '#'],
    ['#', '#', '#', '#', '#', '#', '#', '#'],
    ['#', '#', '#', '#', '#', '#', '#', '#'],
    ['#', '#', '#', '#', '#', '#', '#', '#'],
    ['#', '#', '#', '#', '#', '#', '#', '#'],
  ]
};

// Add to engine
const entity = engine.createEntity();
engine.addComponent(entity, 'pixelArt', pixelArt);
engine.addComponent(entity, 'position', { x: 100, y: 100 });
          `,
          code: {
            runnable: true,
            editable: true,
            initialCode: `// Create pixel art matrix
const pixelArt = {
  width: 8,
  height: 8,
  matrix: [
    ['#', '#', '#', '#', '#', '#', '#', '#', '#'],
    ['#', '#', '#', '#', '#', '#', '#', '#'],
    ['#', '#', '#', '#', '#', '#', '#', '#'],
    ['#', '#', '#', '#', '#', '#', '#', '#'],
    ['#', '#', '#', '#', '#', '#', '#', '#'],
    ['#', '#', '#', '#', '#', '#', '#', '#'],
    ['#', '#', '#', '#', '#', '#', '#', '#'],
    ['#', '#', '#', '#', '#', '#', '#', '#'],
  ]
};

// Add to engine
const entity = engine.createEntity();
engine.addComponent(entity, 'pixelArt', pixelArt);
engine.addComponent(entity, 'position', { x: 100, y: 100 });`,
          },
        },
        validation: {
          type: 'code',
          validator: (data) => {
            return data && data.includes('pixelArt') && data.includes('matrix') && data.includes('8');
          },
          successMessage: 'Perfect! You understand pixel matrices.',
          failureMessage: 'Make sure to create a pixelArt object with width, height, and matrix properties',
        },
        estimatedTime: 10,
        difficulty: 'intermediate',
      },
    ],
    resources: [
      {
        type: 'documentation',
        title: 'Pixel Art Guide',
        description: 'Comprehensive guide to pixel art creation',
        url: '/docs/pixel-art',
      },
    ],
    author: 'Engine Team',
    version: '1.0.0',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
];

// Global tutorial system instance
export const tutorialSystem = new TutorialSystem();

// Register built-in tutorials
BUILTIN_TUTORIALS.forEach(tutorial => {
  tutorialSystem.registerTutorial(tutorial);
});

// Convenience functions
export const startTutorial = (tutorialId: string) => tutorialSystem.startTutorial(tutorialId);
export const completeStep = (stepId: string, data?: any) => tutorialSystem.completeStep(stepId, data);
export const getHint = (stepId: string, hintIndex: number) => tutorialSystem.getHint(stepId, hintIndex);
export const skipStep = (stepId: string) => tutorialSystem.skipStep(stepId);
export const getCurrentTutorial = () => tutorialSystem.getCurrentSession();
export const endTutorial = () => tutorialSystem.endSession();
