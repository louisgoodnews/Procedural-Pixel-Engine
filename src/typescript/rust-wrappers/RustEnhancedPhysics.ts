import init, { EnhancedPhysicsEngineExport, create_physics_config } from '../../../pkg/procedural_pixel_engine_core.js';

export enum JointType {
    Revolute = 0,
    Prismatic = 1,
    Spherical = 2,
    Weld = 3,
    Fixed = 4,
    Distance = 5,
    Hinge = 6,
    Slider = 7,
    Universal = 8,
    Custom = 9,
}

export enum MaterialType {
    Static = 0,
    Dynamic = 1,
    Kinematic = 2,
    Trigger = 3,
    Sensor = 4,
    Custom = 5,
}

export enum ShapeType {
    Sphere = 0,
    Box = 1,
    Capsule = 2,
    Cylinder = 3,
    Cone = 4,
    Mesh = 5,
    Heightfield = 6,
    Compound = 7,
    Custom = 8,
}

export enum MotorType {
    Velocity = 0,
    Position = 1,
    Angular = 2,
    Linear = 3,
}

export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

export interface Joint {
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

export interface JointLimits {
    lowerLimit: number;
    upperLimit: number;
    motorSpeed: number;
    motorForce: number;
    stiffness: number;
    damping: number;
}

export interface JointMotor {
    targetVelocity: number;
    maxForce: number;
    isEnabled: boolean;
    motorType: MotorType;
}

export interface Material {
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

export interface RaycastHit {
    point: Vector3;
    normal: Vector3;
    distance: number;
    bodyId: string;
    materialId: string;
    faceIndex: number;
    triangleIndex: number;
    uvCoords: [number, number];
    isValid: boolean;
}

export interface RaycastResult {
    hits: RaycastHit[];
    rayOrigin: Vector3;
    rayDirection: Vector3;
    maxDistance: number;
    hitCount: number;
    closestHit?: RaycastHit;
    farthestHit?: RaycastHit;
}

export interface EnhancedCollisionShape {
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

export interface PhysicsConfig {
    enableJoints: boolean;
    enableRaycasting: boolean;
    enableMaterials: boolean;
    enableAdvancedCollision: boolean;
    enableContinuousCollision: boolean;
    enableSubstepping: boolean;
    substepCount: number;
    solverIterations: number;
    warmStarting: boolean;
    enableSleeping: boolean;
    sleepThreshold: number;
    enableDebugRendering: boolean;
    maxVelocity: number;
    maxAngularVelocity: number;
    gravityScale: number;
}

export interface PhysicsStats {
    totalBodies: number;
    activeBodies: number;
    sleepingBodies: number;
    totalJoints: number;
    activeJoints: number;
    brokenJoints: number;
    totalMaterials: number;
    raycastCount: number;
    collisionCount: number;
    solverIterationsUsed: number;
    simulationTime: number;
    broadphaseTime: number;
    narrowphaseTime: number;
    solverTime: number;
}

export class RustEnhancedPhysics {
    private wasmModule: EnhancedPhysicsEngineExport | null = null;
    private initialized = false;
    private joints: Map<string, Joint> = new Map();
    private materials: Map<string, Material> = new Map();
    private collisionShapes: Map<string, EnhancedCollisionShape> = new Map();

    async initialize(config: PhysicsConfig): Promise<void> {
        if (!this.initialized) {
            await init();
            this.wasmModule = new EnhancedPhysicsEngineExport(config);
            this.initialized = true;
            console.log('🔬 Rust Enhanced Physics Engine initialized');
        }
    }

    updateConfig(config: PhysicsConfig): void {
        this.ensureInitialized();
        this.wasmModule!.update_config(config);
    }

