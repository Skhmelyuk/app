# Гайд: Push-сповіщення з expo-notifications

Цей гайд описує додавання push-сповіщень для лайків, коментарів та підписок у додаток **ua-messenger**.

---

## Зміст

1. [Огляд архітектури](#1-огляд-архітектури)
2. [Встановлення залежностей](#2-встановлення-залежностей)
3. [Налаштування Expo](#3-налаштування-expo)
4. [Оновлення схеми бази даних](#4-оновлення-схеми-бази-даних)
5. [Створення сервісу сповіщень](#5-створення-сервісу-сповіщень)
6. [Оновлення Convex функцій](#6-оновлення-convex-функцій)
7. [Інтеграція в додаток](#7-інтеграція-в-додаток)
8. [Обробка сповіщень](#8-обробка-сповіщень)
9. [Чек-лист впровадження](#9-чек-лист-впровадження)

---

## 1. Огляд архітектури

### Потік push-сповіщень:

```
1. Користувач реєструється → Отримує Expo Push Token
2. Token зберігається в БД (таблиця users)
3. Дія (лайк/коментар/підписка) → Convex mutation
4. Mutation викликає HTTP action для відправки push
5. Expo Push Service доставляє сповіщення
6. Користувач отримує сповіщення на пристрій
```

### Нові/оновлені файли:

```
hooks/
└── usePushNotifications.ts   # Хук для реєстрації та обробки

convex/
├── pushNotifications.ts      # HTTP actions для відправки
└── users.ts                  # Оновлення (збереження token)

providers/
└── NotificationProvider.tsx  # Провайдер сповіщень

app/
└── _layout.tsx               # Інтеграція провайдера
```

---

## 2. Встановлення залежностей

```bash
npx expo install expo-notifications expo-device expo-constants
```

---

## 3. Налаштування Expo

### Крок 3.1: Оновіть `app.config.ts`

```typescript
// app.config.ts

export default {
  expo: {
    // ... існуючі налаштування

    plugins: [
      // ... інші плагіни
      [
        'expo-notifications',
        {
          icon: './assets/images/notification-icon.png', // 96x96 PNG
          color: '#ffffff',
          sounds: ['./assets/sounds/notification.wav'], // опціонально
        },
      ],
    ],

    // Для Android
    android: {
      // ... існуючі налаштування
      googleServicesFile: './google-services.json', // для FCM
      permissions: ['RECEIVE_BOOT_COMPLETED', 'VIBRATE'],
    },

    // Для iOS
    ios: {
      // ... існуючі налаштування
      infoPlist: {
        UIBackgroundModes: ['remote-notification'],
      },
    },

    // Налаштування сповіщень
    notification: {
      icon: './assets/images/notification-icon.png',
      color: '#3b82f6',
      androidMode: 'default',
      androidCollapsedTitle: 'ua-messenger',
    },
  },
};
```

### Крок 3.2: Створіть іконку сповіщень

Створіть файл `assets/images/notification-icon.png` розміром 96x96 пікселів (монохромний PNG для Android).

---

## 4. Оновлення схеми бази даних

### Оновіть `convex/schema.ts`

Додайте поле `pushToken` до таблиці `users`:

```typescript
// convex/schema.ts

users: defineTable({
  username: v.string(),
  fullname: v.string(),
  email: v.string(),
  bio: v.optional(v.string()),
  image: v.string(),
  followers: v.number(),
  following: v.number(),
  posts: v.number(),
  clerkId: v.string(),
  pushToken: v.optional(v.string()),  // Додати це поле
  notificationsEnabled: v.optional(v.boolean()), // Налаштування сповіщень
}).index('by_clerk_id', ['clerkId']),
```

---

## 5. Створення сервісу сповіщень

### Крок 5.1: Створіть файл `hooks/usePushNotifications.ts`

```typescript
// hooks/usePushNotifications.ts

import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Налаштування поведінки сповіщень
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationState {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: string | null;
}

export function usePushNotifications(): PushNotificationState {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<string | null>(null);

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  const router = useRouter();
  const savePushToken = useMutation(api.users.savePushToken);

  useEffect(() => {
    // Реєстрація для push-сповіщень
    registerForPushNotificationsAsync()
      .then(async (token) => {
        if (token) {
          setExpoPushToken(token);
          // Зберігаємо token в БД
          try {
            await savePushToken({ pushToken: token });
          } catch (e) {
            console.error('Error saving push token:', e);
          }
        }
      })
      .catch((err) => {
        setError(err.message);
      });

    // Слухач вхідних сповіщень (коли додаток відкритий)
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    // Слухач натискання на сповіщення
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Обробка натискання на сповіщення
  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;

    if (data) {
      switch (data.type) {
        case 'like':
        case 'comment':
          if (data.postId) {
            // Перехід до поста (потрібно створити екран)
            router.push(`/post/${data.postId}`);
          }
          break;
        case 'follow':
          if (data.userId) {
            router.push(`/user/${data.userId}`);
          }
          break;
        default:
          router.push('/(tabs)/notifications');
      }
    }
  };

  return { expoPushToken, notification, error };
}

// Функція реєстрації для push-сповіщень
async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // Push-сповіщення працюють тільки на фізичних пристроях
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Перевіряємо/запитуємо дозволи
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permission for push notifications not granted');
    return null;
  }

  // Отримуємо Expo Push Token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    const pushTokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    token = pushTokenData.data;
    console.log('Expo Push Token:', token);
  } catch (error) {
    console.error('Error getting push token:', error);
  }

  // Налаштування каналу для Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3b82f6',
    });
  }

  return token;
}

// Експортуємо функцію для локальних сповіщень (тестування)
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Негайно
  });
}
```

### Крок 5.2: Створіть файл `providers/NotificationProvider.tsx`

```tsx
// providers/NotificationProvider.tsx

import React, { createContext, useContext, ReactNode } from 'react';
import { usePushNotifications, PushNotificationState } from '@/hooks/usePushNotifications';

const NotificationContext = createContext<PushNotificationState | null>(null);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const pushNotificationState = usePushNotifications();

  return (
    <NotificationContext.Provider value={pushNotificationState}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
```

---

## 6. Оновлення Convex функцій

### Крок 6.1: Оновіть `convex/users.ts`

Додайте функцію збереження push token:

```typescript
// convex/users.ts

// Додайте цю mutation
export const savePushToken = mutation({
  args: { pushToken: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    await ctx.db.patch(userId, {
      pushToken: args.pushToken,
    });
  },
});

// Функція для отримання push token користувача
export const getPushToken = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.pushToken || null;
  },
});

// Оновлення налаштувань сповіщень
export const updateNotificationSettings = mutation({
  args: { enabled: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    await ctx.db.patch(userId, {
      notificationsEnabled: args.enabled,
    });
  },
});
```

### Крок 6.2: Створіть файл `convex/pushNotifications.ts`

```typescript
// convex/pushNotifications.ts

import { v } from 'convex/values';
import { action, internalAction } from './_generated/server';
import { internal } from './_generated/api';

// Типи сповіщень
type NotificationType = 'like' | 'comment' | 'follow';

interface PushNotificationPayload {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: string;
  badge?: number;
}

// Відправка push-сповіщення через Expo Push API
export const sendPushNotification = internalAction({
  args: {
    pushToken: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const message: PushNotificationPayload = {
      to: args.pushToken,
      title: args.title,
      body: args.body,
      data: args.data,
      sound: 'default',
    };

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();

      if (result.data?.status === 'error') {
        console.error('Push notification error:', result.data.message);
      }

      return result;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      throw error;
    }
  },
});

// Відправка сповіщення про лайк
export const sendLikeNotification = internalAction({
  args: {
    receiverPushToken: v.string(),
    senderUsername: v.string(),
    postId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runAction(internal.pushNotifications.sendPushNotification, {
      pushToken: args.receiverPushToken,
      title: 'Новий лайк ❤️',
      body: `${args.senderUsername} вподобав(ла) ваш пост`,
      data: {
        type: 'like',
        postId: args.postId,
      },
    });
  },
});

// Відправка сповіщення про коментар
export const sendCommentNotification = internalAction({
  args: {
    receiverPushToken: v.string(),
    senderUsername: v.string(),
    postId: v.string(),
    commentPreview: v.string(),
  },
  handler: async (ctx, args) => {
    const preview =
      args.commentPreview.length > 50
        ? args.commentPreview.substring(0, 50) + '...'
        : args.commentPreview;

    await ctx.runAction(internal.pushNotifications.sendPushNotification, {
      pushToken: args.receiverPushToken,
      title: 'Новий коментар 💬',
      body: `${args.senderUsername}: ${preview}`,
      data: {
        type: 'comment',
        postId: args.postId,
      },
    });
  },
});

// Відправка сповіщення про підписку
export const sendFollowNotification = internalAction({
  args: {
    receiverPushToken: v.string(),
    senderUsername: v.string(),
    senderId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runAction(internal.pushNotifications.sendPushNotification, {
      pushToken: args.receiverPushToken,
      title: 'Новий підписник 👤',
      body: `${args.senderUsername} підписався(-лась) на вас`,
      data: {
        type: 'follow',
        userId: args.senderId,
      },
    });
  },
});
```

### Крок 6.3: Оновіть `convex/posts.ts` (лайки)

Додайте відправку push-сповіщення при лайку:

```typescript
// convex/posts.ts

import { internal } from './_generated/api';

export const toggleLike = mutation({
  args: { postId: v.id('posts') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const existingLike = await ctx.db
      .query('likes')
      .withIndex('by_user_and_post', (q) => q.eq('userId', userId).eq('postId', args.postId))
      .first();

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error('Post not found');

    if (existingLike) {
      // Видаляємо лайк
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.postId, { likes: post.likes - 1 });
      return false;
    } else {
      // Додаємо лайк
      await ctx.db.insert('likes', { userId, postId: args.postId });
      await ctx.db.patch(args.postId, { likes: post.likes + 1 });

      // Відправляємо push-сповіщення (якщо це не власний пост)
      if (post.userId !== userId) {
        const postOwner = await ctx.db.get(post.userId);
        const currentUser = await ctx.db.get(userId);

        if (postOwner?.pushToken && postOwner.notificationsEnabled !== false && currentUser) {
          await ctx.scheduler.runAfter(0, internal.pushNotifications.sendLikeNotification, {
            receiverPushToken: postOwner.pushToken,
            senderUsername: currentUser.username,
            postId: args.postId,
          });
        }

        // Створюємо запис у notifications
        await ctx.db.insert('notifications', {
          receiverId: post.userId,
          senderId: userId,
          type: 'like',
          postId: args.postId,
        });
      }

      return true;
    }
  },
});
```

### Крок 6.4: Оновіть `convex/comments.ts`

```typescript
// convex/comments.ts

import { internal } from './_generated/api';

export const addComment = mutation({
  args: {
    postId: v.id('posts'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error('Post not found');

    // Створюємо коментар
    const commentId = await ctx.db.insert('comments', {
      userId,
      postId: args.postId,
      content: args.content,
    });

    // Оновлюємо лічильник коментарів
    await ctx.db.patch(args.postId, { comments: post.comments + 1 });

    // Відправляємо push-сповіщення (якщо це не власний пост)
    if (post.userId !== userId) {
      const postOwner = await ctx.db.get(post.userId);
      const currentUser = await ctx.db.get(userId);

      if (postOwner?.pushToken && postOwner.notificationsEnabled !== false && currentUser) {
        await ctx.scheduler.runAfter(0, internal.pushNotifications.sendCommentNotification, {
          receiverPushToken: postOwner.pushToken,
          senderUsername: currentUser.username,
          postId: args.postId,
          commentPreview: args.content,
        });
      }

      // Створюємо запис у notifications
      await ctx.db.insert('notifications', {
        receiverId: post.userId,
        senderId: userId,
        type: 'comment',
        postId: args.postId,
        commentId,
      });
    }

    return commentId;
  },
});
```

### Крок 6.5: Оновіть `convex/users.ts` (підписки)

```typescript
// convex/users.ts

import { internal } from './_generated/api';

export const toggleFollow = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error('Not authenticated');

    if (currentUserId === args.userId) {
      throw new Error('Cannot follow yourself');
    }

    const existingFollow = await ctx.db
      .query('follows')
      .withIndex('by_both', (q) => q.eq('followerId', currentUserId).eq('followingId', args.userId))
      .first();

    const targetUser = await ctx.db.get(args.userId);
    const currentUser = await ctx.db.get(currentUserId);

    if (!targetUser || !currentUser) throw new Error('User not found');

    if (existingFollow) {
      // Відписуємось
      await ctx.db.delete(existingFollow._id);
      await ctx.db.patch(args.userId, { followers: targetUser.followers - 1 });
      await ctx.db.patch(currentUserId, { following: currentUser.following - 1 });
      return false;
    } else {
      // Підписуємось
      await ctx.db.insert('follows', {
        followerId: currentUserId,
        followingId: args.userId,
      });
      await ctx.db.patch(args.userId, { followers: targetUser.followers + 1 });
      await ctx.db.patch(currentUserId, { following: currentUser.following + 1 });

      // Відправляємо push-сповіщення
      if (targetUser.pushToken && targetUser.notificationsEnabled !== false) {
        await ctx.scheduler.runAfter(0, internal.pushNotifications.sendFollowNotification, {
          receiverPushToken: targetUser.pushToken,
          senderUsername: currentUser.username,
          senderId: currentUserId,
        });
      }

      // Створюємо запис у notifications
      await ctx.db.insert('notifications', {
        receiverId: args.userId,
        senderId: currentUserId,
        type: 'follow',
      });

      return true;
    }
  },
});
```

---

## 7. Інтеграція в додаток

### Оновіть `app/_layout.tsx`

```tsx
// app/_layout.tsx

import { Stack } from 'expo-router';
import { ClerkAndConvexProvider } from '@/providers/ClerkAndConvexProvider';
import { NotificationProvider } from '@/providers/NotificationProvider';
import { InitialLayout } from '@/components/InitialLayout';

export default function RootLayout() {
  return (
    <ClerkAndConvexProvider>
      <NotificationProvider>
        <InitialLayout>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="user/[id]" />
            {/* ... інші екрани */}
          </Stack>
        </InitialLayout>
      </NotificationProvider>
    </ClerkAndConvexProvider>
  );
}
```

---

## 8. Обробка сповіщень

### Крок 8.1: Компонент налаштувань сповіщень

```tsx
// components/NotificationSettings.tsx

import { View, Text, Switch, StyleSheet } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { COLORS } from '@/constants/theme';
import { useUser } from '@clerk/clerk-expo';

export const NotificationSettings = () => {
  const { user } = useUser();
  const currentUser = useQuery(api.users.getUserByClerkId, user ? { clerkId: user.id } : 'skip');
  const updateSettings = useMutation(api.users.updateNotificationSettings);

  const isEnabled = currentUser?.notificationsEnabled !== false;

  const handleToggle = async (value: boolean) => {
    try {
      await updateSettings({ enabled: value });
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View>
          <Text style={styles.title}>Push-сповіщення</Text>
          <Text style={styles.subtitle}>
            Отримувати сповіщення про лайки, коментарі та підписки
          </Text>
        </View>
        <Switch
          value={isEnabled}
          onValueChange={handleToggle}
          trackColor={{ false: COLORS.grey, true: COLORS.primary }}
          thumbColor={COLORS.white}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: COLORS.background,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.grey,
    marginTop: 4,
    maxWidth: 250,
  },
});
```

### Крок 8.2: Відображення in-app сповіщень

```tsx
// components/InAppNotification.tsx

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useNotifications } from '@/providers/NotificationProvider';
import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export const InAppNotification = () => {
  const { notification } = useNotifications();
  const [visible, setVisible] = useState(false);
  const translateY = useState(new Animated.Value(-100))[0];

  useEffect(() => {
    if (notification) {
      setVisible(true);

      // Анімація появи
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      // Автоматичне приховування через 4 секунди
      const timer = setTimeout(() => {
        hideNotification();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  const hideNotification = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  if (!visible || !notification) return null;

  const { title, body } = notification.request.content;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <TouchableOpacity style={styles.content} onPress={hideNotification}>
        <Ionicons name="notifications" size={24} color={COLORS.primary} />
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {body}
          </Text>
        </View>
        <TouchableOpacity onPress={hideNotification}>
          <Ionicons name="close" size={20} color={COLORS.grey} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  textContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  body: {
    fontSize: 12,
    color: COLORS.grey,
    marginTop: 2,
  },
});
```

---

## 9. Чек-лист впровадження

### Встановлення:

- [ ] `npx expo install expo-notifications expo-device expo-constants`
- [ ] Створити іконку `assets/images/notification-icon.png` (96x96)

### Налаштування:

- [ ] Оновити `app.config.ts`
- [ ] Оновити `convex/schema.ts` (додати `pushToken`, `notificationsEnabled`)

### Код:

- [ ] Створити `hooks/usePushNotifications.ts`
- [ ] Створити `providers/NotificationProvider.tsx`
- [ ] Створити `convex/pushNotifications.ts`
- [ ] Оновити `convex/users.ts` (savePushToken, toggleFollow)
- [ ] Оновити `convex/posts.ts` (toggleLike)
- [ ] Оновити `convex/comments.ts` (addComment)
- [ ] Оновити `app/_layout.tsx`

### Опціонально:

- [ ] Створити `components/NotificationSettings.tsx`
- [ ] Створити `components/InAppNotification.tsx`

### Тестування:

- [ ] `npx convex dev`
- [ ] Тестування на фізичному пристрої (емулятор не підтримує push)
- [ ] Перевірити отримання token
- [ ] Перевірити відправку сповіщень

---

## Важливі примітки

### 1. Push-сповіщення працюють тільки на фізичних пристроях

Емулятори iOS та Android не підтримують push-сповіщення.

### 2. Expo Push Token

- Для development builds використовуйте `expo-dev-client`
- Для production потрібен EAS Build

### 3. Rate Limits

Expo Push API має ліміти:

- 600 сповіщень/хвилину для безкоштовного плану
- Для більших обсягів використовуйте batch sending

### 4. Помилки токенів

Якщо токен недійсний (користувач видалив додаток), Expo поверне помилку. Рекомендується видаляти недійсні токени з БД.

### 5. Тестування

Для локального тестування можна використовувати:

```typescript
import { sendLocalNotification } from '@/hooks/usePushNotifications';

// Тестове сповіщення
sendLocalNotification('Тест', 'Це тестове сповіщення', { type: 'test' });
```

---

## Додаткові ресурси

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Push API](https://docs.expo.dev/push-notifications/overview/)
- [FCM Setup for Android](https://docs.expo.dev/push-notifications/fcm-credentials/)
- [APNs Setup for iOS](https://docs.expo.dev/push-notifications/push-notifications-setup/)
