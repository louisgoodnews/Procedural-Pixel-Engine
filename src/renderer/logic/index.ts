import type { LogicGraph, LogicNode, LogicNodeKind, PixelBlueprint } from "../../shared/types";
import { onRuntimeTraceUpdated } from "../editor/events";

interface LogicCanvasElements {
  addAction: HTMLButtonElement;
  addCondition: HTMLButtonElement;
  addTrigger: HTMLButtonElement;
  canvas: HTMLElement;
  connections: SVGSVGElement;
  frame: HTMLElement;
  status: HTMLElement;
}

interface LogicCanvasCallbacks {
  onTransient(graph: LogicGraph): void;
  onUpdate(graph: LogicGraph): void;
}

type NodeOption = {
  fields: Array<{
    defaultValue: number | string;
    key: string;
    label: string;
    type: "number" | "select" | "text";
    options?: string[];
  }>;
  type: string;
};

const COMPONENT_REGISTRY_KEY = "ppe.architecture.components";
const EVENT_REGISTRY_KEY = "ppe.architecture.events";

function loadComponentRegistry(): string[] {
  const serialized = localStorage.getItem(COMPONENT_REGISTRY_KEY);
  if (!serialized) {
    return ["Health", "Mana", "Stamina"];
  }

  try {
    const parsed = JSON.parse(serialized) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
      : ["Health", "Mana", "Stamina"];
  } catch {
    return ["Health", "Mana", "Stamina"];
  }
}

function getNodeLibrary(): Record<LogicNodeKind, NodeOption[]> {
  const componentRegistry = loadComponentRegistry();
  const eventRegistry = loadEventRegistry();

  return {
    action: [
      {
        fields: [
          {
            key: "component",
            label: "Component",
            options: ["velocity", "position"],
            type: "select",
            defaultValue: "velocity",
          },
          { key: "field", label: "Field", options: ["x", "y"], type: "select", defaultValue: "x" },
          {
            key: "mode",
            label: "Mode",
            options: ["add", "set"],
            type: "select",
            defaultValue: "add",
          },
          { key: "value", label: "Value", type: "number", defaultValue: 10 },
        ],
        type: "ModifyComponent",
      },
      {
        fields: [
          {
            key: "component",
            label: "Component",
            options: ["velocity", "position"],
            type: "select",
            defaultValue: "velocity",
          },
          { key: "field", label: "Field", options: ["x", "y"], type: "select", defaultValue: "x" },
          { key: "min", label: "Min", type: "number", defaultValue: -12 },
          { key: "max", label: "Max", type: "number", defaultValue: 12 },
        ],
        type: "RandomRange",
      },
      {
        fields: [
          {
            key: "component",
            label: "Component",
            options: ["velocity", "position"],
            type: "select",
            defaultValue: "velocity",
          },
          { key: "field", label: "Field", options: ["x", "y"], type: "select", defaultValue: "x" },
          {
            key: "operator",
            label: "Operator",
            options: ["add", "subtract", "multiply", "divide"],
            type: "select",
            defaultValue: "add",
          },
          { key: "value", label: "Value", type: "number", defaultValue: 2 },
        ],
        type: "MathOperation",
      },
      {
        fields: [
          {
            key: "componentName",
            label: "Template",
            options: componentRegistry,
            type: "select",
            defaultValue: componentRegistry[0] ?? "Health",
          },
        ],
        type: "AssignComponentTemplate",
      },
      {
        fields: [
          {
            key: "eventName",
            label: "Event",
            options: eventRegistry,
            type: "select",
            defaultValue: eventRegistry[0] ?? "pulse",
          },
        ],
        type: "EmitEvent",
      },
      {
        fields: [{ key: "blueprint", label: "Asset", type: "text", defaultValue: "sample-asset" }],
        type: "ChangeBlueprint",
      },
    ],
    condition: [
      {
        fields: [
          { key: "sides", label: "Sides", type: "number", defaultValue: 6 },
          { key: "target", label: "Target", type: "number", defaultValue: 4 },
        ],
        type: "DiceRoll",
      },
      {
        fields: [
          {
            key: "component",
            label: "Component",
            options: [...componentRegistry, "velocity", "position"],
            type: "select",
            defaultValue: componentRegistry[0] ?? "velocity",
          },
        ],
        type: "IfComponentExists",
      },
      {
        fields: [
          { key: "axis", label: "Axis", options: ["x", "y"], type: "select", defaultValue: "x" },
          {
            key: "operator",
            label: "Operator",
            options: [">", ">=", "===", "<=", "<"],
            type: "select",
            defaultValue: ">",
          },
          { key: "value", label: "Value", type: "number", defaultValue: 0 },
        ],
        type: "CompareVelocity",
      },
    ],
    trigger: [
      {
        fields: [{ key: "code", label: "Key Code", type: "text", defaultValue: "Space" }],
        type: "OnInput",
      },
      {
        fields: [{ key: "ms", label: "Milliseconds", type: "number", defaultValue: 1000 }],
        type: "OnTimer",
      },
      {
        fields: [
          {
            key: "eventName",
            label: "Event",
            options: eventRegistry,
            type: "select",
            defaultValue: eventRegistry[0] ?? "pulse",
          },
        ],
        type: "OnEvent",
      },
    ],
  };
}

