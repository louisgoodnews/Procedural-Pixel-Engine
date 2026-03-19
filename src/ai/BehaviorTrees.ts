/**
 * Advanced AI Behavior Trees System
 * Provides comprehensive behavior tree implementation for AI decision making
 */

import { createEngineError, validators } from '../utils/ErrorHandling';

export interface BehaviorTree {
  id: string;
  name: string;
  description: string;
  root: BehaviorNode;
  blackboard: Blackboard;
  context: AIContext;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  created: Date;
  lastUpdated: Date;
  executionTime: number;
  nodeCount: number;
  depth: number;
}

export interface BehaviorNode {
  id: string;
  name: string;
  type: NodeType;
  status: NodeStatus;
  children: BehaviorNode[];
  parent?: BehaviorNode;
  conditions: Condition[];
  actions: Action[];
  decorators: Decorator[];
  parameters: NodeParameters;
  metadata: NodeMetadata;
  executionCount: number;
  successCount: number;
  failureCount: number;
  averageExecutionTime: number;
}

export type NodeType = 
  | 'root'
  | 'sequence'
  | 'selector'
  | 'parallel'
  | 'condition'
  | 'action'
  | 'decorator'
  | 'composite'
  | 'leaf';

export type NodeStatus = 
  | 'ready'
  | 'running'
  | 'success'
  | 'failure'
  | 'invalid';

export interface Condition {
  id: string;
  name: string;
  type: 'boolean' | 'numeric' | 'string' | 'custom';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'custom';
  value: any;
  blackboardKey?: string;
  invert: boolean;
  weight: number;
}

export interface Action {
  id: string;
  name: string;
  type: 'immediate' | 'duration' | 'continuous' | 'async';
  parameters: Record<string, any>;
  preconditions: string[];
  postconditions: string[];
  effects: ActionEffect[];
  duration?: number;
  priority: number;
}

export interface ActionEffect {
  type: 'set_variable' | 'modify_variable' | 'trigger_event' | 'call_function' | 'custom';
  target: string;
  value: any;
  probability: number;
}

export interface Decorator {
  id: string;
  name: string;
  type: 'inverter' | 'repeater' | 'timer' | 'cooldown' | 'probability' | 'custom';
  parameters: DecoratorParameters;
  child?: BehaviorNode;
}

export interface DecoratorParameters {
  count?: number;
  duration?: number;
  probability?: number;
  cooldown?: number;
  custom?: Record<string, any>;
}

export interface NodeParameters {
  timeout?: number;
  retryCount?: number;
  priority?: number;
  weight?: number;
  custom?: Record<string, any>;
}

export interface NodeMetadata {
  description: string;
  category: string;
  tags: string[];
  author: string;
  version: string;
  documentation: string;
  examples: string[];
}

export interface Blackboard {
  id: string;
  name: string;
  variables: BlackboardVariable[];
  globalScope: Record<string, any>;
  localScope: Map<string, Record<string, any>>;
  persistence: boolean;
  encryption: boolean;
  created: Date;
  lastModified: Date;
}

export interface BlackboardVariable {
  id: string;
  name: string;
  type: 'boolean' | 'number' | 'string' | 'object' | 'array' | 'function';
  value: any;
  defaultValue: any;
  scope: 'global' | 'local' | 'temporal';
  persistent: boolean;
  readonly: boolean;
  description: string;
  tags: string[];
  lastModified: Date;
  history: VariableHistory[];
}

export interface VariableHistory {
  timestamp: Date;
  value: any;
  changedBy: string;
  reason: string;
}

export interface AIContext {
  id: string;
  entityId: string;
  entity: any;
  environment: Environment;
  knowledge: KnowledgeBase;
  memory: WorkingMemory;
  perception: PerceptionSystem;
  goals: Goal[];
  emotions: EmotionalState;
  personality: PersonalityProfile;
  learning: LearningSystem;
}

export interface Environment {
  id: string;
  type: '2d' | '3d' | 'abstract';
  dimensions: { width: number; height: number; depth?: number };
  objects: EnvironmentObject[];
  agents: Agent[];
  events: EnvironmentEvent[];
  properties: Record<string, any>;
  time: number;
  deltaTime: number;
}

export interface EnvironmentObject {
  id: string;
  type: string;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  properties: Record<string, any>;
  visible: boolean;
  interactive: boolean;
  static: boolean;
}

export interface Agent {
  id: string;
  type: string;
  position: Vector3;
  rotation: Vector3;
  velocity: Vector3;
  health: number;
  maxHealth: number;
  status: 'idle' | 'active' | 'inactive' | 'dead';
  properties: Record<string, any>;
  relationships: Relationship[];
}

export interface Relationship {
  targetId: string;
  type: 'ally' | 'enemy' | 'neutral' | 'friendly' | 'hostile';
  strength: number; // -100 to 100
  trust: number; // 0 to 100
  history: RelationshipHistory[];
}

export interface RelationshipHistory {
  timestamp: Date;
  action: string;
  impact: number;
  context: string;
}

