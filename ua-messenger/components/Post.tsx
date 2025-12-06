import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { styles } from '@/styles/feed.styles';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { Id } from '@/convex/_generated/dataModel';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { CommentsModal } from './CommentsModal';
import { useUser } from '@clerk/clerk-expo';

interface PostProps {
  post: {
    _id: Id<'posts'>;
    imageUrl: string;
    caption?: string;
    likes: number;
    comments: number;
    _creationTime: number;
    author: {
      _id: string;
      username: string;
      image: string;
    };
    isLiked: boolean;
    isBookmarked: boolean;
  };
}

export const Post = ({ post }: PostProps) => {
  // Оптимістичне оновлення
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [showModal, setShowModal] = useState(false);

  const [likesCount, setLikesCount] = useState(post.likes);
  const [commentsCount, setCommentsCount] = useState(post.comments);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked);

  //  Convex mutations
  const toggleLike = useMutation(api.posts.toggleLike);
  const toggleBookmark = useMutation(api.bookmarks.toggleBookmark);

  const { user } = useUser();

  const currentUser = useQuery(api.users.getUserByClerkId, user ? { clerkId: user.id } : 'skip');

  const deletePost = useMutation(api.posts.deletePost);

  const handleLike = async () => {
    try {
      const newIsLiked = await toggleLike({ postId: post._id });
      setIsLiked(newIsLiked);
      setLikesCount((prev) => (newIsLiked ? prev + 1 : prev - 1));
    } catch (error) {
      console.log('Error like: ', error);
    }
  };

  const handleBookmark = async () => {
    try {
      const newIsBookmark = await toggleBookmark({ postId: post._id });
      setIsBookmarked(newIsBookmark);
    } catch (error) {
      console.error('Error', error);
    }
  };

  const handleDeletePost = async () => {
    try {
      await deletePost({ postId: post._id });
    } catch (error) {
      console.error('Error', error);
    }
  };

  return (
    <View style={styles.post}>
      <View style={styles.postHeader}>
        <Link href={`/(tabs)/notifications`}>
          <TouchableOpacity style={styles.postHeaderLeft}>
            <Image
              source={post.author.image}
              style={styles.postAvatar}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
            <Text style={styles.postUsername}>{post.author.username}</Text>
          </TouchableOpacity>
        </Link>
        {post.author._id === currentUser?._id ? (
          <TouchableOpacity onPress={handleDeletePost}>
            <Ionicons name="trash-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>
      <Image
        source={post.imageUrl}
        style={styles.postImage}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={200}
      />
      {/* POST ACTIONS */}
      <View style={styles.postActions}>
        <View style={styles.postActionsLeft}>
          <TouchableOpacity onPress={handleLike}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={24}
              color={isLiked ? COLORS.primary : COLORS.white}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowModal(true)}>
            <Ionicons
              name={commentsCount > 0 ? 'chatbubble' : 'chatbubble-outline'}
              size={22}
              color={commentsCount > 0 ? COLORS.primary : COLORS.white}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleBookmark}>
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={isBookmarked ? COLORS.primary : COLORS.white}
          />
        </TouchableOpacity>
      </View>
      {/* POST INFO */}
      <View style={styles.postInfo}>
        {/* Кількість лайків */}
        <Text style={styles.likesText}>
          {likesCount > 0 ? `${likesCount.toLocaleString()} likes` : 'Be the first to like'}
        </Text>

        {/* Caption (якщо є) */}
        {post.caption && (
          <View style={styles.captionContainer}>
            <Text style={styles.captionUsername}>{post.author.username}</Text>
            <Text style={styles.captionText}>{post.caption}</Text>
          </View>
        )}

        {/* Кількість коментарів (якщо є) */}
        {commentsCount && (
          <TouchableOpacity onPress={() => setShowModal(true)}>
            <Text style={styles.commentsText}>View all {commentsCount} comments</Text>
          </TouchableOpacity>
        )}

        {/* Час створення */}
        <Text style={styles.timeAgo}>
          {formatDistanceToNow(post._creationTime, { addSuffix: true })}
        </Text>
      </View>

      <CommentsModal
        postId={post._id}
        visible={showModal}
        onClose={() => setShowModal(false)}
        onCommentsAdd={() => setCommentsCount(commentsCount + 1)}
      />
    </View>
  );
};
