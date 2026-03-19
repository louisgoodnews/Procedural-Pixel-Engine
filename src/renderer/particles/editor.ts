import type { ParticleEmitter, VFXPreset } from "../../shared/types/particles";

export interface ParticleEditorState {
  currentEmitter: ParticleEmitter | null;
  selectedPreset: VFXPreset | null;
  isPlaying: boolean;
  showAdvanced: boolean;
}

export class ParticleEditor {
  private state: ParticleEditorState = {
    currentEmitter: null,
    selectedPreset: null,
    isPlaying: false,
    showAdvanced: false,
  };

  private container: HTMLElement;
  private onSave?: (emitter: ParticleEmitter) => void;
  private onPlay?: (emitter: ParticleEmitter) => void;
  private onStop?: () => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  setEmitter(emitter: ParticleEmitter): void {
    this.state.currentEmitter = { ...emitter };
    this.render();
  }

  setCallbacks(callbacks: {
    onSave?: (emitter: ParticleEmitter) => void;
    onPlay?: (emitter: ParticleEmitter) => void;
    onStop?: () => void;
  }): void {
    this.onSave = callbacks.onSave;
    this.onPlay = callbacks.onPlay;
    this.onStop = callbacks.onStop;
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="particle-editor">
        <header class="editor-header">
          <h3>Particle Editor</h3>
          <div class="editor-actions">
            <button id="particle-play" class="primary-button" type="button">
              ${this.state.isPlaying ? "Stop" : "Play"}
            </button>
            <button id="particle-save" class="secondary-button" type="button">Save</button>
            <button id="particle-reset" class="secondary-button" type="button">Reset</button>
          </div>
        </header>

        <div class="editor-content">
          <div class="editor-sidebar">
            <div class="editor-section">
              <h4>Presets</h4>
              <div id="particle-presets" class="preset-list"></div>
            </div>

            <div class="editor-section">
              <h4>Basic Properties</h4>
              <div class="editor-fields">
                <label class="field">
                  <span>Name</span>
                  <input id="emitter-name" type="text" value="${this.state.currentEmitter?.name || ""}" />
                </label>
                <label class="field">
                  <span>Emission Rate</span>
                  <input id="emission-rate" type="number" value="${this.state.currentEmitter?.emissionRate || 10}" min="0" max="100" step="1" />
                </label>
                <label class="field">
                  <span>Lifetime (s)</span>
                  <input id="particle-lifetime" type="number" value="${this.state.currentEmitter?.lifetime || 2}" min="0.1" max="10" step="0.1" />
                </label>
                <label class="field">
                  <span>Max Particles</span>
                  <input id="max-particles" type="number" value="${this.state.currentEmitter?.maxParticles || 100}" min="1" max="1000" step="1" />
                </label>
              </div>
            </div>

            <div class="editor-section">
              <h4>Spawn Shape</h4>
              <div class="editor-fields">
                <label class="field">
                  <span>Shape</span>
                  <select id="spawn-shape">
                    <option value="point" ${this.state.currentEmitter?.spawnShape === "point" ? "selected" : ""}>Point</option>
                    <option value="circle" ${this.state.currentEmitter?.spawnShape === "circle" ? "selected" : ""}>Circle</option>
                    <option value="rectangle" ${this.state.currentEmitter?.spawnShape === "rectangle" ? "selected" : ""}>Rectangle</option>
                    <option value="cone" ${this.state.currentEmitter?.spawnShape === "cone" ? "selected" : ""}>Cone</option>
                  </select>
                </label>
                <label class="field" id="spawn-radius-field">
                  <span>Radius</span>
                  <input id="spawn-radius" type="number" value="${this.state.currentEmitter?.spawnRadius || 16}" min="0" max="100" step="1" />
                </label>
              </div>
            </div>

            <div class="editor-section">
              <h4>Velocity</h4>
              <div class="editor-fields">
                <label class="field">
                  <span>Mode</span>
                  <select id="velocity-mode">
                    <option value="directional" ${this.state.currentEmitter?.velocityMode === "directional" ? "selected" : ""}>Directional</option>
                    <option value="radial" ${this.state.currentEmitter?.velocityMode === "radial" ? "selected" : ""}>Radial</option>
                    <option value="random" ${this.state.currentEmitter?.velocityMode === "random" ? "selected" : ""}>Random</option>
                  </select>
                </label>
                <label class="field">
                  <span>Min Speed</span>
                  <input id="velocity-min" type="number" value="${this.state.currentEmitter?.velocityMin || 50}" min="0" max="500" step="1" />
                </label>
                <label class="field">
                  <span>Max Speed</span>
                  <input id="velocity-max" type="number" value="${this.state.currentEmitter?.velocityMax || 100}" min="0" max="500" step="1" />
                </label>
              </div>
            </div>

            <div class="editor-section">
              <h4>Visual</h4>
              <div class="editor-fields">
                <label class="field">
                  <span>Start Color</span>
                  <input id="color-start" type="color" value="${this.state.currentEmitter?.colorStart || "#ffffff"}" />
                </label>
                <label class="field">
                  <span>End Color</span>
                  <input id="color-end" type="color" value="${this.state.currentEmitter?.colorEnd || "#ffffff"}" />
                </label>
                <label class="field">
                  <span>Start Size</span>
                  <input id="size-start" type="number" value="${this.state.currentEmitter?.sizeStart || 4}" min="1" max="50" step="0.5" />
                </label>
                <label class="field">
                  <span>End Size</span>
                  <input id="size-end" type="number" value="${this.state.currentEmitter?.sizeEnd || 1}" min="0" max="50" step="0.5" />
                </label>
                <label class="field">
                  <span>Blend Mode</span>
                  <select id="blend-mode">
                    <option value="normal" ${this.state.currentEmitter?.blendMode === "normal" ? "selected" : ""}>Normal</option>
                    <option value="add" ${this.state.currentEmitter?.blendMode === "add" ? "selected" : ""}>Add</option>
                    <option value="multiply" ${this.state.currentEmitter?.blendMode === "multiply" ? "selected" : ""}>Multiply</option>
                    <option value="screen" ${this.state.currentEmitter?.blendMode === "screen" ? "selected" : ""}>Screen</option>
                  </select>
                </label>
              </div>
            </div>

            <div class="editor-section">
              <button id="toggle-advanced" class="secondary-button" type="button">
                ${this.state.showAdvanced ? "Hide Advanced" : "Show Advanced"}
              </button>
            </div>

            ${this.state.showAdvanced ? this.renderAdvancedFields() : ""}
          </div>

          <div class="editor-preview">
            <div class="preview-header">
              <h4>Live Preview</h4>
              <div class="preview-stats">
                <span id="particle-count">0 particles</span>
              </div>
            </div>
            <div class="preview-canvas">
              <canvas id="particle-preview-canvas" width="400" height="300"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
    this.updateFieldVisibility();
  }