export interface EnvironmentEvent {
  id: string;
  type: string;
  source: string;
  target?: string;
  position: Vector3;
  radius: number;
  data: Record<string, any>;
  timestamp: Date;
  duration?: number;
}

export interface KnowledgeBase {
  id: string;
  facts: Fact[];
  rules: Rule[];
  concepts: Concept[];
  ontology: Ontology;
  confidenceThreshold: number;
  lastUpdated: Date;
}

export interface Fact {
  id: string;
  subject: string;
  predicate: string;
  object: any;
  confidence: number; // 0 to 1
  source: string;
  timestamp: Date;
  expires?: Date;
  verified: boolean;
}

export interface Rule {
  id: string;
  name: string;
  conditions: RuleCondition[];
  consequences: RuleConsequence[];
  priority: number;
  enabled: boolean;
  confidence: number;
  lastTriggered?: Date;
}

export interface RuleCondition {
  type: 'fact' | 'variable' | 'function' | 'custom';
  operator: string;
  parameters: Record<string, any>;
  weight: number;
}

export interface RuleConsequence {
  type: 'add_fact' | 'remove_fact' | 'set_variable' | 'trigger_action' | 'custom';
  parameters: Record<string, any>;
  probability: number;
}

export interface Concept {
  id: string;
  name: string;
  category: string;
  properties: Record<string, any>;
  relationships: ConceptRelationship[];
  instances: ConceptInstance[];
  definition: string;
}

export interface ConceptRelationship {
  type: 'is_a' | 'has_a' | 'part_of' | 'related_to' | 'causes' | 'enables';
  target: string;
  strength: number;
  bidirectional: boolean;
}

export interface ConceptInstance {
  id: string;
  properties: Record<string, any>;
  confidence: number;
  source: string;
  timestamp: Date;
}

export interface Ontology {
  classes: OntologyClass[];
  properties: OntologyProperty[];
  individuals: OntologyIndividual[];
  axioms: OntologyAxiom[];
}

export interface OntologyClass {
  id: string;
  name: string;
  superClass?: string;
  properties: string[];
  instances: string[];
}

export interface OntologyProperty {
  id: string;
  name: string;
  domain: string;
  range: string;
  functional: boolean;
  inverseFunctional: boolean;
}

export interface OntologyIndividual {
  id: string;
  name: string;
  class: string;
  properties: Record<string, any>;
}

export interface OntologyAxiom {
  type: 'subclass' | 'equivalent' | 'disjoint' | 'property' | 'custom';
  subject: string;
  object: string;
  parameters: Record<string, any>;
}

export interface WorkingMemory {
  id: string;
  capacity: number;
  items: MemoryItem[];
  attention: AttentionSystem;
  decayRate: number;
  consolidationThreshold: number;
  lastConsolidation: Date;
}

export interface MemoryItem {
  id: string;
  type: 'fact' | 'event' | 'procedure' | 'schema' | 'episodic';
  content: any;
  importance: number; // 0 to 1
  activation: number; // 0 to 1
  frequency: number;
  recency: number;
  associations: MemoryAssociation[];
  timestamp: Date;
  lastAccessed: Date;
}

export interface MemoryAssociation {
  targetId: string;
  type: 'semantic' | 'episodic' | 'procedural' | 'causal';
  strength: number;
  direction: 'bidirectional' | 'forward' | 'backward';
}

export interface AttentionSystem {
  focus: AttentionFocus[];
  capacity: number;
  currentLoad: number;
  filters: AttentionFilter[];
  priorities: AttentionPriority[];
}

export interface AttentionFocus {
  target: string;
  type: 'visual' | 'auditory' | 'semantic' | 'spatial';
  intensity: number;
  duration: number;
  timestamp: Date;
}

export interface AttentionFilter {
  type: 'relevance' | 'novelty' | 'emotional' | 'goal_directed';
  threshold: number;
  weight: number;
  enabled: boolean;
}

export interface AttentionPriority {
  goal: string;
  priority: number;
  decay: number;
  boost: number;
}

export interface PerceptionSystem {
  id: string;
  sensors: Sensor[];
  processing: PerceptionProcessing;
  attention: AttentionSystem;
  memory: WorkingMemory;
  filters: PerceptionFilter[];
}

export interface Sensor {
  id: string;
  type: 'visual' | 'auditory' | 'tactile' | 'proprioceptive' | 'custom';
  range: number;
  accuracy: number;
  updateRate: number;
  enabled: boolean;
  calibration: SensorCalibration;
}

export interface SensorCalibration {
  offset: Vector3;
  scale: Vector3;
  noise: number;
  bias: number;
  lastCalibrated: Date;
}

export interface PerceptionProcessing {
  pipeline: ProcessingStage[];
  bufferSize: number;
  processingTime: number;
  accuracy: number;
}

export interface ProcessingStage {
  name: string;
  type: 'filter' | 'transform' | 'detect' | 'classify' | 'track' | 'custom';
  parameters: Record<string, any>;
  enabled: boolean;
  order: number;
}

export interface PerceptionFilter {
  type: 'spatial' | 'temporal' | 'semantic' | 'emotional' | 'custom';
  parameters: Record<string, any>;
  enabled: boolean;
  priority: number;
}