    getConfig(): PhysicsConfig {
        this.ensureInitialized();
        const config = this.wasmModule!.get_config();
        return {
            enableJoints: config.enable_joints,
            enableRaycasting: config.enable_raycasting,
            enableMaterials: config.enable_materials,
            enableAdvancedCollision: config.enable_advanced_collision,
            enableContinuousCollision: config.enable_continuous_collision,
            enableSubstepping: config.enable_substepping,
            substepCount: config.substep_count,
            solverIterations: config.solver_iterations,
            warmStarting: config.warm_starting,
            enableSleeping: config.enable_sleeping,
            sleepThreshold: config.sleep_threshold,
            enableDebugRendering: config.enable_debug_rendering,
            maxVelocity: config.max_velocity,
            maxAngularVelocity: config.max_angular_velocity,
            gravityScale: config.gravity_scale,
        };
    }

    getStats(): PhysicsStats {
        this.ensureInitialized();
        const stats = this.wasmModule!.get_stats();
        return {
            totalBodies: stats.total_bodies,
            activeBodies: stats.active_bodies,
            sleepingBodies: stats.sleeping_bodies,
            totalJoints: stats.total_joints,
            activeJoints: stats.active_joints,
            brokenJoints: stats.broken_joints,
            totalMaterials: stats.total_materials,
            raycastCount: stats.raycast_count,
            collisionCount: stats.collision_count,
            solverIterationsUsed: stats.solver_iterations_used,
            simulationTime: stats.simulation_time,
            broadphaseTime: stats.broadphase_time,
            narrowphaseTime: stats.narrowphase_time,
            solverTime: stats.solver_time,
        };
    }

    getPhysicsSummary(): string {
        this.ensureInitialized();
        return this.wasmModule!.get_physics_summary();
    }

    // Joint Management
    addJoint(joint: Joint): { success: boolean; message: string } {
        this.ensureInitialized();
        
        // Validate joint
        if (!joint.id || !joint.bodyAId || !joint.bodyBId) {
            return { success: false, message: 'Joint ID and body IDs are required' };
        }
        
        if (this.joints.has(joint.id)) {
            return { success: false, message: 'Joint ID already exists' };
        }
        
        // Add to local cache
        this.joints.set(joint.id, joint);
        
        // Add to WASM module
        const result = this.wasmModule!.add_joint(joint);
        
        if (result === 'success') {
            console.log(`🔗 Added joint: ${joint.id}`);
            return { success: true, message: 'Joint added successfully' };
        } else {
            this.joints.delete(joint.id);
            return { success: false, message: result };
        }
    }

    removeJoint(jointId: string): { success: boolean; message: string } {
        this.ensureInitialized();
        
        if (!this.joints.has(jointId)) {
            return { success: false, message: 'Joint not found' };
        }
        
        // Remove from local cache
        this.joints.delete(jointId);
        
        // Remove from WASM module (would need to implement this in Rust)
        console.log(`🔗 Removed joint: ${jointId}`);
        return { success: true, message: 'Joint removed successfully' };
    }

    getJoints(): Joint[] {
        return Array.from(this.joints.values());
    }

    getJoint(jointId: string): Joint | undefined {
        return this.joints.get(jointId);
    }

    enableJoint(jointId: string): { success: boolean; message: string } {
        const joint = this.joints.get(jointId);
        if (!joint) {
            return { success: false, message: 'Joint not found' };
        }
        
        if (!joint.isEnabled) {
            joint.isEnabled = true;
            this.joints.set(jointId, joint);
            console.log(`✅ Enabled joint: ${jointId}`);
        }
        
        return { success: true, message: 'Joint enabled successfully' };
    }

    disableJoint(jointId: string): { success: boolean; message: string } {
        const joint = this.joints.get(jointId);
        if (!joint) {
            return { success: false, message: 'Joint not found' };
        }
        
        if (joint.isEnabled) {
            joint.isEnabled = false;
            this.joints.set(jointId, joint);
            console.log(`❌ Disabled joint: ${jointId}`);
        }
        
        return { success: true, message: 'Joint disabled successfully' };
    }

    breakJoint(jointId: string): { success: boolean; message: string } {
        const joint = this.joints.get(jointId);
        if (!joint) {
            return { success: false, message: 'Joint not found' };
        }
        
        if (!joint.isBroken) {
            joint.isBroken = true;
            joint.isEnabled = false;
            this.joints.set(jointId, joint);
            console.log(`💥 Broken joint: ${jointId}`);
        }
        
        return { success: true, message: 'Joint broken successfully' };
    }

