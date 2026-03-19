import "./styles.css";
import { listBlueprintFiles, loadBlueprintCatalog } from "./blueprints";
import { startEngine } from "./bootstrap";
import { initializeBlueprintEditor } from "./editor";
import { renderFatalError } from "./errors";
import { initializeBlueprintGallery } from "./gallery";
import { loadWorldScene } from "./scenes";
import { initializeWorldBuilder } from "./worldBuilder";
import { BrowserLogger } from "./BrowserLogger";
import { DebugLogger } from "./debug";

// Initialize browser-compatible logging system
BrowserLogger.setLevel(1); // DEBUG level
BrowserLogger.info("MainRenderer", "Browser logging system initialized");
DebugLogger.info("MainRenderer", "Debug logging system initialized");

// Add startup debugging
DebugLogger.info("MainRenderer", "Starting renderer initialization");
DebugLogger.info("MainRenderer", "DOM ready", { 
  hasApp: !!document.querySelector("#app"),
  userAgent: navigator.userAgent,
  timestamp: Date.now()
});

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Renderer root element not found.");
}

app.innerHTML = `
  <main class="workspace-shell">
    <header class="workspace-topbar">
      <div class="workspace-brand">
        <p class="eyebrow">Professional Suite</p>
        <h1>Procedural 2D Engine</h1>
        <p id="workspace-project-label" class="gallery-meta">Project: loading...</p>
      </div>
      <div id="workspace-tabs" class="workspace-tabs" aria-label="Workspace tabs"></div>
      <div class="workspace-header-actions">
        <button id="workspace-new-project" class="secondary-button" type="button">New Project</button>
        <button id="workspace-open-project" class="secondary-button" type="button">Open Project</button>
        <button id="workspace-open-settings" class="secondary-button" type="button">Settings</button>
        <button id="workspace-new-blueprint" class="primary-button" type="button">New Blueprint</button>
        <button id="workspace-export" class="secondary-button" type="button">Export Bundle</button>
        <button id="workspace-exit-app" class="secondary-button" type="button">Exit</button>
      </div>
    </header>

    <section class="workspace-body">
      <aside class="file-browser-shell" aria-label="File browser">
        <div class="file-browser-header">
          <div>
            <p class="eyebrow eyebrow-small">Assets</p>
            <h2>Asset Browser</h2>
          </div>
          <p id="gallery-meta" class="gallery-meta"></p>
        </div>
        <p class="file-browser-copy">
          Single-click to select for placement, double-click to open directly in an editor tab.
        </p>
        <div class="editor-fields">
          <label class="field">
            <span>Search</span>
            <input id="gallery-search" type="text" placeholder="Filter assets" />
          </label>
          <label class="field">
            <span>Kind</span>
            <select id="gallery-filter-kind">
              <option value="all">All</option>
              <option value="component">Component</option>
              <option value="system">System</option>
              <option value="template">Template</option>
            </select>
          </label>
        </div>
        <div id="gallery-grid" class="gallery-grid"></div>
      </aside>

      <section class="workspace-main">
        <section id="world-view-panel" class="workspace-panel is-active" aria-label="World view">
          <div class="world-view-copy">
            <p class="eyebrow">Workspace View</p>
            <h2>Live Canvas</h2>
            <p class="lede">
              The platform opens into a live runtime canvas. Open any asset in parallel tabs without
              losing the benchmark and preview context.
            </p>
            <p id="hud-meta" class="hud-line"></p>
            <p id="hud-issues" class="hud-line hud-line-muted"></p>
            <div class="hud-benchmark-shell">
              <div class="editor-header-actions">
                <button id="workspace-play-toggle" class="primary-button" type="button">Play</button>
                <button id="workspace-stop-toggle" class="secondary-button" type="button" disabled>Stop</button>
              </div>
              <button id="hud-toggle-benchmarks" class="secondary-button" type="button">Hide Performance</button>
              <button id="hud-toggle-physics-debug" class="secondary-button" type="button">Show Physics Debug</button>
              <p id="hud-benchmarks" class="hud-line hud-line-muted"></p>
              <div class="hud-time-travel">
                <label class="field">
                  <span>Time Travel</span>
                  <input id="hud-time-slider" type="range" min="0" max="10000" step="100" value="0" />
                </label>
                <p id="hud-time-label" class="hud-line hud-line-muted">Live</p>
                <div class="frame-controls">
                  <button id="hud-step-back" class="secondary-button" type="button">Step Back</button>
                  <button id="hud-step-forward" class="secondary-button" type="button">Step Forward</button>
                </div>
              </div>
            </div>
          </div>
          <div class="world-stage">
            <canvas id="engine-canvas" width="640" height="480"></canvas>
          </div>
        </section>

        <section id="editor-view-panel" class="workspace-panel" aria-label="Blueprint editor">
          <header class="editor-workspace-header">
            <div>
            <p class="eyebrow">Asset Editor</p>
              <h2 id="editor-current-file">No blueprint open</h2>
              <p id="editor-current-zone" class="hud-line hud-line-muted"></p>
            </div>
            <div class="editor-header-actions">
              <button id="editor-save" class="primary-button" type="button">Save</button>
              <button id="editor-close" class="secondary-button" type="button">Close</button>
            </div>
          </header>

          <div class="editor-workspace">
            <aside id="editor-sidebar" class="editor-sidebar">
              <div class="editor-card">
                <div class="editor-fields">
                  <label class="field">
                    <span>Name</span>
                    <input id="editor-name" type="text" />
                  </label>
                  <label class="field">
                    <span>Type</span>
                    <input id="editor-blueprint-type" type="text" />
                  </label>
                  <label class="field">
                    <span>Zone</span>
                    <input id="editor-zone" type="text" />
                  </label>
                  <label class="field field-small">
                    <span>Pixel Size</span>
                    <input id="editor-pixel-size" type="number" min="1" step="1" />
                  </label>
                </div>

                <details class="tool-group" open>
                  <summary>Draw</summary>
                  <div class="editor-toolbox">
                    <button id="editor-tool-pen" class="tool-button" type="button">Brush (B)</button>
                    <button id="editor-tool-bucket" class="tool-button" type="button">Bucket (G)</button>
                    <button id="editor-tool-eraser" class="tool-button" type="button">Eraser (E)</button>
                    <button id="editor-tool-picker" class="tool-button" type="button">Picker</button>
                    <button id="editor-tool-symmetry" class="tool-button" type="button">Symmetry</button>
                  </div>
                </details>

                <details class="tool-group" open>
                  <summary>Transform</summary>
                  <div class="editor-toolbox">
                    <button id="editor-undo" class="tool-button" type="button">Undo</button>
                    <button id="editor-redo" class="tool-button" type="button">Redo</button>
                    <button id="editor-canvas-flip-horizontal" class="tool-button" type="button">Flip H</button>
                    <button id="editor-canvas-flip-vertical" class="tool-button" type="button">Flip V</button>
                    <button id="editor-canvas-center" class="tool-button" type="button">Center</button>
                  </div>
                </details>

                <section class="editor-section">
                  <div class="editor-section-header">
                    <h3>Asset Architecture</h3>
                    <p>Define reusable component templates and global systems once, then assign them anywhere.</p>
                  </div>
                  <details class="tool-group" open>
                    <summary>Logic</summary>
                    <div class="editor-toolbox">
                      <button id="editor-open-architecture-studio" class="secondary-button" type="button">Open Architecture Studio</button>
                      <button id="editor-import-blueprint" class="secondary-button" type="button">Import Blueprint</button>
                      <button id="editor-open-logic-editor" class="secondary-button" type="button">Open Logic Editor</button>
                      <button id="editor-export-bundle" class="secondary-button" type="button">Export Asset</button>
                      <button id="editor-import-bundle" class="secondary-button" type="button">Import Asset</button>
                      <button id="editor-delete-blueprint" class="secondary-button" type="button">Delete Asset</button>
                    </div>
                  </details>
                <div id="editor-assigned-components" class="tag-list"></div>
                <div id="editor-assigned-systems" class="tag-list"></div>
                </section>

                <section class="editor-section">
                  <div class="editor-section-header">
                    <h3>Sprites</h3>
                    <p>Multiple matrices for animations or multi-part assets.</p>
                  </div>
                  <div class="editor-toolbox">
                    <button id="editor-prev-frame" class="secondary-button" type="button">Prev Frame</button>
                    <button id="editor-next-frame" class="secondary-button" type="button">Next Frame</button>
                  </div>
                  <p id="editor-frame-meta" class="hud-line hud-line-muted"></p>
                </section>

                <section class="editor-section">
                  <div class="editor-section-header">
                    <h3>Palette</h3>
                    <p>Click to paint. Right click to clear.</p>
                  </div>
                  <div id="editor-palette" class="editor-palette"></div>
                  <div class="editor-color-studio-launch">
                    <button id="editor-open-color-studio" class="secondary-button" type="button">Open Color Studio</button>
                    <div id="editor-current-color" class="editor-current-color"></div>
                  </div>
                  <div class="editor-add-color">
                    <input id="editor-color-code" type="text" maxlength="1" placeholder="T" />
                    <button id="editor-add-color" type="button">Add Token</button>
                  </div>
                </section>

                <section class="editor-section">
                  <div class="editor-section-header">
                    <h3>Canvas</h3>
                    <p>Resize with 8x8, 16x16, or 32x32 production presets.</p>
                  </div>
                  <div class="editor-resize">
                    <input id="editor-resize-width" type="number" min="1" step="1" placeholder="Width" />
                    <input id="editor-resize-height" type="number" min="1" step="1" placeholder="Height" />
                    <button id="editor-resize-apply" type="button">Resize</button>
                  </div>
                </section>

                <section class="editor-section">
                  <div class="editor-section-header">
                    <h3>1:1 Preview</h3>
                    <p>True-size sprite output without grid lines.</p>
                  </div>
                  <div class="editor-preview-frame editor-preview-frame-large">
                    <canvas id="editor-preview" class="editor-preview-canvas"></canvas>
                  </div>
                </section>

                <p id="editor-status" class="editor-status"></p>
                <ul id="editor-issues" class="editor-issues"></ul>
              </div>
            </aside>

            <section id="editor-canvas-shell" class="editor-canvas-shell">
              <div id="editor-surface" class="editor-surface">
                <div id="editor-grid-shell" class="editor-grid-shell">
                  <div class="editor-grid-meta">
                    <span id="editor-grid-size"></span>
                    <span id="editor-grid-mode"></span>
                  </div>
                  <div id="editor-grid" class="editor-grid editor-grid-large" aria-label="Blueprint pixel grid"></div>
                  <div class="editor-minimap-shell">
                    <div class="editor-grid-meta">
                      <span>Mini-Map</span>
                      <span id="editor-minimap-meta"></span>
                    </div>
                    <div class="editor-preview-frame">
                      <canvas id="editor-minimap" class="editor-preview-canvas"></canvas>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>

        <section id="world-builder-panel" class="workspace-panel" aria-label="World editor">
          <header class="editor-workspace-header">
            <div>
              <p class="eyebrow">Scene Editor</p>
              <h2 id="world-builder-scene-name">starter-plains.json</h2>
              <p id="world-builder-scene-status" class="hud-line hud-line-muted"></p>
            </div>
            <div class="editor-header-actions">
              <button id="world-builder-save" class="primary-button" type="button">Save Scene</button>
            </div>
          </header>
          <div class="world-builder-shell">
            <aside class="editor-sidebar">
              <div class="editor-card">
                <section class="editor-section">
                  <div class="editor-section-header">
                    <h3>Placement</h3>
                    <p>Single-click in the asset browser to pick an asset, then click on the canvas to place it.</p>
                  </div>
                  <div class="editor-toolbox">
                    <button id="world-builder-tool-select" class="tool-button" type="button">Select</button>
                    <button id="world-builder-tool-place" class="tool-button" type="button">Place</button>
                    <button id="world-builder-toggle-snap" class="tool-button" type="button">Snap On</button>
                    <button id="world-builder-reload" class="secondary-button" type="button">Reload Scene</button>
                    <button id="world-builder-stress-test" class="secondary-button" type="button">Run Extreme Stress Test</button>
                  </div>
                  <p id="world-builder-selected-blueprint" class="hud-line"></p>
                  <p id="world-builder-selection-status" class="hud-line hud-line-muted"></p>
                  <div class="editor-fields">
                    <label class="field">
                      <span>Search</span>
                      <input id="world-builder-search" type="text" placeholder="Find placed assets" />
                    </label>
                  </div>
                  <div class="editor-toolbox">
                    <button id="world-builder-layer-background" class="tool-button is-selected" type="button">Background</button>
                    <button id="world-builder-layer-midground" class="tool-button is-selected" type="button">Midground</button>
                    <button id="world-builder-layer-foreground" class="tool-button is-selected" type="button">Foreground</button>
                  </div>
                </section>
                <section class="editor-section">
                  <div class="editor-section-header">
                    <h3>Entities</h3>
                    <p>Double-click any placed object to jump straight into its asset editor tab.</p>
                  </div>
                  <div class="editor-toolbox">
                    <button id="world-builder-add-component" class="secondary-button" type="button">Add Component</button>
                    <button id="world-builder-delete-selected" class="secondary-button" type="button">Delete Selected</button>
                  </div>
                </section>
              </div>
            </aside>
            <section class="editor-canvas-shell">
              <div id="world-builder-viewport" class="world-builder-viewport">
                <div
                  id="world-builder-surface"
                  class="world-builder-surface"
                  aria-label="World builder map"
                ></div>
              </div>
            </section>
          </div>
        </section>
      </section>
    </section>
  </main>

  <div id="new-blueprint-modal" class="modal-backdrop" aria-hidden="true">
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="new-blueprint-title">
      <div class="editor-section-header">
        <div>
          <p class="eyebrow eyebrow-small">New Blueprint</p>
          <h3 id="new-blueprint-title">Create Blueprint</h3>
        </div>
      </div>
      <div class="editor-fields">
        <label class="field">
          <span>Name</span>
          <input id="new-blueprint-name" type="text" placeholder="forest-sprite" />
        </label>
        <label id="new-blueprint-category-field" class="field field-small">
          <span>Kind</span>
          <select id="new-blueprint-category">
            <option value="Component">Component</option>
            <option value="System">System</option>
            <option value="Template">Template</option>
          </select>
        </label>
        <label id="new-blueprint-type-preset-field" class="field field-small">
          <span>Type</span>
          <select id="new-blueprint-type">
            <option value="Sprite">Sprite</option>
            <option value="World">World</option>
            <option value="Prop">Prop</option>
            <option value="UI">UI</option>
          </select>
        </label>
        <label id="new-blueprint-size-preset-field" class="field field-small">
          <span>Size</span>
          <select id="new-blueprint-size">
            <option value="8">8x8</option>
            <option value="16">16x16</option>
            <option value="32">32x32</option>
            <option value="64">64x64</option>
            <option value="custom">Custom</option>
          </select>
        </label>
      </div>
      <label class="field field-small">
        <span>Zone Palette</span>
        <select id="new-blueprint-zone-palette">
          <option value="zone-1-core-gold">Zone 1: Core / Gold</option>
          <option value="zone-2-industrial-rust">Zone 2: Industrial / Rust</option>
          <option value="zone-3-techno-neon">Zone 3: Techno / Neon</option>
        </select>
      </label>
      <label class="field field-checkbox">
        <span>Custom Settings</span>
        <input id="new-blueprint-custom-toggle" type="checkbox" />
      </label>
      <div id="new-blueprint-custom-fields" class="editor-fields is-hidden">
        <label class="field">
          <span>Custom Kind</span>
          <input id="new-blueprint-custom-category" type="text" placeholder="Component" />
        </label>
        <label class="field">
          <span>Custom Type</span>
          <input id="new-blueprint-custom-type" type="text" placeholder="Portrait" />
        </label>
        <label class="field field-small">
          <span>Width</span>
          <input id="new-blueprint-custom-width" type="number" min="1" step="1" value="16" />
        </label>
        <label class="field field-small">
          <span>Height</span>
          <input id="new-blueprint-custom-height" type="number" min="1" step="1" value="16" />
        </label>
      </div>
      <div class="modal-actions">
        <button id="new-blueprint-cancel" class="secondary-button" type="button">Cancel</button>
        <button id="new-blueprint-confirm" class="primary-button" type="button">Create</button>
      </div>
    </div>
  </div>

  <div id="logic-editor-modal" class="modal-backdrop logic-editor-modal" aria-hidden="true">
    <div id="logic-editor-card" class="logic-editor-card" role="dialog" aria-modal="true" aria-labelledby="logic-editor-title">
      <div id="logic-editor-header" class="editor-section-header logic-editor-header">
        <div>
          <p class="eyebrow eyebrow-small">Automation Canvas</p>
          <h3 id="logic-editor-title">Logic Editor</h3>
        </div>
        <div class="editor-header-actions">
          <p id="logic-status" class="gallery-meta"></p>
          <button id="logic-editor-close" class="secondary-button" type="button">Close</button>
        </div>
      </div>
      <section id="logic-shell" class="logic-shell logic-shell-modal">
        <div class="logic-toolbar">
          <button id="logic-add-trigger" class="secondary-button" type="button">Add Trigger</button>
          <button id="logic-add-condition" class="secondary-button" type="button">Add Condition</button>
          <button id="logic-add-action" class="secondary-button" type="button">Add Action</button>
        </div>
        <div class="logic-canvas-frame">
          <svg id="logic-connections" class="logic-connections" aria-hidden="true"></svg>
          <div id="logic-canvas" class="logic-canvas" aria-label="Blueprint logic canvas"></div>
        </div>
      </section>
    </div>
  </div>

  <div id="project-browser-modal" class="modal-backdrop" aria-hidden="true">
    <div class="modal-card project-browser-card" role="dialog" aria-modal="true" aria-labelledby="project-browser-title">
      <div class="editor-section-header">
        <div>
          <p class="eyebrow eyebrow-small">Workspace</p>
          <h3 id="project-browser-title">Project Browser</h3>
        </div>
        <button id="project-browser-close" class="secondary-button" type="button">Close</button>
      </div>
      <div class="workspace-tabs color-studio-tabs">
        <button id="project-browser-tab-open" class="workspace-tab" type="button">Open</button>
        <button id="project-browser-tab-new" class="workspace-tab" type="button">New</button>
      </div>
      <div id="project-browser-panel-open" class="color-studio-panel">
        <section class="editor-section">
          <div class="editor-section-header">
            <h3>Current Project</h3>
            <p id="project-browser-current" class="gallery-meta"></p>
          </div>
        </section>
        <label class="field">
          <span>Project Path</span>
          <input id="project-browser-path" type="text" placeholder="/path/to/project" />
        </label>
        <div class="modal-actions modal-actions-left">
          <button id="project-browser-open-confirm" class="primary-button" type="button">Open Project</button>
        </div>
        <section class="editor-section">
          <div class="editor-section-header">
            <h3>Recent Projects</h3>
            <p>Quickly reopen a workspace without typing the full path.</p>
          </div>
          <div id="project-browser-recents" class="architecture-list"></div>
        </section>
      </div>
      <div id="project-browser-panel-new" class="color-studio-panel is-hidden">
        <label class="field">
          <span>Project Name</span>
          <input id="project-browser-name" type="text" placeholder="new-framework-project" />
        </label>
        <div class="modal-actions modal-actions-left">
          <button id="project-browser-create-confirm" class="primary-button" type="button">Create Project</button>
        </div>
      </div>
    </div>
  </div>

  <div id="settings-modal" class="modal-backdrop" aria-hidden="true">
    <div class="modal-card project-browser-card" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div class="editor-section-header">
        <div>
          <p class="eyebrow eyebrow-small">Workspace</p>
          <h3 id="settings-title">Settings</h3>
        </div>
        <button id="settings-close" class="secondary-button" type="button">Close</button>
      </div>
      <div class="editor-fields">
        <label class="field field-small">
          <span>Theme</span>
          <select id="settings-theme">
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="contrast">High Contrast</option>
          </select>
        </label>
        <label class="field field-small">
          <span>Font Size</span>
          <select id="settings-font-size">
            <option value="14">Compact</option>
            <option value="16">Default</option>
            <option value="18">Large</option>
          </select>
        </label>
        <label class="field field-small">
          <span>UI Scale</span>
          <select id="settings-ui-scale">
            <option value="0.95">95%</option>
            <option value="1">100%</option>
            <option value="1.1">110%</option>
            <option value="1.2">120%</option>
          </select>
        </label>
      </div>
      <div class="modal-actions">
        <button id="settings-apply" class="primary-button" type="button">Apply</button>
      </div>
    </div>
  </div>

  <div id="color-studio-modal" class="modal-backdrop" aria-hidden="true">
    <div class="modal-card color-studio-card" role="dialog" aria-modal="true" aria-labelledby="color-studio-title">
      <div class="editor-section-header">
        <div>
          <p class="eyebrow eyebrow-small">Palette Studio</p>
          <h3 id="color-studio-title">Color Studio</h3>
        </div>
        <button id="color-studio-close" class="secondary-button" type="button">Close</button>
      </div>
      <div class="workspace-tabs color-studio-tabs">
        <button id="color-studio-tab-picker" class="workspace-tab" type="button">Picker & Recent</button>
        <button id="color-studio-tab-library" class="workspace-tab" type="button">Library</button>
      </div>
      <div id="color-studio-panel-picker" class="color-studio-panel">
        <label class="field field-small">
          <span>Picker</span>
          <input id="color-studio-picker" type="color" value="#8ac926" />
        </label>
        <section class="editor-section">
          <div class="editor-section-header">
            <h3>Recent Colors</h3>
            <p>Reusable history for quick asset work.</p>
          </div>
          <div id="color-studio-recent" class="color-tile-grid"></div>
        </section>
      </div>
      <div id="color-studio-panel-library" class="color-studio-panel is-hidden">
        <section class="editor-section">
          <div class="editor-section-header">
            <h3>Blueprint Library</h3>
            <p>All colors defined in the current blueprint.</p>
          </div>
          <div id="color-studio-library" class="color-tile-grid color-tile-grid-scroll"></div>
        </section>
      </div>
    </div>
  </div>

  <div id="architecture-studio-modal" class="modal-backdrop" aria-hidden="true">
    <div class="modal-card color-studio-card" role="dialog" aria-modal="true" aria-labelledby="architecture-studio-title">
      <div class="editor-section-header">
        <div>
          <p class="eyebrow eyebrow-small">Global Architecture</p>
          <h3 id="architecture-studio-title">Component & System Studio</h3>
        </div>
        <button id="architecture-studio-close" class="secondary-button" type="button">Close</button>
      </div>
      <div class="workspace-tabs color-studio-tabs">
        <button id="architecture-tab-components" class="workspace-tab" type="button">Components</button>
        <button id="architecture-tab-systems" class="workspace-tab" type="button">Systems</button>
        <button id="architecture-tab-events" class="workspace-tab" type="button">Events</button>
      </div>
      <div id="architecture-panel-components" class="color-studio-panel">
        <div class="editor-fields">
          <label class="field">
            <span>New Component</span>
            <input id="architecture-component-name" type="text" placeholder="Health" />
          </label>
          <button id="architecture-component-add" class="primary-button" type="button">Add Component</button>
        </div>
        <div id="architecture-component-list" class="architecture-list"></div>
      </div>
      <div id="architecture-panel-systems" class="color-studio-panel is-hidden">
        <div class="editor-fields">
          <label class="field">
            <span>New System</span>
            <input id="architecture-system-name" type="text" placeholder="WeatherSystem" />
          </label>
          <button id="architecture-system-add" class="primary-button" type="button">Add System</button>
        </div>
        <div id="architecture-system-list" class="architecture-list"></div>
      </div>
      <div id="architecture-panel-events" class="color-studio-panel is-hidden">
        <div class="editor-fields">
          <label class="field">
            <span>New Event</span>
            <input id="architecture-event-name" type="text" placeholder="pulse" />
          </label>
          <button id="architecture-event-add" class="primary-button" type="button">Add Event</button>
        </div>
        <div id="architecture-event-list" class="architecture-list"></div>
      </div>
    </div>
  </div>

  <div id="toast-region" class="toast-region" aria-live="polite" aria-atomic="true"></div>
`;

