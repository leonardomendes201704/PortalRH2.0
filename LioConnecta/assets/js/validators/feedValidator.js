import { ensureArray, ensureNumberLike, ensureObject, ensureString, isObject, throwIfInvalid } from "./shared.js";

export function validateFeedContract(raw) {
  const issues = [];

  if (!ensureObject("feed", raw, issues)) {
    throwIfInvalid("feed", issues);
  }

  ensureString(raw.title, issues, "title");

  if (raw.posts !== undefined && ensureArray("feed", raw.posts, issues, "posts")) {
    raw.posts.forEach((post, index) => {
      if (!isObject(post)) {
        issues.push(`posts[${index}] deve ser um objeto`);
        return;
      }

      ensureString(post.author, issues, `posts[${index}].author`);
      ensureString(post.area, issues, `posts[${index}].area`);
      ensureString(post.timeAgo, issues, `posts[${index}].timeAgo`);
      ensureString(post.text, issues, `posts[${index}].text`);
      ensureString(post.highlightTitle, issues, `posts[${index}].highlightTitle`);
      ensureString(post.highlightText, issues, `posts[${index}].highlightText`);
      ensureString(post.image, issues, `posts[${index}].image`);
      ensureString(post.imageAlt, issues, `posts[${index}].imageAlt`);
      ensureNumberLike(post.reactions, issues, `posts[${index}].reactions`);
      ensureNumberLike(post.commentsCount, issues, `posts[${index}].commentsCount`);
      ensureNumberLike(post.sharesCount, issues, `posts[${index}].sharesCount`);

      if (post.comments !== undefined && ensureArray("feed", post.comments, issues, `posts[${index}].comments`)) {
        post.comments.forEach((comment, commentIndex) => {
          if (!isObject(comment)) {
            issues.push(`posts[${index}].comments[${commentIndex}] deve ser um objeto`);
            return;
          }

          ensureString(comment.author, issues, `posts[${index}].comments[${commentIndex}].author`);
          ensureString(comment.text, issues, `posts[${index}].comments[${commentIndex}].text`);
        });
      }
    });
  }

  throwIfInvalid("feed", issues);
  return raw;
}
