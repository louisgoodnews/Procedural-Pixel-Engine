# Rust Enhanced Physics System

## Overview

The Rust Enhanced Physics System is a comprehensive physics engine implementation that provides advanced physics simulation capabilities including joint systems, material interactions, raycasting, and sophisticated collision detection. Built with performance and extensibility in mind, it offers a complete physics solution for complex 2D and 3D applications.

## Features

### 🔗 Joint System
- **Multiple Joint Types**: Revolute, Prismatic, Spherical, Weld, Fixed, Distance, Hinge, Slider, Universal
- **Joint Constraints**: Position and velocity limits, stiffness and damping control
- **Joint Motors**: Velocity and position-based motors with configurable force limits
- **Joint Breaking**: Configurable break forces and torques for realistic failure simulation
- **Joint Management**: Dynamic addition, removal, enable/disable operations

### 🧪 Material System
- **Material Properties**: Density, friction, restitution, hardness, elasticity, durability
- **Physical Properties**: Heat capacity, thermal/electrical conductivity, magnetic permeability
- **Material Types**: Static, Dynamic, Kinematic, Trigger, Sensor
- **Material Interactions**: Configurable interaction coefficients between different materials
- **Material Degradation**: Simulated wear and tear over time

### 🔦 Raycasting System
- **Multi-directional Raycasting**: Cast rays in any direction with configurable distance
- **Hit Detection**: Precise hit points, normals, distances, and material information
- **Advanced Raycasting**: Sphere-based raycasting, dense raycasting patterns
- **Ray Caching**: Optimized raycast result caching for performance
- **Hit Filtering**: Layer masks and collision filtering for selective detection

### 🔷 Collision Detection
- **Collision Shapes**: Sphere, Box, Capsule, Cylinder, Cone, Mesh, Heightfield, Compound
- **Advanced Collision**: Continuous collision detection, substepping for accuracy
- **Collision Response**: Material-based collision response with realistic physics
- **Broadphase/Narrowphase**: Optimized collision detection pipeline
- **Collision Analysis**: Performance monitoring and optimization recommendations

### ⚙️ Physics Simulation
- **Configurable Timesteps**: Substepping for improved accuracy and stability
- **Solver Configuration**: Iterative constraint solving with configurable iterations
- **Performance Optimization**: Object sleeping, warm starting, adaptive time stepping
- **Debug Rendering**: Visual debugging support for physics objects and constraints
- **Statistics Monitoring**: Real-time performance metrics and system statistics

## Quick Start

### Installation

```typescript
import { RustEnhancedPhysics } from './rust-wrappers/RustEnhancedPhysics';
```

### Basic Setup

```typescript
// Create enhanced physics instance
const physics = new RustEnhancedPhysics();

// Initialize with configuration
const config = RustEnhancedPhysics.createFullPhysicsConfig();
await physics.initialize(config);

// Add a joint
const joint = RustEnhancedPhysics.createJoint(
    'door_hinge',
    JointType.Revolute,
    'door_frame',
    'door_panel',
    { x: 0, y: 1, z: 0 },
    { x: 1, y: 1, z: 0 }
);
physics.addJoint(joint);

// Add a material
const wood = RustEnhancedPhysics.createMaterial(
    'wood',
    'Oak Wood',
    MaterialType.Dynamic,
    {
        density: 0.7,
        friction: 0.6,
        restitution: 0.4,
        hardness: 2.0,
        durability: 150.0,
    }
);
physics.addMaterial(wood);

// Perform raycasting
const hit = physics.raycast(
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    100
);

if (hit.hitCount > 0) {
    console.log(`Hit detected at distance: ${hit.closestHit!.distance}`);
}
```

## API Reference

### RustEnhancedPhysics Class

#### Constructor
```typescript
constructor()
```
Creates a new enhanced physics engine instance.

#### Initialization
```typescript
async initialize(config: PhysicsConfig): Promise<void>
```
Initializes the physics engine with the specified configuration.

#### Configuration
```typescript
updateConfig(config: PhysicsConfig): void
getConfig(): PhysicsConfig
```
Updates or retrieves the current physics configuration.

#### Statistics
```typescript
getStats(): PhysicsStats
getPhysicsSummary(): string
```
Retrieves physics statistics and generates a comprehensive summary.

### Joint Management

#### Add Joint
```typescript
addJoint(joint: Joint): { success: boolean; message: string }
```
Adds a new joint to the physics system.

#### Remove Joint
```typescript
removeJoint(jointId: string): { success: boolean; message: string }
```
Removes a joint from the physics system.

#### Get Joints
```typescript
getJoints(): Joint[]
getJoint(jointId: string): Joint | undefined
```
Retrieves all joints or a specific joint.

