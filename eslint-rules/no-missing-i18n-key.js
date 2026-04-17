/**
 * Custom ESLint rule: no-missing-i18n-key
 *
 * Flags t('foo.bar'), i18n.t('foo.bar'), i18next.t('foo.bar') calls whose
 * first argument is a string literal not present in en/translation.json.
 *
 * Known limits:
 *   - Template literals and dynamic keys are skipped (no static analysis possible).
 *   - Does not cross file boundaries to find translate-helper wrappers; only
 *     direct calls to identifiers matching translateIdentifiers are checked.
 */
'use strict';

const path = require('path');
const fs = require('fs');

function flatten(obj, prefix, out) {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      flatten(v, key, out);
    } else {
      out.add(key);
    }
  }
  return out;
}

let cachedKeys = null;
let cachedMtime = 0;

function loadKeys(jsonPath) {
  try {
    const stat = fs.statSync(jsonPath);
    if (cachedKeys && stat.mtimeMs === cachedMtime) return cachedKeys;
    const raw = fs.readFileSync(jsonPath, 'utf8');
    cachedKeys = flatten(JSON.parse(raw), '', new Set());
    cachedMtime = stat.mtimeMs;
    return cachedKeys;
  } catch (e) {
    return new Set();
  }
}

const DEFAULT_IDENTIFIERS = ['t'];
const DEFAULT_MEMBER_OBJECTS = ['i18n', 'i18next'];

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow i18n keys missing from en/translation.json',
    },
    schema: [
      {
        type: 'object',
        properties: {
          translationPath: { type: 'string' },
          identifiers: { type: 'array', items: { type: 'string' } },
          memberObjects: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missing: "Missing i18n key: '{{key}}' not in en/translation.json",
    },
  },
  create(context) {
    const opts = context.options[0] || {};
    const translationPath = path.resolve(
      context.getCwd ? context.getCwd() : process.cwd(),
      opts.translationPath || 'src/locales/en/translation.json'
    );
    const identifiers = new Set(opts.identifiers || DEFAULT_IDENTIFIERS);
    const memberObjects = new Set(opts.memberObjects || DEFAULT_MEMBER_OBJECTS);
    const keys = loadKeys(translationPath);

    function isTranslateCallee(callee) {
      if (callee.type === 'Identifier') return identifiers.has(callee.name);
      if (callee.type === 'MemberExpression' && !callee.computed) {
        const obj = callee.object;
        const prop = callee.property;
        if (prop.type !== 'Identifier' || prop.name !== 't') return false;
        if (obj.type === 'Identifier') return memberObjects.has(obj.name);
        // e.g. this.i18n.t, something.i18next.t
        if (obj.type === 'MemberExpression' && !obj.computed && obj.property.type === 'Identifier') {
          return memberObjects.has(obj.property.name);
        }
      }
      return false;
    }

    return {
      CallExpression(node) {
        if (!isTranslateCallee(node.callee)) return;
        const arg = node.arguments[0];
        if (!arg) return;
        if (arg.type !== 'Literal' || typeof arg.value !== 'string') return;
        const key = arg.value;
        if (keys.has(key)) return;
        context.report({ node: arg, messageId: 'missing', data: { key } });
      },
    };
  },
};
