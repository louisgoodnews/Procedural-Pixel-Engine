import type {
  ParticleComponent,
  ParticleEmitter,
  ParticleInstance,
  ParticleSystem as ParticleSystemType,
  VFXPreset,
} from "../../shared/types/particles";
import type { System, World } from "../World";
import type { EngineComponents, EngineResources } from "../types";

interface ActiveParticle extends ParticleInstance {
  age: number; // actual age in seconds
  maxAge: number; // lifetime in seconds
}

interface EmitterState {
  emitter: ParticleEmitter;
  emitAccumulator: number;
  particles: ActiveParticle[];
  lastBurstTime: number;
}

export class ParticleEffectSystem implements System<EngineComponents, EngineResources> {
  private readonly emitters = new Map<string, EmitterState>();
  private readonly presets = new Map<string, VFXPreset>();
  private globalSettings: ParticleSystemType["globalSettings"] = {
    maxTotalParticles: 1000,
    performanceMode: false,
    debugMode: false,
  };

  constructor() {
    this.initializePresets();
  }

  execute(world: World<EngineComponents, EngineResources>, deltaTime: number): void {
    const runtimeMetrics = world.getResource("runtimeMetrics");
    const camera = world.getResource("camera");

    if (!runtimeMetrics || !camera) {
      return;
    }

    // Update performance mode based on frame rate
    this.globalSettings.performanceMode = runtimeMetrics.currentFps < 60;

    // Update all active emitters
    for (const emitterState of this.emitters.values()) {
      this.updateEmitter(emitterState, deltaTime, world, camera);
    }

    // Clean up dead emitters
    this.cleanupDeadEmitters(world);

    // Update particle runtime resource
    this.updateParticleRuntimeResource(world);

    // Update debug info if enabled
    if (this.globalSettings.debugMode) {
      this.updateDebugInfo(world);
    }
  }

  private updateEmitter(
    emitterState: EmitterState,
    deltaTime: number,
    world: World<EngineComponents, EngineResources>,
    camera: EngineResources["camera"],
  ): void {
    const { emitter } = emitterState;
    const now = performance.now() / 1000;

    // Update existing particles
    this.updateParticles(emitterState, deltaTime, world, camera);

    // Handle burst emission
    if (emitter.burstCount && emitter.burstDelay) {
      if (now - emitterState.lastBurstTime >= emitter.burstDelay) {
        this.emitBurst(emitterState, world);
        emitterState.lastBurstTime = now;
      }
    }

    // Handle continuous emission
    if (emitter.emissionRate > 0) {
      emitterState.emitAccumulator += deltaTime * emitter.emissionRate;

      while (
        emitterState.emitAccumulator >= 1 &&
        emitterState.particles.length < emitter.maxParticles
      ) {
        this.emitParticle(emitterState, world, camera);
        emitterState.emitAccumulator -= 1;
      }
    }

    // Update particle count for debugging
    emitterState.particles = emitterState.particles.filter((p) => p.life > 0);
  }

