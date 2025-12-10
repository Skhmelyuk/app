import { FlatList, Text, View } from 'react-native';
import { styles } from '@/styles/notifications.style';
import { useConvexAuth, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Loader } from '@/components/Loader';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { Notification } from '@/components/Notifivation';

export default function NotificationsScreen() {
  const { isAuthenticated } = useConvexAuth();
  const notifications = useQuery(api.notifications.getNotifications, isAuthenticated ? {} : 'skip');

  if (notifications === undefined) return <Loader />;
  if (notifications.length === 0) return <NoNotificationsFound />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <FlatList
        data={notifications}
        renderItem={({ item }) => <Notification notification={item} />}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      ></FlatList>
    </View>
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