export interface Goal {
  id: string;
  name: string;
  type: 'achievement' | 'maintenance' | 'avoidance' | 'exploration' | 'custom';
  priority: number;
  urgency: number;
  importance: number;
  progress: number; // 0 to 1
  status: 'active' | 'completed' | 'failed' | 'paused' | 'cancelled';
  conditions: GoalCondition[];
  subgoals: string[];
  deadline?: Date;
  created: Date;
  lastUpdated: Date;
}

export interface GoalCondition {
  type: 'state' | 'event' | 'time' | 'custom';
  operator: string;
  parameters: Record<string, any>;
  satisfied: boolean;
  lastChecked: Date;
}

export interface EmotionalState {
  id: string;
  emotions: Emotion[];
  mood: Mood;
  personalityTraits: PersonalityTrait[];
  regulation: EmotionalRegulation;
  expression: EmotionalExpression;
}

export interface Emotion {
  type: 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust' | 'anticipation' | 'trust' | 'custom';
  intensity: number; // 0 to 1
  valence: number; // -1 to 1
  arousal: number; // 0 to 1
  duration: number;
  cause?: string;
  timestamp: Date;
}

export interface Mood {
  valence: number; // -1 to 1
  arousal: number; // 0 to 1
  dominance: number; // -1 to 1
  stability: number; // 0 to 1
  lastUpdated: Date;
}

export interface PersonalityTrait {
  trait: 'openness' | 'conscientiousness' | 'extraversion' | 'agreeableness' | 'neuroticism' | 'custom';
  value: number; // 0 to 1
  stability: number; // 0 to 1
  expression: string;
}

export interface EmotionalRegulation {
  strategies: RegulationStrategy[];
  thresholds: RegulationThreshold[];
  cooldowns: RegulationCooldown[];
}

export interface RegulationStrategy {
  type: 'reappraisal' | 'suppression' | 'distraction' | 'problem_solving' | 'custom';
  effectiveness: number;
  conditions: string[];
  parameters: Record<string, any>;
}

export interface RegulationThreshold {
  emotion: string;
  threshold: number;
  action: string;
  parameters: Record<string, any>;
}

export interface RegulationCooldown {
  emotion: string;
  duration: number;
  lastTriggered: Date;
}

export interface EmotionalExpression {
  facial: FacialExpression;
  vocal: VocalExpression;
  body: BodyExpression;
  linguistic: LinguisticExpression;
}

export interface FacialExpression {
  expressions: FacialExpressionType[];
  intensity: number;
  duration: number;
}

export interface FacialExpressionType {
  muscle: string;
  activation: number; // 0 to 1
}

export interface VocalExpression {
  pitch: number;
  volume: number;
  tempo: number;
  timbre: string;
  prosody: string;
}

export interface BodyExpression {
  posture: string;
  gestures: Gesture[];
  movement: MovementPattern;
  proximity: ProximityBehavior;
}

export interface Gesture {
  type: string;
  amplitude: number;
  duration: number;
  meaning: string;
}

export interface MovementPattern {
  speed: number;
  smoothness: number;
  direction: Vector3;
  rhythm: string;
}

export interface ProximityBehavior {
  personalSpace: number;
  preferredDistance: number;
  approachSpeed: number;
  avoidanceDistance: number;
}

export interface LinguisticExpression {
  vocabulary: VocabularyChoice;
  syntax: SyntaxPattern;
  semantics: SemanticContent;
  pragmatics: PragmaticContext;
}

export interface VocabularyChoice {
  formality: number; // 0 to 1
  complexity: number; // 0 to 1
  emotionality: number; // 0 to 1
  specificity: number; // 0 to 1
}

export interface SyntaxPattern {
  complexity: number; // 0 to 1
  length: number;
  structure: string;
  variation: number; // 0 to 1
}

export interface SemanticContent {
  topics: string[];
  sentiment: number; // -1 to 1
  clarity: number; // 0 to 1
  coherence: number; // 0 to 1
}

export interface PragmaticContext {
  politeness: number; // 0 to 1
  directness: number; // 0 to 1
  formality: number; // 0 to 1
  context_awareness: number; // 0 to 1
}

export interface PersonalityProfile {
  id: string;
  traits: PersonalityTrait[];
  preferences: Preference[];
  values: Value[];
  habits: Habit[];
  learningStyle: LearningStyle;
  socialStyle: SocialStyle;
  cognitiveStyle: CognitiveStyle;
}

export interface Preference {
  domain: string;
  item: string;
  value: number; // -1 to 1
  confidence: number; // 0 to 1
  stability: number; // 0 to 1
  context: string;
}

export interface Value {
  name: string;
  importance: number; // 0 to 1
  universality: number; // 0 to 1
  context: string[];
  expression: string[];
}

export interface Habit {
  trigger: string;
  action: string;
  reward: string;
  frequency: number;
  strength: number; // 0 to 1
  context: string[];
}

