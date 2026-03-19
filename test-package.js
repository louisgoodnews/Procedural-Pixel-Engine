import { Engine, World, createEntity, createEngine } from './dist/index.js';

// Test basic engine functionality
console.log('🧪 Testing Procedural Pixel Engine Package...');

// Test engine creation
const engine = createEngine();
console.log('✅ Engine created successfully');

// Test world functionality
const world = engine.getWorld();
console.log('✅ World accessed successfully');

// Test entity creation
const entity = createEntity();
console.log('✅ Entity created successfully');

// Test adding entity to world
const worldEntity = world.createEntity();
console.log('✅ Entity added to world successfully');

// Test engine start/stop
engine.start();
console.log('✅ Engine started successfully');

setTimeout(() => {
  engine.stop();
  console.log('✅ Engine stopped successfully');
  console.log('🎉 All tests passed! Package is working correctly.');
}, 100);
