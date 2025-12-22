import { Id } from '@/convex/_generated/dataModel';
import { styles } from '@/styles/notifications.style';
import { TouchableOpacity, View, Text, Dimensions, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { formatDistanceToNow } from 'date-fns';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

interface NotificationProps {
  notification: {
    _id: Id<'notifications'>;
    type: 'like' | 'comment' | 'follow';
    sender: {
      _id: Id<'users'>;
      username: string;
      image: string;
    };
    post: {
      imageUrl: string;
    } | null;
    comment: string | undefined;
    _creationTime: number;
  };
  onDelete: (id: Id<'notifications'>) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

export function SwipeableNotification({ notification, onDelete }: NotificationProps) {
  const translateX = useSharedValue(0);

  const handleDelete = () => {
    onDelete(notification._id);
  };

  const panGenture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      translateX.value = Math.min(0, event.translationX);
    })
    .onEnd((event) => {
      if (translateX.value < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 300 }, () => {
          runOnJS(handleDelete)();
        });
      } else {
        translateX.value = withTiming(0, { duration: 300 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteButtonStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    );

    return { opacity };
  });

  return (
    <View style={swipeStyles.container}>
      <Animated.View style={[swipeStyles.deleteButton, deleteButtonStyle]}>
        <Ionicons name="trash-outline" size={24} color={COLORS.white} />
        <Text style={swipeStyles.deleteText}>Delete</Text>
      </Animated.View>

      <GestureDetector gesture={panGenture}>
        <Animated.View style={[swipeStyles.content, animatedStyle]}>
          <View style={styles.notificationItem}>
            <View style={styles.notificationContent}>
              <Link href={`/(tabs)/notifications`}>
                <TouchableOpacity style={styles.avatarContainer}>
                  <Image
                    source={notification.sender.image}
                    style={styles.avatar}
                    contentFit="cover"
                    transition={200}
                  />
                  <View style={styles.iconBadge}>
                    {notification.type === 'like' ? (
                      <Ionicons name="heart" size={14} color={COLORS.primary} />
                    ) : notification.type === 'follow' ? (
                      <Ionicons name="person-add" size={14} color="#8B5CF6" />
                    ) : (
                      <Ionicons name="chatbubble" size={14} color="#3B82F6" />
                    )}
                  </View>
                </TouchableOpacity>
              </Link>

              <View style={styles.notificationInfo}>
                <Link href={`/notifications`}>
                  <TouchableOpacity>
                    <Text style={styles.username}>{notification.sender.username}</Text>
                  </TouchableOpacity>
                </Link>

                <Text style={styles.action}>
                  {notification.type === 'follow'
                    ? 'started following you'
                    : notification.type === 'like'
                      ? 'liked your post'
                      : `commented: "${notification.comment}"`}
                </Text>
                <Text style={styles.timeAgo}>
                  {formatDistanceToNow(notification._creationTime, {
                    addSuffix: true,
                  })}
                </Text>
              </View>
            </View>

            {notification.post && (
              <Image
                source={notification.post.imageUrl}
                style={styles.postImage}
                contentFit="cover"
                transition={200}
              />
            )}
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const swipeStyles = StyleSheet.create({
  // Контейнер — потрібен для position: absolute кнопки
  container: {
    position: 'relative', // Створює контекст позиціонування
    marginBottom: 20, // Відступ між елементами
  },

  // Контент — має фон, щоб перекривати кнопку
  content: {
    backgroundColor: COLORS.background, // Важливо! Інакше кнопка буде видна
  },

  // Кнопка видалення — прихована під контентом
  deleteButton: {
    position: 'absolute', // Вийнята з потоку документа
    right: 0, // Прив'язана до правого краю
    top: 0, // Розтягнута на всю висоту
    bottom: 0,
    width: 100, // Фіксована ширина
    backgroundColor: '#EF4444', // Червоний колір
    justifyContent: 'center', // Центрування вмісту
    alignItems: 'center',
    borderRadius: 8,
  },

  deleteText: {
    color: COLORS.white,
    fontSize: 12,
    marginTop: 4,
  },
});