const canvas = document.querySelector<HTMLCanvasElement>("#engine-canvas");
if (!canvas) {
  throw new Error("Engine canvas was not created.");
}

const context = canvas.getContext("2d");
if (!context) {
  throw new Error("Canvas 2D context is unavailable.");
}

const rendererCanvas = canvas;
const rendererContext = context;

rendererContext.imageSmoothingEnabled = false;

const hudMeta = document.querySelector<HTMLElement>("#hud-meta");
const hudIssues = document.querySelector<HTMLElement>("#hud-issues");
const hudBenchmarks = document.querySelector<HTMLElement>("#hud-benchmarks");
const hudBenchmarkShell = document.querySelector<HTMLElement>(".hud-benchmark-shell");
const hudBenchmarkToggle = document.querySelector<HTMLButtonElement>("#hud-toggle-benchmarks");
const hudPhysicsDebugToggle = document.querySelector<HTMLButtonElement>(
  "#hud-toggle-physics-debug",
);
const hudTimeLabel = document.querySelector<HTMLElement>("#hud-time-label");
const hudTimeSlider = document.querySelector<HTMLInputElement>("#hud-time-slider");
const hudStepBackButton = document.querySelector<HTMLButtonElement>("#hud-step-back");
const hudStepForwardButton = document.querySelector<HTMLButtonElement>("#hud-step-forward");
const playButton = document.querySelector<HTMLButtonElement>("#workspace-play-toggle");
const stopButton = document.querySelector<HTMLButtonElement>("#workspace-stop-toggle");