#### Joint Control
```typescript
enableJoint(jointId: string): { success: boolean; message: string }
disableJoint(jointId: string): { success: boolean; message: string }
breakJoint(jointId: string): { success: boolean; message: string }
```
Controls joint state and breaking.

### Material Management

#### Add Material
```typescript
addMaterial(material: Material): { success: boolean; message: string }
```
Adds a new material to the physics system.

#### Remove Material
```typescript
removeMaterial(materialId: string): { success: boolean; message: string }
```
Removes a material from the physics system.

#### Get Materials
```typescript
getMaterials(): Material[]
getMaterial(materialId: string): Material | undefined
```
Retrieves all materials or a specific material.

### Raycasting

#### Basic Raycast
```typescript
raycast(origin: Vector3, direction: Vector3, maxDistance: number): RaycastResult
```
Performs a single raycast operation.

#### Advanced Raycasting
```typescript
raycastAll(origin: Vector3, maxDistance: number): RaycastResult[]
raycastInSphere(center: Vector3, radius: number, rayCount: number): RaycastResult[]
```
Performs advanced raycasting patterns.

### Collision Shapes

#### Add Collision Shape
```typescript
addCollisionShape(shape: EnhancedCollisionShape): { success: boolean; message: string }
```
Adds a new collision shape to the physics system.

#### Remove Collision Shape
```typescript
removeCollisionShape(shapeId: string): { success: boolean; message: string }
```
Removes a collision shape from the physics system.

#### Get Collision Shapes
```typescript
getCollisionShapes(): EnhancedCollisionShape[]
getCollisionShape(shapeId: string): EnhancedCollisionShape | undefined
```
Retrieves all collision shapes or a specific shape.

### Analysis Methods

#### Joint Analysis
```typescript
analyzeJointPerformance(): {
    totalJoints: number;
    activeJoints: number;
    brokenJoints: number;
    jointTypes: Record<JointType, number>;
    averageLoad: number;
    recommendations: string[];
}
```
Analyzes joint performance and provides optimization recommendations.

#### Material Analysis
```typescript
analyzeMaterialUsage(): {
    totalMaterials: number;
    materialTypes: Record<MaterialType, number>;
    averageDurability: number;
    averageDensity: number;
    recommendations: string[];
}
```
Analyzes material usage and provides optimization recommendations.

#### Collision Analysis
```typescript
analyzeCollisionPerformance(): {
    totalCollisions: number;
    averageCollisionTime: number;
    collisionShapeTypes: Record<ShapeType, number>;
    recommendations: string[];
}
```
Analyzes collision performance and provides optimization recommendations.

#### Comprehensive Report
```typescript
generatePhysicsReport(): string
```
Generates a comprehensive physics system report.

## Configuration

### PhysicsConfig Interface

```typescript
interface PhysicsConfig {
    enableJoints: boolean;              // Enable joint system
    enableRaycasting: boolean;          // Enable raycasting
    enableMaterials: boolean;           // Enable material system
    enableAdvancedCollision: boolean;    // Enable advanced collision detection
    enableContinuousCollision: boolean; // Enable continuous collision detection
    enableSubstepping: boolean;         // Enable substepping
    substepCount: number;               // Number of substeps per frame
    solverIterations: number;          // Solver iterations per step
    warmStarting: boolean;              // Enable warm starting
    enableSleeping: boolean;            // Enable object sleeping
    sleepThreshold: number;             // Sleep velocity threshold
    enableDebugRendering: boolean;      // Enable debug rendering
    maxVelocity: number;                // Maximum velocity
    maxAngularVelocity: number;         // Maximum angular velocity
    gravityScale: number;               // Gravity scale factor
}
```

### Configuration Presets

#### Full Physics Configuration
```typescript
const config = RustEnhancedPhysics.createFullPhysicsConfig();
```
Enables all features with high-quality settings.

#### Basic Physics Configuration
```typescript
const config = RustEnhancedPhysics.createBasicPhysicsConfig();
```
Minimal configuration for basic physics needs.

#### High Performance Configuration
```typescript
const config = RustEnhancedPhysics.createHighPerformanceConfig();
```
Optimized for maximum performance with many objects.

#### Mobile Configuration
```typescript
const config = RustEnhancedPhysics.createMobileConfig();
```
Optimized for mobile devices with limited resources.

#### Custom Configuration
```typescript
const config = RustEnhancedPhysics.createPhysicsConfig({
    enableJoints: true,
    enableRaycasting: true,
    enableMaterials: false,
    substepCount: 6,
    solverIterations: 15,
});
```

