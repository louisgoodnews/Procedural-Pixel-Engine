interface ToastOptions {
  actionLabel?: string;
  durationMs?: number;
  onAction?: () => void;
}

interface ToastRecord extends ToastOptions {
  id: string;
  message: string;
  tone: ToastTone;
}

const DEFAULT_DURATION_MS = 2800;
const ERROR_DURATION_MS = 6000;

export type ToastTone = "error" | "info" | "success";

function getToastRegion(): HTMLElement {
  const region = document.querySelector<HTMLElement>("#toast-region");
  if (!region) {
    throw new Error("Toast region was not found.");
  }

  return region;
}

function removeToast(item: HTMLElement): void {
  item.classList.add("is-leaving");
  window.setTimeout(() => item.remove(), 180);
}

function renderToast(region: HTMLElement, toast: ToastRecord): void {
  const item = document.createElement("div");
  item.className = `toast toast-${toast.tone}`;
  item.dataset.toastId = toast.id;

  const icon = document.createElement("span");
  icon.className = "toast-icon";
  icon.textContent = toast.tone === "error" ? "!" : toast.tone === "success" ? "OK" : "i";

  const message = document.createElement("span");
  message.className = "toast-message";
  message.textContent = toast.message;

  item.append(icon, message);

  if (toast.tone === "error" || toast.actionLabel) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "toast-action";
    button.textContent = toast.actionLabel ?? "Dismiss";
    button.addEventListener("click", () => {
      toast.onAction?.();
      removeToast(item);
    });
    item.append(button);
  }

  region.append(item);

  window.setTimeout(
    () => {
      removeToast(item);
    },
    toast.durationMs ?? (toast.tone === "error" ? ERROR_DURATION_MS : DEFAULT_DURATION_MS),
  );
}

export function showToast(message: string, tone: ToastTone = "info", options?: ToastOptions): void {
  renderToast(getToastRegion(), {
    id: crypto.randomUUID(),
    message,
    tone,
    ...options,
  });
}
