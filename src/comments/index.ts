/**
 * Commenting system index
 * Exports all commenting and rich text tools
 */

// Core commenting system
export * from './CommentingSystem';

// Global instances
export {
  commentingSystem,
} from './CommentingSystem';

// Convenience functions
export {
  addComment,
  addCommentReply,
  editComment,
  deleteComment,
  addReaction,
  getComments,
  getCommentStats,
} from './CommentingSystem';
