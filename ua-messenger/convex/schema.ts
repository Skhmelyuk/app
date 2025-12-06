import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // Таблица користувачів
  users: defineTable({
    username: v.string(),
    fullname: v.string(),
    email: v.string(),
    bio: v.optional(v.string()),
    image: v.string(),
    followers: v.number(),
    following: v.number(),
    posts: v.number(),
    clerkId: v.string(),
  }).index('by_clerk_id', ['clerkId']),
  // Таблица постів
  posts: defineTable({
    userId: v.id('users'),
    imageUrl: v.string(),
    storageId: v.id('_storage'),
    caption: v.optional(v.string()),
    likes: v.number(),
    comments: v.number(),
  }).index('by_user', ['userId']),
  // Таблица лайків
  likes: defineTable({
    userId: v.id('users'),
    postId: v.id('posts'),
  })
    .index('by_post', ['postId'])
    .index('by_user_and_post', ['userId', 'postId']),
  // Таблица коментарів
  comments: defineTable({
    userId: v.id('users'),
    postId: v.id('posts'),
    content: v.string(),
  }).index('by_post', ['postId']),
  // Таблица подписок
  follows: defineTable({
    followerId: v.id('users'),
    followingId: v.id('users'),
  })
    .index('by_follower', ['followerId'])
    .index('by_following', ['followingId'])
    .index('by_both', ['followerId', 'followingId']),
  // Таблица уведомлень
  notifications: defineTable({
    receiverId: v.id('users'),
    senderId: v.id('users'),
    type: v.union(v.literal('like'), v.literal('comment'), v.literal('follow')),
    postId: v.optional(v.id('posts')),
    commentId: v.optional(v.id('comments')),
  }).index('by_receiver', ['receiverId']),
  // Таблица закладок
  bookmarks: defineTable({
    userId: v.id('users'),
    postId: v.id('posts'),
  })
    .index('by_user', ['userId'])
    .index('by_post', ['postId'])
    .index('by_user_and_post', ['userId', 'postId']),
});
