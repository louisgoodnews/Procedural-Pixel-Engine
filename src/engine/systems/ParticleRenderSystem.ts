import type { System, World } from "../World";
import type { EngineComponents, EngineResources } from "../types";
import type { ActiveParticle } from "../types";

export class ParticleRenderSystem implements System<EngineComponents, EngineResources> {
  execute(world: World<EngineComponents, EngineResources>): void {
    const canvas = world.getResource("canvas");
    const context = world.getResource("context");
    const camera = world.getResource("camera");
    const renderStats = world.getResource("renderStats");
    const particleRuntime = world.getResource("particleRuntime");

    if (!canvas || !context || !camera || !renderStats || !particleRuntime) {
      return;
    }

    const allParticles = particleRuntime.allParticles;
    if (allParticles.length === 0) {
      return;
    }

    // Save context state
    context.save();

    // Apply camera transform
    context.translate(-camera.x, -camera.y);

    // Sort particles by blend mode for optimal rendering
    const particlesByBlendMode = this.groupParticlesByBlendMode(allParticles);

    // Render particles by blend mode
    for (const [blendMode, particles] of particlesByBlendMode) {
      this.renderParticlesWithBlendMode(context, particles, blendMode);
    }

    // Restore context state
    context.restore();

    // Update render stats
    renderStats.drawCalls += particlesByBlendMode.size;
  }

  private groupParticlesByBlendMode(particles: ActiveParticle[]): Map<string, ActiveParticle[]> {
    const groups = new Map<string, ActiveParticle[]>();

    for (const particle of particles) {
      const blendMode = particle.emitterId
        ? this.getEmitterBlendMode(particle.emitterId)
        : "normal";
      if (!groups.has(blendMode)) {
        groups.set(blendMode, []);
      }
      groups.get(blendMode)!.push(particle);
    }

    return groups;
  }

  private getEmitterBlendMode(emitterId: string): string {
    // This would get the blend mode from the emitter
    // For now, default to normal
    return "normal";
  }

  private renderParticlesWithBlendMode(
    context: CanvasRenderingContext2D,
    particles: ActiveParticle[],
    blendMode: string,
  ): void {
    if (particles.length === 0) {
      return;
    }

    // Set blend mode
    this.setBlendMode(context, blendMode);

    // Render all particles with this blend mode
    for (const particle of particles) {
      this.renderParticle(context, particle);
    }

    // Reset blend mode
    context.globalCompositeOperation = "source-over";
  }

  private setBlendMode(context: CanvasRenderingContext2D, blendMode: string): void {
    switch (blendMode) {
      case "add":
        context.globalCompositeOperation = "lighter";
        break;
      case "multiply":
        context.globalCompositeOperation = "multiply";
        break;
      case "screen":
        context.globalCompositeOperation = "screen";
        break;
      case "normal":
      default:
        context.globalCompositeOperation = "source-over";
        break;
    }
  }

  private renderParticle(context: CanvasRenderingContext2D, particle: ActiveParticle): void {
    if (particle.opacity <= 0 || particle.size <= 0) {
      return;
    }

    context.save();

    // Set particle properties
    context.globalAlpha = particle.opacity;
    context.fillStyle = particle.color;

    // Apply rotation if needed
    if (particle.rotation !== 0) {
      context.translate(particle.position.x, particle.position.y);
      context.rotate(particle.rotation);
      context.translate(-particle.position.x, -particle.position.y);
    }

    // Draw particle as circle (for now)
    context.beginPath();
    context.arc(particle.position.x, particle.position.y, particle.size / 2, 0, Math.PI * 2);
    context.fill();

    context.restore();
  }
}