export interface LearningStyle {
  visual: number; // 0 to 1
  auditory: number; // 0 to 1
  kinesthetic: number; // 0 to 1
  reading: number; // 0 to 1
  experiential: number; // 0 to 1
}

export interface SocialStyle {
  introversion: number; // 0 to 1
  agreeableness: number; // 0 to 1
  dominance: number; // 0 to 1
  nurturance: number; // 0 to 1
  expressiveness: number; // 0 to 1
}

export interface CognitiveStyle {
  analytical: number; // 0 to 1
  intuitive: number; // 0 to 1
  systematic: number; // 0 to 1
  creative: number; // 0 to 1
  reflective: number; // 0 to 1
}

export interface LearningSystem {
  id: string;
  algorithms: LearningAlgorithm[];
  models: MLModel[];
  data: LearningData;
  performance: LearningPerformance;
  configuration: LearningConfiguration;
}

export interface LearningAlgorithm {
  id: string;
  name: string;
  type: 'supervised' | 'unsupervised' | 'reinforcement' | 'deep_learning' | 'custom';
  parameters: Record<string, any>;
  performance: AlgorithmPerformance;
  lastTrained: Date;
}

export interface AlgorithmPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  loss: number;
  trainingTime: number;
  inferenceTime: number;
}

export interface MLModel {
  id: string;
  name: string;
  type: 'classification' | 'regression' | 'clustering' | 'neural_network' | 'custom';
  architecture: ModelArchitecture;
  weights: ModelWeights;
  performance: ModelPerformance;
  version: string;
  created: Date;
  lastUpdated: Date;
}

export interface ModelArchitecture {
  layers: Layer[];
  connections: Connection[];
  inputShape: number[];
  outputShape: number[];
}

export interface Layer {
  id: string;
  type: 'dense' | 'convolutional' | 'recurrent' | 'attention' | 'custom';
  parameters: LayerParameters;
  activation: string;
  shape: number[];
}

export interface LayerParameters {
  units?: number;
  filters?: number;
  kernelSize?: number[];
  stride?: number[];
  padding?: string;
  dropout?: number;
  batchNorm?: boolean;
  custom?: Record<string, any>;
}

export interface Connection {
  source: string;
  target: string;
  weight: number;
  trainable: boolean;
}

export interface ModelWeights {
  values: number[][][];
  shape: number[];
  dtype: string;
  trainable: boolean;
}

export interface ModelPerformance {
  accuracy: number;
  loss: number;
  validationAccuracy: number;
  validationLoss: number;
  trainingHistory: TrainingHistory[];
  inferenceTime: number;
  memoryUsage: number;
}

export interface TrainingHistory {
  epoch: number;
  accuracy: number;
  loss: number;
  validationAccuracy: number;
  validationLoss: number;
  timestamp: Date;
}

export interface LearningData {
  training: Dataset;
  validation: Dataset;
  test: Dataset;
  augmentation: DataAugmentation[];
  preprocessing: DataPreprocessing[];
}

export interface Dataset {
  samples: DataSample[];
  labels: any[];
  size: number;
  split: number; // 0 to 1
  balanced: boolean;
  augmented: boolean;
}

export interface DataSample {
  id: string;
  features: number[];
  label?: any;
  metadata: Record<string, any>;
  timestamp: Date;
}

export interface DataAugmentation {
  type: 'rotation' | 'scaling' | 'translation' | 'noise' | 'custom';
  parameters: Record<string, any>;
  probability: number;
}

export interface DataPreprocessing {
  type: 'normalization' | 'standardization' | 'encoding' | 'feature_extraction' | 'custom';
  parameters: Record<string, any>;
  enabled: boolean;
}

export interface LearningPerformance {
  overallAccuracy: number;
  averageLoss: number;
  trainingTime: number;
  inferenceTime: number;
  memoryUsage: number;
  modelCount: number;
  lastEvaluation: Date;
}

export interface LearningConfiguration {
  batchSize: number;
  learningRate: number;
  epochs: number;
  optimizer: string;
  lossFunction: string;
  metrics: string[];
  earlyStopping: boolean;
  checkpointing: boolean;
  distributed: boolean;
}

export interface BehaviorTreeEvent {
  type: 'node_started' | 'node_completed' | 'node_failed' | 'tree_started' | 'tree_completed' | 'tree_failed' | 'variable_changed' | 'context_updated';
  nodeId?: string;
  treeId: string;
  timestamp: Date;
  data?: any;
}

export class BehaviorTreeSystem {
  private trees = new Map<string, BehaviorTree>();
  private nodes = new Map<string, BehaviorNode>();
  private blackboards = new Map<string, Blackboard>();
  private contexts = new Map<string, AIContext>();
  private eventListeners = new Map<string, Set<(event: BehaviorTreeEvent) => void>>();
  private nodeTypes = new Map<string, NodeTypeHandler>();
  private executionQueue: ExecutionTask[] = [];
  private isRunning = false;

  constructor() {
    this.initializeNodeTypes();
    this.startExecutionLoop();
  }

