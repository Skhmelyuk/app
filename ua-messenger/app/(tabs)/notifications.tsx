import { FlatList, Text, View } from 'react-native';
import { styles } from '@/styles/notifications.style';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Loader } from '@/components/Loader';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { Id } from '@/convex/_generated/dataModel';
import { SwipeableNotification } from '@/components/SwipeableNotifivation';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function NotificationsScreen() {
  const { isAuthenticated } = useConvexAuth();
  const notifications = useQuery(api.notifications.getNotifications, isAuthenticated ? {} : 'skip');

  const deleteNotification = useMutation(api.notifications.deleteNotification);

  const handleDeleteNotification = async (notificationId: Id<'notifications'>) => {
    try {
      await deleteNotification({ notificationId });
    } catch (error) {
      console.error(error);
    }
  };

  if (notifications === undefined) return <Loader />;
  if (notifications.length === 0) return <NoNotificationsFound />;

  return (
    <GestureHandlerRootView>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>

        <FlatList
          data={notifications}
          renderItem={({ item }) => (
            <SwipeableNotification notification={item} onDelete={handleDeleteNotification} />
          )}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        ></FlatList>
      </View>
    </GestureHandlerRootView>
  );
}

function NoNotificationsFound() {
  return (
    <View style={[styles.container, styles.centered]}>
      <Ionicons name="notifications-outline" size={74} color={COLORS.primary} />
      <Text style={{ fontSize: 20, color: COLORS.white }}>No notifications yet</Text>
    </View>
  );
}