    // Material Management
    addMaterial(material: Material): { success: boolean; message: string } {
        this.ensureInitialized();
        
        // Validate material
        if (!material.id || !material.name) {
            return { success: false, message: 'Material ID and name are required' };
        }
        
        if (this.materials.has(material.id)) {
            return { success: false, message: 'Material ID already exists' };
        }
        
        // Add to local cache
        this.materials.set(material.id, material);
        
        // Add to WASM module
        const result = this.wasmModule!.add_material(material);
        
        if (result === 'success') {
            console.log(`🧪 Added material: ${material.name}`);
            return { success: true, message: 'Material added successfully' };
        } else {
            this.materials.delete(material.id);
            return { success: false, message: result };
        }
    }

    removeMaterial(materialId: string): { success: boolean; message: string } {
        if (!this.materials.has(materialId)) {
            return { success: false, message: 'Material not found' };
        }
        
        // Remove from local cache
        this.materials.delete(materialId);
        
        console.log(`🧪 Removed material: ${materialId}`);
        return { success: true, message: 'Material removed successfully' };
    }

    getMaterials(): Material[] {
        return Array.from(this.materials.values());
    }

    getMaterial(materialId: string): Material | undefined {
        return this.materials.get(materialId);
    }

    // Raycasting
    raycast(origin: Vector3, direction: Vector3, maxDistance: number): RaycastResult {
        this.ensureInitialized();
        const result = this.wasmModule!.raycast(origin, direction, maxDistance);
        return {
            hits: result.hits.map((hit: any) => ({
                point: { x: hit.point.x, y: hit.point.y, z: hit.point.z },
                normal: { x: hit.normal.x, y: hit.normal.y, z: hit.normal.z },
                distance: hit.distance,
                bodyId: hit.body_id,
                materialId: hit.material_id,
                faceIndex: hit.face_index,
                triangleIndex: hit.triangle_index,
                uvCoords: hit.uv_coords,
                isValid: hit.is_valid,
            })),
            rayOrigin: { x: result.ray_origin.x, y: result.ray_origin.y, z: result.ray_origin.z },
            rayDirection: { x: result.ray_direction.x, y: result.ray_direction.y, z: result.ray_direction.z },
            maxDistance: result.max_distance,
            hitCount: result.hit_count,
            closestHit: result.closest_hit ? {
                point: { x: result.closest_hit.point.x, y: result.closest_hit.point.y, z: result.closest_hit.point.z },
                normal: { x: result.closest_hit.normal.x, y: result.closest_hit.normal.y, z: result.closest_hit.normal.z },
                distance: result.closest_hit.distance,
                bodyId: result.closest_hit.body_id,
                materialId: result.closest_hit.material_id,
                faceIndex: result.closest_hit.face_index,
                triangleIndex: result.closest_hit.triangle_index,
                uvCoords: result.closest_hit.uv_coords,
                isValid: result.closest_hit.is_valid,
            } : undefined,
            farthestHit: result.farthest_hit ? {
                point: { x: result.farthest_hit.point.x, y: result.farthest_hit.point.y, z: result.farthest_hit.point.z },
                normal: { x: result.farthest_hit.normal.x, y: result.farthest_hit.normal.y, z: result.farthest_hit.normal.z },
                distance: result.farthest_hit.distance,
                bodyId: result.farthest_hit.body_id,
                materialId: result.farthest_hit.material_id,
                faceIndex: result.farthest_hit.face_index,
                triangleIndex: result.farthest_hit.triangle_index,
                uvCoords: result.farthest_hit.uv_coords,
                isValid: result.farthest_hit.is_valid,
            } : undefined,
        };
    }

