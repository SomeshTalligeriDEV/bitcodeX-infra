import { htmlFromString } from "../dom_utils";

export interface ProviderButtonOptions {
  icon: SVGSVGElement;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  chevron?: SVGSVGElement;
}

export function createProviderButton(
  options: ProviderButtonOptions,
): HTMLButtonElement {
  const { icon, label, onClick, disabled = false, chevron } = options;

  const btn = htmlFromString<HTMLButtonElement>(`
    <button class="bitcodex-provider-btn" type="button">
      <span class="bitcodex-provider-icon"></span>
      <span class="bitcodex-provider-label">${label}</span>
    </button>
  `);

  if (disabled) {
    btn.disabled = true;
  }
  if (onClick) {
    btn.addEventListener("click", onClick);
  }

  btn.querySelector(".bitcodex-provider-icon")!.appendChild(icon);

  if (chevron) {
    const chevronSpan = document.createElement("span");
    chevronSpan.className = "bitcodex-chevron-icon";
    chevronSpan.appendChild(chevron);
    btn.appendChild(chevronSpan);
  }

  return btn;
}