  /**
   * Create behavior tree
   */
  createTree(
    name: string,
    description: string,
    rootNode: BehaviorNode,
    blackboard?: Blackboard,
    context?: AIContext
  ): BehaviorTree {
    const treeId = this.generateId();
    const tree: BehaviorTree = {
      id: treeId,
      name,
      description,
      root: rootNode,
      blackboard: blackboard || this.createBlackboard(`${name}_blackboard`),
      context: context || this.createContext(treeId),
      status: 'idle',
      created: new Date(),
      lastUpdated: new Date(),
      executionTime: 0,
      nodeCount: this.countNodes(rootNode),
      depth: this.calculateDepth(rootNode)
    };

    this.trees.set(treeId, tree);
    this.nodes.set(rootNode.id, rootNode);

    this.emitEvent({
      type: 'tree_created',
      treeId,
      timestamp: new Date(),
      data: { name, nodeCount: tree.nodeCount }
    });

    return tree;
  }

  /**
   * Execute behavior tree
   */
  async executeTree(treeId: string): Promise<NodeStatus> {
    const tree = this.trees.get(treeId);
    if (!tree) {
      throw createEngineError(
        `Behavior tree '${treeId}' not found`,
        'TREE_NOT_FOUND',
        'system',
        'high'
      );
    }

    if (tree.status === 'running') {
      throw createEngineError(
        `Behavior tree '${treeId}' is already running`,
        'TREE_ALREADY_RUNNING',
        'system',
        'medium'
      );
    }

    tree.status = 'running';
    const startTime = Date.now();

    this.emitEvent({
      type: 'tree_started',
      treeId,
      timestamp: new Date()
    });

    try {
      const result = await this.executeNode(tree.root, tree);
      tree.status = result === 'success' ? 'completed' : 'failed';
      tree.executionTime = Date.now() - startTime;
      tree.lastUpdated = new Date();

      this.emitEvent({
        type: result === 'success' ? 'tree_completed' : 'tree_failed',
        treeId,
        timestamp: new Date(),
        data: { result, executionTime: tree.executionTime }
      });

      return result;
    } catch (error) {
      tree.status = 'failed';
      tree.executionTime = Date.now() - startTime;
      tree.lastUpdated = new Date();

      this.emitEvent({
        type: 'tree_failed',
        treeId,
        timestamp: new Date(),
        data: { error: error.message, executionTime: tree.executionTime }
      });

      throw error;
    }
  }

  /**
   * Stop behavior tree execution
   */
  stopTree(treeId: string): void {
    const tree = this.trees.get(treeId);
    if (!tree) return;

    tree.status = 'idle';
    this.emitEvent({
      type: 'tree_stopped',
      treeId,
      timestamp: new Date()
    });
  }

  /**
   * Create behavior node
   */
  createNode(
    name: string,
    type: NodeType,
    parameters: NodeParameters = {},
    children: BehaviorNode[] = []
  ): BehaviorNode {
    const nodeId = this.generateId();
    const node: BehaviorNode = {
      id: nodeId,
      name,
      type,
      status: 'ready',
      children,
      conditions: [],
      actions: [],
      decorators: [],
      parameters,
      metadata: {
        description: '',
        category: 'default',
        tags: [],
        author: 'system',
        version: '1.0.0',
        documentation: '',
        examples: []
      },
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
      averageExecutionTime: 0
    };

    // Set parent references
    for (const child of children) {
      child.parent = node;
      this.nodes.set(child.id, child);
    }

    this.nodes.set(nodeId, node);
    return node;
  }

  /**
   * Add child node
   */
  addChildNode(parentId: string, child: BehaviorNode): void {
    const parent = this.nodes.get(parentId);
    if (!parent) {
      throw createEngineError(
        `Parent node '${parentId}' not found`,
        'NODE_NOT_FOUND',
        'system',
        'high'
      );
    }

    child.parent = parent;
    parent.children.push(child);
    this.nodes.set(child.id, child);
  }

  /**
   * Create blackboard
   */
  createBlackboard(name: string, persistence = false, encryption = false): Blackboard {
    const blackboardId = this.generateId();
    const blackboard: Blackboard = {
      id: blackboardId,
      name,
      variables: [],
      globalScope: {},
      localScope: new Map(),
      persistence,
      encryption,
      created: new Date(),
      lastModified: new Date()
    };

    this.blackboards.set(blackboardId, blackboard);
    return blackboard;
  }