    raycastAll(origin: Vector3, maxDistance: number): RaycastResult[] {
        const results: RaycastResult[] = [];
        
        // Simulate multiple raycasts in different directions
        const directions = [
            { x: 1, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
            { x: 0, y: 0, z: 1 },
            { x: -1, y: 0, z: 0 },
            { x: 0, y: -1, z: 0 },
            { x: 0, y: 0, z: -1 },
        ];
        
        for (const dir of directions) {
            const result = this.raycast(origin, dir, maxDistance);
            results.push(result);
        }
        
        return results;
    }

    raycastInSphere(center: Vector3, radius: number, rayCount: number): RaycastResult[] {
        const results: RaycastResult[] = [];
        
        for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * 2 * Math.PI;
            const direction = {
                x: Math.cos(angle),
                y: 0,
                z: Math.sin(angle),
            };
            
            const result = this.raycast(center, direction, radius);
            results.push(result);
        }
        
        return results;
    }

    // Collision Shapes
    addCollisionShape(shape: EnhancedCollisionShape): { success: boolean; message: string } {
        if (!shape.id) {
            return { success: false, message: 'Shape ID is required' };
        }
        
        if (this.collisionShapes.has(shape.id)) {
            return { success: false, message: 'Shape ID already exists' };
        }
        
        // Add to local cache
        this.collisionShapes.set(shape.id, shape);
        
        console.log(`🔷 Added collision shape: ${shape.id}`);
        return { success: true, message: 'Collision shape added successfully' };
    }

    removeCollisionShape(shapeId: string): { success: boolean; message: string } {
        if (!this.collisionShapes.has(shapeId)) {
            return { success: false, message: 'Collision shape not found' };
        }
        
        // Remove from local cache
        this.collisionShapes.delete(shapeId);
        
        console.log(`🔷 Removed collision shape: ${shapeId}`);
        return { success: true, message: 'Collision shape removed successfully' };
    }

    getCollisionShapes(): EnhancedCollisionShape[] {
        return Array.from(this.collisionShapes.values());
    }

    getCollisionShape(shapeId: string): EnhancedCollisionShape | undefined {
        return this.collisionShapes.get(shapeId);
    }

    // Utility methods for creating configurations
    static createPhysicsConfig(config: Partial<PhysicsConfig>): PhysicsConfig {
        return {
            enableJoints: config.enableJoints !== undefined ? config.enableJoints : true,
            enableRaycasting: config.enableRaycasting !== undefined ? config.enableRaycasting : true,
            enableMaterials: config.enableMaterials !== undefined ? config.enableMaterials : true,
            enableAdvancedCollision: config.enableAdvancedCollision !== undefined ? config.enableAdvancedCollision : true,
            enableContinuousCollision: config.enableContinuousCollision !== undefined ? config.enableContinuousCollision : false,
            enableSubstepping: config.enableSubstepping !== undefined ? config.enableSubstepping : true,
            substepCount: config.substepCount || 4,
            solverIterations: config.solverIterations || 10,
            warmStarting: config.warmStarting !== undefined ? config.warmStarting : true,
            enableSleeping: config.enableSleeping !== undefined ? config.enableSleeping : true,
            sleepThreshold: config.sleepThreshold || 0.1,
            enableDebugRendering: config.enableDebugRendering !== undefined ? config.enableDebugRendering : false,
            maxVelocity: config.maxVelocity || 100.0,
            maxAngularVelocity: config.maxAngularVelocity || 10.0,
            gravityScale: config.gravityScale || 1.0,
        };
    }

    // Configuration presets
    static createFullPhysicsConfig(): PhysicsConfig {
        return RustEnhancedPhysics.createPhysicsConfig({
            enableJoints: true,
            enableRaycasting: true,
            enableMaterials: true,
            enableAdvancedCollision: true,
            enableContinuousCollision: true,
            enableSubstepping: true,
            substepCount: 8,
            solverIterations: 20,
            warmStarting: true,
            enableSleeping: true,
            sleepThreshold: 0.05,
            enableDebugRendering: true,
            maxVelocity: 200.0,
            maxAngularVelocity: 20.0,
            gravityScale: 1.0,
        });
    }

