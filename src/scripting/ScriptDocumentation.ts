/**
 * Script Documentation and Examples
 * Provides comprehensive documentation and examples for all supported scripting languages
 */

import { ScriptLanguage } from './ScriptingSystem';
import { createEngineError, validators } from '../utils/ErrorHandling';

export interface DocumentationSection {
  id: string;
  title: string;
  content: string;
  language?: string;
  examples: CodeExample[];
  relatedSections: string[];
  tags: string[];
}

export interface CodeExample {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  runnable: boolean;
  expectedOutput?: string;
  dependencies?: string[];
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  language: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
  sections: TutorialSection[];
  prerequisites: string[];
  objectives: string[];
}

export interface TutorialSection {
  id: string;
  title: string;
  content: string;
  examples: CodeExample[];
  exercises: Exercise[];
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  instructions: string;
  startingCode: string;
  solution: string;
  hints: string[];
  testCases: TestCase[];
}

export interface TestCase {
  id: string;
  description: string;
  input: any;
  expectedOutput: any;
  setup?: string;
  teardown?: string;
}

export interface APIReference {
  language: string;
  modules: APIModule[];
  globals: APIGlobal[];
  types: APIType[];
}

export interface APIModule {
  name: string;
  description: string;
  functions: APIFunction[];
  classes: APIClass[];
  constants: APIConstant[];
}

export interface APIFunction {
  name: string;
  description: string;
  parameters: APIParameter[];
  returnType: string;
  examples: CodeExample[];
  since: string;
  deprecated?: string;
}

export interface APIClass {
  name: string;
  description: string;
  constructor: APIFunction;
  methods: APIFunction[];
  properties: APIProperty[];
  staticMethods: APIFunction[];
  staticProperties: APIProperty[];
}

export interface APIProperty {
  name: string;
  type: string;
  description: string;
  readonly: boolean;
  optional: boolean;
  default?: any;
}

export interface APIGlobal {
  name: string;
  type: string;
  description: string;
  examples: CodeExample[];
}

export interface APIType {
  name: string;
  description: string;
  properties: APIProperty[];
  methods: APIFunction[];
}

export interface APIParameter {
  name: string;
  type: string;
  description: string;
  optional: boolean;
  default?: any;
}

export class ScriptDocumentation {
  private sections = new Map<string, DocumentationSection>();
  private examples = new Map<string, CodeExample>();
  private tutorials = new Map<string, Tutorial>();
  private apiReferences = new Map<string, APIReference>();

  constructor() {
    this.initializeDocumentation();
  }

  /**
   * Get documentation section by ID
   */
  getSection(id: string): DocumentationSection | undefined {
    return this.sections.get(id);
  }

  /**
   * Get all documentation sections
   */
  getAllSections(): DocumentationSection[] {
    return Array.from(this.sections.values());
  }

  /**
   * Get sections by language
   */
  getSectionsByLanguage(language: string): DocumentationSection[] {
    return Array.from(this.sections.values()).filter(
      section => !section.language || section.language === language
    );
  }

  /**
   * Get sections by tag
   */
  getSectionsByTag(tag: string): DocumentationSection[] {
    return Array.from(this.sections.values()).filter(
      section => section.tags.includes(tag)
    );
  }