function loadEventRegistry(): string[] {
  const serialized = localStorage.getItem(EVENT_REGISTRY_KEY);
  if (!serialized) {
    return ["pulse", "alarm", "checkpoint"];
  }

  try {
    const parsed = JSON.parse(serialized) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
      : ["pulse", "alarm", "checkpoint"];
  } catch {
    return ["pulse", "alarm", "checkpoint"];
  }
}

function requireLogicElements(): LogicCanvasElements {
  const requireElement = <TElement extends HTMLElement>(selector: string): TElement => {
    const element = document.querySelector<TElement>(selector);
    if (!element) {
      throw new Error(`Logic canvas element "${selector}" was not found.`);
    }

    return element;
  };
  const connections = document.querySelector<SVGSVGElement>("#logic-connections");
  if (!connections) {
    throw new Error('Logic canvas element "#logic-connections" was not found.');
  }

  return {
    addAction: requireElement("#logic-add-action"),
    addCondition: requireElement("#logic-add-condition"),
    addTrigger: requireElement("#logic-add-trigger"),
    canvas: requireElement("#logic-canvas"),
    connections,
    frame: requireElement(".logic-canvas-frame"),
    status: requireElement("#logic-status"),
  };
}

function ensureLogicGraph(blueprint: PixelBlueprint): LogicGraph {
  if (blueprint.logicGraph) {
    return blueprint.logicGraph;
  }

  const graph: LogicGraph = {
    version: 1,
    nodes: [],
    connections: [],
  };
  blueprint.logicGraph = graph;
  return graph;
}

function cloneGraph(graph: LogicGraph): LogicGraph {
  return {
    version: 1,
    nodes: graph.nodes.map((node) => ({
      ...node,
      data: node.data ? { ...node.data } : undefined,
      position: { ...node.position },
    })),
    connections: graph.connections.map((connection) => ({
      ...connection,
      from: { ...connection.from },
      to: { ...connection.to },
    })),
  };
}

function createNode(kind: LogicNodeKind, index: number): LogicNode {
  const option = getNodeLibrary()[kind][0];
  return {
    id: `${kind}-${crypto.randomUUID()}`,
    kind,
    type: option.type,
    position: { x: 40 + index * 22, y: 40 + index * 18 },
    data: Object.fromEntries(option.fields.map((field) => [field.key, field.defaultValue])),
  };
}

function getNodeOptions(kind: LogicNodeKind): NodeOption[] {
  return getNodeLibrary()[kind];
}

function renderConnections(
  elements: LogicCanvasElements,
  graph: LogicGraph,
  nodeElements: Map<string, HTMLElement>,
): void {
  const frame = elements.canvas.getBoundingClientRect();
  elements.connections.setAttribute(
    "viewBox",
    `0 0 ${elements.canvas.scrollWidth} ${elements.canvas.scrollHeight}`,
  );
  elements.connections.innerHTML = "";

  for (const connection of graph.connections) {
    const from = nodeElements.get(connection.from.nodeId);
    const to = nodeElements.get(connection.to.nodeId);

    if (!from || !to) {
      continue;
    }

    const fromRect = from.getBoundingClientRect();
    const toRect = to.getBoundingClientRect();
    const startX = fromRect.left - frame.left + fromRect.width;
    const startY = fromRect.top - frame.top + fromRect.height / 2;
    const endX = toRect.left - frame.left;
    const endY = toRect.top - frame.top + toRect.height / 2;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      `M ${startX} ${startY} C ${startX + 80} ${startY}, ${endX - 80} ${endY}, ${endX} ${endY}`,
    );
    path.setAttribute("class", "logic-connection");
    elements.connections.append(path);
  }
}

