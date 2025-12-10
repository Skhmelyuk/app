import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { getAuthenticatedUser } from './users';

export const generateUploadUrl = mutation(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('Unauthorized');
  return await ctx.storage.generateUploadUrl();
});

export const createPost = mutation({
  args: {
    caption: v.optional(v.string()),
    storageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const imageUrl = await ctx.storage.getUrl(args.storageId);
    if (!imageUrl) throw new Error('Image URL not found');

    const postId = await ctx.db.insert('posts', {
      userId: currentUser._id,
      imageUrl,
      storageId: args.storageId,
      caption: args.caption,
      likes: 0,
      comments: 0,
    });

    await ctx.db.patch(currentUser._id, {
      posts: currentUser.posts + 1,
    });
    return postId;
  },
});

export const getFeedPosts = query({
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);

    // Отримання всіх постів
    const posts = await ctx.db.query('posts').order('desc').collect();
    if (posts.length === 0) return [];

    const postsInfo = await Promise.all(
      posts.map(async (post) => {
        const postAuthor = (await ctx.db.get(post.userId))!;

        const like = await ctx.db
          .query('likes')
          .withIndex('by_user_and_post', (q) =>
            q.eq('userId', currentUser._id).eq('postId', post._id)
          )
          .first();

        const bookmarks = await ctx.db
          .query('bookmarks')
          .withIndex('by_user_and_post', (q) =>
            q.eq('userId', currentUser._id).eq('postId', post._id)
          )
          .first();

        return {
          ...post,
          author: {
            _id: postAuthor._id,
            username: postAuthor.username,
            image: postAuthor.image,
          },
          isLiked: !!like,
          isBookmarked: !!bookmarks,
        };
      })
    );

    return postsInfo;
  },
});

export const toggleLike = mutation({
  args: {
    postId: v.id('posts'),
  },
  handler: async (ctx, args) => {
    // 1. Отримання юзера
    const currentUser = await getAuthenticatedUser(ctx);

    // 2. Перевірка, чи лайк поставлений
    const like = await ctx.db
      .query('likes')
      .withIndex('by_user_and_post', (q) =>
        q.eq('userId', currentUser._id).eq('postId', args.postId)
      )
      .first();

    // 3. Отримання посту
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error('Post not found');

    // 4. Toggle логіка
    if (like) {
      // UNLIKE: видаляємо лайк
      await ctx.db.delete(like._id);
      await ctx.db.patch(post._id, {
        likes: post.likes - 1,
      });
      return false; // unliked
    } else {
      // LIKE: додаємо лайк
      await ctx.db.insert('likes', {
        userId: currentUser._id,
        postId: args.postId,
      });
      await ctx.db.patch(post._id, {
        likes: post.likes + 1,
      });

      // 5. Створення notification (якщо не свій пост)
      if (currentUser._id !== post.userId) {
        await ctx.db.insert('notifications', {
          type: 'like',
          receiverId: post.userId,
          senderId: currentUser._id,
          postId: args.postId,
        });
      }
      return true; // liked
    }
  },
});

export const deletePost = mutation({
  args: {
    postId: v.id('posts'),
  },
  handler: async (ctx, args) => {
    // 1. Отримання поточного користувача
    const currentUser = await getAuthenticatedUser(ctx);

    // 2. Отримання посту
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error('Post not found');

    // 3. Перевірка власника
    if (post.userId !== currentUser._id) {
      throw new Error('Not authorized to delete this post');
    }

    // 4. Видалення пов'язаних лайків
    const likes = await ctx.db
      .query('likes')
      .withIndex('by_post', (q) => q.eq('postId', args.postId))
      .collect();

    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    // 5. Видалення пов'язаних коментарів
    const comments = await ctx.db
      .query('comments')
      .withIndex('by_post', (q) => q.eq('postId', args.postId))
      .collect();

    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // 6. Видалення пов'язаних закладок
    const bookmarks = await ctx.db
      .query('bookmarks')
      .withIndex('by_post', (q) => q.eq('postId', args.postId))
      .collect();

    for (const bookmark of bookmarks) {
      await ctx.db.delete(bookmark._id);
    }

    // 6. Видалення пов'язаних постів
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_post', (q) => q.eq('postId', args.postId))
      .collect();

    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    // 7. Видалення файлу зі Storage
    await ctx.storage.delete(post.storageId);

    // 8. Видалення посту
    await ctx.db.delete(args.postId);

    // 9. Зменшення лічильника постів користувача
    await ctx.db.patch(currentUser._id, {
      posts: Math.max(0, (currentUser.posts || 1) - 1),
    });
  },
});
