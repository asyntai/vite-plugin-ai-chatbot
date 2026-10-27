/**
 * Asyntai AI chatbot for Vite.
 *
 * Adds the Asyntai chat widget to every HTML page Vite serves and builds. It
 * uses Vite's transformIndexHtml hook, so it works the same for React, Vue,
 * Svelte, Solid, Preact, Lit and plain HTML projects: the plugin puts the
 * ordinary embed loader just before </body> and changes nothing else.
 *
 * CommonJS on purpose: a vite.config.js written as ESM imports it as the
 * default export, and an older CommonJS config can require() it.
 */

const DEFAULT_SCRIPT_URL = 'https://widget.asyntai.com/static/js/chat-widget.js';
const WIDGET_ID_PATTERN = /^asyntai_[A-Za-z0-9]+$/;
const NAME = 'vite-plugin-ai-chatbot';

/**
 * Vite calls the plugin factory when it loads the config, so a wrong option
 * stops `vite` and `vite build` with a clear message instead of producing a
 * site with no chat on it.
 */
function validateOptions(options) {
  const opts = options || {};
  const widgetId = typeof opts.widgetId === 'string' ? opts.widgetId.trim() : '';

  if (!widgetId) {
    throw new Error(
      NAME +
        ': "widgetId" is required. Copy it from the Install page of your ' +
        'Asyntai dashboard, for example asyntai_1a2b3c4d5e6f.',
    );
  }
  if (!WIDGET_ID_PATTERN.test(widgetId)) {
    throw new Error(
      NAME +
        ': "' +
        widgetId +
        '" does not look like a widget ID. It starts with asyntai_, for ' +
        'example asyntai_1a2b3c4d5e6f.',
    );
  }

  const scriptUrl =
    typeof opts.scriptUrl === 'string' && opts.scriptUrl.trim()
      ? opts.scriptUrl.trim()
      : DEFAULT_SCRIPT_URL;

  return {
    widgetId,
    scriptUrl,
    // Set to false to keep the widget off the site during `vite` (dev server).
    enableInDevelopment: opts.enableInDevelopment !== false,
  };
}

/** JSON.stringify, safe inside an HTML <script> element. */
function jsString(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

/**
 * The loader waits for the page's load event before it fetches the widget.
 * An ordinary `<script async src>` holds the load event open until its own
 * fetch finishes, so an unreachable server would delay the host page. This
 * pattern cannot.
 */
function buildLoader(widgetId, scriptUrl) {
  return (
    '(function(){var l=function(){' +
    'if(document.querySelector("script[data-asyntai-id]"))return;' +
    'var s=document.createElement("script");' +
    's.src=' +
    jsString(scriptUrl) +
    ';s.async=true;' +
    's.setAttribute("data-asyntai-id",' +
    jsString(widgetId) +
    ');' +
    'document.head.appendChild(s)};' +
    'if(document.readyState==="complete"){l()}' +
    'else{window.addEventListener("load",l)}})();'
  );
}

/**
 * Puts the tag before the last </body>, or before </html> when the page has no
 * body tag. A fragment with neither is left alone: it is not a whole page.
 * A page that already carries an Asyntai snippet is left alone too.
 */
function injectIntoHtml(html, tag) {
  if (typeof html !== 'string' || html.includes('data-asyntai-id')) {
    return html;
  }
  const lower = html.toLowerCase();
  let at = lower.lastIndexOf('</body>');
  if (at === -1) {
    at = lower.lastIndexOf('</html>');
  }
  if (at === -1) {
    return html;
  }
  return html.slice(0, at) + tag + html.slice(at);
}

function viteAiChatbot(options) {
  const settings = validateOptions(options);
  const tag =
    '<script data-asyntai-loader>' +
    buildLoader(settings.widgetId, settings.scriptUrl) +
    '</script>';
  let isDevServer = false;

  return {
    name: NAME,
    configResolved(config) {
      isDevServer = config.command === 'serve' && !(config.isPreview);
    },
    // A plain function works in every Vite version from 2 to 8. It runs on
    // each HTML entry: index.html, and every page of a multi-page app.
    transformIndexHtml(html, ctx) {
      const devRequest = isDevServer || Boolean(ctx && ctx.server);
      if (devRequest && !settings.enableInDevelopment) {
        return html;
      }
      return injectIntoHtml(html, tag);
    },
  };
}

module.exports = viteAiChatbot;
module.exports.default = viteAiChatbot;
module.exports.validateOptions = validateOptions;
module.exports.buildLoader = buildLoader;
module.exports.injectIntoHtml = injectIntoHtml;
module.exports.DEFAULT_SCRIPT_URL = DEFAULT_SCRIPT_URL;
