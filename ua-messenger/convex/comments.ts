import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthenticatedUser } from './users';

export const addComment = mutation({
  args: {
    content: v.string(), // Текст коментаря
    postId: v.id('posts'), // ID посту
  },
  handler: async (ctx, args) => {
    // 1. Отримання поточного користувача
    const currentUser = await getAuthenticatedUser(ctx);

    // 2. Перевірка існування посту
    const post = await ctx.db.get(args.postId);
    if (!post) throw new ConvexError('Post not found');

    // 3. Створення коментаря
    const commentId = await ctx.db.insert('comments', {
      userId: currentUser._id,
      postId: args.postId,
      content: args.content,
    });

    // 4. Оновлення лічильника коментарів посту
    await ctx.db.patch(args.postId, {
      comments: post.comments + 1,
    });

    // 5. Створення notification (якщо не свій пост)
    if (post.userId !== currentUser._id) {
      await ctx.db.insert('notifications', {
        receiverId: post.userId,
        senderId: currentUser._id,
        type: 'comment',
        postId: args.postId,
        commentId,
      });
    }

    return commentId;
  },
});

export const getComments = query({
  args: {
    postId: v.id('posts'),
  },
  handler: async (ctx, args) => {
    // 1. Отримання всіх коментарів посту
    const comments = await ctx.db
      .query('comments')
      .withIndex('by_post', (q) => q.eq('postId', args.postId))
      .collect();

    // 2. Збагачення даними користувача
    const commentsWithInfo = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return {
          ...comment,
          user: {
            fullname: user!.fullname,
            image: user!.image,
          },
        };
      })
    );

    return commentsWithInfo;
  },
});