## Data Structures

### Joint Interface

```typescript
interface Joint {
    id: string;
    jointType: JointType;
    bodyAId: string;
    bodyBId: string;
    anchorA: Vector3;
    anchorB: Vector3;
    axis: Vector3;
    limits: JointLimits;
    motor: JointMotor;
    isEnabled: boolean;
    breakForce: number;
    breakTorque: number;
    isBroken: boolean;
}
```

### Material Interface

```typescript
interface Material {
    id: string;
    name: string;
    materialType: MaterialType;
    density: number;
    friction: number;
    restitution: number;
    rollingFriction: number;
    spinningFriction: number;
    hardness: number;
    elasticity: number;
    durability: number;
    heatCapacity: number;
    thermalConductivity: number;
    electricalConductivity: number;
    magneticPermeability: number;
    color: [number, number, number, number];
    textureId?: string;
    customProperties: Record<string, string>;
}
```

### RaycastResult Interface

```typescript
interface RaycastResult {
    hits: RaycastHit[];
    rayOrigin: Vector3;
    rayDirection: Vector3;
    maxDistance: number;
    hitCount: number;
    closestHit?: RaycastHit;
    farthestHit?: RaycastHit;
}
```

### EnhancedCollisionShape Interface

```typescript
interface EnhancedCollisionShape {
    id: string;
    shapeType: ShapeType;
    dimensions: Vector3;
    radius: number;
    height: number;
    vertices: Vector3[];
    indices: number[];
    transform: number[]; // 4x4 matrix
    isTrigger: boolean;
    isSensor: boolean;
    layerMask: number;
    collisionMask: number;
}
```

## Usage Examples

### Door Hinge System

```typescript
// Create door physics
const physics = new RustEnhancedPhysics();
await physics.initialize(RustEnhancedPhysics.createFullPhysicsConfig());

// Create door material
const doorMaterial = RustEnhancedPhysics.createMaterial(
    'door_wood',
    'Door Wood',
    MaterialType.Dynamic,
    {
        density: 0.6,
        friction: 0.5,
        restitution: 0.2,
        hardness: 1.5,
        durability: 200.0,
    }
);
physics.addMaterial(doorMaterial);

// Create hinge joint
const doorHinge = RustEnhancedPhysics.createJoint(
    'main_door_hinge',
    JointType.Revolute,
    'door_frame',
    'door_panel',
    { x: 0, y: 1, z: 0 },
    { x: 0.8, y: 1, z: 0 },
    {
        limits: {
            lowerLimit: -Math.PI / 2,
            upperLimit: Math.PI / 2,
            motorSpeed: 0.5,
            motorForce: 50.0,
            stiffness: 800.0,
            damping: 8.0,
        },
        motor: {
            targetVelocity: 0.0,
            maxForce: 30.0,
            isEnabled: false,
            motorType: MotorType.Velocity,
        },
        breakForce: 2000.0,
        breakTorque: 2000.0,
    }
);

physics.addJoint(doorHinge);

// Auto-close mechanism
setInterval(() => {
    const hinge = physics.getJoint('main_door_hinge');
    if (hinge && !hinge.motor.isEnabled) {
        // Enable auto-close motor
        physics.enableJoint('main_door_hinge');
    }
}, 1000);
```

### Material Interaction System

```typescript
// Create different materials for realistic interactions
const steel = RustEnhancedPhysics.createMaterial('steel', 'Steel', MaterialType.Dynamic, {
    density: 7.8,
    friction: 0.7,
    restitution: 0.1,
    hardness: 5.0,
    durability: 500.0,
    electricalConductivity: 1000000.0,
});

const rubber = RustEnhancedPhysics.createMaterial('rubber', 'Rubber', MaterialType.Dynamic, {
    density: 1.2,
    friction: 0.9,
    restitution: 0.8,
    hardness: 0.5,
    durability: 200.0,
    elasticity: 0.9,
});

const glass = RustEnhancedPhysics.createMaterial('glass', 'Glass', MaterialType.Dynamic, {
    density: 2.5,
    friction: 0.3,
    restitution: 0.05,
    hardness: 6.0,
    durability: 50.0,
    elasticity: 0.1,
});

physics.addMaterial(steel);
physics.addMaterial(rubber);
physics.addMaterial(glass);

// Analyze material usage
const analysis = physics.analyzeMaterialUsage();
console.log(`Average durability: ${analysis.averageDurability}`);
console.log(`Recommendations: ${analysis.recommendations.join(', ')}`);
```

### Advanced Raycasting

