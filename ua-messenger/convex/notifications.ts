import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthenticatedUser } from './users';

export const getNotifications = query({
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_receiver', (q) => q.eq('receiverId', currentUser._id))
      .order('desc')
      .collect();

    const notificationsWithInfo = await Promise.all(
      notifications.map(async (notification) => {
        const sender = (await ctx.db.get(notification.senderId))!;
        let post = null;
        let comment = null;

        if (notification.postId) {
          post = await ctx.db.get(notification.postId);
        }

        if (notification.type === 'comment' && notification.commentId) {
          comment = await ctx.db.get(notification.commentId);
        }

        return {
          ...notification,
          sender: {
            _id: sender._id,
            username: sender.username,
            image: sender.image,
          },
          post,
          comment: comment?.content,
        };
      })
    );

    return notificationsWithInfo;
  },
});

export const deleteNotification = mutation({
  args: {
    notificationId: v.id('notifications'),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.receiverId !== currentUser._id) {
      throw new Error('You can only delete your own notifications');
    }

    await ctx.db.delete(args.notificationId);

    return { success: true };
  },
});