    static createBasicPhysicsConfig(): PhysicsConfig {
        return RustEnhancedPhysics.createPhysicsConfig({
            enableJoints: false,
            enableRaycasting: false,
            enableMaterials: false,
            enableAdvancedCollision: false,
            enableContinuousCollision: false,
            enableSubstepping: false,
            substepCount: 1,
            solverIterations: 5,
            warmStarting: false,
            enableSleeping: false,
            sleepThreshold: 0.1,
            enableDebugRendering: false,
            maxVelocity: 50.0,
            maxAngularVelocity: 5.0,
            gravityScale: 1.0,
        });
    }

    static createHighPerformanceConfig(): PhysicsConfig {
        return RustEnhancedPhysics.createPhysicsConfig({
            enableJoints: true,
            enableRaycasting: true,
            enableMaterials: true,
            enableAdvancedCollision: true,
            enableContinuousCollision: true,
            enableSubstepping: true,
            substepCount: 16,
            solverIterations: 32,
            warmStarting: true,
            enableSleeping: true,
            sleepThreshold: 0.01,
            enableDebugRendering: false,
            maxVelocity: 500.0,
            maxAngularVelocity: 50.0,
            gravityScale: 1.0,
        });
    }

    static createMobileConfig(): PhysicsConfig {
        return RustEnhancedPhysics.createPhysicsConfig({
            enableJoints: true,
            enableRaycasting: true,
            enableMaterials: false,
            enableAdvancedCollision: true,
            enableContinuousCollision: false,
            enableSubstepping: true,
            substepCount: 2,
            solverIterations: 8,
            warmStarting: true,
            enableSleeping: true,
            sleepThreshold: 0.2,
            enableDebugRendering: false,
            maxVelocity: 100.0,
            maxAngularVelocity: 10.0,
            gravityScale: 1.0,
        });
    }

    // Utility methods for creating joints
    static createJoint(
        id: string,
        jointType: JointType,
        bodyAId: string,
        bodyBId: string,
        anchorA: Vector3,
        anchorB: Vector3,
        options: Partial<Joint> = {}
    ): Joint {
        return {
            id,
            jointType,
            bodyAId,
            bodyBId,
            anchorA,
            anchorB,
            axis: options.axis || { x: 0, y: 1, z: 0 },
            limits: options.limits || {
                lowerLimit: -1.0,
                upperLimit: 1.0,
                motorSpeed: 0.0,
                motorForce: 100.0,
                stiffness: 1000.0,
                damping: 10.0,
            },
            motor: options.motor || {
                targetVelocity: 0.0,
                maxForce: 100.0,
                isEnabled: false,
                motorType: MotorType.Velocity,
            },
            isEnabled: options.isEnabled !== undefined ? options.isEnabled : true,
            breakForce: options.breakForce || 10000.0,
            breakTorque: options.breakTorque || 10000.0,
            isBroken: false,
        };
    }

    // Utility methods for creating materials
    static createMaterial(
        id: string,
        name: string,
        materialType: MaterialType,
        properties: Partial<Material> = {}
    ): Material {
        return {
            id,
            name,
            materialType,
            density: properties.density || 1.0,
            friction: properties.friction || 0.5,
            restitution: properties.restitution || 0.3,
            rollingFriction: properties.rollingFriction || 0.1,
            spinningFriction: properties.spinningFriction || 0.1,
            hardness: properties.hardness || 1.0,
            elasticity: properties.elasticity || 0.5,
            durability: properties.durability || 100.0,
            heatCapacity: properties.heatCapacity || 1.0,
            thermalConductivity: properties.thermalConductivity || 0.1,
            electricalConductivity: properties.electricalConductivity || 0.0,
            magneticPermeability: properties.magneticPermeability || 1.0,
            color: properties.color || [0.5, 0.5, 0.5, 1.0],
            textureId: properties.textureId,
            customProperties: properties.customProperties || {},
        };
    }