  private renderAdvancedFields(): string {
    return `
      <div class="editor-section advanced">
        <h4>Advanced Properties</h4>
        <div class="editor-fields">
          <label class="field">
            <span>Gravity Mode</span>
            <select id="gravity-mode">
              <option value="none" ${this.state.currentEmitter?.gravityMode === "none" ? "selected" : ""}>None</option>
              <option value="world" ${this.state.currentEmitter?.gravityMode === "world" ? "selected" : ""}>World</option>
              <option value="local" ${this.state.currentEmitter?.gravityMode === "local" ? "selected" : ""}>Local</option>
            </select>
          </label>
          <label class="field">
            <span>Gravity X</span>
            <input id="gravity-x" type="number" value="${this.state.currentEmitter?.gravityX || 0}" min="-500" max="500" step="1" />
          </label>
          <label class="field">
            <span>Gravity Y</span>
            <input id="gravity-y" type="number" value="${this.state.currentEmitter?.gravityY || 100}" min="-500" max="500" step="1" />
          </label>
          <label class="field">
            <span>Damping</span>
            <input id="damping" type="number" value="${this.state.currentEmitter?.damping || 0.98}" min="0" max="1" step="0.01" />
          </label>
          <label class="field">
            <span>Burst Count</span>
            <input id="burst-count" type="number" value="${this.state.currentEmitter?.burstCount || 0}" min="0" max="100" step="1" />
          </label>
          <label class="field">
            <span>Opacity Mode</span>
            <select id="opacity-mode">
              <option value="constant" ${this.state.currentEmitter?.opacityMode === "constant" ? "selected" : ""}>Constant</option>
              <option value="fade" ${this.state.currentEmitter?.opacityMode === "fade" ? "selected" : ""}>Fade</option>
              <option value="curve" ${this.state.currentEmitter?.opacityMode === "curve" ? "selected" : ""}>Curve</option>
            </select>
          </label>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    // Play/Stop button
    const playButton = this.container.querySelector("#particle-play") as HTMLButtonElement;
    playButton?.addEventListener("click", () => {
      if (this.state.isPlaying) {
        this.stopPreview();
      } else {
        this.startPreview();
      }
    });

    // Save button
    const saveButton = this.container.querySelector("#particle-save") as HTMLButtonElement;
    saveButton?.addEventListener("click", () => {
      this.saveEmitter();
    });

    // Reset button
    const resetButton = this.container.querySelector("#particle-reset") as HTMLButtonElement;
    resetButton?.addEventListener("click", () => {
      this.resetEmitter();
    });

    // Advanced toggle
    const advancedToggle = this.container.querySelector("#toggle-advanced") as HTMLButtonElement;
    advancedToggle?.addEventListener("click", () => {
      this.state.showAdvanced = !this.state.showAdvanced;
      this.render();
    });

    // Field listeners for real-time updates
    this.attachFieldListeners();
  }

  private attachFieldListeners(): void {
    const fields = [
      "emitter-name",
      "emission-rate",
      "particle-lifetime",
      "max-particles",
      "spawn-shape",
      "spawn-radius",
      "velocity-mode",
      "velocity-min",
      "velocity-max",
      "color-start",
      "color-end",
      "size-start",
      "size-end",
      "blend-mode",
      "gravity-mode",
      "gravity-x",
      "gravity-y",
      "damping",
      "burst-count",
      "opacity-mode",
    ];

    for (const fieldId of fields) {
      const field = this.container.querySelector(`#${fieldId}`) as
        | HTMLInputElement
        | HTMLSelectElement;
      field?.addEventListener("input", () => {
        this.updateEmitterFromFields();
        this.updateFieldVisibility();
      });
    }
  }

  private updateFieldVisibility(): void {
    const spawnShape = (this.container.querySelector("#spawn-shape") as HTMLSelectElement)?.value;
    const radiusField = this.container.querySelector("#spawn-radius-field") as HTMLElement;

    if (radiusField) {
      radiusField.style.display =
        spawnShape === "circle" || spawnShape === "cone" ? "block" : "none";
    }
  }

  private updateEmitterFromFields(): void {
    if (!this.state.currentEmitter) return;

    const getValue = (id: string): string => {
      const element = this.container.querySelector(`#${id}`) as
        | HTMLInputElement
        | HTMLSelectElement;
      return element?.value || "";
    };

    const getNumber = (id: string): number => {
      const value = getValue(id);
      return Number.parseFloat(value) || 0;
    };

    this.state.currentEmitter = {
      ...this.state.currentEmitter,
      name: getValue("emitter-name"),
      emissionRate: getNumber("emission-rate"),
      lifetime: getNumber("particle-lifetime"),
      maxParticles: Math.floor(getNumber("max-particles")),
      spawnShape: getValue("spawn-shape") as any,
      spawnRadius: getNumber("spawn-radius"),
      velocityMode: getValue("velocity-mode") as any,
      velocityMin: getNumber("velocity-min"),
      velocityMax: getNumber("velocity-max"),
      colorStart: getValue("color-start"),
      colorEnd: getValue("color-end"),
      sizeStart: getNumber("size-start"),
      sizeEnd: getNumber("size-end"),
      blendMode: getValue("blend-mode") as any,
      gravityMode: getValue("gravity-mode") as any,
      gravityX: getNumber("gravity-x"),
      gravityY: getNumber("gravity-y"),
      damping: getNumber("damping"),
      burstCount: getNumber("burst-count") || undefined,
      opacityMode: getValue("opacity-mode") as any,
    };

    // Auto-update preview if playing
    if (this.state.isPlaying && this.onPlay) {
      this.onPlay(this.state.currentEmitter);
    }
  }

  private startPreview(): void {
    if (!this.state.currentEmitter) return;

    this.state.isPlaying = true;
    const playButton = this.container.querySelector("#particle-play") as HTMLButtonElement;
    if (playButton) playButton.textContent = "Stop";

    if (this.onPlay) {
      this.onPlay(this.state.currentEmitter);
    }
  }

  private stopPreview(): void {
    this.state.isPlaying = false;
    const playButton = this.container.querySelector("#particle-play") as HTMLButtonElement;
    if (playButton) playButton.textContent = "Play";

    if (this.onStop) {
      this.onStop();
    }
  }

  private saveEmitter(): void {
    if (!this.state.currentEmitter) return;

    if (this.onSave) {
      this.onSave(this.state.currentEmitter);
    }
  }

  private resetEmitter(): void {
    // Reset to default values
    this.state.currentEmitter = this.createDefaultEmitter();
    this.render();
  }

  private createDefaultEmitter(): ParticleEmitter {
    return {
      id: `emitter-${Date.now()}`,
      name: "New Emitter",
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emissionRate: 10,
      lifetime: 2,
      maxParticles: 100,
      spawnShape: "point",
      velocityMode: "radial",
      velocityMin: 50,
      velocityMax: 100,
      gravityMode: "world",
      gravityX: 0,
      gravityY: 100,
      accelerationX: 0,
      accelerationY: 0,
      damping: 0.98,
      sizeMode: "curve",
      sizeStart: 4,
      sizeEnd: 1,
      colorMode: "gradient",
      colorStart: "#ffffff",
      colorEnd: "#888888",
      opacityMode: "fade",
      opacityStart: 1,
      opacityEnd: 0,
      rotationMode: "none",
      rotationSpeed: 0,
      blendMode: "normal",
    };
  }

  public loadPresets(presets: VFXPreset[]): void {
    const presetsContainer = this.container.querySelector("#particle-presets") as HTMLElement;
    if (!presetsContainer) return;

    presetsContainer.innerHTML = presets
      .map(
        (preset) => `
      <div class="preset-item" data-preset-id="${preset.id}">
        <div class="preset-name">${preset.name}</div>
        <div class="preset-category">${preset.category}</div>
        <div class="preset-description">${preset.description}</div>
      </div>
    `,
      )
      .join("");

    // Attach click listeners to preset items
    presetsContainer.querySelectorAll(".preset-item").forEach((item) => {
      item.addEventListener("click", () => {
        const presetId = item.getAttribute("data-preset-id");
        const preset = presets.find((p) => p.id === presetId);
        if (preset) {
          this.applyPreset(preset);
        }
      });
    });
  }

  private applyPreset(preset: VFXPreset): void {
    this.state.selectedPreset = preset;
    this.state.currentEmitter = {
      ...this.createDefaultEmitter(),
      ...preset.emitterTemplate,
      id: this.state.currentEmitter?.id || `emitter-${Date.now()}`,
      name: preset.name,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.render();
  }

  public updateParticleCount(count: number): void {
    const countElement = this.container.querySelector("#particle-count") as HTMLElement;
    if (countElement) {
      countElement.textContent = `${count} particles`;
    }
  }
}