  /**
   * Set blackboard variable
   */
  setVariable(
    blackboardId: string,
    name: string,
    value: any,
    scope: 'global' | 'local' | 'temporal' = 'global',
    contextId?: string
  ): void {
    const blackboard = this.blackboards.get(blackboardId);
    if (!blackboard) {
      throw createEngineError(
        `Blackboard '${blackboardId}' not found`,
        'BLACKBOARD_NOT_FOUND',
        'system',
        'high'
      );
    }

    const variable = blackboard.variables.find(v => v.name === name);
    const oldValue = variable?.value;

    if (scope === 'global') {
      blackboard.globalScope[name] = value;
    } else if (scope === 'local' && contextId) {
      if (!blackboard.localScope.has(contextId)) {
        blackboard.localScope.set(contextId, {});
      }
      blackboard.localScope.get(contextId)![name] = value;
    }

    if (variable) {
      variable.value = value;
      variable.lastModified = new Date();
      variable.history.push({
        timestamp: new Date(),
        value,
        changedBy: 'system',
        reason: 'variable_update'
      });
    } else {
      const newVariable: BlackboardVariable = {
        id: this.generateId(),
        name,
        type: this.inferType(value),
        value,
        defaultValue: value,
        scope,
        persistent: false,
        readonly: false,
        description: '',
        tags: [],
        lastModified: new Date(),
        history: [{
          timestamp: new Date(),
          value,
          changedBy: 'system',
          reason: 'variable_creation'
        }]
      };
      blackboard.variables.push(newVariable);
    }

    blackboard.lastModified = new Date();

    this.emitEvent({
      type: 'variable_changed',
      treeId: '',
      timestamp: new Date(),
      data: { blackboardId, name, oldValue, newValue: value, scope }
    });
  }

  /**
   * Get blackboard variable
   */
  getVariable(
    blackboardId: string,
    name: string,
    scope: 'global' | 'local' | 'temporal' = 'global',
    contextId?: string
  ): any {
    const blackboard = this.blackboards.get(blackboardId);
    if (!blackboard) return undefined;

    if (scope === 'global') {
      return blackboard.globalScope[name];
    } else if (scope === 'local' && contextId) {
      const localScope = blackboard.localScope.get(contextId);
      return localScope?.[name];
    }

    return undefined;
  }

  /**
   * Create AI context
   */
  createContext(entityId: string): AIContext {
    const contextId = this.generateId();
    const context: AIContext = {
      id: contextId,
      entityId,
      entity: null,
      environment: this.createEnvironment(),
      knowledge: this.createKnowledgeBase(),
      memory: this.createWorkingMemory(),
      perception: this.createPerceptionSystem(),
      goals: [],
      emotions: this.createEmotionalState(),
      personality: this.createPersonalityProfile(),
      learning: this.createLearningSystem()
    };

    this.contexts.set(contextId, context);
    return context;
  }

  /**
   * Get behavior tree
   */
  getTree(treeId: string): BehaviorTree | undefined {
    return this.trees.get(treeId);
  }

  /**
   * Get all trees
   */
  getAllTrees(): BehaviorTree[] {
    return Array.from(this.trees.values());
  }

  /**
   * Get behavior node
   */
  getNode(nodeId: string): BehaviorNode | undefined {
    return this.nodes.get(nodeId);
  }

  /**
   * Get blackboard
   */
  getBlackboard(blackboardId: string): Blackboard | undefined {
    return this.blackboards.get(blackboardId);
  }

  /**
   * Get AI context
   */
  getContext(contextId: string): AIContext | undefined {
    return this.contexts.get(contextId);
  }

  /**
   * Add event listener
   */
  addEventListener(
    eventType: string,
    callback: (event: BehaviorTreeEvent) => void
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    
    this.eventListeners.get(eventType)!.add(callback);
    
    return () => {
      this.eventListeners.get(eventType)?.delete(callback);
    };
  }

  // Private methods

  private initializeNodeTypes(): void {
    // Sequence node
    this.nodeTypes.set('sequence', {
      execute: async (node, tree) => {
        for (const child of node.children) {
          const result = await this.executeNode(child, tree);
          if (result !== 'success') {
            return result;
          }
        }
        return 'success';
      }
    });

    // Selector node
    this.nodeTypes.set('selector', {
      execute: async (node, tree) => {
        for (const child of node.children) {
          const result = await this.executeNode(child, tree);
          if (result === 'success') {
            return 'success';
          }
        }
        return 'failure';
      }
    });

    // Parallel node
    this.nodeTypes.set('parallel', {
      execute: async (node, tree) => {
        const promises = node.children.map(child => this.executeNode(child, tree));
        const results = await Promise.all(promises);
        
        // Success if all children succeed
        return results.every(result => result === 'success') ? 'success' : 'failure';
      }
    });

    // Condition node
    this.nodeTypes.set('condition', {
      execute: async (node, tree) => {
        for (const condition of node.conditions) {
          if (!this.evaluateCondition(condition, tree)) {
            return 'failure';
          }
        }
        return 'success';
      }
    });

    // Action node
    this.nodeTypes.set('action', {
      execute: async (node, tree) => {
        for (const action of node.actions) {
          const result = await this.executeAction(action, tree);
          if (!result) {
            return 'failure';
          }
        }
        return 'success';
      }
    });
  }

