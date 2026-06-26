import { DEFAULT_FEED_TITLE, DEFAULT_POSTS } from "../view-models/defaults.js";
import { asArray, asNumber, asString } from "./shared.js";

function mapComment(comment) {
  return {
    author: asString(comment?.author, "Colaborador"),
    text: asString(comment?.text, "")
  };
}

function mapPost(post) {
  const images = asArray(post?.images)
    .map((item) => ({
      id: asString(item?.id, ""),
      url: asString(item?.url, ""),
      description: asString(item?.description, ""),
      aspectRatio: asString(item?.aspectRatio, "free"),
      commentCount: asNumber(item?.commentCount, 0)
    }))
    .filter((item) => item.url);

  const image = asString(post?.image, images[0]?.url || "");

  return {
    postId: asString(post?.postId, ""),
    source: asString(post?.source, ""),
    communicationId: asString(post?.communicationId, ""),
    slug: asString(post?.slug, ""),
    author: asString(post?.author, "Autor não informado"),
    area: asString(post?.area, "Área não informada"),
    timeAgo: asString(post?.timeAgo, "agora"),
    text: asString(post?.text, ""),
    highlightTitle: asString(post?.highlightTitle, ""),
    highlightText: asString(post?.highlightText, ""),
    image,
    imageAlt: asString(post?.imageAlt, asString(post?.author, "Imagem do post")),
    images,
    reactions: asNumber(post?.reactions, 0),
    hasLiked: Boolean(post?.hasLiked),
    commentsCount: asNumber(post?.commentsCount, 0),
    sharesCount: asNumber(post?.sharesCount, 0),
    comments: asArray(post?.comments).map(mapComment).filter((comment) => comment.text)
  };
}

export function mapFeedViewModel(raw = {}, { allowDefaults = true } = {}) {
  const posts = asArray(raw.posts)
    .map(mapPost)
    .filter((post) => post.text || post.image || post.images.length);

  return {
    title: asString(raw.title, DEFAULT_FEED_TITLE),
    posts: posts.length > 0
      ? posts
      : allowDefaults
        ? [...DEFAULT_POSTS]
        : []
  };
}
