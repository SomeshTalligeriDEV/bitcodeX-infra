const css = String.raw;

export const modalStyles = css`
  :host {
    /* Font */
    --bitcodex-font-family:
      Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

    /* Colors - Light theme (from bitcodex_common_ui color_tokens) */
    --bitcodex-white: #ffffff;
    --bitcodex-gray-50: #fafafa;
    --bitcodex-gray-100: #f5f5f5;
    --bitcodex-gray-300: #d5d7da;
    --bitcodex-gray-400: #a4a7ae;
    --bitcodex-gray-500: #717680;
    --bitcodex-gray-600: #535862;
    --bitcodex-gray-700: #414651;
    --bitcodex-gray-900: #181d27;
    --bitcodex-gray-950: #0a0d12;

    /* Semantic tokens */
    --bitcodex-bg-primary: var(--bitcodex-white);
    --bitcodex-bg-primary-hover: var(--bitcodex-gray-50);
    --bitcodex-bg-secondary: var(--bitcodex-gray-50);
    --bitcodex-bg-tertiary: var(--bitcodex-gray-100);
    --bitcodex-bg-overlay: var(--bitcodex-gray-950);
    --bitcodex-text-primary: var(--bitcodex-gray-900);
    --bitcodex-text-secondary: var(--bitcodex-gray-700);
    --bitcodex-text-brand-secondary: var(--bitcodex-gray-900);
    --bitcodex-fg-tertiary: var(--bitcodex-gray-600);
    --bitcodex-fg-quaternary: var(--bitcodex-gray-400);
    --bitcodex-fg-disabled-subtle: var(--bitcodex-gray-300);
    --bitcodex-fg-brand-primary: var(--bitcodex-gray-900);
    --bitcodex-border-primary: var(--bitcodex-gray-300);
    --bitcodex-border-error-subtle: #fda29b;

    /* Shadows */
    --bitcodex-shadow-xs: 0 1px 2px 0 rgba(16, 24, 40, 0.05);
    --bitcodex-shadow-lg:
      0 12px 16px -4px rgba(16, 24, 40, 0.08),
      0 4px 6px -2px rgba(16, 24, 40, 0.03);

    /* Spacing */
    --bitcodex-spacing-xs: 4px;
    --bitcodex-radius-md: 8px;
    --bitcodex-radius-lg: 16px;
  }

  /* Dark theme */
  :host([data-theme="dark"]) {
    /* Colors - Dark theme (from bitcodex_common_ui color_tokens) */
    --bitcodex-gray-50: #f7f7f7;
    --bitcodex-gray-300: #cecfd2;
    --bitcodex-gray-400: #94979c;
    --bitcodex-gray-500: #85888e;
    --bitcodex-gray-600: #61656c;
    --bitcodex-gray-700: #373a41;
    --bitcodex-gray-800: #22262f;
    --bitcodex-gray-900: #13161b;
    --bitcodex-gray-950: #0c0e12;

    /* Semantic tokens - Dark */
    --bitcodex-bg-primary: var(--bitcodex-gray-950);
    --bitcodex-bg-primary-hover: var(--bitcodex-gray-800);
    --bitcodex-bg-secondary: var(--bitcodex-gray-900);
    --bitcodex-bg-tertiary: var(--bitcodex-gray-800);
    --bitcodex-text-primary: var(--bitcodex-gray-50);
    --bitcodex-text-secondary: var(--bitcodex-gray-300);
    --bitcodex-text-brand-secondary: var(--bitcodex-gray-300);
    --bitcodex-fg-tertiary: var(--bitcodex-gray-400);
    --bitcodex-fg-quaternary: var(--bitcodex-gray-600);
    --bitcodex-fg-disabled-subtle: var(--bitcodex-gray-600);
    --bitcodex-fg-brand-primary: var(--bitcodex-gray-50);
    --bitcodex-border-primary: var(--bitcodex-gray-700);
    --bitcodex-border-error-subtle: #f04438;

    /* Shadows - Dark */
    --bitcodex-shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
    --bitcodex-shadow-lg:
      0 12px 16px -4px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .bitcodex-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2147483647;
    isolation: isolate;
    font-family: var(--bitcodex-font-family);
  }

  .bitcodex-modal-container {
    position: relative;
    background: var(--bitcodex-bg-primary);
    border-radius: var(--bitcodex-radius-lg);
    box-shadow: var(--bitcodex-shadow-lg);
    width: 100%;
    max-width: 400px;
    margin: 16px;
    overflow: hidden;
    animation: bitcodex-modal-fade-in 0.2s ease-out;
  }

  @keyframes bitcodex-modal-fade-in {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .bitcodex-modal-close {
    position: absolute;
    right: 24px;
    top: 24px;
    width: 36px;
    height: 36px;
    padding: var(--bitcodex-radius-md);
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--bitcodex-radius-md);
    color: var(--bitcodex-fg-tertiary);
    transition: background-color 0.2s ease;
    z-index: 1;
  }

  .bitcodex-modal-close:hover {
    background: var(--bitcodex-bg-secondary);
  }

  .bitcodex-modal-close svg {
    width: 20px;
    height: 20px;
  }

  /* Progress View (Loading/Failed) */
  .bitcodex-progress-view {
    display: flex;
    padding: 32px 24px 24px 24px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 240px;
  }

  .bitcodex-progress-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 54px;
    height: 54px;
    position: relative;
  }

  .bitcodex-progress-circle .bitcodex-provider-icon {
    width: 48px;
    height: 48px;
  }

  .bitcodex-progress-circle .bitcodex-provider-icon svg {
    width: 100%;
    height: 100%;
  }

  .bitcodex-spinner-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    margin-top: -31px;
    margin-left: -31px;
    z-index: 10;
    width: 62px;
    height: 62px;
    color: var(--bitcodex-fg-brand-primary);
  }

  .bitcodex-spinner-overlay svg {
    width: 100%;
    height: 100%;
  }

  .bitcodex-spinner-overlay.bitcodex-spinning svg {
    animation: bitcodex-spin 1s linear infinite;
  }

  .bitcodex-spinner-overlay:not(.bitcodex-spinning) {
    color: var(--bitcodex-border-error-subtle);
  }

  @keyframes bitcodex-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .bitcodex-progress-text {
    margin-top: 9px;
    font-size: 16px;
    font-weight: 500;
    line-height: 24px;
    color: var(--bitcodex-text-primary);
    text-align: center;
  }

  .bitcodex-retry-btn {
    display: flex;
    height: 20px;
    justify-content: center;
    align-items: center;
    gap: 4px;
    align-self: stretch;
    cursor: pointer;
    margin-top: 16px;
    background: none;
    border: none;
    font-family: var(--bitcodex-font-family);
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
    color: var(--bitcodex-text-brand-secondary);
  }

  .bitcodex-retry-btn:hover {
    opacity: 0.8;
  }

  /* Default View */
  .bitcodex-default-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48px 20px 20px 20px;
  }

  .bitcodex-logo-wrapper {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin-bottom: 36px;
  }

  .bitcodex-logo-wrapper img {
    display: block;
  }

  /* Socials View */
  .bitcodex-socials-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px;
  }

  .bitcodex-back-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    align-self: stretch;
    margin-bottom: 26px;
  }

  .bitcodex-back-btn {
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--bitcodex-text-primary);
    padding: 0;
  }

  .bitcodex-back-btn svg {
    width: 24px;
    height: 24px;
  }

  .bitcodex-back-title {
    flex: 1;
    text-align: center;
    font-size: 14px;
    font-weight: 500;
    color: var(--bitcodex-text-primary);
    padding-right: 24px; /* Balance the back button */
  }

  /* Provider List */
  .bitcodex-provider-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
  }

  .bitcodex-socials-list {
    gap: 12px;
  }

  /* Provider Button */
  .bitcodex-provider-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--bitcodex-spacing-xs);
    width: 100%;
    height: 40px;
    padding: 10px 14px;
    border: 1px solid var(--bitcodex-border-primary);
    border-radius: var(--bitcodex-radius-md);
    background: var(--bitcodex-bg-primary);
    cursor: pointer;
    font-family: var(--bitcodex-font-family);
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
    color: var(--bitcodex-text-primary);
    box-shadow: var(--bitcodex-shadow-xs);
    transition: background 0.2s ease;
    outline: none;
  }

  .bitcodex-provider-btn:hover:not(:disabled) {
    background: var(--bitcodex-bg-primary-hover);
  }

  .bitcodex-provider-btn:focus {
    box-shadow:
      0 0 0 4px rgba(152, 162, 179, 0.14),
      0 1px 2px 0 rgba(16, 24, 40, 0.05);
  }

  .bitcodex-provider-btn:disabled {
    color: var(--bitcodex-fg-quaternary);
    border-color: var(--bitcodex-fg-disabled-subtle);
    cursor: not-allowed;
  }

  .bitcodex-provider-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .bitcodex-provider-icon svg {
    width: 100%;
    height: 100%;
  }

  .bitcodex-provider-label {
    padding: 0 2px;
  }

  /* Social Icons Wrapper (for Other Socials button) */
  .bitcodex-social-icons-wrapper {
    display: flex;
    align-items: center;
    position: relative;
  }

  .bitcodex-social-icon {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .bitcodex-social-icon + .bitcodex-social-icon {
    margin-left: -2px;
  }

  .bitcodex-social-icon svg {
    width: 100%;
    height: 100%;
  }

  .bitcodex-chevron-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--bitcodex-fg-quaternary);
  }

  .bitcodex-chevron-icon svg {
    width: 100%;
    height: 100%;
  }

  /* Footer */
  .bitcodex-modal-footer {
    margin-top: 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .bitcodex-footer-logo {
    display: block;
    width: 52px;
    height: 20px;
  }

  .bitcodex-footer-link {
    font-size: 12px;
    font-weight: 500;
    color: var(--bitcodex-text-secondary);
    text-decoration: underline;
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
  }

  .bitcodex-footer-link:hover {
    color: var(--bitcodex-text-primary);
  }

  .bitcodex-external-icon {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--bitcodex-gray-500);
  }

  .bitcodex-external-icon svg {
    width: 100%;
    height: 100%;
  }
`;
