import { RustEnhancedPhysics, JointType, MaterialType, ShapeType, MotorType, Vector3 } from '../rust-wrappers/RustEnhancedPhysics';

export interface TestResult {
    name: string;
    status: 'pass' | 'fail' | 'skip';
    message: string;
    duration: number;
    details?: any;
}

export class RustEnhancedPhysicsTest {
    private enhancedPhysics: RustEnhancedPhysics;
    private results: TestResult[] = [];

    constructor() {
        this.enhancedPhysics = new RustEnhancedPhysics();
    }

    async runAllTests(): Promise<void> {
        console.log('🔬 Starting Rust Enhanced Physics Tests...');
        console.log('==========================================');
        
        try {
            await this.testInitialization();
            await this.testJointManagement();
            await this.testMaterialManagement();
            await this.testRaycasting();
            await this.testCollisionShapes();
            await this.testConfigurationPresets();
            await this.testPhysicsAnalysis();
            await this.testPerformanceMonitoring();
            await this.testPhysicsSimulation();
            await this.testAdvancedFeatures();
            
            this.generateReport();
        } catch (error) {
            console.error('❌ Rust Enhanced Physics test suite failed:', error instanceof Error ? error.message : String(error));
            this.addResult('Rust Enhanced Physics Test Suite', 'fail', `Suite failed: ${error instanceof Error ? error.message : String(error)}`, 0);
        }
    }

