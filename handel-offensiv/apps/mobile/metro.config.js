/**
 * Metro-Konfiguration für das pnpm-Monorepo:
 * Workspace-Packages (@handel-offensiv/*) liegen außerhalb des App-Ordners
 * und werden als TypeScript-Quelle direkt mitgebündelt.
 */
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Änderungen in packages/* beobachten
config.watchFolders = [workspaceRoot];

// Module zuerst lokal, dann im Workspace-Root auflösen (pnpm-Hoisting)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = config;
