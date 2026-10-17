import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const source = await readFile(new URL('../assets/image-viewer.js', import.meta.url), 'utf8');
function fixture({ supported = true } = {}) {
  class Element {
    constructor() {
      this.listeners = {}; this.attributes = {}; this.dataset = {}; this.hidden = true;
      this.classes = new Set(); this.focused = false;
      this.classList = { toggle: (name, value) => value ? this.classes.add(name) : this.classes.delete(name) };
    }
    addEventListener(name, fn) { (this.listeners[name] ??= []).push(fn); }
    setAttribute(name, value) { this.attributes[name] = value; }
    fire(name, extra = {}) {
      const event = { target: this, button: 0, prevented: false, preventDefault() { this.prevented = true; }, ...extra };
      for (const listener of this.listeners[name] || []) listener(event);
      return event;
    }
    showModal() { this.open = true; }
    close() { this.open = false; this.fire('close'); }
    focus() { this.focused = true; }
  }
  const ids = new Map(['screenshot-dialog', 'screenshot-image', 'screenshot-stage', 'screenshot-title', 'screenshot-count', 'screenshot-original', 'screenshot-zoom', 'screenshot-status', 'screenshot-close', 'screenshot-previous', 'screenshot-next'].map(id => [id, new Element()]));
  const links = ['template', 'review', 'operate'].map(name => {
    const link = new Element();
    link.href = `https://www.infrayard.eu/assets/product-${name}-full.jpg`;
    link.dataset.title = name;
    link.querySelector = () => ({ alt: name + ' screenshot' });
    return link;
  });
  const document = { documentElement: new Element(), getElementById: id => ids.get(id), querySelectorAll: () => links };
  if (!supported) ids.get('screenshot-dialog').showModal = undefined;
  runInNewContext(source, { document });
  return { ids, links, document, dialog: ids.get('screenshot-dialog') };
}

test('opens the selected full-resolution image and restores focus and scrolling on close', () => {
  const { ids, links, document, dialog } = fixture();
  assert.equal(links[1].fire('click').prevented, true);
  assert.equal(dialog.open, true);
  assert.equal(ids.get('screenshot-image').src, links[1].href);
  assert.equal(ids.get('screenshot-image').alt, 'review screenshot');
  assert.equal(ids.get('screenshot-original').href, links[1].href);
  assert.ok(document.documentElement.classes.has('screenshot-open'));
  ids.get('screenshot-close').fire('click');
  assert.equal(dialog.open, false);
  assert.equal(links[1].focused, true);
  assert.equal(document.documentElement.classes.has('screenshot-open'), false);
});

test('keyboard and buttons wrap around the gallery and reset zoom when changing image', () => {
  const { ids, links, dialog } = fixture();
  links[0].fire('click');
  dialog.fire('keydown', { key: 'ArrowLeft' });
  assert.equal(ids.get('screenshot-image').src, links[2].href);
  ids.get('screenshot-zoom').fire('click');
  assert.equal(ids.get('screenshot-zoom').attributes['aria-pressed'], 'true');
  ids.get('screenshot-next').fire('click');
  assert.equal(ids.get('screenshot-image').src, links[0].href);
  assert.equal(ids.get('screenshot-zoom').attributes['aria-pressed'], 'false');
  assert.equal(ids.get('screenshot-count').textContent, 'SCREENSHOT 1 / 3');
  dialog.fire('keydown', { key: 'ArrowRight' });
  assert.equal(ids.get('screenshot-image').src, links[1].href);
});

test('modified clicks and unsupported dialogs retain native image-link navigation', () => {
  const ui = fixture();
  assert.equal(ui.links[0].fire('click', { ctrlKey: true }).prevented, false);
  assert.equal(ui.links[0].fire('click', { metaKey: true }).prevented, false);
  assert.equal(ui.links[0].fire('click', { button: 1 }).prevented, false);
  const fallback = fixture({ supported: false });
  assert.equal(fallback.links[0].fire('click').prevented, false);
});

test('image loading errors keep a direct original link available and clear on the next image', () => {
  const { ids, links, dialog } = fixture();
  links[0].fire('click');
  ids.get('screenshot-image').fire('error');
  assert.equal(ids.get('screenshot-status').hidden, false);
  assert.equal(ids.get('screenshot-original').href, links[0].href);
  ids.get('screenshot-next').fire('click');
  assert.equal(ids.get('screenshot-status').hidden, true);
  dialog.fire('click', { target: ids.get('screenshot-stage') });
  assert.equal(dialog.open, false);
});
