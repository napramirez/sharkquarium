import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ENTRY = 'src/main.js';

const PATTERNS = {
  importNamed: /^[ \t]*import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"];?[ \t]*$/gm,
  importNamespace: /^[ \t]*import\s*\*\s*as\s+([A-Za-z_$][\w$]*)\s*from\s*['"]([^'"]+)['"];?[ \t]*$/gm,
  importSideEffect: /^[ \t]*import\s*['"]([^'"]+)['"];?[ \t]*$/gm,
  exportList: /^[ \t]*export\s*\{([^}]*)\}\s*;?[ \t]*$/gm,
  exportDeclaration: /^([ \t]*)export\s+((?:async\s+)?(?:class|function)\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*))/gm,
};

const UNSUPPORTED = [
  [/^[ \t]*export\s+default\b/m, 'export default is not supported; use named exports'],
  [/^[ \t]*export\s*\*/m, 'export * is not supported; list exported names explicitly'],
  [/^[ \t]*export\s*\{[^}]*\}\s*from\b/m, 're-exports are not supported; import first, then export'],
  [/^[ \t]*import\s+[A-Za-z_$][\w$]*\s*(?:,|from\b)/m, 'default imports are not supported; use named imports'],
  [/\bimport\s*\(/m, 'dynamic import() is not supported in single-file builds'],
  [/\bimport\.meta\b/m, 'import.meta is not supported in single-file builds'],
];

export function resolveId(fromId, spec) {
  if (!spec.startsWith('.')) {
    throw new Error(`Only relative imports are supported, found "${spec}" in ${fromId}`);
  }
  const id = path.posix.normalize(path.posix.join(path.posix.dirname(fromId), spec));
  if (!id.endsWith('.js')) {
    throw new Error(`Imports must point at .js files, found "${spec}" in ${fromId}`);
  }
  return id;
}

export function transformModule(source, id) {
  for (const [pattern, message] of UNSUPPORTED) {
    if (pattern.test(source)) throw new Error(`${message} (${id})`);
  }

  const dependencies = new Set();
  const exportedNames = [];

  source = source.replace(PATTERNS.importNamespace, (_match, name, spec) => {
    const dependency = resolveId(id, spec);
    dependencies.add(dependency);
    return `const ${name} = __require(${JSON.stringify(dependency)});`;
  });

  source = source.replace(PATTERNS.importNamed, (_match, list, spec) => {
    const dependency = resolveId(id, spec);
    dependencies.add(dependency);
    const bindings = list
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const parts = item.split(/\s+as\s+/);
        return parts.length === 2 ? `${parts[0].trim()}: ${parts[1].trim()}` : item;
      });
    return `const { ${bindings.join(', ')} } = __require(${JSON.stringify(dependency)});`;
  });

  source = source.replace(PATTERNS.importSideEffect, (_match, spec) => {
    const dependency = resolveId(id, spec);
    dependencies.add(dependency);
    return `__require(${JSON.stringify(dependency)});`;
  });

  source = source.replace(PATTERNS.exportList, (_match, list) => {
    return list
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const parts = item.split(/\s+as\s+/);
        const local = parts[0].trim();
        const exported = parts.length === 2 ? parts[1].trim() : local;
        return `exports.${exported} = ${local};`;
      })
      .join('\n');
  });

  source = source.replace(
    PATTERNS.exportDeclaration,
    (_match, indent, declaration, functionName, variableName) => {
      exportedNames.push(functionName ?? variableName);
      return indent + declaration;
    },
  );

  return { code: source, dependencies: [...dependencies], exportedNames };
}

export async function bundleProject({ entry = ENTRY, root = process.cwd() } = {}) {
  const modules = new Map();

  async function crawl(id) {
    if (modules.has(id)) return;
    const source = await readFile(path.join(root, id), 'utf8');
    const transformed = transformModule(source, id);
    modules.set(id, transformed);
    for (const dependency of transformed.dependencies) {
      await crawl(dependency);
    }
  }

  await crawl(entry);

  const lines = [
    '(function () {',
    "'use strict';",
    'var __factories = {};',
    'function __define(id, factory) { __factories[id] = factory; }',
    'var __cache = {};',
    'function __require(id) {',
    '  if (__cache[id]) return __cache[id].exports;',
    '  var module = __cache[id] = { exports: {} };',
    '  __factories[id](module.exports);',
    '  return module.exports;',
    '}',
  ];

  for (const [id, { code, exportedNames }] of modules) {
    lines.push(`__define(${JSON.stringify(id)}, function (exports) {`);
    lines.push(code);
    for (const name of exportedNames) {
      lines.push(`exports.${name} = ${name};`);
    }
    lines.push('});');
  }

  lines.push(`__require(${JSON.stringify(entry)});`);
  lines.push('})();');

  return { code: lines.join('\n'), moduleCount: modules.size };
}