async function renderFoundation(): Promise<void> {
  DebugLogger.info("RenderFoundation", "Starting renderFoundation");
  
  if (
    !hudMeta ||
    !hudIssues ||
    !hudBenchmarks ||
    !hudBenchmarkShell ||
    !hudBenchmarkToggle ||
    !hudPhysicsDebugToggle ||
    !hudTimeLabel ||
    !hudTimeSlider ||
    !hudStepBackButton ||
    !hudStepForwardButton ||
    !playButton ||
    !stopButton
  ) {
    DebugLogger.error("RenderFoundation", "HUD elements missing", {
      hudMeta: !!hudMeta,
      hudIssues: !!hudIssues,
      hudBenchmarks: !!hudBenchmarks,
      playButton: !!playButton,
      stopButton: !!stopButton
    });
    throw new Error("Renderer HUD elements were not created.");
  }

  DebugLogger.info("RenderFoundation", "HUD elements found, loading data");
  
  let [catalog, fileNames, scene] = await Promise.all([
    loadBlueprintCatalog(),
    listBlueprintFiles(),
    loadWorldScene("starter-plains"),
  ]);

  DebugLogger.info("RenderFoundation", "Data loaded", {
    catalogLoaded: !!catalog,
    blueprintCount: catalog?.blueprints?.length || 0,
    fileNamesLoaded: !!fileNames,
    fileCount: fileNames?.length || 0,
    sceneLoaded: !!scene
  });

  const integrity = await window.api.inspectAssetIntegrity();
  const hasIntegrityIssues =
    integrity.unknownBlueprintFiles.length > 0 ||
    integrity.unknownLogicFiles.length > 0 ||
    integrity.unknownSceneFiles.length > 0 ||
    integrity.orphanLogicFiles.length > 0 ||
    integrity.staleMappings.length > 0;

  if (hasIntegrityIssues) {
    const summary = [
      integrity.unknownBlueprintFiles.length
        ? `Unindexed assets: ${integrity.unknownBlueprintFiles.join(", ")}`
        : "",
      integrity.unknownLogicFiles.length
        ? `Unindexed logic: ${integrity.unknownLogicFiles.join(", ")}`
        : "",
      integrity.unknownSceneFiles.length
        ? `Unindexed scenes: ${integrity.unknownSceneFiles.join(", ")}`
        : "",
      integrity.orphanLogicFiles.length
        ? `Orphan logic: ${integrity.orphanLogicFiles.join(", ")}`
        : "",
      integrity.staleMappings.length ? `Stale mappings: ${integrity.staleMappings.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    if (
      window.confirm(
        `Asset integrity issues were found.\n\n${summary}\n\nPress OK to clean them up.`,
      )
    ) {
      await window.api.repairAssetIntegrity("cleanup");
      [catalog, fileNames, scene] = await Promise.all([
        loadBlueprintCatalog(),
        listBlueprintFiles(),
        loadWorldScene("starter-plains"),
      ]);
    } else if (window.confirm("Reindex unknown files instead?")) {
      await window.api.repairAssetIntegrity("reindex");
      [catalog, fileNames, scene] = await Promise.all([
        loadBlueprintCatalog(),
        listBlueprintFiles(),
        loadWorldScene("starter-plains"),
      ]);
    }
  }

  const worldBuilder = initializeWorldBuilder(catalog, scene);
  initializeBlueprintEditor(catalog, {
    blueprintFiles: fileNames,
    worldBuilder,
  });
  initializeBlueprintGallery(catalog, fileNames);
  const engine = startEngine(rendererCanvas, rendererContext, catalog, {
    benchmarks: hudBenchmarks,
    benchmarkShell: hudBenchmarkShell,
    benchmarkToggle: hudBenchmarkToggle,
    physicsDebugToggle: hudPhysicsDebugToggle,
    timeLabel: hudTimeLabel,
    timeSlider: hudTimeSlider,
    stepBackButton: hudStepBackButton,
    stepForwardButton: hudStepForwardButton,
    meta: hudMeta,
    issues: hudIssues,
  });

  playButton.addEventListener("click", () => {
    engine.startPlaytest();
    playButton.disabled = true;
    stopButton.disabled = false;
  });

  stopButton.addEventListener("click", () => {
    engine.stopPlaytest();
    playButton.disabled = false;
    stopButton.disabled = true;
  });
}

renderFoundation().catch((error: unknown) => {
  BrowserLogger.error("MainRenderer", "Failed to load renderer foundation", error);
  console.error("Failed to load renderer foundation:", error);
  renderFatalError(
    app,
    "Engine bootstrap failed. Check to default asset files and Electron main process.",
  );
});