    // Utility methods for creating collision shapes
    static createSphereShape(id: string, radius: number, position: Vector3): EnhancedCollisionShape {
        return {
            id,
            shapeType: ShapeType.Sphere,
            dimensions: { x: radius * 2, y: radius * 2, z: radius * 2 },
            radius,
            height: radius * 2,
            vertices: [],
            indices: [],
            transform: [
                1, 0, 0, position.x,
                0, 1, 0, position.y,
                0, 0, 1, position.z,
                0, 0, 0, 1,
            ],
            isTrigger: false,
            isSensor: false,
            layerMask: 1,
            collisionMask: 1,
        };
    }

    static createBoxShape(id: string, width: number, height: number, depth: number, position: Vector3): EnhancedCollisionShape {
        return {
            id,
            shapeType: ShapeType.Box,
            dimensions: { x: width, y: height, z: depth },
            radius: Math.max(width, height, depth) / 2,
            height: height,
            vertices: [],
            indices: [],
            transform: [
                1, 0, 0, position.x,
                0, 1, 0, position.y,
                0, 0, 1, position.z,
                0, 0, 0, 1,
            ],
            isTrigger: false,
            isSensor: false,
            layerMask: 1,
            collisionMask: 1,
        };
    }

    static createCapsuleShape(id: string, radius: number, height: number, position: Vector3): EnhancedCollisionShape {
        return {
            id,
            shapeType: ShapeType.Capsule,
            dimensions: { x: radius * 2, y: height, z: radius * 2 },
            radius,
            height,
            vertices: [],
            indices: [],
            transform: [
                1, 0, 0, position.x,
                0, 1, 0, position.y,
                0, 0, 1, position.z,
                0, 0, 0, 1,
            ],
            isTrigger: false,
            isSensor: false,
            layerMask: 1,
            collisionMask: 1,
        };
    }

    // Physics analysis methods
    analyzeJointPerformance(): {
        totalJoints: number;
        activeJoints: number;
        brokenJoints: number;
        jointTypes: Record<JointType, number>;
        averageLoad: number;
        recommendations: string[];
    } {
        const joints = this.getJoints();
        const jointTypes: Record<JointType, number> = {} as any;
        let totalLoad = 0;
        
        for (const joint of joints) {
            jointTypes[joint.jointType] = (jointTypes[joint.jointType] || 0) + 1;
            totalLoad += joint.breakForce;
        }
        
        const averageLoad = joints.length > 0 ? totalLoad / joints.length : 0;
        const recommendations: string[] = [];
        
        if (this.getStats().brokenJoints > 0) {
            recommendations.push('Consider increasing break force thresholds for frequently broken joints');
        }
        
        if (averageLoad < 100) {
            recommendations.push('Joint loads seem low, consider optimizing joint configuration');
        }
        
        return {
            totalJoints: joints.length,
            activeJoints: joints.filter(j => j.isEnabled).length,
            brokenJoints: joints.filter(j => j.isBroken).length,
            jointTypes,
            averageLoad,
            recommendations,
        };
    }

    analyzeMaterialUsage(): {
        totalMaterials: number;
        materialTypes: Record<MaterialType, number>;
        averageDurability: number;
        averageDensity: number;
        recommendations: string[];
    } {
        const materials = this.getMaterials();
        const materialTypes: Record<MaterialType, number> = {} as any;
        let totalDurability = 0;
        let totalDensity = 0;
        
        for (const material of materials) {
            materialTypes[material.materialType] = (materialTypes[material.materialType] || 0) + 1;
            totalDurability += material.durability;
            totalDensity += material.density;
        }
        
        const averageDurability = materials.length > 0 ? totalDurability / materials.length : 0;
        const averageDensity = materials.length > 0 ? totalDensity / materials.length : 0;
        const recommendations: string[] = [];
        
        if (averageDurability < 50) {
            recommendations.push('Materials have low durability, consider using more robust materials');
        }
        
        if (averageDensity > 10) {
            recommendations.push('High density materials may impact performance, consider optimization');
        }
        
        return {
            totalMaterials: materials.length,
            materialTypes,
            averageDurability,
            averageDensity,
            recommendations,
        };
    }

