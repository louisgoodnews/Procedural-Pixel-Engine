/**
 * Wiki system index
 * Exports all community wiki and collaborative documentation tools
 */

// Core wiki system
export * from './CommunityWiki';

// Global instances
export {
  communityWiki,
} from './CommunityWiki';

// Convenience functions
export {
  createWikiPage,
  updateWikiPage,
  deleteWikiPage,
  getWikiPage,
  getAllWikiPages,
  searchWikiPages,
  getWikiStats,
  setWikiUser,
  getWikiUser,
  exportWiki,
} from './CommunityWiki';
