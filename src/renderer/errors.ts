export function renderFatalError(root: HTMLElement, message: string): void {
  root.insertAdjacentHTML("beforeend", `<p class="error" role="alert">${message}</p>`);
}