    analyzeCollisionPerformance(): {
        totalCollisions: number;
        averageCollisionTime: number;
        collisionShapeTypes: Record<ShapeType, number>;
        recommendations: string[];
    } {
        const stats = this.getStats();
        const shapes = this.getCollisionShapes();
        const collisionShapeTypes: Record<ShapeType, number> = {} as any;
        
        for (const shape of shapes) {
            collisionShapeTypes[shape.shapeType] = (collisionShapeTypes[shape.shapeType] || 0) + 1;
        }
        
        const averageCollisionTime = stats.simulationTime / Math.max(stats.collisionCount, 1);
        const recommendations: string[] = [];
        
        if (stats.collisionCount > 1000) {
            recommendations.push('High collision count detected, consider optimizing collision detection');
        }
        
        if (averageCollisionTime > 1.0) {
            recommendations.push('Collision processing is slow, consider reducing complexity');
        }
        
        return {
            totalCollisions: stats.collisionCount,
            averageCollisionTime,
            collisionShapeTypes,
            recommendations,
        };
    }

    // Generate comprehensive physics report
    generatePhysicsReport(): string {
        const stats = this.getStats();
        const jointAnalysis = this.analyzeJointPerformance();
        const materialAnalysis = this.analyzeMaterialUsage();
        const collisionAnalysis = this.analyzeCollisionPerformance();
        const summary = this.getPhysicsSummary();

        return `🔬 Enhanced Physics System Report
Generated: ${new Date().toISOString()}

📊 System Statistics:
- Total Bodies: ${stats.totalBodies}
- Active Bodies: ${stats.activeBodies}
- Sleeping Bodies: ${stats.sleepingBodies}
- Total Joints: ${stats.totalJoints}
- Active Joints: ${stats.activeJoints}
- Broken Joints: ${stats.brokenJoints}
- Total Materials: ${stats.totalMaterials}
- Raycast Count: ${stats.raycastCount}
- Collision Count: ${stats.collisionCount}
- Solver Iterations Used: ${stats.solverIterationsUsed}
- Simulation Time: ${stats.simulationTime.toFixed(2)}ms

🔗 Joint Analysis:
- Total Joints: ${jointAnalysis.totalJoints}
- Active Joints: ${jointAnalysis.activeJoints}
- Broken Joints: ${jointAnalysis.brokenJoints}
- Average Load: ${jointAnalysis.averageLoad.toFixed(2)}
- Joint Types:
${Object.entries(jointAnalysis.jointTypes).map(([type, count]) => 
    `  - ${JointType[parseInt(type) as JointType]}: ${count}`
).join('\n')}

🧪 Material Analysis:
- Total Materials: ${materialAnalysis.totalMaterials}
- Average Durability: ${materialAnalysis.averageDurability.toFixed(2)}
- Average Density: ${materialAnalysis.averageDensity.toFixed(2)}
- Material Types:
${Object.entries(materialAnalysis.materialTypes).map(([type, count]) => 
    `  - ${MaterialType[parseInt(type) as MaterialType]}: ${count}`
).join('\n')}

🔷 Collision Analysis:
- Total Collisions: ${collisionAnalysis.totalCollisions}
- Average Collision Time: ${collisionAnalysis.averageCollisionTime.toFixed(2)}ms
- Collision Shape Types:
${Object.entries(collisionAnalysis.collisionShapeTypes).map(([type, count]) => 
    `  - ${ShapeType[parseInt(type) as ShapeType]}: ${count}`
).join('\n')}

💡 Recommendations:
${[...jointAnalysis.recommendations, ...materialAnalysis.recommendations, ...collisionAnalysis.recommendations]
    .map(rec => `- ${rec}`)
    .join('\n') || 'No recommendations at this time'}

📋 System Summary:
${summary}`;
    }

    private ensureInitialized(): void {
        if (!this.initialized || !this.wasmModule) {
            throw new Error('Enhanced Physics Engine not initialized');
        }
    }

    isInitialized(): boolean {
        return this.initialized;
    }
}