```typescript
// Create raycasting system for object detection
class ObjectDetector {
    constructor(private physics: RustEnhancedPhysics) {}

    detectObjectsInArea(center: Vector3, radius: number): RaycastResult[] {
        return this.physics.raycastInSphere(center, radius, 36); // 36 rays in circle
    }

    findNearestObject(origin: Vector3, direction: Vector3, maxDistance: number): RaycastHit | null {
        const result = this.physics.raycast(origin, direction, maxDistance);
        return result.closestHit || null;
    }

    scanEnvironment(position: Vector3): {
        forward: RaycastResult;
        left: RaycastResult;
        right: RaycastResult;
        up: RaycastResult;
        down: RaycastResult;
    } {
        return {
            forward: this.physics.raycast(position, { x: 0, y: 0, z: 1 }, 50),
            left: this.physics.raycast(position, { x: -1, y: 0, z: 0 }, 50),
            right: this.physics.raycast(position, { x: 1, y: 0, z: 0 }, 50),
            up: this.physics.raycast(position, { x: 0, y: 1, z: 0 }, 50),
            down: this.physics.raycast(position, { x: 0, y: -1, z: 0 }, 50),
        };
    }
}

const detector = new ObjectDetector(physics);
const scan = detector.scanEnvironment({ x: 0, y: 1, z: 0 });
console.log(`Objects detected forward: ${scan.forward.hitCount}`);
```

### Performance Monitoring

```typescript
// Monitor physics performance
class PerformanceMonitor {
    constructor(private physics: RustEnhancedPhysics) {
        this.startMonitoring();
    }

    private startMonitoring(): void {
        setInterval(() => {
            const stats = this.physics.getStats();
            const jointAnalysis = this.physics.analyzeJointPerformance();
            const materialAnalysis = this.physics.analyzeMaterialUsage();
            const collisionAnalysis = this.physics.analyzeCollisionPerformance();

            // Performance alerts
            if (stats.simulationTime > 16.67) { // > 60fps
                console.warn('Physics simulation taking too long:', stats.simulationTime);
            }

            if (stats.collisionCount > 1000) {
                console.warn('High collision count detected:', stats.collisionCount);
            }

            if (stats.brokenJoints > 0) {
                console.warn('Joints breaking:', stats.brokenJoints);
            }

            // Generate performance report
            if (Date.now() % 10000 < 100) { // Every 10 seconds
                const report = this.physics.generatePhysicsReport();
                console.log('Physics Performance Report:', report);
            }
        }, 1000);
    }

    getOptimizationRecommendations(): string[] {
        const jointAnalysis = this.physics.analyzeJointPerformance();
        const materialAnalysis = this.physics.analyzeMaterialUsage();
        const collisionAnalysis = this.physics.analyzeCollisionPerformance();

        return [
            ...jointAnalysis.recommendations,
            ...materialAnalysis.recommendations,
            ...collisionAnalysis.recommendations,
        ];
    }
}

const monitor = new PerformanceMonitor(physics);
```

## Performance Considerations

### Optimization Tips

1. **Use Appropriate Substepping**
   - More substeps = better accuracy but slower performance
   - Use 2-4 substeps for most applications
   - Use 8+ substeps only for high-precision simulations

2. **Optimize Joint Count**
   - Limit active joints to what's necessary
   - Disable joints when not in use
   - Use joint breaking to remove failed constraints

3. **Material Selection**
   - Use simpler materials for static objects
   - Avoid excessive material properties
   - Consider material pooling for similar objects

4. **Raycasting Efficiency**
   - Limit raycast distance when possible
   - Use raycast caching for repeated queries
   - Consider spatial partitioning for complex scenes

5. **Collision Optimization**
   - Use appropriate collision shapes
   - Enable object sleeping for static objects
   - Use layer masks to filter unnecessary collisions

### Performance Metrics

The enhanced physics system provides comprehensive performance metrics:

- **Simulation Time**: Time spent in physics simulation
- **Joint Count**: Number of active joints
- **Collision Count**: Number of collisions detected
- **Raycast Count**: Number of raycasts performed
- **Solver Iterations**: Solver iterations used

### Memory Management

- **Object Pooling**: Reuse joint and material objects
- **Cleanup**: Remove unused joints and materials
- **Caching**: Cache frequently accessed data
- **Garbage Collection**: Minimize object creation

## Troubleshooting

### Common Issues

#### Joint Not Working
```typescript
// Check joint configuration
const joint = physics.getJoint('my_joint');
if (!joint) {
    console.error('Joint not found');
} else if (!joint.isEnabled) {
    console.warn('Joint is disabled');
    physics.enableJoint('my_joint');
}
```