  private async executeNode(node: BehaviorNode, tree: BehaviorTree): Promise<NodeStatus> {
    node.status = 'running';
    node.executionCount++;
    const startTime = Date.now();

    this.emitEvent({
      type: 'node_started',
      nodeId: node.id,
      treeId: tree.id,
      timestamp: new Date()
    });

    try {
      // Check conditions
      for (const condition of node.conditions) {
        if (!this.evaluateCondition(condition, tree)) {
          node.status = 'failure';
          node.failureCount++;
          return 'failure';
        }
      }

      // Apply decorators
      for (const decorator of node.decorators) {
        const result = await this.applyDecorator(decorator, node, tree);
        if (result !== 'success') {
          node.status = 'failure';
          node.failureCount++;
          return 'failure';
        }
      }

      // Execute node based on type
      const handler = this.nodeTypes.get(node.type);
      if (!handler) {
        throw createEngineError(
          `No handler for node type '${node.type}'`,
          'UNSUPPORTED_NODE_TYPE',
          'system',
          'medium'
        );
      }

      const result = await handler.execute(node, tree);
      node.status = result;
      
      if (result === 'success') {
        node.successCount++;
      } else {
        node.failureCount++;
      }

      // Update execution time
      const executionTime = Date.now() - startTime;
      node.averageExecutionTime = (node.averageExecutionTime * (node.executionCount - 1) + executionTime) / node.executionCount;

      this.emitEvent({
        type: result === 'success' ? 'node_completed' : 'node_failed',
        nodeId: node.id,
        treeId: tree.id,
        timestamp: new Date(),
        data: { result, executionTime }
      });

      return result;
    } catch (error) {
      node.status = 'failure';
      node.failureCount++;
      
      this.emitEvent({
        type: 'node_failed',
        nodeId: node.id,
        treeId: tree.id,
        timestamp: new Date(),
        data: { error: error.message }
      });

      return 'failure';
    }
  }

  private evaluateCondition(condition: Condition, tree: BehaviorTree): boolean {
    let value: any;

    if (condition.blackboardKey) {
      value = this.getVariable(tree.blackboard.id, condition.blackboardKey);
    } else {
      value = condition.value;
    }

    let result: boolean;

    switch (condition.operator) {
      case 'equals':
        result = value === condition.value;
        break;
      case 'not_equals':
        result = value !== condition.value;
        break;
      case 'greater_than':
        result = Number(value) > Number(condition.value);
        break;
      case 'less_than':
        result = Number(value) < Number(condition.value);
        break;
      case 'contains':
        result = String(value).includes(String(condition.value));
        break;
      default:
        result = true; // Default to true for custom operators
    }

    return condition.invert ? !result : result;
  }

  private async executeAction(action: Action, tree: BehaviorTree): Promise<boolean> {
    // Mock action execution
    console.log(`Executing action: ${action.name}`);
    
    // Apply effects
    for (const effect of action.effects) {
      await this.applyEffect(effect, tree);
    }

    return true;
  }

  private async applyEffect(effect: ActionEffect, tree: BehaviorTree): Promise<void> {
    switch (effect.type) {
      case 'set_variable':
        this.setVariable(tree.blackboard.id, effect.target, effect.value);
        break;
      case 'modify_variable':
        const current = this.getVariable(tree.blackboard.id, effect.target);
        this.setVariable(tree.blackboard.id, effect.target, this.modifyValue(current, effect.value));
        break;
      case 'trigger_event':
        // Mock event triggering
        console.log(`Triggering event: ${effect.target}`);
        break;
    }
  }

  private modifyValue(current: any, modifier: any): any {
    if (typeof current === 'number' && typeof modifier === 'number') {
      return current + modifier;
    }
    return modifier;
  }

  private async applyDecorator(decorator: Decorator, node: BehaviorNode, tree: BehaviorTree): Promise<NodeStatus> {
    switch (decorator.type) {
      case 'inverter':
        const childResult = await this.executeNode(decorator.child!, tree);
        return childResult === 'success' ? 'failure' : 'success';
      
      case 'repeater':
        const count = decorator.parameters.count || 1;
        for (let i = 0; i < count; i++) {
          const result = await this.executeNode(decorator.child!, tree);
          if (result !== 'success') {
            return result;
          }
        }
        return 'success';
      
      case 'timer':
        const duration = decorator.parameters.duration || 1000;
        await new Promise(resolve => setTimeout(resolve, duration));
        return await this.executeNode(decorator.child!, tree);
      
      default:
        return await this.executeNode(decorator.child!, tree);
    }
  }

  private countNodes(node: BehaviorNode): number {
    let count = 1;
    for (const child of node.children) {
      count += this.countNodes(child);
    }
    return count;
  }

  private calculateDepth(node: BehaviorNode): number {
    if (node.children.length === 0) {
      return 1;
    }
    return 1 + Math.max(...node.children.map(child => this.calculateDepth(child)));
  }