export function createLogicCanvasController() {
  const elements = requireLogicElements();
  let pendingConnectionSourceId: string | null = null;
  let zoom = 1;
  let tracedNodes = new Set<string>();
  let tracedAssetName = "";

  onRuntimeTraceUpdated((update) => {
    if (!tracedAssetName) {
      tracedNodes = new Set<string>();
      return;
    }

    tracedNodes = new Set(update.tracedNodesByAsset[tracedAssetName] ?? []);
  });

  const clampZoom = (value: number): number => Math.min(2.5, Math.max(0.45, value));

  elements.frame.addEventListener(
    "wheel",
    (event) => {
      if (event.ctrlKey) {
        event.preventDefault();
        zoom = clampZoom(zoom + (event.deltaY < 0 ? 0.08 : -0.08));
        elements.frame.style.setProperty("--logic-zoom", String(zoom));
        return;
      }

      if (event.shiftKey) {
        event.preventDefault();
        elements.frame.scrollLeft += event.deltaY;
        return;
      }

      event.preventDefault();
      elements.frame.scrollTop += event.deltaY;
    },
    { passive: false },
  );

  const render = (blueprint: PixelBlueprint, callbacks: LogicCanvasCallbacks): void => {
    tracedAssetName = blueprint.name;
    const graph = ensureLogicGraph(blueprint);
    const nodeElements = new Map<string, HTMLElement>();
    elements.canvas.innerHTML = "";
    elements.frame.style.setProperty("--logic-zoom", String(zoom));
    elements.status.textContent = `${graph.nodes.length} nodes • ${graph.connections.length} links${pendingConnectionSourceId ? " • linking..." : ""}`;

    const maxX = graph.nodes.reduce((largest, node) => Math.max(largest, node.position.x), 0);
    const maxY = graph.nodes.reduce((largest, node) => Math.max(largest, node.position.y), 0);
    const contentWidth = Math.max(1200, Math.round((maxX + 420) * zoom));
    const contentHeight = Math.max(720, Math.round((maxY + 320) * zoom));
    elements.canvas.style.width = `${contentWidth}px`;
    elements.canvas.style.height = `${contentHeight}px`;
    elements.connections.style.width = `${contentWidth}px`;
    elements.connections.style.height = `${contentHeight}px`;

    const addNode = (kind: LogicNodeKind) => {
      const nextGraph = cloneGraph(graph);
      nextGraph.nodes.push(createNode(kind, nextGraph.nodes.length));
      callbacks.onUpdate(nextGraph);
    };

    elements.addTrigger.onclick = () => addNode("trigger");
    elements.addCondition.onclick = () => addNode("condition");
    elements.addAction.onclick = () => addNode("action");

    for (const node of graph.nodes) {
      const card = document.createElement("article");
      card.className = `logic-node logic-node-${node.kind}`;
      card.classList.toggle("is-traced", tracedNodes.has(node.id));
      card.style.left = `${node.position.x * zoom}px`;
      card.style.top = `${node.position.y * zoom}px`;
      card.style.transform = `scale(${zoom})`;

      const header = document.createElement("header");
      header.className = "logic-node-header";
      header.innerHTML = `<strong>${node.kind}</strong><span>${node.type}</span>`;

      const body = document.createElement("div");
      body.className = "logic-node-body";

      const typeSelect = document.createElement("select");
      for (const option of getNodeOptions(node.kind)) {
        const choice = document.createElement("option");
        choice.value = option.type;
        choice.textContent = option.type;
        choice.selected = option.type === node.type;
        typeSelect.append(choice);
      }
      typeSelect.addEventListener("change", () => {
        const nextGraph = cloneGraph(graph);
        const nextNode = nextGraph.nodes.find((entry) => entry.id === node.id);
        const option = getNodeOptions(node.kind).find((entry) => entry.type === typeSelect.value);
        if (!nextNode || !option) {
          return;
        }

        nextNode.type = option.type;
        nextNode.data = Object.fromEntries(
          option.fields.map((field) => [field.key, field.defaultValue]),
        );
        callbacks.onUpdate(nextGraph);
      });
      body.append(typeSelect);

      const selectedOption =
        getNodeOptions(node.kind).find((entry) => entry.type === node.type) ??
        getNodeOptions(node.kind)[0];

      for (const field of selectedOption.fields) {
        const label = document.createElement("label");
        label.className = "logic-node-field";

        const text = document.createElement("span");
        text.textContent = field.label;
        label.append(text);

        const input =
          field.type === "select"
            ? document.createElement("select")
            : document.createElement("input");

        if (input instanceof HTMLInputElement) {
          input.type = field.type;
          input.value = String(node.data?.[field.key] ?? field.defaultValue);
        } else {
          for (const option of field.options ?? []) {
            const choice = document.createElement("option");
            choice.value = option;
            choice.textContent = option;
            choice.selected = option === String(node.data?.[field.key] ?? field.defaultValue);
            input.append(choice);
          }
        }

        input.addEventListener("change", () => {
          const nextGraph = cloneGraph(graph);
          const nextNode = nextGraph.nodes.find((entry) => entry.id === node.id);
          if (!nextNode) {
            return;
          }

          const rawValue =
            input instanceof HTMLInputElement && input.type === "number"
              ? Number(input.value)
              : input.value;
          nextNode.data = {
            ...nextNode.data,
            [field.key]: rawValue,
          };
          callbacks.onUpdate(nextGraph);
        });

        label.append(input);
        body.append(label);
      }

      const footer = document.createElement("footer");
      footer.className = "logic-node-footer";

      const connectButton = document.createElement("button");
      connectButton.type = "button";
      connectButton.className = "secondary-button";
      connectButton.textContent = pendingConnectionSourceId === node.id ? "Cancel Link" : "Link";
      connectButton.addEventListener("click", () => {
        pendingConnectionSourceId = pendingConnectionSourceId === node.id ? null : node.id;
        render(blueprint, callbacks);
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "secondary-button";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => {
        const nextGraph = cloneGraph(graph);
        nextGraph.nodes = nextGraph.nodes.filter((entry) => entry.id !== node.id);
        nextGraph.connections = nextGraph.connections.filter(
          (entry) => entry.from.nodeId !== node.id && entry.to.nodeId !== node.id,
        );
        pendingConnectionSourceId = null;
        callbacks.onUpdate(nextGraph);
      });

      footer.append(connectButton, deleteButton);
      card.append(header, body, footer);
      elements.canvas.append(card);
      nodeElements.set(node.id, card);

      card.addEventListener("click", (event) => {
        if (
          !(event.target instanceof HTMLElement) ||
          event.target.closest("button, input, select")
        ) {
          return;
        }

        if (!pendingConnectionSourceId || pendingConnectionSourceId === node.id) {
          return;
        }

        const nextGraph = cloneGraph(graph);
        nextGraph.connections.push({
          id: `connection-${crypto.randomUUID()}`,
          from: { nodeId: pendingConnectionSourceId, port: "out" },
          to: { nodeId: node.id, port: "in" },
        });
        pendingConnectionSourceId = null;
        callbacks.onUpdate(nextGraph);
      });

      header.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        const startX = event.clientX;
        const startY = event.clientY;
        const originX = node.position.x;
        const originY = node.position.y;

        const onMove = (moveEvent: PointerEvent) => {
          const nextGraph = cloneGraph(graph);
          const nextNode = nextGraph.nodes.find((entry) => entry.id === node.id);
          if (!nextNode) {
            return;
          }

          nextNode.position.x = Math.max(12, originX + (moveEvent.clientX - startX) / zoom);
          nextNode.position.y = Math.max(12, originY + (moveEvent.clientY - startY) / zoom);
          callbacks.onTransient(nextGraph);
        };

        const onUp = (upEvent: PointerEvent) => {
          const nextGraph = cloneGraph(graph);
          const nextNode = nextGraph.nodes.find((entry) => entry.id === node.id);
          if (nextNode) {
            nextNode.position.x = Math.max(12, originX + (upEvent.clientX - startX) / zoom);
            nextNode.position.y = Math.max(12, originY + (upEvent.clientY - startY) / zoom);
            callbacks.onUpdate(nextGraph);
          }

          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
        };

        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
      });
    }

    requestAnimationFrame(() => renderConnections(elements, graph, nodeElements));
  };

  const clear = () => {
    elements.canvas.innerHTML = "";
    elements.connections.innerHTML = "";
    elements.canvas.style.width = "1200px";
    elements.canvas.style.height = "720px";
    elements.connections.style.width = "1200px";
    elements.connections.style.height = "720px";
    elements.status.textContent = "Open a blueprint to build logic.";
  };

  return {
    clear,
    render,
  };
}