  private updateParticles(
    emitterState: EmitterState,
    deltaTime: number,
    world: World<EngineComponents, EngineResources>,
    camera: EngineResources["camera"],
  ): void {
    const { emitter } = emitterState;

    for (const particle of emitterState.particles) {
      // Update age and life
      particle.age += deltaTime;
      particle.life = Math.max(0, 1 - particle.age / particle.maxAge);

      if (particle.life <= 0) {
        continue; // Particle will be removed in cleanup
      }

      // Apply physics
      this.applyParticlePhysics(particle, emitter, deltaTime);

      // Update visual properties
      this.updateParticleVisuals(particle, emitter);

      // Culling check
      if (emitter.cullingDistance) {
        const dx = particle.position.x - camera.x;
        const dy = particle.position.y - camera.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > emitter.cullingDistance) {
          particle.life = 0; // Kill particle if too far
        }
      }
    }
  }

  private applyParticlePhysics(
    particle: ActiveParticle,
    emitter: ParticleEmitter,
    deltaTime: number,
  ): void {
    // Apply gravity
    let gravityX = 0;
    let gravityY = 0;

    switch (emitter.gravityMode) {
      case "world":
        gravityX = emitter.gravityX;
        gravityY = emitter.gravityY;
        break;
      case "local":
        // Local gravity relative to particle's initial direction
        const angle = Math.atan2(particle.velocity.y, particle.velocity.x);
        gravityX = Math.cos(angle) * emitter.gravityX - Math.sin(angle) * emitter.gravityY;
        gravityY = Math.sin(angle) * emitter.gravityX + Math.cos(angle) * emitter.gravityY;
        break;
    }

    // Apply acceleration and gravity
    particle.velocity.x += (emitter.accelerationX + gravityX) * deltaTime;
    particle.velocity.y += (emitter.accelerationY + gravityY) * deltaTime;

    // Apply damping
    particle.velocity.x *= Math.pow(emitter.damping, deltaTime);
    particle.velocity.y *= Math.pow(emitter.damping, deltaTime);

    // Update position
    particle.position.x += particle.velocity.x * deltaTime;
    particle.position.y += particle.velocity.y * deltaTime;
  }

  private updateParticleVisuals(particle: ActiveParticle, emitter: ParticleEmitter): void {
    // Update size
    switch (emitter.sizeMode) {
      case "constant":
        particle.size = emitter.sizeStart;
        break;
      case "curve":
        particle.size =
          emitter.sizeStart + (emitter.sizeEnd || emitter.sizeStart) * (1 - particle.life);
        break;
      case "random":
        const randomSize = emitter.sizeRandomness ? Math.random() * emitter.sizeRandomness : 0;
        particle.size = emitter.sizeStart + randomSize;
        break;
    }

    // Update color
    switch (emitter.colorMode) {
      case "constant":
        particle.color = emitter.colorStart;
        break;
      case "gradient":
        particle.color = this.interpolateColor(
          emitter.colorStart,
          emitter.colorEnd || emitter.colorStart,
          1 - particle.life,
        );
        break;
      case "random":
        const colors = emitter.colorRandomness || [emitter.colorStart];
        particle.color = colors[Math.floor(Math.random() * colors.length)];
        break;
    }

    // Update opacity
    switch (emitter.opacityMode) {
      case "constant":
        particle.opacity = emitter.opacityStart;
        break;
      case "fade":
        particle.opacity = emitter.opacityStart * particle.life;
        break;
      case "curve":
        const curve = emitter.opacityCurve || 1;
        particle.opacity = emitter.opacityStart * Math.pow(particle.life, curve);
        break;
    }

    // Update rotation
    switch (emitter.rotationMode) {
      case "constant":
        particle.rotation += emitter.rotationSpeed * (particle.maxAge - particle.age);
        break;
      case "random":
        const randomRotation = emitter.rotationRandomness
          ? Math.random() * emitter.rotationRandomness
          : 0;
        particle.rotation +=
          (emitter.rotationSpeed + randomRotation) * (particle.maxAge - particle.age);
        break;
    }
  }

  private emitParticle(
    emitterState: EmitterState,
    world: World<EngineComponents, EngineResources>,
    camera: EngineResources["camera"],
  ): void {
    const { emitter } = emitterState;
    const now = performance.now() / 1000;

    // Calculate spawn position
    const spawnPos = this.calculateSpawnPosition(emitter, camera);

    // Calculate initial velocity
    const velocity = this.calculateInitialVelocity(emitter);

    // Create particle
    const particle: ActiveParticle = {
      id: `${emitter.id}-${Date.now()}-${Math.random()}`,
      emitterId: emitter.id,
      position: { ...spawnPos },
      velocity,
      life: 1,
      size: emitter.sizeStart,
      color: emitter.colorStart,
      opacity: emitter.opacityStart,
      rotation: 0,
      createdAt: now,
      age: 0,
      maxAge: emitter.lifetime,
    };

    emitterState.particles.push(particle);
  }

  private emitBurst(
    emitterState: EmitterState,
    world: World<EngineComponents, EngineResources>,
  ): void {
    const { emitter } = emitterState;
    const camera = world.getResource("camera");

    if (!camera || !emitter.burstCount) {
      return;
    }

    for (
      let i = 0;
      i < emitter.burstCount && emitterState.particles.length < emitter.maxParticles;
      i++
    ) {
      this.emitParticle(emitterState, world, camera);
    }
  }

  private calculateSpawnPosition(
    emitter: ParticleEmitter,
    camera: EngineResources["camera"],
  ): { x: number; y: number } {
    // For now, spawn at camera center - in real implementation, this would be at emitter entity position
    const baseX = camera.x + 320; // Center of 640px canvas
    const baseY = camera.y + 240; // Center of 480px canvas

    switch (emitter.spawnShape) {
      case "point":
        return { x: baseX, y: baseY };
      case "circle":
        const angle = Math.random() * Math.PI * 2;
        const radius = emitter.spawnRadius || 16;
        return {
          x: baseX + Math.cos(angle) * radius,
          y: baseY + Math.sin(angle) * radius,
        };
      case "rectangle":
        const width = emitter.spawnWidth || 32;
        const height = emitter.spawnHeight || 32;
        return {
          x: baseX + (Math.random() - 0.5) * width,
          y: baseY + (Math.random() - 0.5) * height,
        };
      case "cone":
        const coneAngle =
          (emitter.spawnAngle || 0) +
          (Math.random() - 0.5) * (emitter.directionSpread || Math.PI / 4);
        const coneRadius = emitter.spawnRadius || 16;
        return {
          x: baseX + Math.cos(coneAngle) * coneRadius,
          y: baseY + Math.sin(coneAngle) * coneRadius,
        };
      default:
        return { x: baseX, y: baseY };
    }
  }

  private calculateInitialVelocity(emitter: ParticleEmitter): { x: number; y: number } {
    const speed = emitter.velocityMin + Math.random() * (emitter.velocityMax - emitter.velocityMin);

    switch (emitter.velocityMode) {
      case "directional":
        const baseAngle = emitter.directionAngle || 0;
        const spread = emitter.directionSpread || 0;
        const angle = baseAngle + (Math.random() - 0.5) * spread;
        return {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        };
      case "radial":
        const radialAngle = Math.random() * Math.PI * 2;
        return {
          x: Math.cos(radialAngle) * speed,
          y: Math.sin(radialAngle) * speed,
        };
      case "random":
        return {
          x: (Math.random() - 0.5) * speed * 2,
          y: (Math.random() - 0.5) * speed * 2,
        };
      default:
        return { x: speed, y: 0 };
    }
  }

  private interpolateColor(color1: string, color2: string, factor: number): string {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);

    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);

    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16),
        }
      : { r: 255, g: 255, b: 255 };
  }

  private cleanupDeadEmitters(world: World<EngineComponents, EngineResources>): void {
    const entities = world.getEntitiesWith("particleComponent");

    for (const entity of entities) {
      const particleComp = world.getComponent(entity, "particleComponent");
      if (!particleComp) continue;

      const emitterState = this.emitters.get(particleComp.emitterId);
      if (!emitterState) continue;

      // Remove emitter if it has no active particles and is not active
      if (!particleComp.active && emitterState.particles.length === 0) {
        this.emitters.delete(particleComp.emitterId);
        world.removeComponent(entity, "particleComponent");
      }
    }
  }

  private updateParticleRuntimeResource(world: World<EngineComponents, EngineResources>): void {
    const allParticles = this.getAllParticles();

    world.setResource("particleRuntime", {
      allParticles,
      activeEmitters: this.emitters.size,
      totalEmitted: allParticles.length, // This could be tracked more accurately
      performanceMode: this.globalSettings.performanceMode,
    });
  }

  private updateDebugInfo(world: World<EngineComponents, EngineResources>): void {
    const runtimeMetrics = world.getResource("runtimeMetrics");
    if (!runtimeMetrics) return;

    let totalParticles = 0;
    for (const emitterState of this.emitters.values()) {
      totalParticles += emitterState.particles.length;
    }

    // Update debug info in runtime metrics (this would be displayed in HUD)
    console.debug(`Particle System: ${this.emitters.size} emitters, ${totalParticles} particles`);
  }

  private initializePresets(): void {
    // Add some common VFX presets
    const presets: VFXPreset[] = [
      {
        id: "explosion-basic",
        name: "Basic Explosion",
        category: "explosion",
        description: "Simple explosion effect with orange particles",
        emitterTemplate: {
          emissionRate: 0,
          burstCount: 30,
          burstDelay: 0,
          lifetime: 1.5,
          maxParticles: 30,
          spawnShape: "circle",
          spawnRadius: 8,
          velocityMode: "radial",
          velocityMin: 50,
          velocityMax: 150,
          gravityMode: "world",
          gravityX: 0,
          gravityY: 100,
          damping: 0.98,
          sizeMode: "curve",
          sizeStart: 8,
          sizeEnd: 2,
          colorMode: "gradient",
          colorStart: "#ff6600",
          colorEnd: "#ffaa00",
          opacityMode: "fade",
          opacityStart: 1,
          opacityEnd: 0,
          rotationMode: "random",
          rotationSpeed: 5,
          blendMode: "add",
        },
      },
      {
        id: "fire-basic",
        name: "Basic Fire",
        category: "fire",
        description: "Rising fire effect with red and orange particles",
        emitterTemplate: {
          emissionRate: 20,
          lifetime: 2,
          maxParticles: 50,
          spawnShape: "circle",
          spawnRadius: 4,
          velocityMode: "directional",
          velocityMin: 30,
          velocityMax: 60,
          directionAngle: -Math.PI / 2, // Upward
          directionSpread: Math.PI / 6,
          gravityMode: "world",
          gravityX: 0,
          gravityY: -20, // Negative gravity for rising effect
          damping: 0.95,
          sizeMode: "curve",
          sizeStart: 4,
          sizeEnd: 1,
          colorMode: "gradient",
          colorStart: "#ff0000",
          colorEnd: "#ffaa00",
          opacityMode: "fade",
          opacityStart: 0.8,
          opacityEnd: 0,
          blendMode: "add",
        },
      },
    ];

    for (const preset of presets) {
      this.presets.set(preset.id, preset);
    }
  }

  // Public API for external systems
  public createEmitter(emitter: ParticleEmitter): void {
    this.emitters.set(emitter.id, {
      emitter,
      emitAccumulator: 0,
      particles: [],
      lastBurstTime: 0,
    });
  }

  public destroyEmitter(emitterId: string): void {
    this.emitters.delete(emitterId);
  }

  public getEmitterState(emitterId: string): EmitterState | undefined {
    return this.emitters.get(emitterId);
  }

  public getAllParticles(): ActiveParticle[] {
    const allParticles: ActiveParticle[] = [];
    for (const emitterState of this.emitters.values()) {
      allParticles.push(...emitterState.particles);
    }
    return allParticles;
  }

  public getPreset(presetId: string): VFXPreset | undefined {
    return this.presets.get(presetId);
  }

  public getAllPresets(): VFXPreset[] {
    return Array.from(this.presets.values());
  }

  public setGlobalSettings(settings: Partial<ParticleSystemType["globalSettings"]>): void {
    this.globalSettings = { ...this.globalSettings, ...settings };
  }
}