  private inferType(value: any): BlackboardVariable['type'] {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') return 'string';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object' && value !== null) return 'object';
    return 'string'; // Default
  }

  private createEnvironment(): Environment {
    return {
      id: this.generateId(),
      type: '3d',
      dimensions: { width: 1000, height: 1000, depth: 1000 },
      objects: [],
      agents: [],
      events: [],
      properties: {},
      time: 0,
      deltaTime: 0.016 // 60 FPS
    };
  }

  private createKnowledgeBase(): KnowledgeBase {
    return {
      id: this.generateId(),
      facts: [],
      rules: [],
      concepts: [],
      ontology: {
        classes: [],
        properties: [],
        individuals: [],
        axioms: []
      },
      confidenceThreshold: 0.7,
      lastUpdated: new Date()
    };
  }

  private createWorkingMemory(): WorkingMemory {
    return {
      id: this.generateId(),
      capacity: 100,
      items: [],
      attention: {
        focus: [],
        capacity: 7,
        currentLoad: 0,
        filters: [],
        priorities: []
      },
      decayRate: 0.1,
      consolidationThreshold: 0.8,
      lastConsolidation: new Date()
    };
  }

  private createPerceptionSystem(): PerceptionSystem {
    return {
      id: this.generateId(),
      sensors: [],
      processing: {
        pipeline: [],
        bufferSize: 1000,
        processingTime: 0,
        accuracy: 0.95
      },
      attention: {
        focus: [],
        capacity: 7,
        currentLoad: 0,
        filters: [],
        priorities: []
      },
      memory: this.createWorkingMemory(),
      filters: []
    };
  }

  private createEmotionalState(): EmotionalState {
    return {
      id: this.generateId(),
      emotions: [],
      mood: {
        valence: 0,
        arousal: 0.5,
        dominance: 0,
        stability: 0.7,
        lastUpdated: new Date()
      },
      personalityTraits: [],
      regulation: {
        strategies: [],
        thresholds: [],
        cooldowns: []
      },
      expression: {
        facial: { expressions: [], intensity: 0, duration: 0 },
        vocal: { pitch: 1, volume: 0.5, tempo: 1, timbre: 'neutral', prosody: 'neutral' },
        body: { posture: 'neutral', gestures: [], movement: { speed: 1, smoothness: 0.8, direction: { x: 0, y: 0, z: 1 }, rhythm: 'steady' }, proximity: { personalSpace: 1, preferredDistance: 2, approachSpeed: 1, avoidanceDistance: 3 } },
        linguistic: { vocabulary: { formality: 0.5, complexity: 0.5, emotionality: 0.5, specificity: 0.5 }, syntax: { complexity: 0.5, length: 10, structure: 'simple', variation: 0.3 }, semantics: { topics: [], sentiment: 0, clarity: 0.8, coherence: 0.8 }, pragmatics: { politeness: 0.7, directness: 0.6, formality: 0.5, context_awareness: 0.7 } }
      }
    };
  }

  private createPersonalityProfile(): PersonalityProfile {
    return {
      id: this.generateId(),
      traits: [],
      preferences: [],
      values: [],
      habits: [],
      learningStyle: {
        visual: 0.25,
        auditory: 0.25,
        kinesthetic: 0.25,
        reading: 0.25,
        experiential: 0.25
      },
      socialStyle: {
        introversion: 0.5,
        agreeableness: 0.7,
        dominance: 0.5,
        nurturance: 0.6,
        expressiveness: 0.5
      },
      cognitiveStyle: {
        analytical: 0.5,
        intuitive: 0.5,
        systematic: 0.6,
        creative: 0.5,
        reflective: 0.5
      }
    };
  }

  private createLearningSystem(): LearningSystem {
    return {
      id: this.generateId(),
      algorithms: [],
      models: [],
      data: {
        training: { samples: [], labels: [], size: 0, split: 0.8, balanced: true, augmented: false },
        validation: { samples: [], labels: [], size: 0, split: 0.1, balanced: true, augmented: false },
        test: { samples: [], labels: [], size: 0, split: 0.1, balanced: true, augmented: false },
        augmentation: [],
        preprocessing: []
      },
      performance: {
        overallAccuracy: 0,
        averageLoss: 0,
        trainingTime: 0,
        inferenceTime: 0,
        memoryUsage: 0,
        modelCount: 0,
        lastEvaluation: new Date()
      },
      configuration: {
        batchSize: 32,
        learningRate: 0.001,
        epochs: 100,
        optimizer: 'adam',
        lossFunction: 'mse',
        metrics: ['accuracy'],
        earlyStopping: true,
        checkpointing: true,
        distributed: false
      }
    };
  }

  private startExecutionLoop(): void {
    this.isRunning = true;
    this.processExecutionQueue();
  }

  private async processExecutionQueue(): Promise<void> {
    while (this.isRunning && this.executionQueue.length > 0) {
      const task = this.executionQueue.shift()!;
      try {
        await this.executeTask(task);
      } catch (error) {
        console.error('Execution task failed:', error);
      }
    }
    
    if (this.isRunning) {
      setTimeout(() => this.processExecutionQueue(), 16); // 60 FPS
    }
  }

  private async executeTask(task: ExecutionTask): Promise<void> {
    // Mock task execution
    console.log(`Executing task: ${task.type}`);
  }

  private emitEvent(event: BehaviorTreeEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const callback of listeners) {
        callback(event);
      }
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

interface NodeTypeHandler {
  execute: (node: BehaviorNode, tree: BehaviorTree) => Promise<NodeStatus>;
}

interface ExecutionTask {
  id: string;
  type: string;
  priority: number;
  data: any;
}

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

// Factory function
export function createBehaviorTreeSystem(): BehaviorTreeSystem {
  return new BehaviorTreeSystem();
}