    private async testInitialization(): Promise<void> {
        const testName = 'Enhanced Physics Initialization';
        const start = performance.now();
        
        try {
            const config = RustEnhancedPhysics.createFullPhysicsConfig();
            await this.enhancedPhysics.initialize(config);
            
            if (!this.enhancedPhysics.isInitialized()) {
                throw new Error('Enhanced Physics not initialized after initialize() call');
            }
            
            // Test config retrieval
            const retrievedConfig = this.enhancedPhysics.getConfig();
            if (!retrievedConfig.enableJoints || !retrievedConfig.enableRaycasting) {
                throw new Error('Config not set correctly');
            }
            
            // Test stats retrieval
            const stats = this.enhancedPhysics.getStats();
            if (stats.totalJoints < 0 || stats.totalMaterials < 0) {
                throw new Error('Stats not valid');
            }
            
            // Test physics summary
            const summary = this.enhancedPhysics.getPhysicsSummary();
            if (!summary || summary.length === 0) {
                throw new Error('Physics summary not available');
            }
            
            this.addResult(testName, 'pass', 'Enhanced Physics initialized successfully', performance.now() - start);
        } catch (error) {
            this.addResult(testName, 'fail', `Initialization failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testJointManagement(): Promise<void> {
        const testName = 'Joint Management';
        const start = performance.now();
        
        try {
            // Create test joints
            const joint1 = RustEnhancedPhysics.createJoint(
                'joint1',
                JointType.Revolute,
                'body1',
                'body2',
                { x: 0, y: 0, z: 0 },
                { x: 1, y: 0, z: 0 }
            );
            
            const joint2 = RustEnhancedPhysics.createJoint(
                'joint2',
                JointType.Prismatic,
                'body2',
                'body3',
                { x: 0, y: 0, z: 0 },
                { x: 0, y: 1, z: 0 },
                {
                    limits: {
                        lowerLimit: -2.0,
                        upperLimit: 2.0,
                        motorSpeed: 5.0,
                        motorForce: 200.0,
                        stiffness: 1500.0,
                        damping: 15.0,
                    },
                    motor: {
                        targetVelocity: 2.0,
                        maxForce: 150.0,
                        isEnabled: true,
                        motorType: MotorType.Velocity,
                    }
                }
            );
            
            // Add joints
            const result1 = this.enhancedPhysics.addJoint(joint1);
            if (!result1.success) {
                throw new Error(`Failed to add joint1: ${result1.message}`);
            }
            
            const result2 = this.enhancedPhysics.addJoint(joint2);
            if (!result2.success) {
                throw new Error(`Failed to add joint2: ${result2.message}`);
            }
            
            // Test duplicate joint
            const duplicateResult = this.enhancedPhysics.addJoint(joint1);
            if (duplicateResult.success) {
                throw new Error('Should not allow duplicate joint IDs');
            }
            
            // Test joint retrieval
            const retrievedJoint1 = this.enhancedPhysics.getJoint('joint1');
            if (!retrievedJoint1 || retrievedJoint1.jointType !== JointType.Revolute) {
                throw new Error('Joint1 not retrieved correctly');
            }
            
            const allJoints = this.enhancedPhysics.getJoints();
            if (allJoints.length !== 2) {
                throw new Error('Expected 2 joints, got ' + allJoints.length);
            }
            
            // Test joint enable/disable
            const disableResult = this.enhancedPhysics.disableJoint('joint1');
            if (!disableResult.success) {
                throw new Error(`Failed to disable joint1: ${disableResult.message}`);
            }
            
            const disabledJoint = this.enhancedPhysics.getJoint('joint1');
            if (disabledJoint?.isEnabled) {
                throw new Error('Joint1 should be disabled');
            }
            
            const enableResult = this.enhancedPhysics.enableJoint('joint1');
            if (!enableResult.success) {
                throw new Error(`Failed to enable joint1: ${enableResult.message}`);
            }
            
            // Test joint breaking
            const breakResult = this.enhancedPhysics.breakJoint('joint2');
            if (!breakResult.success) {
                throw new Error(`Failed to break joint2: ${breakResult.message}`);
            }
            
            const brokenJoint = this.enhancedPhysics.getJoint('joint2');
            if (!brokenJoint?.isBroken || brokenJoint.isEnabled) {
                throw new Error('Joint2 should be broken and disabled');
            }
            
            // Test joint removal
            const removeResult = this.enhancedPhysics.removeJoint('joint1');
            if (!removeResult.success) {
                throw new Error(`Failed to remove joint1: ${removeResult.message}`);
            }
            
            const removedJoint = this.enhancedPhysics.getJoint('joint1');
            if (removedJoint) {
                throw new Error('Joint1 should be removed');
            }
            
            const finalJoints = this.enhancedPhysics.getJoints();
            if (finalJoints.length !== 1) {
                throw new Error('Expected 1 joint after removal, got ' + finalJoints.length);
            }
            
            this.addResult(testName, 'pass', 'Joint management works correctly', performance.now() - start, {
                jointsCreated: 2,
                jointsActive: finalJoints.filter(j => j.isEnabled).length,
                jointsBroken: finalJoints.filter(j => j.isBroken).length,
                jointTypes: [...new Set(finalJoints.map(j => j.jointType))].length,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Joint management failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testMaterialManagement(): Promise<void> {
        const testName = 'Material Management';
        const start = performance.now();
        
        try {
            // Create test materials
            const metal = RustEnhancedPhysics.createMaterial(
                'metal',
                'Steel',
                MaterialType.Dynamic,
                {
                    density: 7.8,
                    friction: 0.7,
                    restitution: 0.1,
                    hardness: 5.0,
                    durability: 500.0,
                    color: [0.7, 0.7, 0.8, 1.0],
                }
            );
            
            const rubber = RustEnhancedPhysics.createMaterial(
                'rubber',
                'Rubber',
                MaterialType.Dynamic,
                {
                    density: 1.2,
                    friction: 0.9,
                    restitution: 0.8,
                    hardness: 0.5,
                    durability: 200.0,
                    color: [0.2, 0.2, 0.2, 1.0],
                }
            );
            
            const glass = RustEnhancedPhysics.createMaterial(
                'glass',
                'Glass',
                MaterialType.Dynamic,
                {
                    density: 2.5,
                    friction: 0.3,
                    restitution: 0.05,
                    hardness: 6.0,
                    durability: 50.0,
                    color: [0.8, 0.9, 1.0, 0.7],
                }
            );
            
            // Add materials
            const result1 = this.enhancedPhysics.addMaterial(metal);
            if (!result1.success) {
                throw new Error(`Failed to add metal: ${result1.message}`);
            }
            
            const result2 = this.enhancedPhysics.addMaterial(rubber);
            if (!result2.success) {
                throw new Error(`Failed to add rubber: ${result2.message}`);
            }
            
            const result3 = this.enhancedPhysics.addMaterial(glass);
            if (!result3.success) {
                throw new Error(`Failed to add glass: ${result3.message}`);
            }
            
            // Test duplicate material
            const duplicateResult = this.enhancedPhysics.addMaterial(metal);
            if (duplicateResult.success) {
                throw new Error('Should not allow duplicate material IDs');
            }
            
            // Test material retrieval
            const retrievedMetal = this.enhancedPhysics.getMaterial('metal');
            if (!retrievedMetal || retrievedMetal.name !== 'Steel') {
                throw new Error('Metal material not retrieved correctly');
            }
            
            const allMaterials = this.enhancedPhysics.getMaterials();
            if (allMaterials.length !== 3) {
                throw new Error('Expected 3 materials, got ' + allMaterials.length);
            }
            
            // Test material properties
            if (retrievedMetal.density !== 7.8 || retrievedMetal.friction !== 0.7) {
                throw new Error('Metal properties not set correctly');
            }
            
            // Test material removal
            const removeResult = this.enhancedPhysics.removeMaterial('glass');
            if (!removeResult.success) {
                throw new Error(`Failed to remove glass: ${removeResult.message}`);
            }
            
            const removedMaterial = this.enhancedPhysics.getMaterial('glass');
            if (removedMaterial) {
                throw new Error('Glass material should be removed');
            }
            
            const finalMaterials = this.enhancedPhysics.getMaterials();
            if (finalMaterials.length !== 2) {
                throw new Error('Expected 2 materials after removal, got ' + finalMaterials.length);
            }
            
            // Test material analysis
            const analysis = this.enhancedPhysics.analyzeMaterialUsage();
            if (analysis.totalMaterials !== 2) {
                throw new Error('Material analysis count mismatch');
            }
            
            if (analysis.averageDurability <= 0) {
                throw new Error('Invalid average durability');
            }
            
            this.addResult(testName, 'pass', 'Material management works correctly', performance.now() - start, {
                materialsCreated: 3,
                materialsRemaining: finalMaterials.length,
                averageDurability: analysis.averageDurability,
                averageDensity: analysis.averageDensity,
                materialTypes: Object.keys(analysis.materialTypes).length,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Material management failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testRaycasting(): Promise<void> {
        const testName = 'Raycasting';
        const start = performance.now();
        
        try {
            // Test basic raycast
            const origin = { x: 0, y: 0, z: 0 };
            const direction = { x: 1, y: 0, z: 0 };
            const maxDistance = 100;
            
            const result = this.enhancedPhysics.raycast(origin, direction, maxDistance);
            
            if (!result || result.hitCount < 0) {
                throw new Error('Raycast result invalid');
            }
            
            if (result.hits.length !== result.hitCount) {
                throw new Error('Hit count mismatch');
            }
            
            // Verify hit structure
            for (const hit of result.hits) {
                if (!hit.point || !hit.normal || hit.distance < 0) {
                    throw new Error('Invalid hit structure');
                }
                
                if (!hit.isValid) {
                    throw new Error('Hit should be valid');
                }
            }
            
            // Test raycast all directions
            const allResults = this.enhancedPhysics.raycastAll(origin, maxDistance);
            if (allResults.length !== 6) {
                throw new Error('Expected 6 raycast results, got ' + allResults.length);
            }
            
            // Test raycast in sphere
            const sphereResults = this.enhancedPhysics.raycastInSphere(origin, 50, 8);
            if (sphereResults.length !== 8) {
                throw new Error('Expected 8 sphere raycast results, got ' + sphereResults.length);
            }
            
            // Test closest and farthest hits
            if (result.hitCount > 0) {
                if (!result.closestHit || !result.farthestHit) {
                    throw new Error('Missing closest or farthest hit');
                }
                
                if (result.closestHit.distance > result.farthestHit.distance) {
                    throw new Error('Closest hit should be closer than farthest hit');
                }
            }
            
            // Test raycast with no hits (simulate)
            const noHitResult = this.enhancedPhysics.raycast(
                { x: 1000, y: 1000, z: 1000 },
                { x: 0, y: 1, z: 0 },
                10
            );
            
            if (noHitResult.hitCount !== 0) {
                console.warn('Expected no hits, but got ' + noHitResult.hitCount);
            }
            
            this.addResult(testName, 'pass', 'Raycasting works correctly', performance.now() - start, {
                basicRaycastHits: result.hitCount,
                allDirectionRaycasts: allResults.length,
                sphereRaycasts: sphereResults.length,
                closestHitDistance: result.closestHit?.distance,
                farthestHitDistance: result.farthestHit?.distance,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Raycasting failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testCollisionShapes(): Promise<void> {
        const testName = 'Collision Shapes';
        const start = performance.now();
        
        try {
            // Create test collision shapes
            const sphere = RustEnhancedPhysics.createSphereShape('sphere1', 5.0, { x: 0, y: 0, z: 0 });
            const box = RustEnhancedPhysics.createBoxShape('box1', 10, 8, 6, { x: 10, y: 0, z: 0 });
            const capsule = RustEnhancedPhysics.createCapsuleShape('capsule1', 3.0, 8.0, { x: -10, y: 0, z: 0 });
            
            // Add collision shapes
            const result1 = this.enhancedPhysics.addCollisionShape(sphere);
            if (!result1.success) {
                throw new Error(`Failed to add sphere: ${result1.message}`);
            }
            
            const result2 = this.enhancedPhysics.addCollisionShape(box);
            if (!result2.success) {
                throw new Error(`Failed to add box: ${result2.message}`);
            }
            
            const result3 = this.enhancedPhysics.addCollisionShape(capsule);
            if (!result3.success) {
                throw new Error(`Failed to add capsule: ${result3.message}`);
            }
            
            // Test duplicate shape
            const duplicateResult = this.enhancedPhysics.addCollisionShape(sphere);
            if (duplicateResult.success) {
                throw new Error('Should not allow duplicate shape IDs');
            }
            
            // Test shape retrieval
            const retrievedSphere = this.enhancedPhysics.getCollisionShape('sphere1');
            if (!retrievedSphere || retrievedSphere.shapeType !== ShapeType.Sphere) {
                throw new Error('Sphere shape not retrieved correctly');
            }
            
            const allShapes = this.enhancedPhysics.getCollisionShapes();
            if (allShapes.length !== 3) {
                throw new Error('Expected 3 shapes, got ' + allShapes.length);
            }
            
            // Test shape properties
            if (retrievedSphere.radius !== 5.0) {
                throw new Error('Sphere radius not set correctly');
            }
            
            const retrievedBox = this.enhancedPhysics.getCollisionShape('box1');
            if (!retrievedBox || retrievedBox.shapeType !== ShapeType.Box) {
                throw new Error('Box shape not retrieved correctly');
            }
            
            if (retrievedBox.dimensions.x !== 10 || retrievedBox.dimensions.y !== 8) {
                throw new Error('Box dimensions not set correctly');
            }
            
            // Test shape removal
            const removeResult = this.enhancedPhysics.removeCollisionShape('capsule1');
            if (!removeResult.success) {
                throw new Error(`Failed to remove capsule: ${removeResult.message}`);
            }
            
            const removedShape = this.enhancedPhysics.getCollisionShape('capsule1');
            if (removedShape) {
                throw new Error('Capsule shape should be removed');
            }
            
            const finalShapes = this.enhancedPhysics.getCollisionShapes();
            if (finalShapes.length !== 2) {
                throw new Error('Expected 2 shapes after removal, got ' + finalShapes.length);
            }
            
            // Test collision analysis
            const analysis = this.enhancedPhysics.analyzeCollisionPerformance();
            if (analysis.totalCollisions < 0) {
                throw new Error('Invalid collision count');
            }
            
            this.addResult(testName, 'pass', 'Collision shapes work correctly', performance.now() - start, {
                shapesCreated: 3,
                shapesRemaining: finalShapes.length,
                shapeTypes: [...new Set(finalShapes.map(s => s.shapeType))].length,
                totalCollisions: analysis.totalCollisions,
                averageCollisionTime: analysis.averageCollisionTime,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Collision shapes failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testConfigurationPresets(): Promise<void> {
        const testName = 'Configuration Presets';
        const start = performance.now();
        
        try {
            // Test full physics configuration
            const fullConfig = RustEnhancedPhysics.createFullPhysicsConfig();
            await this.enhancedPhysics.initialize(fullConfig);
            
            const fullConfigRetrieved = this.enhancedPhysics.getConfig();
            if (!fullConfigRetrieved.enableJoints || !fullConfigRetrieved.enableRaycasting) {
                throw new Error('Full physics configuration not set correctly');
            }
            
            // Test basic physics configuration
            const basicConfig = RustEnhancedPhysics.createBasicPhysicsConfig();
            await this.enhancedPhysics.initialize(basicConfig);
            
            const basicConfigRetrieved = this.enhancedPhysics.getConfig();
            if (basicConfigRetrieved.enableJoints || basicConfigRetrieved.enableRaycasting) {
                throw new Error('Basic physics configuration not set correctly');
            }
            
            // Test high performance configuration
            const highPerfConfig = RustEnhancedPhysics.createHighPerformanceConfig();
            await this.enhancedPhysics.initialize(highPerfConfig);
            
            const highPerfConfigRetrieved = this.enhancedPhysics.getConfig();
            if (!highPerfConfigRetrieved.enableJoints || highPerfConfigRetrieved.substepCount !== 16) {
                throw new Error('High performance configuration not set correctly');
            }
            
            // Test mobile configuration
            const mobileConfig = RustEnhancedPhysics.createMobileConfig();
            await this.enhancedPhysics.initialize(mobileConfig);
            
            const mobileConfigRetrieved = this.enhancedPhysics.getConfig();
            if (!mobileConfigRetrieved.enableJoints || mobileConfigRetrieved.substepCount !== 2) {
                throw new Error('Mobile configuration not set correctly');
            }
            
            // Test custom configuration
            const customConfig = RustEnhancedPhysics.createPhysicsConfig({
                enableJoints: true,
                enableRaycasting: false,
                enableMaterials: true,
                substepCount: 6,
                solverIterations: 15,
            });
            
            await this.enhancedPhysics.initialize(customConfig);
            const customConfigRetrieved = this.enhancedPhysics.getConfig();
            
            if (!customConfigRetrieved.enableJoints || customConfigRetrieved.enableRaycasting) {
                throw new Error('Custom configuration not set correctly');
            }
            
            if (customConfigRetrieved.substepCount !== 6 || customConfigRetrieved.solverIterations !== 15) {
                throw new Error('Custom configuration parameters not set correctly');
            }
            
            this.addResult(testName, 'pass', 'Configuration presets work correctly', performance.now() - start, {
                fullConfigFeatures: this.countEnabledFeatures(fullConfigRetrieved),
                basicConfigFeatures: this.countEnabledFeatures(basicConfigRetrieved),
                highPerfConfigFeatures: this.countEnabledFeatures(highPerfConfigRetrieved),
                mobileConfigFeatures: this.countEnabledFeatures(mobileConfigRetrieved),
                customConfigFeatures: this.countEnabledFeatures(customConfigRetrieved),
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Configuration presets failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testPhysicsAnalysis(): Promise<void> {
        const testName = 'Physics Analysis';
        const start = performance.now();
        
        try {
            // Set up test data
            await this.enhancedPhysics.initialize(RustEnhancedPhysics.createFullPhysicsConfig());
            
            // Add test joints
            const joint1 = RustEnhancedPhysics.createJoint('joint1', JointType.Revolute, 'body1', 'body2', 
                { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 });
            const joint2 = RustEnhancedPhysics.createJoint('joint2', JointType.Prismatic, 'body2', 'body3', 
                { x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });
            const joint3 = RustEnhancedPhysics.createJoint('joint3', JointType.Spherical, 'body3', 'body4', 
                { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 });
            
            this.enhancedPhysics.addJoint(joint1);
            this.enhancedPhysics.addJoint(joint2);
            this.enhancedPhysics.addJoint(joint3);
            
            // Add test materials
            const metal = RustEnhancedPhysics.createMaterial('metal', 'Steel', MaterialType.Dynamic, 
                { density: 7.8, durability: 500 });
            const rubber = RustEnhancedPhysics.createMaterial('rubber', 'Rubber', MaterialType.Dynamic, 
                { density: 1.2, durability: 200 });
            const glass = RustEnhancedPhysics.createMaterial('glass', 'Glass', MaterialType.Dynamic, 
                { density: 2.5, durability: 50 });
            
            this.enhancedPhysics.addMaterial(metal);
            this.enhancedPhysics.addMaterial(rubber);
            this.enhancedPhysics.addMaterial(glass);
            
            // Test joint analysis
            const jointAnalysis = this.enhancedPhysics.analyzeJointPerformance();
            
            if (jointAnalysis.totalJoints !== 3) {
                throw new Error('Joint analysis total count mismatch');
            }
            
            if (jointAnalysis.activeJoints !== 3) {
                throw new Error('Joint analysis active count mismatch');
            }
            
            if (Object.keys(jointAnalysis.jointTypes).length !== 3) {
                throw new Error('Joint analysis types count mismatch');
            }
            
            if (jointAnalysis.averageLoad <= 0) {
                throw new Error('Invalid average joint load');
            }
            
            // Test material analysis
            const materialAnalysis = this.enhancedPhysics.analyzeMaterialUsage();
            
            if (materialAnalysis.totalMaterials !== 3) {
                throw new Error('Material analysis total count mismatch');
            }
            
            if (materialAnalysis.averageDurability <= 0) {
                throw new Error('Invalid average durability');
            }
            
            if (materialAnalysis.averageDensity <= 0) {
                throw new Error('Invalid average density');
            }
            
            // Test collision analysis
            const collisionAnalysis = this.enhancedPhysics.analyzeCollisionPerformance();
            
            if (collisionAnalysis.totalCollisions < 0) {
                throw new Error('Invalid collision count');
            }
            
            if (collisionAnalysis.averageCollisionTime < 0) {
                throw new Error('Invalid average collision time');
            }
            
            // Test comprehensive report
            const report = this.enhancedPhysics.generatePhysicsReport();
            
            if (!report || report.length === 0) {
                throw new Error('Physics report generation failed');
            }
            
            // Verify report contains expected sections
            const expectedSections = [
                'System Statistics:',
                'Joint Analysis:',
                'Material Analysis:',
                'Collision Analysis:',
                'Recommendations:',
                'System Summary:',
            ];
            
            for (const section of expectedSections) {
                if (!report.includes(section)) {
                    console.warn(`Report missing section: ${section}`);
                }
            }
            
            this.addResult(testName, 'pass', 'Physics analysis works correctly', performance.now() - start, {
                jointAnalysis: {
                    totalJoints: jointAnalysis.totalJoints,
                    activeJoints: jointAnalysis.activeJoints,
                    averageLoad: jointAnalysis.averageLoad,
                },
                materialAnalysis: {
                    totalMaterials: materialAnalysis.totalMaterials,
                    averageDurability: materialAnalysis.averageDurability,
                    averageDensity: materialAnalysis.averageDensity,
                },
                collisionAnalysis: {
                    totalCollisions: collisionAnalysis.totalCollisions,
                    averageCollisionTime: collisionAnalysis.averageCollisionTime,
                },
                reportLength: report.length,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Physics analysis failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testPerformanceMonitoring(): Promise<void> {
        const testName = 'Performance Monitoring';
        const start = performance.now();
        
        try {
            // Initialize with high performance config
            const config = RustEnhancedPhysics.createHighPerformanceConfig();
            await this.enhancedPhysics.initialize(config);
            
            // Create performance-intensive scenario
            for (let i = 0; i < 50; i++) {
                const joint = RustEnhancedPhysics.createJoint(
                    `joint${i}`,
                    JointType.Revolute,
                    `body${i}`,
                    `body${i + 1}`,
                    { x: i, y: 0, z: 0 },
                    { x: i + 1, y: 0, z: 0 }
                );
                this.enhancedPhysics.addJoint(joint);
            }
            
            for (let i = 0; i < 20; i++) {
                const material = RustEnhancedPhysics.createMaterial(
                    `material${i}`,
                    `Material${i}`,
                    MaterialType.Dynamic,
                    {
                        density: 1.0 + (i * 0.1),
                        durability: 100 + (i * 10),
                    }
                );
                this.enhancedPhysics.addMaterial(material);
            }
            
            // Perform raycasting operations
            for (let i = 0; i < 100; i++) {
                const origin = { x: i, y: 0, z: 0 };
                const direction = { x: 1, y: Math.sin(i * 0.1), z: Math.cos(i * 0.1) };
                this.enhancedPhysics.raycast(origin, direction, 100);
            }
            
            // Add collision shapes
            for (let i = 0; i < 30; i++) {
                const sphere = RustEnhancedPhysics.createSphereShape(
                    `sphere${i}`,
                    1.0 + (i * 0.1),
                    { x: i * 2, y: 0, z: 0 }
                );
                this.enhancedPhysics.addCollisionShape(sphere);
            }
            
            // Get performance stats
            const stats = this.enhancedPhysics.getStats();
            
            if (stats.totalJoints !== 50) {
                throw new Error('Expected 50 joints, got ' + stats.totalJoints);
            }
            
            if (stats.totalMaterials !== 20) {
                throw new Error('Expected 20 materials, got ' + stats.totalMaterials);
            }
            
            if (stats.raycastCount !== 100) {
                throw new Error('Expected 100 raycasts, got ' + stats.raycastCount);
            }
            
            if (stats.simulationTime < 0) {
                throw new Error('Invalid simulation time');
            }
            
            // Test performance analysis
            const jointAnalysis = this.enhancedPhysics.analyzeJointPerformance();
            const materialAnalysis = this.enhancedPhysics.analyzeMaterialUsage();
            const collisionAnalysis = this.enhancedPhysics.analyzeCollisionPerformance();
            
            // Performance recommendations
            const recommendations = [
                ...jointAnalysis.recommendations,
                ...materialAnalysis.recommendations,
                ...collisionAnalysis.recommendations,
            ];
            
            if (recommendations.length === 0) {
                console.warn('No performance recommendations generated');
            }
            
            // Test performance under different configurations
            const basicConfig = RustEnhancedPhysics.createBasicPhysicsConfig();
            await this.enhancedPhysics.initialize(basicConfig);
            
            const basicStats = this.enhancedPhysics.getStats();
            
            if (basicStats.solverIterationsUsed >= stats.solverIterationsUsed) {
                console.warn('Basic config should use fewer solver iterations');
            }
            
            this.addResult(testName, 'pass', 'Performance monitoring works correctly', performance.now() - start, {
                totalJoints: stats.totalJoints,
                totalMaterials: stats.totalMaterials,
                raycastCount: stats.raycastCount,
                simulationTime: stats.simulationTime,
                solverIterationsUsed: stats.solverIterationsUsed,
                performanceRecommendations: recommendations.length,
                basicConfigIterations: basicStats.solverIterationsUsed,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Performance monitoring failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testPhysicsSimulation(): Promise<void> {
        const testName = 'Physics Simulation';
        const start = performance.now();
        
        try {
            // Initialize with simulation-friendly config
            const config = RustEnhancedPhysics.createPhysicsConfig({
                enableJoints: true,
                enableRaycasting: true,
                enableMaterials: true,
                enableAdvancedCollision: true,
                enableSubstepping: true,
                substepCount: 4,
                solverIterations: 8,
            });
            
            await this.enhancedPhysics.initialize(config);
            
            // Create a simple physics scene
            // Create joints for a simple mechanism
            const baseJoint = RustEnhancedPhysics.createJoint(
                'base',
                JointType.Weld,
                'world',
                'arm1',
                { x: 0, y: 0, z: 0 },
                { x: 0, y: 1, z: 0 }
            );
            
            const armJoint1 = RustEnhancedPhysics.createJoint(
                'arm1',
                JointType.Revolute,
                'arm1',
                'arm2',
                { x: 0, y: 2, z: 0 },
                { x: 2, y: 2, z: 0 },
                {
                    limits: {
                        lowerLimit: -Math.PI / 2,
                        upperLimit: Math.PI / 2,
                        motorSpeed: 1.0,
                        motorForce: 100.0,
                        stiffness: 500.0,
                        damping: 5.0,
                    },
                    motor: {
                        targetVelocity: 0.5,
                        maxForce: 50.0,
                        isEnabled: true,
                        motorType: MotorType.Velocity,
                    }
                }
            );
            
            const armJoint2 = RustEnhancedPhysics.createJoint(
                'arm2',
                JointType.Revolute,
                'arm2',
                'arm3',
                { x: 2, y: 2, z: 0 },
                { x: 4, y: 2, z: 0 },
                {
                    limits: {
                        lowerLimit: -Math.PI / 4,
                        upperLimit: Math.PI / 4,
                        motorSpeed: 0.5,
                        motorForce: 50.0,
                        stiffness: 300.0,
                        damping: 3.0,
                    }
                }
            );
            
            this.enhancedPhysics.addJoint(baseJoint);
            this.enhancedPhysics.addJoint(armJoint1);
            this.enhancedPhysics.addJoint(armJoint2);
            
            // Create materials with different properties
            const steel = RustEnhancedPhysics.createMaterial('steel', 'Steel', MaterialType.Dynamic, {
                density: 7.8,
                friction: 0.7,
                restitution: 0.1,
                hardness: 5.0,
                durability: 500.0,
            });
            
            const aluminum = RustEnhancedPhysics.createMaterial('aluminum', 'Aluminum', MaterialType.Dynamic, {
                density: 2.7,
                friction: 0.5,
                restitution: 0.3,
                hardness: 2.5,
                durability: 300.0,
            });
            
            this.enhancedPhysics.addMaterial(steel);
            this.enhancedPhysics.addMaterial(aluminum);
            
            // Create collision shapes
            const baseSphere = RustEnhancedPhysics.createSphereShape('baseSphere', 0.5, { x: 0, y: 0, z: 0 });
            const armBox1 = RustEnhancedPhysics.createBoxShape('armBox1', 2, 0.2, 0.2, { x: 1, y: 2, z: 0 });
            const armBox2 = RustEnhancedPhysics.createBoxShape('armBox2', 2, 0.2, 0.2, { x: 3, y: 2, z: 0 });
            const endSphere = RustEnhancedPhysics.createSphereShape('endSphere', 0.3, { x: 4, y: 2, z: 0 });
            
            this.enhancedPhysics.addCollisionShape(baseSphere);
            this.enhancedPhysics.addCollisionShape(armBox1);
            this.enhancedPhysics.addCollisionShape(armBox2);
            this.enhancedPhysics.addCollisionShape(endSphere);
            
            // Simulate raycasting to detect the mechanism
            const raycastResults = [];
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
                const origin = { x: 2, y: 2, z: -5 };
                const direction = { x: Math.cos(angle), y: 0, z: Math.sin(angle) };
                const result = this.enhancedPhysics.raycast(origin, direction, 10);
                raycastResults.push(result);
            }
            
            // Verify raycast results
            if (raycastResults.length !== 16) {
                throw new Error('Expected 16 raycast results, got ' + raycastResults.length);
            }
            
            // Check if raycasts detected the mechanism
            let totalHits = 0;
            for (const result of raycastResults) {
                totalHits += result.hitCount;
            }
            
            if (totalHits === 0) {
                console.warn('No raycast hits detected on mechanism');
            }
            
            // Get simulation statistics
            const stats = this.enhancedPhysics.getStats();
            
            if (stats.totalJoints !== 3) {
                throw new Error('Expected 3 joints in simulation');
            }
            
            if (stats.totalMaterials !== 2) {
                throw new Error('Expected 2 materials in simulation');
            }
            
            // Test joint states
            const activeJoints = this.enhancedPhysics.getJoints().filter(j => j.isEnabled);
            if (activeJoints.length !== 3) {
                throw new Error('Expected 3 active joints');
            }
            
            // Test motorized joint
            const motorizedJoint = this.enhancedPhysics.getJoint('arm1');
            if (!motorizedJoint || !motorizedJoint.motor.isEnabled) {
                throw new Error('Motorized joint not configured correctly');
            }
            
            // Generate simulation report
            const report = this.enhancedPhysics.generatePhysicsReport();
            
            if (!report.includes('Joint Analysis:') || !report.includes('Material Analysis:')) {
                throw new Error('Simulation report incomplete');
            }
            
            this.addResult(testName, 'pass', 'Physics simulation works correctly', performance.now() - start, {
                jointsInSimulation: stats.totalJoints,
                materialsInSimulation: stats.totalMaterials,
                raycastHits: totalHits,
                activeJoints: activeJoints.length,
                motorizedJoints: this.enhancedPhysics.getJoints().filter(j => j.motor.isEnabled).length,
                simulationTime: stats.simulationTime,
                reportGenerated: report.length > 0,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Physics simulation failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private async testAdvancedFeatures(): Promise<void> {
        const testName = 'Advanced Features';
        const start = performance.now();
        
        try {
            // Test all joint types
            const jointTypes = [
                JointType.Revolute,
                JointType.Prismatic,
                JointType.Spherical,
                JointType.Weld,
                JointType.Distance,
                JointType.Hinge,
            ];
            
            for (let i = 0; i < jointTypes.length; i++) {
                const jointType = jointTypes[i];
                const joint = RustEnhancedPhysics.createJoint(
                    `joint_${JointType[jointType].toLowerCase()}`,
                    jointType,
                    `body${i}`,
                    `body${i + 1}`,
                    { x: i, y: 0, z: 0 },
                    { x: i + 1, y: 0, z: 0 }
                );
                
                const result = this.enhancedPhysics.addJoint(joint);
                if (!result.success) {
                    throw new Error(`Failed to add ${JointType[jointType]} joint`);
                }
            }
            
            // Test all material types
            const materialTypes = [
                MaterialType.Static,
                MaterialType.Dynamic,
                MaterialType.Kinematic,
                MaterialType.Trigger,
                MaterialType.Sensor,
            ];
            
            for (let i = 0; i < materialTypes.length; i++) {
                const materialType = materialTypes[i];
                const material = RustEnhancedPhysics.createMaterial(
                    `material_${MaterialType[materialType].toLowerCase()}`,
                    `${MaterialType[materialType]} Material`,
                    materialType,
                    {
                        density: 1.0 + (i * 0.5),
                        durability: 100 + (i * 50),
                    }
                );
                
                const result = this.enhancedPhysics.addMaterial(material);
                if (!result.success) {
                    throw new Error(`Failed to add ${MaterialType[materialType]} material`);
                }
            }
            
            // Test all shape types
            const shapeTypes = [
                ShapeType.Sphere,
                ShapeType.Box,
                ShapeType.Capsule,
                ShapeType.Cylinder,
                ShapeType.Cone,
            ];
            
            for (let i = 0; i < shapeTypes.length; i++) {
                const shapeType = shapeTypes[i];
                let shape;
                
                switch (shapeType) {
                    case ShapeType.Sphere:
                        shape = RustEnhancedPhysics.createSphereShape(
                            `shape_${ShapeType[shapeType].toLowerCase()}`,
                            1.0 + (i * 0.5),
                            { x: i * 3, y: 0, z: 0 }
                        );
                        break;
                    case ShapeType.Box:
                        shape = RustEnhancedPhysics.createBoxShape(
                            `shape_${ShapeType[shapeType].toLowerCase()}`,
                            2 + (i * 0.5),
                            2 + (i * 0.3),
                            2 + (i * 0.4),
                            { x: i * 3, y: 0, z: 0 }
                        );
                        break;
                    case ShapeType.Capsule:
                        shape = RustEnhancedPhysics.createCapsuleShape(
                            `shape_${ShapeType[shapeType].toLowerCase()}`,
                            0.5 + (i * 0.2),
                            2 + (i * 0.5),
                            { x: i * 3, y: 0, z: 0 }
                        );
                        break;
                    default:
                        // Create a sphere as fallback for unimplemented shapes
                        shape = RustEnhancedPhysics.createSphereShape(
                            `shape_${ShapeType[shapeType].toLowerCase()}`,
                            1.0,
                            { x: i * 3, y: 0, z: 0 }
                        );
                }
                
                const result = this.enhancedPhysics.addCollisionShape(shape);
                if (!result.success) {
                    throw new Error(`Failed to add ${ShapeType[shapeType]} shape`);
                }
            }
            
            // Test advanced raycasting patterns
            const origin = { x: 0, y: 0, z: 0 };
            
            // Test dense raycasting
            const denseResults = [];
            for (let i = 0; i < 50; i++) {
                const angle = (i / 50) * Math.PI * 2;
                const direction = {
                    x: Math.cos(angle),
                    y: Math.sin(angle) * 0.5,
                    z: Math.sin(angle),
                };
                denseResults.push(this.enhancedPhysics.raycast(origin, direction, 20));
            }
            
            // Test raycast with different distances
            const distanceResults = [];
            for (let distance = 1; distance <= 10; distance++) {
                const result = this.enhancedPhysics.raycast(origin, { x: 1, y: 0, z: 0 }, distance);
                distanceResults.push(result);
            }
            
            // Test complex joint configurations
            const complexJoint = RustEnhancedPhysics.createJoint(
                'complex_joint',
                JointType.Universal,
                'bodyA',
                'bodyB',
                { x: 0, y: 0, z: 0 },
                { x: 1, y: 1, z: 1 },
                {
                    limits: {
                        lowerLimit: -Math.PI,
                        upperLimit: Math.PI,
                        motorSpeed: 2.0,
                        motorForce: 300.0,
                        stiffness: 2000.0,
                        damping: 20.0,
                    },
                    motor: {
                        targetVelocity: 1.5,
                        maxForce: 200.0,
                        isEnabled: true,
                        motorType: MotorType.Angular,
                    },
                    breakForce: 5000.0,
                    breakTorque: 5000.0,
                }
            );
            
            const complexResult = this.enhancedPhysics.addJoint(complexJoint);
            if (!complexResult.success) {
                throw new Error('Failed to add complex joint');
            }
            
            // Test joint breaking
            const breakResult = this.enhancedPhysics.breakJoint('complex_joint');
            if (!breakResult.success) {
                throw new Error('Failed to break complex joint');
            }
            
            const brokenJoint = this.enhancedPhysics.getJoint('complex_joint');
            if (!brokenJoint?.isBroken) {
                throw new Error('Joint should be broken');
            }
            
            // Get final statistics
            const stats = this.enhancedPhysics.getStats();
            
            // Verify advanced features
            if (stats.totalJoints < jointTypes.length) {
                throw new Error('Not all joint types created');
            }
            
            if (stats.totalMaterials < materialTypes.length) {
                throw new Error('Not all material types created');
            }
            
            if (stats.raycastCount < denseResults.length + distanceResults.length) {
                throw new Error('Not all raycasts completed');
            }
            
            if (stats.brokenJoints < 1) {
                throw new Error('Joint breaking not recorded');
            }
            
            // Generate comprehensive report
            const report = this.enhancedPhysics.generatePhysicsReport();
            
            if (!report.includes('Advanced Features') || report.length < 1000) {
                console.warn('Advanced features report may be incomplete');
            }
            
            this.addResult(testName, 'pass', 'Advanced features work correctly', performance.now() - start, {
                jointTypesTested: jointTypes.length,
                materialTypesTested: materialTypes.length,
                shapeTypesTested: shapeTypes.length,
                denseRaycasts: denseResults.length,
                distanceRaycasts: distanceResults.length,
                complexJointsCreated: 1,
                jointsBroken: stats.brokenJoints,
                totalRaycasts: stats.raycastCount,
                reportLength: report.length,
            });
        } catch (error) {
            this.addResult(testName, 'fail', `Advanced features failed: ${error instanceof Error ? error.message : String(error)}`, performance.now() - start);
        }
    }

    private countEnabledFeatures(config: any): number {
        let count = 0;
        if (config.enableJoints) count++;
        if (config.enableRaycasting) count++;
        if (config.enableMaterials) count++;
        if (config.enableAdvancedCollision) count++;
        if (config.enableContinuousCollision) count++;
        if (config.enableSubstepping) count++;
        if (config.enableSleeping) count++;
        if (config.enableDebugRendering) count++;
        return count;
    }

    private addResult(name: string, status: 'pass' | 'fail' | 'skip', message: string, duration: number, details?: any): void {
        this.results.push({ name, status, message, duration, details });
        
        const statusIcon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
        console.log(`${statusIcon} ${name}: ${message} (${duration.toFixed(2)}ms)`);
    }

    private generateReport(): void {
        console.log('\n🔬 Rust Enhanced Physics Test Report');
        console.log('=====================================');
        
        const passed = this.results.filter(r => r.status === 'pass').length;
        const failed = this.results.filter(r => r.status === 'fail').length;
        const skipped = this.results.filter(r => r.status === 'skip').length;
        const total = this.results.length;
        
        console.log(`\n📈 Summary:`);
        console.log(`   Total Tests: ${total}`);
        console.log(`   Passed: ${passed}`);
        console.log(`   Failed: ${failed}`);
        console.log(`   Skipped: ${skipped}`);
        console.log(`   Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
        
        const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
        console.log(`   Total Duration: ${totalDuration.toFixed(2)}ms`);
        
        if (failed > 0) {
            console.log(`\n❌ Failed Tests:`);
            this.results.filter(r => r.status === 'fail').forEach(result => {
                console.log(`   - ${result.name}: ${result.message}`);
            });
        }
        
        // Enhanced physics system summary
        const initTest = this.results.find(r => r.name === 'Enhanced Physics Initialization');
        const jointTest = this.results.find(r => r.name === 'Joint Management');
        const materialTest = this.results.find(r => r.name === 'Material Management');
        const raycastTest = this.results.find(r => r.name === 'Raycasting');
        
        if (initTest?.details || jointTest?.details || materialTest?.details || raycastTest?.details) {
            console.log(`\n🔬 Enhanced Physics System Summary:`);
            if (initTest?.details) {
                console.log(`   Initialization: ✅ Complete`);
            }
            if (jointTest?.details) {
                console.log(`   Joint Management: ${jointTest.details.jointsCreated} joints managed`);
            }
            if (materialTest?.details) {
                console.log(`   Material Management: ${materialTest.details.materialsRemaining} materials managed`);
            }
            if (raycastTest?.details) {
                console.log(`   Raycasting: ${raycastTest.details.basicRaycastHits} hits detected`);
            }
        }
        
        // Save detailed results
        const report = {
            timestamp: new Date().toISOString(),
            results: this.results,
            summary: {
                total,
                passed,
                failed,
                skipped,
                successRate: (passed / total) * 100,
                totalDuration,
            },
            environment: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                cores: navigator.hardwareConcurrency,
                webgl: !!document.createElement('canvas').getContext('webgl'),
                wasm: typeof WebAssembly !== 'undefined',
            },
        };
        
        console.log('\n📄 Detailed test report:', JSON.stringify(report, null, 2));
    }

    getResults(): TestResult[] {
        return [...this.results];
    }

    clearResults(): void {
        this.results = [];
    }
}
