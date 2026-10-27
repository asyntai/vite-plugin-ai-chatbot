# vite-plugin-ai-chatbot

Add the [Asyntai](https://asyntai.com) AI chat assistant to any Vite site. It
answers visitor questions from your own content, in more than 80 languages.

It works with every Vite project that has an `index.html`: React, Vue, Svelte,
Solid, Preact, Lit and plain HTML, on Vite 4, 5, 6, 7 and 8.

## Install

```bash
npm install vite-plugin-ai-chatbot
```

Then add the plugin in `vite.config.js` (or `vite.config.ts`):

```js
import { defineConfig } from 'vite';
import aiChatbot from 'vite-plugin-ai-chatbot';

export default defineConfig({
  plugins: [aiChatbot({ widgetId: 'asyntai_1a2b3c4d5e6f' })],
});
```

With React, Vue or another framework plugin, add it next to the one you have:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import aiChatbot from 'vite-plugin-ai-chatbot';

export default defineConfig({
  plugins: [react(), aiChatbot({ widgetId: 'asyntai_1a2b3c4d5e6f' })],
});
```

Run `vite` or `vite build`. The chat bubble is on every page.

## Where the widget ID comes from

Open the Install page in your [Asyntai dashboard](https://asyntai.com/dashboard).
The widget ID is the value of `data-asyntai-id` in the snippet shown there. It
starts with `asyntai_`.

Creating an account is free, and the Free plan is enough to try the widget.

## Options

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `widgetId` | string | required | Your Asyntai widget ID |
| `enableInDevelopment` | boolean | `true` | Set to `false` to keep the widget off the site while you run the `vite` dev server |
| `scriptUrl` | string | the Asyntai CDN | Advanced. Load the widget from another URL |

A missing or malformed `widgetId` stops Vite with a message that says how to
fix it.

## What the plugin does

- It adds the Asyntai loader to every HTML page, just before `</body>`. In a
  multi-page app, every HTML entry gets it.
- The loader waits for the page's `load` event, so your own app always renders
  first.
- Your JavaScript bundle stays as it is. The loader is a small inline script,
  not part of your build.
- A page that already has the Asyntai snippet keeps it and gets no second one.

## Answering from your content

Asyntai reads your published pages. Add your site URL in the dashboard, and the
assistant answers from the same pages the widget sits on. You can also add extra
documents and question and answer pairs.

## Removing it

Delete the `aiChatbot(...)` line and build again. The widget is gone.

## Support

Email [hello@asyntai.com](mailto:hello@asyntai.com), or read the
[Vite guide](https://asyntai.com/documentation/integrations/vite/).

## Licence

MIT. See [LICENSE](LICENSE).
