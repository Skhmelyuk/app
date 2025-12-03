import { useAuth } from '@clerk/clerk-expo';
import { FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { styles } from '@/styles/feed.styles';
import { COLORS } from '@/constants/theme';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Post } from '@/components/Post';
import { Loader } from '@/components/Loader';
import { NoPostsFound } from '@/components/NoPostsFound';
import { StoriesSection } from '@/components/Stories';

export default function Index() {
  const { signOut } = useAuth();

  const posts = useQuery(api.posts.getFeedPosts);

  if (posts === undefined) return <Loader />;
  if (posts.length === 0) return <NoPostsFound />;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ua-messenger</Text>
        <TouchableOpacity onPress={() => signOut()}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 60,
          }}
          renderItem={({ item }) => <Post post={item} />}
          ListHeaderComponent={<StoriesSection />}
        />
      </ScrollView>
    </View>
  );
}
