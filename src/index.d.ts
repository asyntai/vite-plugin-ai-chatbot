declare namespace viteAiChatbot {
  interface AsyntaiOptions {
    /** Your Asyntai widget ID, for example `asyntai_1a2b3c4d5e6f`. Required. */
    widgetId: string;
    /** Set to false to keep the widget off the site during the `vite` dev server. */
    enableInDevelopment?: boolean;
    /** Advanced. Load the widget script from another URL. */
    scriptUrl?: string;
  }

  /** A Vite plugin object. Typed loosely so it fits every Vite version. */
  interface AsyntaiVitePlugin {
    name: string;
    configResolved: (config: any) => void;
    transformIndexHtml: (html: string, ctx?: any) => string;
  }

  function validateOptions(options: AsyntaiOptions): Required<AsyntaiOptions>;
  function buildLoader(widgetId: string, scriptUrl: string): string;
  function injectIntoHtml(html: string, tag: string): string;
  const DEFAULT_SCRIPT_URL: string;
}

declare function viteAiChatbot(
  options: viteAiChatbot.AsyntaiOptions,
): viteAiChatbot.AsyntaiVitePlugin;

export = viteAiChatbot;
