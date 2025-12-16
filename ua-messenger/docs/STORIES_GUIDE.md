# Гайд: Повноцінна реалізація Stories

Цей гайд описує покрокове додавання функціоналу Stories у додаток **ua-messenger**.

---

## Зміст

1. [Огляд архітектури](#1-огляд-архітектури)
2. [Оновлення схеми бази даних](#2-оновлення-схеми-бази-даних)
3. [Створення Convex функцій](#3-створення-convex-функцій)
4. [Створення компонентів UI](#4-створення-компонентів-ui)
5. [Створення екранів](#5-створення-екранів)
6. [Інтеграція в головний екран](#6-інтеграція-в-головний-екран)
7. [Чек-лист впровадження](#7-чек-лист-впровадження)

---

## 1. Огляд архітектури

### Нові файли:

```
convex/
├── stories.ts            # Функції для stories
├── crons.ts              # Автоматичне видалення

components/
├── StoriesList.tsx       # Горизонтальний список
├── StoryCircle.tsx       # Кружечок story
├── StoryViewer.tsx       # Перегляд stories
├── StoryProgressBar.tsx  # Прогрес-бар

app/
├── story/[userId].tsx    # Екран перегляду
└── create-story.tsx      # Створення story
```

---

## 2. Оновлення схеми бази даних

### Файл `convex/schema.ts`

Додайте таблиці:

```typescript
// Таблиця stories
stories: defineTable({
  userId: v.id('users'),
  imageUrl: v.string(),
  storageId: v.id('_storage'),
  caption: v.optional(v.string()),
  textOverlay: v.optional(v.string()),
  textColor: v.optional(v.string()),
  expiresAt: v.number(),
  viewsCount: v.number(),
})
  .index('by_user', ['userId'])
  .index('by_expires', ['expiresAt']),

// Таблиця переглядів
storyViews: defineTable({
  storyId: v.id('stories'),
  viewerId: v.id('users'),
  viewedAt: v.number(),
})
  .index('by_story', ['storyId'])
  .index('by_viewer', ['viewerId'])
  .index('by_story_and_viewer', ['storyId', 'viewerId']),
```

---

## 3. Створення Convex функцій

### Файл `convex/stories.ts`

```typescript
import { v } from 'convex/values';
import { mutation, query, internalMutation } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

const STORY_DURATION_MS = 24 * 60 * 60 * 1000; // 24 години

// Отримати stories для стрічки
export const getFeedStories = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const now = Date.now();

    // Отримуємо підписки
    const follows = await ctx.db
      .query('follows')
      .withIndex('by_follower', (q) => q.eq('followerId', userId))
      .collect();

    const followingIds = follows.map((f) => f.followingId);
    const relevantUserIds = [userId, ...followingIds];

    // Активні stories
    const allStories = await ctx.db
      .query('stories')
      .filter((q) => q.gt(q.field('expiresAt'), now))
      .collect();

    const relevantStories = allStories.filter((story) => relevantUserIds.includes(story.userId));

    // Групуємо по користувачах
    const storiesByUser = new Map();
    for (const story of relevantStories) {
      const key = story.userId.toString();
      if (!storiesByUser.has(key)) storiesByUser.set(key, []);
      storiesByUser.get(key).push(story);
    }

    const result = await Promise.all(
      Array.from(storiesByUser.entries()).map(async ([_, stories]) => {
        const storyUser = await ctx.db.get(stories[0].userId);
        if (!storyUser) return null;

        stories.sort((a, b) => a._creationTime - b._creationTime);

        const viewChecks = await Promise.all(
          stories.map(async (story) => {
            const view = await ctx.db
              .query('storyViews')
              .withIndex('by_story_and_viewer', (q) =>
                q.eq('storyId', story._id).eq('viewerId', userId)
              )
              .first();
            return !!view;
          })
        );

        return {
          user: {
            _id: storyUser._id,
            username: storyUser.username,
            image: storyUser.image,
          },
          stories: stories.map((s, i) => ({ ...s, isViewed: viewChecks[i] })),
          hasUnviewed: viewChecks.some((v) => !v),
          isOwn: storyUser._id === userId,
          latestStoryTime: stories[stories.length - 1]._creationTime,
        };
      })
    );

    return result.filter(Boolean).sort((a, b) => {
      if (a.isOwn && !b.isOwn) return -1;
      if (!a.isOwn && b.isOwn) return 1;
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return b.latestStoryTime - a.latestStoryTime;
    });
  },
});

// Отримати stories користувача
export const getUserStories = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    const now = Date.now();

    const stories = await ctx.db
      .query('stories')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.gt(q.field('expiresAt'), now))
      .collect();

    stories.sort((a, b) => a._creationTime - b._creationTime);

    const storiesWithInfo = await Promise.all(
      stories.map(async (story) => {
        let isViewed = false;
        let viewers = [];

        if (currentUserId) {
          const view = await ctx.db
            .query('storyViews')
            .withIndex('by_story_and_viewer', (q) =>
              q.eq('storyId', story._id).eq('viewerId', currentUserId)
            )
            .first();
          isViewed = !!view;

          if (story.userId === currentUserId) {
            const views = await ctx.db
              .query('storyViews')
              .withIndex('by_story', (q) => q.eq('storyId', story._id))
              .collect();

            viewers = await Promise.all(
              views.map(async (v) => {
                const viewer = await ctx.db.get(v.viewerId);
                return viewer
                  ? {
                      _id: viewer._id,
                      username: viewer.username,
                      image: viewer.image,
                      viewedAt: v.viewedAt,
                    }
                  : null;
              })
            );
            viewers = viewers.filter(Boolean);
          }
        }

        return { ...story, isViewed, viewers };
      })
    );

    const user = await ctx.db.get(args.userId);

    return {
      user: user
        ? {
            _id: user._id,
            username: user.username,
            fullname: user.fullname,
            image: user.image,
          }
        : null,
      stories: storiesWithInfo,
      isOwn: currentUserId === args.userId,
    };
  },
});

// Створити story
export const createStory = mutation({
  args: {
    storageId: v.id('_storage'),
    imageUrl: v.string(),
    caption: v.optional(v.string()),
    textOverlay: v.optional(v.string()),
    textColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    return await ctx.db.insert('stories', {
      userId,
      imageUrl: args.imageUrl,
      storageId: args.storageId,
      caption: args.caption,
      textOverlay: args.textOverlay,
      textColor: args.textColor,
      expiresAt: Date.now() + STORY_DURATION_MS,
      viewsCount: 0,
    });
  },
});

// Переглянути story
export const viewStory = mutation({
  args: { storyId: v.id('stories') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const story = await ctx.db.get(args.storyId);
    if (!story || story.userId === userId) return;

    const existing = await ctx.db
      .query('storyViews')
      .withIndex('by_story_and_viewer', (q) => q.eq('storyId', args.storyId).eq('viewerId', userId))
      .first();

    if (existing) return;

    await ctx.db.insert('storyViews', {
      storyId: args.storyId,
      viewerId: userId,
      viewedAt: Date.now(),
    });

    await ctx.db.patch(args.storyId, { viewsCount: story.viewsCount + 1 });
  },
});

// Видалити story
export const deleteStory = mutation({
  args: { storyId: v.id('stories') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const story = await ctx.db.get(args.storyId);
    if (!story || story.userId !== userId) throw new Error('Not authorized');

    const views = await ctx.db
      .query('storyViews')
      .withIndex('by_story', (q) => q.eq('storyId', args.storyId))
      .collect();

    await Promise.all(views.map((v) => ctx.db.delete(v._id)));
    await ctx.storage.delete(story.storageId);
    await ctx.db.delete(args.storyId);
  },
});

// Генерація URL для завантаження
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    return await ctx.storage.generateUploadUrl();
  },
});

// Видалення прострочених (cron)
export const deleteExpiredStories = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query('stories')
      .filter((q) => q.lt(q.field('expiresAt'), now))
      .collect();

    for (const story of expired) {
      const views = await ctx.db
        .query('storyViews')
        .withIndex('by_story', (q) => q.eq('storyId', story._id))
        .collect();
      await Promise.all(views.map((v) => ctx.db.delete(v._id)));
      try {
        await ctx.storage.delete(story.storageId);
      } catch {}
      await ctx.db.delete(story._id);
    }
    return expired.length;
  },
});

// Перевірка наявності stories
export const hasActiveStories = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const story = await ctx.db
      .query('stories')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.gt(q.field('expiresAt'), Date.now()))
      .first();
    return !!story;
  },
});
```

### Файл `convex/crons.ts`

```typescript
import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.interval('delete expired stories', { hours: 1 }, internal.stories.deleteExpiredStories);

export default crons;
```

---

## 4. Створення компонентів UI

### Встановіть залежність:

```bash
npx expo install expo-linear-gradient
```

### Файл `components/StoryCircle.tsx`

```tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';

export const StoryCircle = ({ user, hasUnviewed, isOwn, hasStories, onPress, onAddPress }) => {
  const gradientColors = hasUnviewed
    ? ['#F58529', '#DD2A7B', '#8134AF', '#515BD4']
    : ['#4a4a4a', '#4a4a4a'];

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={isOwn && !hasStories ? onAddPress : onPress}
    >
      <View style={styles.circleWrapper}>
        {hasStories ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.imageWrapper}>
              <Image source={user.image} style={styles.image} contentFit="cover" />
            </View>
          </LinearGradient>
        ) : (
          <Image source={user.image} style={styles.imageNoStory} contentFit="cover" />
        )}

        {isOwn && (
          <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
            <Ionicons name="add" size={14} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.username} numberOfLines={1}>
        {isOwn ? 'Ваша історія' : user.username}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginHorizontal: 8, width: 76 },
  circleWrapper: { width: 68, height: 68, justifyContent: 'center', alignItems: 'center' },
  gradient: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  image: { width: 56, height: 56, borderRadius: 28 },
  imageNoStory: { width: 62, height: 62, borderRadius: 31 },
  addButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  username: { fontSize: 12, color: COLORS.white, marginTop: 4, textAlign: 'center' },
});
```

### Файл `components/StoriesList.tsx`

```tsx
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { StoryCircle } from './StoryCircle';
import { COLORS } from '@/constants/theme';

export const StoriesList = () => {
  const router = useRouter();
  const feedStories = useQuery(api.stories.getFeedStories);

  if (!feedStories) return <View style={styles.placeholder} />;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {feedStories.map((item) => (
        <StoryCircle
          key={item.user._id}
          user={item.user}
          hasUnviewed={item.hasUnviewed}
          isOwn={item.isOwn}
          hasStories={item.stories.length > 0}
          onPress={() => router.push(`/story/${item.user._id}`)}
          onAddPress={() => router.push('/create-story')}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.grey,
  },
  content: { paddingHorizontal: 8, paddingVertical: 12 },
  placeholder: { height: 100, backgroundColor: COLORS.background },
});
```

### Файл `components/StoryProgressBar.tsx`

```tsx
import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const StoryProgressBar = ({
  storiesCount,
  currentIndex,
  duration,
  isPaused,
  onComplete,
}) => {
  const progress = useRef(new Animated.Value(0)).current;
  const animationRef = useRef(null);

  useEffect(() => {
    progress.setValue(0);
    if (!isPaused) {
      animationRef.current = Animated.timing(progress, {
        toValue: 1,
        duration,
        useNativeDriver: false,
      });
      animationRef.current.start(({ finished }) => finished && onComplete());
    }
    return () => animationRef.current?.stop();
  }, [currentIndex]);

  useEffect(() => {
    if (isPaused) {
      animationRef.current?.stop();
    } else {
      const currentValue = progress._value;
      animationRef.current = Animated.timing(progress, {
        toValue: 1,
        duration: duration * (1 - currentValue),
        useNativeDriver: false,
      });
      animationRef.current.start(({ finished }) => finished && onComplete());
    }
  }, [isPaused]);

  const barWidth = (SCREEN_WIDTH - 32 - (storiesCount - 1) * 4) / storiesCount;

  return (
    <View style={styles.container}>
      {Array.from({ length: storiesCount }).map((_, i) => (
        <View key={i} style={[styles.bar, { width: barWidth }]}>
          {i < currentIndex ? (
            <View style={[styles.fill, { width: '100%' }]} />
          ) : i === currentIndex ? (
            <Animated.View
              style={[
                styles.fill,
                {
                  width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                },
              ]}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 8, gap: 4 },
  bar: { height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: COLORS.white, borderRadius: 1 },
});
```

---

## 5. Створення екранів

### Файл `app/story/[userId].tsx`

```tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { StoryViewer } from '@/components/StoryViewer';
import { Loader } from '@/components/Loader';

export default function StoryScreen() {
  const { userId } = useLocalSearchParams();
  const router = useRouter();
  const data = useQuery(api.stories.getUserStories, { userId });

  if (data === undefined) return <Loader />;
  if (!data?.user || !data.stories.length) {
    router.back();
    return null;
  }

  const initialIndex = data.stories.findIndex((s) => !s.isViewed);

  return (
    <StoryViewer
      user={data.user}
      stories={data.stories}
      isOwn={data.isOwn}
      initialIndex={initialIndex >= 0 ? initialIndex : 0}
      onClose={() => router.back()}
    />
  );
}
```

### Файл `app/create-story.tsx`

```tsx
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';

export default function CreateStoryScreen() {
  const router = useRouter();
  const [image, setImage] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const generateUploadUrl = useMutation(api.stories.generateUploadUrl);
  const createStory = useMutation(api.stories.createStory);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handlePublish = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(image);
      const blob = await response.blob();
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': blob.type },
        body: blob,
      });
      const { storageId } = await uploadRes.json();
      const imageUrl = `${process.env.EXPO_PUBLIC_CONVEX_URL}/api/storage/${storageId}`;

      await createStory({ storageId, imageUrl, textOverlay: text || undefined });
      router.back();
    } catch (e) {
      Alert.alert('Помилка', 'Не вдалося опублікувати');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Нова історія</Text>
        <TouchableOpacity onPress={handlePublish} disabled={!image || loading}>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.publish}>Опублікувати</Text>
          )}
        </TouchableOpacity>
      </View>

      {image ? (
        <View style={styles.preview}>
          <Image source={image} style={styles.previewImage} contentFit="cover" />
          {text && (
            <View style={styles.textOverlay}>
              <Text style={styles.overlayText}>{text}</Text>
            </View>
          )}
        </View>
      ) : (
        <TouchableOpacity style={styles.picker} onPress={pickImage}>
          <Ionicons name="images" size={48} color={COLORS.primary} />
          <Text style={styles.pickerText}>Вибрати фото</Text>
        </TouchableOpacity>
      )}

      {image && (
        <TextInput
          style={styles.input}
          placeholder="Додати текст..."
          placeholderTextColor={COLORS.grey}
          value={text}
          onChangeText={setText}
          maxLength={100}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  title: { fontSize: 18, fontWeight: '600', color: COLORS.white },
  publish: { fontSize: 16, fontWeight: '600', color: COLORS.primary },
  preview: { flex: 1, margin: 16, borderRadius: 12, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  textOverlay: {
    position: 'absolute',
    top: '40%',
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
    borderRadius: 8,
  },
  overlayText: { fontSize: 18, fontWeight: '600', color: COLORS.white, textAlign: 'center' },
  picker: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pickerText: { fontSize: 16, color: COLORS.white, marginTop: 12 },
  input: {
    backgroundColor: '#2a2a2a',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.white,
  },
});
```

---

## 6. Інтеграція в головний екран

### Оновіть `app/(tabs)/index.tsx`

```tsx
import { StoriesList } from '@/components/StoriesList';

// В FlatList додайте:
<FlatList
  ListHeaderComponent={<StoriesList />}
  // ... інші props
/>;
```

### Оновіть `app/_layout.tsx`

```tsx
<Stack.Screen name="story/[userId]" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
<Stack.Screen name="create-story" options={{ presentation: 'modal' }} />
```

---

## 7. Чек-лист впровадження

- [ ] Оновити `convex/schema.ts`
- [ ] Створити `convex/stories.ts`
- [ ] Створити `convex/crons.ts`
- [ ] `npx expo install expo-linear-gradient`
- [ ] Створити `components/StoryCircle.tsx`
- [ ] Створити `components/StoriesList.tsx`
- [ ] Створити `components/StoryProgressBar.tsx`
- [ ] Створити `components/StoryViewer.tsx`
- [ ] Створити `app/story/[userId].tsx`
- [ ] Створити `app/create-story.tsx`
- [ ] Оновити `app/(tabs)/index.tsx`
- [ ] Оновити `app/_layout.tsx`
- [ ] `npx convex dev`
- [ ] Тестування

---

**Примітка:** Компонент `StoryViewer.tsx` потребує окремої реалізації з підтримкою жестів, прогрес-бару та списку переглядачів. Базовий код наведено вище.
