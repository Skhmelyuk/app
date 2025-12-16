import { Loader } from '@/components/Loader';
import { COLORS } from '@/constants/theme';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { styles } from '@/styles/profile.styles';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TouchableOpacity, View, Text, ScrollView, Pressable, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { NoPostsFound } from '@/components/NoPostsFound';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const userId = id as Id<'users'>;

  const profile = useQuery(api.users.getUserProfile, { id: userId });
  const posts = useQuery(api.posts.getPostsByUser, { userId });
  const isFollowing = useQuery(api.users.isFollowing, { followingId: userId });

  const toggleFollow = useMutation(api.users.toggleFollow);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  if (profile === undefined || posts === undefined || isFollowing === undefined) return <Loader />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{profile.username}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileInfo}>
          <View style={styles.avatarAndStats}>
            <View style={styles.avatarContainer}>
              <Image
                source={profile.image}
                style={styles.avatar}
                contentFit="cover"
                transition={200}
                cachePolicy={'memory-disk'}
              />
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profile.posts}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profile.followers}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{profile.following}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
          </View>
          <Text style={styles.name}>{profile.fullname}</Text>
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          <Pressable
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={() => toggleFollow({ followingId: id as Id<'users'> })}
          >
            <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </Pressable>
        </View>
        {posts?.length === 0 && <NoPostsFound />}
        <FlatList
          data={posts}
          numColumns={3}
          scrollEnabled={false}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.gridItem}>
              <Image
                source={item.imageUrl}
                style={styles.gridImage}
                contentFit="cover"
                transition={200}
                cachePolicy={'memory-disk'}
              />
            </TouchableOpacity>
          )}
        />
      </ScrollView>
    </View>
  );
}
