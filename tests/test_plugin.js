/**
 * Offline tests for vite-plugin-ai-chatbot.
 *
 * These call the plugin the way Vite calls it: the factory with options, then
 * configResolved, then transformIndexHtml. No Vite install is needed, so a
 * mistake in the option handling shows up in a second.
 *
 * Run: node plugins/vite/tests/test_plugin.js
 */

const assert = require('assert');
const plugin = require('../src/index.js');
const { validateOptions, injectIntoHtml, DEFAULT_SCRIPT_URL } = plugin;

const passed = [];
const failed = [];

function check(name, fn) {
  try {
    fn();
    passed.push(name);
    console.log('  PASS  ' + name);
  } catch (err) {
    failed.push(name);
    console.log('  FAIL  ' + name + '  -> ' + err.message);
  }
}

const PAGE =
  '<!doctype html><html><head><title>t</title></head><body><div id="app"></div>' +
  '<script type="module" src="/src/main.js"></script></body></html>';
const ID = 'asyntai_1a2b3c4d5e6f';

/** Makes the plugin and runs configResolved the way Vite does. */
function setup(options, command, isPreview) {
  const p = plugin(options);
  p.configResolved({ command: command || 'build', isPreview: Boolean(isPreview) });
  return p;
}

/** A build call: Vite passes a context with a bundle and no server. */
function build(p, html) {
  return p.transformIndexHtml(html, { path: '/index.html', filename: '/x/index.html', bundle: {} });
}

/** A dev-server call: Vite passes a context with the server. */
function dev(p, html) {
  return p.transformIndexHtml(html, { path: '/', filename: '/x/index.html', server: {} });
}

console.log('\nOptions');

check('a valid widget ID is accepted', () => {
  assert.strictEqual(validateOptions({ widgetId: ID }).widgetId, ID);
});

check('surrounding spaces are trimmed', () => {
  assert.strictEqual(validateOptions({ widgetId: '  ' + ID + '  ' }).widgetId, ID);
});