#### Raycast Not Hitting
```typescript
// Check raycast parameters
const result = physics.raycast(origin, direction, maxDistance);
if (result.hitCount === 0) {
    console.log('No hits detected. Check:');
    console.log('- Ray direction is normalized');
    console.log('- Max distance is sufficient');
    console.log('- Objects are in ray path');
    console.log('- Collision shapes are properly configured');
}
```

#### Performance Issues
```typescript
// Analyze performance
const stats = physics.getStats();
if (stats.simulationTime > 16.67) {
    console.log('Performance issues detected:');
    
    const jointAnalysis = physics.analyzeJointPerformance();
    const materialAnalysis = physics.analyzeMaterialUsage();
    const collisionAnalysis = physics.analyzeCollisionPerformance();
    
    console.log('Joint recommendations:', jointAnalysis.recommendations);
    console.log('Material recommendations:', materialAnalysis.recommendations);
    console.log('Collision recommendations:', collisionAnalysis.recommendations);
}
```

#### Memory Leaks
```typescript
// Check for memory leaks
const initialStats = physics.getStats();

// ... perform operations ...

const finalStats = physics.getStats();
if (finalStats.totalJoints > initialStats.totalJoints + 10) {
    console.warn('Possible joint memory leak');
}

// Clean up unused objects
physics.getJoints().forEach(joint => {
    if (joint.isBroken) {
        physics.removeJoint(joint.id);
    }
});
```

### Debug Mode

Enable debug rendering for visual debugging:

```typescript
const config = RustEnhancedPhysics.createPhysicsConfig({
    enableDebugRendering: true,
    enableJoints: true,
    enableAdvancedCollision: true,
});

await physics.initialize(config);
```

### Logging

The enhanced physics system provides comprehensive logging:

```typescript
// Get physics summary for debugging
const summary = physics.getPhysicsSummary();
console.log(summary);

// Generate detailed report
const report = physics.generatePhysicsReport();
console.log(report);
```

## Best Practices

### Joint Design

1. **Use Appropriate Joint Types**
   - Revolute for rotational movement
   - Prismatic for linear movement
   - Spherical for free rotation
   - Weld for rigid connections

2. **Configure Limits Properly**
   - Set realistic lower/upper limits
   - Use appropriate stiffness values
   - Configure damping to prevent oscillation

3. **Motor Configuration**
   - Use velocity motors for continuous motion
   - Use position motors for precise positioning
   - Set appropriate force limits

### Material Design

1. **Realistic Properties**
   - Use real-world density values
   - Configure friction based on surface properties
   - Set restitution for material bounciness

2. **Performance Considerations**
   - Simplify materials for static objects
   - Use material pooling for similar objects
   - Avoid excessive custom properties

### Raycasting Design

1. **Efficient Raycasting**
   - Limit raycast distance
   - Use appropriate ray density
   - Cache raycast results when possible

2. **Hit Processing**
   - Filter hits by distance
   - Use layer masks for selective detection
   - Process hits in order of importance

### System Architecture

1. **Modular Design**
   - Separate physics concerns
   - Use factory methods for object creation
   - Implement proper error handling

2. **Performance Monitoring**
   - Monitor physics simulation time
   - Track joint and material counts
   - Generate regular performance reports

## API Compatibility

### Browser Support

The enhanced physics system requires:
- **WebAssembly**: Modern browsers with WASM support
- **TypeScript**: TypeScript 4.0+ for type safety
- **ES6+**: Modern JavaScript features

### Version Compatibility

- **Rust Enhanced Physics**: 1.0.0+
- **WebAssembly**: Current version
- **TypeScript**: 4.0+

### Breaking Changes

Major versions may include breaking changes. Always check the migration guide when upgrading.

## Contributing

### Development Setup

1. Clone the repository
2. Install Rust and wasm-pack
3. Build the WASM module:
   ```bash
   cd src/rust
   wasm-pack build --target web --out-dir ../../pkg
   ```
4. Run tests:
   ```typescript
   import { RustEnhancedPhysicsTest } from './integration/RustEnhancedPhysicsTest';
   
   const test = new RustEnhancedPhysicsTest();
   await test.runAllTests();
   ```

### Code Style

- Follow Rust naming conventions
- Use TypeScript strict mode
- Include comprehensive documentation
- Write unit tests for new features

### Pull Requests

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Update documentation
5. Submit pull request

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation
- Run the test suite for diagnostics

## Changelog

### Version 1.0.0
- Initial release of enhanced physics system
- Joint system with multiple joint types
- Material system with realistic properties
- Advanced raycasting capabilities
- Collision detection and response
- Performance monitoring and analysis
- Comprehensive test suite
- Complete documentation

---

*Last updated: 2026-03-16*