  /**
   * Search documentation
   */
  searchDocumentation(query: string, options: {
    language?: string;
    tags?: string[];
    limit?: number;
  } = {}): DocumentationSection[] {
    const lowerQuery = query.toLowerCase();
    let results = Array.from(this.sections.values());

    // Filter by language
    if (options.language) {
      results = results.filter(section => 
        !section.language || section.language === options.language
      );
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      results = results.filter(section =>
        options.tags!.some(tag => section.tags.includes(tag))
      );
    }

    // Search by content
    results = results.filter(section =>
      section.title.toLowerCase().includes(lowerQuery) ||
      section.content.toLowerCase().includes(lowerQuery)
    );

    // Sort by relevance
    results.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      
      if (aTitle === lowerQuery) return -1;
      if (bTitle === lowerQuery) return 1;
      if (aTitle.startsWith(lowerQuery)) return -1;
      if (bTitle.startsWith(lowerQuery)) return 1;
      
      return 0;
    });

    // Limit results
    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Get code example by ID
   */
  getExample(id: string): CodeExample | undefined {
    return this.examples.get(id);
  }

  /**
   * Get all code examples
   */
  getAllExamples(): CodeExample[] {
    return Array.from(this.examples.values());
  }

  /**
   * Get examples by language
   */
  getExamplesByLanguage(language: string): CodeExample[] {
    return Array.from(this.examples.values()).filter(
      example => example.language === language
    );
  }

  /**
   * Get examples by difficulty
   */
  getExamplesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): CodeExample[] {
    return Array.from(this.examples.values()).filter(
      example => example.difficulty === difficulty
    );
  }

  /**
   * Get tutorial by ID
   */
  getTutorial(id: string): Tutorial | undefined {
    return this.tutorials.get(id);
  }

  /**
   * Get all tutorials
   */
  getAllTutorials(): Tutorial[] {
    return Array.from(this.tutorials.values());
  }

  /**
   * Get tutorials by language
   */
  getTutorialsByLanguage(language: string): Tutorial[] {
    return Array.from(this.tutorials.values()).filter(
      tutorial => tutorial.language === language
    );
  }

  /**
   * Get API reference for language
   */
  getAPIReference(language: string): APIReference | undefined {
    return this.apiReferences.get(language);
  }

  /**
   * Generate getting started guide
   */
  generateGettingStartedGuide(language: string): DocumentationSection {
    const examples = this.getExamplesByLanguage(language).filter(
      example => example.difficulty === 'beginner'
    );

    return {
      id: `getting-started-${language}`,
      title: `Getting Started with ${language}`,
      content: this.generateGettingStartedContent(language),
      language,
      examples: examples.slice(0, 5),
      relatedSections: ['setup', 'basic-concepts', 'first-script'],
      tags: ['getting-started', 'beginner', language]
    };
  }

  // Private methods

  private initializeDocumentation(): void {
    this.createJavaScriptDocumentation();
    this.createLuaDocumentation();
    this.createPythonDocumentation();
    this.createCommonDocumentation();
  }

  private createJavaScriptDocumentation(): void {
    // JavaScript API Reference
    const jsAPI: APIReference = {
      language: 'javascript',
      modules: [
        {
          name: 'engine',
          description: 'Core engine API for JavaScript scripting',
          functions: [
            {
              name: 'createEntity',
              description: 'Create a new entity in the engine',
              parameters: [
                { name: 'id', type: 'string', description: 'Unique entity ID', optional: false },
                { name: 'components', type: 'object', description: 'Initial components', optional: true }
              ],
              returnType: 'Entity',
              examples: [
                {
                  id: 'create-entity-example',
                  title: 'Create Entity',
                  description: 'Creates a new entity with position component',
                  code: `const entity = engine.createEntity('player', {
  position: { x: 0, y: 0 },
  velocity: { x: 1, y: 0 }
});`,
                  language: 'javascript',
                  runnable: true,
                  tags: ['entity', 'creation'],
                  difficulty: 'beginner'
                }
              ],
              since: '1.0.0'
            }
          ],
          classes: [],
          constants: []
        }
      ],
      globals: [
        {
          name: 'console',
          type: 'Console',
          description: 'Logging utility for debugging',
          examples: [
            {
              id: 'console-log-example',
              title: 'Console Logging',
              description: 'Basic logging example',
              code: 'console.log("Hello, Engine!");',
              language: 'javascript',
              runnable: true,
              tags: ['logging', 'debug'],
              difficulty: 'beginner'
            }
          ]
        }
      ],
      types: []
    };

    this.apiReferences.set('javascript', jsAPI);

    // JavaScript Examples
    this.examples.set('js-hello-world', {
      id: 'js-hello-world',
      title: 'Hello World',
      description: 'Basic hello world example',
      code: `// Hello World in JavaScript
console.log("Hello, Procedural Pixel Engine!");

// Create a simple entity
const entity = engine.createEntity('hello-world-entity');
entity.addComponent('position', { x: 100, y: 100 });

console.log("Entity created at position:", entity.position);`,
      language: 'javascript',
      runnable: true,
      expectedOutput: 'Hello, Procedural Pixel Engine!',
      tags: ['beginner', 'basics'],
      difficulty: 'beginner'
    });

    // JavaScript Tutorial
    this.tutorials.set('js-basics', {
      id: 'js-basics',
      title: 'JavaScript Basics',
      description: 'Learn the basics of JavaScript scripting in the engine',
      language: 'javascript',
      difficulty: 'beginner',
      estimatedTime: 30,
      sections: [
        {
          id: 'js-intro',
          title: 'Introduction',
          content: `
JavaScript is one of the primary scripting languages supported by the Procedural Pixel Engine. 
It provides a familiar syntax and powerful features for game development.

## Why JavaScript?

- **Familiar syntax** for web developers
- **Dynamic typing** for rapid prototyping
- **Rich ecosystem** of libraries and tools
- **Excellent debugging support**
- **Hot reloading** for fast iteration

## Getting Started

To start scripting with JavaScript, simply create a .js file in your project and the engine 
will automatically load and execute it.
          `,
          examples: [
            {
              id: 'js-intro-example',
              title: 'First JavaScript Script',
              description: 'Your first JavaScript script in the engine',
              code: `// This is a comment in JavaScript
console.log("Script loaded successfully!");

// Access the engine API
const engine = global.engine;
console.log("Engine version:", engine.version);`,
              language: 'javascript',
              runnable: true,
              tags: ['introduction', 'basics'],
              difficulty: 'beginner'
            }
          ],
          exercises: []
        }
      ],
      prerequisites: [],
      objectives: [
        'Understand JavaScript basics',
        'Create your first script',
        'Use the engine API',
        'Debug JavaScript code'
      ]
    });
  }

  private createLuaDocumentation(): void {
    // Lua API Reference
    const luaAPI: APIReference = {
      language: 'lua',
      modules: [
        {
          name: 'engine',
          description: 'Core engine API for Lua scripting',
          functions: [
            {
              name: 'create_entity',
              description: 'Create a new entity in the engine',
              parameters: [
                { name: 'id', type: 'string', description: 'Unique entity ID', optional: false },
                { name: 'components', type: 'table', description: 'Initial components', optional: true }
              ],
              returnType: 'Entity',
              examples: [
                {
                  id: 'lua-create-entity',
                  title: 'Create Entity in Lua',
                  description: 'Creates a new entity with position component',
                  code: `local entity = engine.create_entity("player", {
  position = { x = 0, y = 0 },
  velocity = { x = 1, y = 0 }
})`,
                  language: 'lua',
                  runnable: true,
                  tags: ['entity', 'creation'],
                  difficulty: 'beginner'
                }
              ],
              since: '1.0.0'
            }
          ],
          classes: [],
          constants: []
        }
      ],
      globals: [],
      types: []
    };

    this.apiReferences.set('lua', luaAPI);

    // Lua Examples
    this.examples.set('lua-hello-world', {
      id: 'lua-hello-world',
      title: 'Hello World',
      description: 'Basic hello world example in Lua',
      code: `-- Hello World in Lua
print("Hello, Procedural Pixel Engine!")

-- Create a simple entity
local entity = engine.create_entity("hello-world-entity")
entity:add_component("position", { x = 100, y = 100 })

print("Entity created at position:", entity.position.x, entity.position.y)`,
      language: 'lua',
      runnable: true,
      expectedOutput: 'Hello, Procedural Pixel Engine!',
      tags: ['beginner', 'basics'],
      difficulty: 'beginner'
    });
  }

  private createPythonDocumentation(): void {
    // Python API Reference
    const pythonAPI: APIReference = {
      language: 'python',
      modules: [
        {
          name: 'engine',
          description: 'Core engine API for Python scripting',
          functions: [
            {
              name: 'create_entity',
              description: 'Create a new entity in the engine',
              parameters: [
                { name: 'id', type: 'str', description: 'Unique entity ID', optional: false },
                { name: 'components', type: 'dict', description: 'Initial components', optional: true }
              ],
              returnType: 'Entity',
              examples: [
                {
                  id: 'python-create-entity',
                  title: 'Create Entity in Python',
                  description: 'Creates a new entity with position component',
                  code: `entity = engine.create_entity("player", {
    "position": { "x": 0, "y": 0 },
    "velocity": { "x": 1, "y": 0 }
})`,
                  language: 'python',
                  runnable: true,
                  tags: ['entity', 'creation'],
                  difficulty: 'beginner'
                }
              ],
              since: '1.0.0'
            }
          ],
          classes: [],
          constants: []
        }
      ],
      globals: [
        {
          name: 'print',
          type: 'function',
          description: 'Print output for debugging',
          examples: [
            {
              id: 'python-print-example',
              title: 'Print Statement',
              description: 'Basic print example',
              code: 'print("Hello, Engine!")',
              language: 'python',
              runnable: true,
              tags: ['logging', 'debug'],
              difficulty: 'beginner'
            }
          ]
        }
      ],
      types: []
    };

    this.apiReferences.set('python', pythonAPI);

    // Python Examples
    this.examples.set('python-hello-world', {
      id: 'python-hello-world',
      title: 'Hello World',
      description: 'Basic hello world example in Python',
      code: `# Hello World in Python
print("Hello, Procedural Pixel Engine!")

# Create a simple entity
entity = engine.create_entity("hello-world-entity")
entity.add_component("position", {"x": 100, "y": 100})

print(f"Entity created at position: {entity.position}")`,
      language: 'python',
      runnable: true,
      expectedOutput: 'Hello, Procedural Pixel Engine!',
      tags: ['beginner', 'basics'],
      difficulty: 'beginner'
    });
  }

  private createCommonDocumentation(): void {
    // Common sections that apply to all languages
    this.sections.set('setup', {
      id: 'setup',
      title: 'Setup and Installation',
      content: `
## Setting Up Scripting

The Procedural Pixel Engine supports multiple scripting languages. Here's how to get started:

### 1. Choose Your Language

- **JavaScript/TypeScript** - Best for web developers, excellent tooling
- **Lua** - Lightweight, fast, great for embedded scripting
- **Python** - Powerful, easy to learn, extensive libraries

### 2. Create Script Files

Create files with the appropriate extension in your project:

- JavaScript: \`.js\` or \`.ts\`
- Lua: \`.lua\`
- Python: \`.py\`

### 3. Configure the Engine

The engine will automatically detect and load your script files. You can configure
script settings in the engine configuration file.

### 4. Start Scripting!

You're ready to start creating amazing games with the Procedural Pixel Engine!
      `,
      examples: [],
      relatedSections: ['getting-started-javascript', 'getting-started-lua', 'getting-started-python'],
      tags: ['setup', 'installation', 'configuration']
    });

    this.sections.set('basic-concepts', {
      id: 'basic-concepts',
      title: 'Basic Concepts',
      content: `
## Core Concepts

Understanding these core concepts will help you write better scripts:

### Entities
Entities are the basic building blocks of your game. They represent objects in your game world.

### Components
Components contain data that defines entity properties and behaviors.

### Systems
Systems contain logic that processes entities with specific components.

### Scripts
Scripts are your code that interacts with the engine to create game logic.

### Engine API
The Engine API provides functions and objects you can use in your scripts.
      `,
      examples: [],
      relatedSections: ['entities', 'components', 'systems', 'api-reference'],
      tags: ['concepts', 'architecture', 'ecs']
    });
  }

  private generateGettingStartedContent(language: string): string {
    const languageInfo = {
      javascript: {
        syntax: 'JavaScript uses C-style syntax with curly braces and semicolons.',
        variables: 'Use let, const, or var to declare variables.',
        functions: 'Functions are first-class citizens and can be defined in multiple ways.',
        examples: 'console.log("Hello World!");'
      },
      lua: {
        syntax: 'Lua uses a simple, clean syntax with minimal punctuation.',
        variables: 'Variables are global by default, use local for local scope.',
        functions: 'Functions are defined with the function keyword.',
        examples: 'print("Hello World!")'
      },
      python: {
        syntax: 'Python uses indentation to define code blocks.',
        variables: 'Variables are dynamically typed and don\'t need declaration.',
        functions: 'Functions are defined with the def keyword.',
        examples: 'print("Hello World!")'
      }
    };

    const info = languageInfo[language as keyof typeof languageInfo];
    if (!info) return '';

    return `
## Getting Started with ${language.charAt(0).toUpperCase() + language.slice(1)}

${info.syntax}

### Variables
${info.variables}

### Functions
${info.functions}

### First Program
\`\`\`${language}
${info.examples}
\`\`\`

### Next Steps
1. Try the examples above
2. Read through the API reference
3. Create your first script
4. Experiment with the engine features
    `;
  }
}

// Factory function
export function createScriptDocumentation(): ScriptDocumentation {
  return new ScriptDocumentation();
}