check('a missing widget ID stops Vite', () => {
  assert.throws(() => plugin({}), /widgetId" is required/);
});

check('no options at all stops Vite', () => {
  assert.throws(() => plugin(), /widgetId" is required/);
});

check('an empty widget ID stops Vite', () => {
  assert.throws(() => plugin({ widgetId: '   ' }), /widgetId" is required/);
});

check('a widget ID without the prefix stops Vite', () => {
  assert.throws(() => plugin({ widgetId: '1a2b3c4d5e6f' }), /does not look like a widget ID/);
});

check('a widget ID with a quote in it stops Vite', () => {
  assert.throws(() => plugin({ widgetId: 'asyntai_a"b' }), /does not look like a widget ID/);
});

check('the error names the package', () => {
  assert.throws(() => plugin({}), /^Error: vite-plugin-ai-chatbot:/);
});

check('the default script URL is the Asyntai CDN', () => {
  assert.strictEqual(validateOptions({ widgetId: ID }).scriptUrl, DEFAULT_SCRIPT_URL);
  assert.strictEqual(DEFAULT_SCRIPT_URL, 'https://widget.asyntai.com/static/js/chat-widget.js');
});

check('a custom script URL is kept', () => {
  const v = validateOptions({ widgetId: ID, scriptUrl: 'https://example.com/w.js' });
  assert.strictEqual(v.scriptUrl, 'https://example.com/w.js');
});

console.log('\nPlugin shape');

check('the plugin has the package name', () => {
  assert.strictEqual(plugin({ widgetId: ID }).name, 'vite-plugin-ai-chatbot');
});

check('transformIndexHtml is a plain function (works in Vite 2 to 8)', () => {
  assert.strictEqual(typeof plugin({ widgetId: ID }).transformIndexHtml, 'function');
});

check('the default export is the same function (ESM import)', () => {
  assert.strictEqual(plugin.default, plugin);
});

console.log('\nInjected code');

check('the loader goes just before </body>', () => {
  const out = build(setup({ widgetId: ID }), PAGE);
  assert.ok(/<script data-asyntai-loader>[^]*<\/script><\/body>/.test(out));
  assert.strictEqual(out.replace(/<script data-asyntai-loader>[^]*?<\/script>/, ''), PAGE);
});

check('the app entry script stays in place, before the loader', () => {
  const out = build(setup({ widgetId: ID }), PAGE);
  assert.ok(out.indexOf('/src/main.js') < out.indexOf('data-asyntai-loader'));
});

check('the widget ID and script URL are in the loader', () => {
  const out = build(setup({ widgetId: ID }), PAGE);
  assert.ok(out.includes('"' + ID + '"'));
  assert.ok(out.includes(DEFAULT_SCRIPT_URL));
});

check('the loader waits for the load event', () => {
  const out = build(setup({ widgetId: ID }), PAGE);
  assert.ok(out.includes('window.addEventListener("load"'));
  assert.ok(out.includes('document.readyState==="complete"'));
});

check('the loader is valid JavaScript', () => {
  const out = build(setup({ widgetId: ID }), PAGE);
  const code = out.match(/<script data-asyntai-loader>([^]*?)<\/script>/)[1];
  new Function(code);
});

check('the loader is a classic script, not a module (Vite leaves it unbundled)', () => {
  const out = build(setup({ widgetId: ID }), PAGE);
  assert.ok(!/<script data-asyntai-loader[^>]*type=/.test(out));
});

check('a script URL with </script> cannot break out of the tag', () => {
  const out = build(setup({ widgetId: ID, scriptUrl: 'https://e.com/</script><b>x' }), PAGE);
  assert.strictEqual(out.split('</script>').length - 1, 2);
  assert.ok(!out.includes('<b>x'));
});

check('upper-case </BODY> is found', () => {
  const out = build(setup({ widgetId: ID }), '<HTML><BODY>x</BODY></HTML>');
  assert.ok(out.endsWith('</script></BODY></HTML>'));
});

check('the last </body> is used when a comment holds another one', () => {
  const out = build(setup({ widgetId: ID }), '<html><body><!-- </body> -->x</body></html>');
  assert.ok(out.startsWith('<html><body><!-- </body> -->x<script'));
});

check('a page with no body tag gets it before </html>', () => {
  assert.strictEqual(injectIntoHtml('<html>x</html>', '<s></s>'), '<html>x<s></s></html>');
});

check('a fragment with no body or html tag is left alone', () => {
  assert.strictEqual(build(setup({ widgetId: ID }), '<p>part</p>'), '<p>part</p>');
});

check('a page that already has an Asyntai snippet is left alone', () => {
  const page = '<html><body><script src="x" data-asyntai-id="asyntai_x"></script></body></html>';
  assert.strictEqual(build(setup({ widgetId: ID }), page), page);
});

check('running the hook twice adds only one loader', () => {
  const p = setup({ widgetId: ID });
  const once = build(p, PAGE);
  assert.strictEqual(build(p, once), once);
});

check('a non-string input is returned unchanged', () => {
  assert.strictEqual(build(setup({ widgetId: ID }), undefined), undefined);
});

console.log('\nDevelopment mode');

check('the widget is on in the dev server by default', () => {
  assert.ok(dev(setup({ widgetId: ID }, 'serve'), PAGE).includes('data-asyntai-loader'));
});

check('enableInDevelopment false keeps it off in the dev server', () => {
  assert.strictEqual(dev(setup({ widgetId: ID, enableInDevelopment: false }, 'serve'), PAGE), PAGE);
});

check('enableInDevelopment false: a dev context alone is enough to skip', () => {
  const p = plugin({ widgetId: ID, enableInDevelopment: false });
  assert.strictEqual(dev(p, PAGE), PAGE);
});

check('enableInDevelopment false still adds it in vite build', () => {
  const p = setup({ widgetId: ID, enableInDevelopment: false }, 'build');
  assert.ok(build(p, PAGE).includes('data-asyntai-loader'));
});

check('enableInDevelopment false still adds it when the hook runs before configResolved', () => {
  const p = plugin({ widgetId: ID, enableInDevelopment: false });
  assert.ok(build(p, PAGE).includes('data-asyntai-loader'));
});

check('vite preview (serve + isPreview) counts as a build, not dev', () => {
  const p = setup({ widgetId: ID, enableInDevelopment: false }, 'serve', true);
  assert.ok(build(p, PAGE).includes('data-asyntai-loader'));
});

console.log('\n' + passed.length + ' passed, ' + failed.length + ' failed');
process.exit(failed.length ? 1 : 0);
