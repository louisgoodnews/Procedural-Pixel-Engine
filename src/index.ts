/**
 * Procedural Pixel Engine
 * A comprehensive, enterprise-grade, multi-platform game development ecosystem
 * 
 * @version 1.0.0
 * @author Procedural Pixel Engine Team
 * @license MIT
 */

// Core engine systems
export * from './engine';

// Version information
export const ENGINE_VERSION = '1.0.0';
export const ENGINE_BUILD = '2024-03-19';
export const ENGINE_COMPATIBILITY = {
  node: '>=18.0.0',
  browsers: {
    chrome: '>=90',
    firefox: '>=88',
    safari: '>=14',
    edge: '>=90'
  }
};

// Feature flags
export const FEATURES = {
  WEBGL2: true,
  WEBGPU: true,
  PHYSICS: true,
  AUDIO: true,
  ANIMATION: true,
  INPUT: true,
  UI: true,
  NETWORKING: true,
  AI: true,
  VR: true,
  MOBILE: true,
  CONSOLE: true,
  SECURITY: true,
  CLOUD: true,
  PERFORMANCE: true,
  ACCESSIBILITY: true,
  SOCIAL: true,
  TESTING: true
} as const;
