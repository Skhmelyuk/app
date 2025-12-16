# Гайд: Додавання Direct Messages (Приватні повідомлення)

Цей гайд описує покрокове додавання функціоналу приватних повідомлень у додаток **ua-messenger**.

---

## Зміст

1. [Огляд архітектури](#1-огляд-архітектури)
2. [Оновлення схеми бази даних (Convex)](#2-оновлення-схеми-бази-даних-convex)
3. [Створення Convex функцій](#3-створення-convex-функцій)
4. [Створення компонентів UI](#4-створення-компонентів-ui)
5. [Створення екранів](#5-створення-екранів)
6. [Оновлення навігації](#6-оновлення-навігації)
7. [Додаткові покращення](#7-додаткові-покращення)

---

## 1. Огляд архітектури

### Структура функціоналу:

```
Direct Messages
├── Список діалогів (conversations)
├── Екран чату (chat)
│   ├── Текстові повідомлення
│   └── Зображення
└── Створення нового діалогу
```

### Нові файли, які потрібно створити:

```
convex/
├── conversations.ts      # Функції для діалогів
├── messages.ts           # Функції для повідомлень

components/
├── ConversationItem.tsx  # Елемент списку діалогів
├── MessageBubble.tsx     # Бульбашка повідомлення
├── ChatInput.tsx         # Поле вводу повідомлення
└── ImageMessagePicker.tsx # Вибір зображення для відправки

app/
├── (tabs)/
│   └── messages.tsx      # Список діалогів (новий таб)
└── chat/
    └── [id].tsx          # Екран чату
```

---

## 2. Оновлення схеми бази даних (Convex)

### Крок 2.1: Оновіть файл `convex/schema.ts`

Додайте нові таблиці в кінець схеми:

```typescript
// convex/schema.ts

import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // ... існуючі таблиці (users, posts, likes, comments, follows, notifications, bookmarks)

  // Таблиця діалогів (conversations)
  conversations: defineTable({
    participantOneId: v.id('users'),
    participantTwoId: v.id('users'),
    lastMessageId: v.optional(v.id('messages')),
    lastMessageTime: v.optional(v.number()),
  })
    .index('by_participant_one', ['participantOneId'])
    .index('by_participant_two', ['participantTwoId'])
    .index('by_participants', ['participantOneId', 'participantTwoId']),

  // Таблиця повідомлень (messages)
  messages: defineTable({
    conversationId: v.id('conversations'),
    senderId: v.id('users'),
    content: v.optional(v.string()), // Текст повідомлення
    imageUrl: v.optional(v.string()), // URL зображення
    storageId: v.optional(v.id('_storage')), // ID файлу в storage
    isRead: v.boolean(),
  })
    .index('by_conversation', ['conversationId'])
    .index('by_sender', ['senderId']),
});
```

---

## 3. Створення Convex функцій

### Крок 3.1: Створіть файл `convex/conversations.ts`

```typescript
// convex/conversations.ts

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

// Отримати всі діалоги поточного користувача
export const getConversations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Знаходимо всі діалоги, де користувач є учасником
    const conversationsAsOne = await ctx.db
      .query('conversations')
      .withIndex('by_participant_one', (q) => q.eq('participantOneId', userId))
      .collect();

    const conversationsAsTwo = await ctx.db
      .query('conversations')
      .withIndex('by_participant_two', (q) => q.eq('participantTwoId', userId))
      .collect();

    const allConversations = [...conversationsAsOne, ...conversationsAsTwo];

    // Сортуємо за часом останнього повідомлення
    allConversations.sort((a, b) => {
      const timeA = a.lastMessageTime || a._creationTime;
      const timeB = b.lastMessageTime || b._creationTime;
      return timeB - timeA;
    });

    // Додаємо інформацію про співрозмовника та останнє повідомлення
    const conversationsWithDetails = await Promise.all(
      allConversations.map(async (conversation) => {
        const otherUserId =
          conversation.participantOneId === userId
            ? conversation.participantTwoId
            : conversation.participantOneId;

        const otherUser = await ctx.db.get(otherUserId);

        let lastMessage = null;
        if (conversation.lastMessageId) {
          lastMessage = await ctx.db.get(conversation.lastMessageId);
        }

        // Підрахунок непрочитаних повідомлень
        const unreadMessages = await ctx.db
          .query('messages')
          .withIndex('by_conversation', (q) => q.eq('conversationId', conversation._id))
          .filter((q) => q.and(q.eq(q.field('isRead'), false), q.neq(q.field('senderId'), userId)))
          .collect();

        return {
          ...conversation,
          otherUser: otherUser
            ? {
                _id: otherUser._id,
                username: otherUser.username,
                fullname: otherUser.fullname,
                image: otherUser.image,
              }
            : null,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                imageUrl: lastMessage.imageUrl,
                senderId: lastMessage.senderId,
                _creationTime: lastMessage._creationTime,
              }
            : null,
          unreadCount: unreadMessages.length,
        };
      })
    );

    return conversationsWithDetails;
  },
});

// Отримати або створити діалог з користувачем
export const getOrCreateConversation = mutation({
  args: { otherUserId: v.id('users') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    // Перевіряємо, чи існує діалог
    const existingConversation1 = await ctx.db
      .query('conversations')
      .withIndex('by_participants', (q) =>
        q.eq('participantOneId', userId).eq('participantTwoId', args.otherUserId)
      )
      .first();

    if (existingConversation1) return existingConversation1._id;

    const existingConversation2 = await ctx.db
      .query('conversations')
      .withIndex('by_participants', (q) =>
        q.eq('participantOneId', args.otherUserId).eq('participantTwoId', userId)
      )
      .first();

    if (existingConversation2) return existingConversation2._id;

    // Створюємо новий діалог
    const conversationId = await ctx.db.insert('conversations', {
      participantOneId: userId,
      participantTwoId: args.otherUserId,
    });

    return conversationId;
  },
});

// Отримати деталі діалогу
export const getConversation = query({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;

    // Перевіряємо, чи користувач є учасником
    if (conversation.participantOneId !== userId && conversation.participantTwoId !== userId) {
      return null;
    }

    const otherUserId =
      conversation.participantOneId === userId
        ? conversation.participantTwoId
        : conversation.participantOneId;

    const otherUser = await ctx.db.get(otherUserId);

    return {
      ...conversation,
      otherUser: otherUser
        ? {
            _id: otherUser._id,
            username: otherUser.username,
            fullname: otherUser.fullname,
            image: otherUser.image,
          }
        : null,
    };
  },
});
```

### Крок 3.2: Створіть файл `convex/messages.ts`

```typescript
// convex/messages.ts

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

// Отримати повідомлення діалогу
export const getMessages = query({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Перевіряємо доступ до діалогу
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return [];

    if (conversation.participantOneId !== userId && conversation.participantTwoId !== userId) {
      return [];
    }

    const messages = await ctx.db
      .query('messages')
      .withIndex('by_conversation', (q) => q.eq('conversationId', args.conversationId))
      .order('asc')
      .collect();

    // Додаємо інформацію про відправника
    const messagesWithSender = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return {
          ...message,
          sender: sender
            ? {
                _id: sender._id,
                username: sender.username,
                image: sender.image,
              }
            : null,
          isOwn: message.senderId === userId,
        };
      })
    );

    return messagesWithSender;
  },
});

// Відправити текстове повідомлення
export const sendMessage = mutation({
  args: {
    conversationId: v.id('conversations'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    // Перевіряємо доступ до діалогу
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error('Conversation not found');

    if (conversation.participantOneId !== userId && conversation.participantTwoId !== userId) {
      throw new Error('Access denied');
    }

    // Створюємо повідомлення
    const messageId = await ctx.db.insert('messages', {
      conversationId: args.conversationId,
      senderId: userId,
      content: args.content,
      isRead: false,
    });

    // Оновлюємо діалог
    await ctx.db.patch(args.conversationId, {
      lastMessageId: messageId,
      lastMessageTime: Date.now(),
    });

    return messageId;
  },
});

// Відправити зображення
export const sendImageMessage = mutation({
  args: {
    conversationId: v.id('conversations'),
    storageId: v.id('_storage'),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    // Перевіряємо доступ до діалогу
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error('Conversation not found');

    if (conversation.participantOneId !== userId && conversation.participantTwoId !== userId) {
      throw new Error('Access denied');
    }

    // Створюємо повідомлення з зображенням
    const messageId = await ctx.db.insert('messages', {
      conversationId: args.conversationId,
      senderId: userId,
      imageUrl: args.imageUrl,
      storageId: args.storageId,
      isRead: false,
    });

    // Оновлюємо діалог
    await ctx.db.patch(args.conversationId, {
      lastMessageId: messageId,
      lastMessageTime: Date.now(),
    });

    return messageId;
  },
});

// Позначити повідомлення як прочитані
export const markAsRead = mutation({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const unreadMessages = await ctx.db
      .query('messages')
      .withIndex('by_conversation', (q) => q.eq('conversationId', args.conversationId))
      .filter((q) => q.and(q.eq(q.field('isRead'), false), q.neq(q.field('senderId'), userId)))
      .collect();

    await Promise.all(unreadMessages.map((message) => ctx.db.patch(message._id, { isRead: true })));

    return unreadMessages.length;
  },
});

// Генерація URL для завантаження зображення
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    return await ctx.storage.generateUploadUrl();
  },
});
```

---

## 4. Створення компонентів UI

### Крок 4.1: Створіть файл `components/ConversationItem.tsx`

```tsx
// components/ConversationItem.tsx

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import { COLORS } from '@/constants/theme';
import { Id } from '@/convex/_generated/dataModel';

interface ConversationItemProps {
  conversation: {
    _id: Id<'conversations'>;
    otherUser: {
      _id: Id<'users'>;
      username: string;
      fullname: string;
      image: string;
    } | null;
    lastMessage: {
      content?: string;
      imageUrl?: string;
      senderId: Id<'users'>;
      _creationTime: number;
    } | null;
    unreadCount: number;
    lastMessageTime?: number;
    _creationTime: number;
  };
  onPress: () => void;
}

export const ConversationItem = ({ conversation, onPress }: ConversationItemProps) => {
  const { otherUser, lastMessage, unreadCount } = conversation;

  if (!otherUser) return null;

  const getLastMessagePreview = () => {
    if (!lastMessage) return 'Почніть розмову';
    if (lastMessage.imageUrl) return '📷 Фото';
    return lastMessage.content || '';
  };

  const getTime = () => {
    const time = conversation.lastMessageTime || conversation._creationTime;
    return formatDistanceToNow(time, { addSuffix: true, locale: uk });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={otherUser.image} style={styles.avatar} contentFit="cover" transition={200} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.username} numberOfLines={1}>
            {otherUser.username}
          </Text>
          <Text style={styles.time}>{getTime()}</Text>
        </View>

        <View style={styles.messageRow}>
          <Text
            style={[styles.lastMessage, unreadCount > 0 && styles.unreadMessage]}
            numberOfLines={1}
          >
            {getLastMessagePreview()}
          </Text>

          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.background,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.grey,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: COLORS.grey,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.grey,
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {
    color: COLORS.white,
    fontWeight: '500',
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
});
```

### Крок 4.2: Створіть файл `components/MessageBubble.tsx`

```tsx
// components/MessageBubble.tsx

import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { format } from 'date-fns';
import { COLORS } from '@/constants/theme';
import { Id } from '@/convex/_generated/dataModel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_BUBBLE_WIDTH = SCREEN_WIDTH * 0.75;

interface MessageBubbleProps {
  message: {
    _id: Id<'messages'>;
    content?: string;
    imageUrl?: string;
    isOwn: boolean;
    isRead: boolean;
    _creationTime: number;
    sender: {
      _id: Id<'users'>;
      username: string;
      image: string;
    } | null;
  };
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const { isOwn, content, imageUrl, _creationTime, isRead } = message;

  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      {!isOwn && message.sender && (
        <Image source={message.sender.image} style={styles.avatar} contentFit="cover" />
      )}

      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        {imageUrl && (
          <Image source={imageUrl} style={styles.image} contentFit="cover" transition={200} />
        )}

        {content && (
          <Text style={[styles.text, isOwn ? styles.ownText : styles.otherText]}>{content}</Text>
        )}

        <View style={styles.footer}>
          <Text style={[styles.time, isOwn ? styles.ownTime : styles.otherTime]}>
            {format(_creationTime, 'HH:mm')}
          </Text>
          {isOwn && <Text style={styles.readStatus}>{isRead ? '✓✓' : '✓'}</Text>}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  ownContainer: {
    justifyContent: 'flex-end',
  },
  otherContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  bubble: {
    maxWidth: MAX_BUBBLE_WIDTH,
    borderRadius: 16,
    padding: 12,
  },
  ownBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: COLORS.grey,
    borderBottomLeftRadius: 4,
  },
  image: {
    width: MAX_BUBBLE_WIDTH - 24,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownText: {
    color: COLORS.white,
  },
  otherText: {
    color: COLORS.white,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  time: {
    fontSize: 11,
  },
  ownTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTime: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  readStatus: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },
});
```

### Крок 4.3: Створіть файл `components/ChatInput.tsx`

```tsx
// components/ChatInput.tsx

import { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '@/constants/theme';

interface ChatInputProps {
  onSendText: (text: string) => Promise<void>;
  onSendImage: (uri: string) => Promise<void>;
  disabled?: boolean;
}

export const ChatInput = ({ onSendText, onSendImage, disabled }: ChatInputProps) => {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendText = async () => {
    if (!text.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendText(text.trim());
      setText('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handlePickImage = async () => {
    if (isSending) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setIsSending(true);
      try {
        await onSendImage(result.assets[0].uri);
      } catch (error) {
        console.error('Error sending image:', error);
      } finally {
        setIsSending(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={handlePickImage}
        disabled={disabled || isSending}
      >
        <Ionicons name="image-outline" size={24} color={COLORS.primary} />
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Повідомлення..."
        placeholderTextColor={COLORS.grey}
        multiline
        maxLength={1000}
        editable={!disabled && !isSending}
      />

      <TouchableOpacity
        style={[styles.sendButton, (!text.trim() || isSending) && styles.sendButtonDisabled]}
        onPress={handleSendText}
        disabled={!text.trim() || disabled || isSending}
      >
        {isSending ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <Ionicons name="send" size={20} color={COLORS.white} />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    backgroundColor: COLORS.background,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.grey,
  },
  iconButton: {
    padding: 8,
    marginRight: 4,
  },
  input: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.white,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
```

---

## 5. Створення екранів

### Крок 5.1: Створіть файл `app/(tabs)/messages.tsx`

```tsx
// app/(tabs)/messages.tsx

import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ConversationItem } from '@/components/ConversationItem';
import { Loader } from '@/components/Loader';
import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function MessagesScreen() {
  const router = useRouter();
  const conversations = useQuery(api.conversations.getConversations);

  if (conversations === undefined) {
    return <Loader />;
  }

  const handleConversationPress = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
  };

  const handleNewMessage = () => {
    // Можна відкрити модальне вікно для вибору користувача
    // або перейти на екран пошуку користувачів
    router.push('/new-chat');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Повідомлення</Text>
        <TouchableOpacity onPress={handleNewMessage}>
          <Ionicons name="create-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={COLORS.grey} />
          <Text style={styles.emptyText}>Немає повідомлень</Text>
          <Text style={styles.emptySubtext}>Почніть спілкуватися з друзями</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ConversationItem
              conversation={item}
              onPress={() => handleConversationPress(item._id)}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.grey,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.grey,
    marginTop: 8,
    textAlign: 'center',
  },
});
```

### Крок 5.2: Створіть файл `app/chat/[id].tsx`

```tsx
// app/chat/[id].tsx

import { useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { MessageBubble } from '@/components/MessageBubble';
import { ChatInput } from '@/components/ChatInput';
import { Loader } from '@/components/Loader';
import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const conversationId = id as Id<'conversations'>;

  const conversation = useQuery(api.conversations.getConversation, {
    conversationId,
  });
  const messages = useQuery(api.messages.getMessages, { conversationId });

  const sendMessage = useMutation(api.messages.sendMessage);
  const sendImageMessage = useMutation(api.messages.sendImageMessage);
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
  const markAsRead = useMutation(api.messages.markAsRead);

  // Позначаємо повідомлення як прочитані при відкритті чату
  useEffect(() => {
    if (conversationId) {
      markAsRead({ conversationId });
    }
  }, [conversationId, messages]);

  // Прокручуємо до останнього повідомлення
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendText = async (text: string) => {
    await sendMessage({
      conversationId,
      content: text,
    });
  };

  const handleSendImage = async (uri: string) => {
    try {
      // Отримуємо URL для завантаження
      const uploadUrl = await generateUploadUrl();

      // Читаємо файл
      const response = await fetch(uri);
      const blob = await response.blob();

      // Завантажуємо на сервер
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': blob.type },
        body: blob,
      });

      const { storageId } = await uploadResponse.json();

      // Отримуємо URL зображення
      const imageUrl = `${process.env.EXPO_PUBLIC_CONVEX_URL}/api/storage/${storageId}`;

      // Відправляємо повідомлення з зображенням
      await sendImageMessage({
        conversationId,
        storageId,
        imageUrl,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  if (conversation === undefined || messages === undefined) {
    return <Loader />;
  }

  if (!conversation) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Діалог не знайдено</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>

        {conversation.otherUser && (
          <TouchableOpacity
            style={styles.userInfo}
            onPress={() => router.push(`/user/${conversation.otherUser?._id}`)}
          >
            <Image source={conversation.otherUser.image} style={styles.avatar} contentFit="cover" />
            <View>
              <Text style={styles.username}>{conversation.otherUser.username}</Text>
              <Text style={styles.fullname}>{conversation.otherUser.fullname}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Input */}
      <ChatInput onSendText={handleSendText} onSendImage={handleSendImage} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.grey,
    paddingTop: 50, // Для safe area
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  fullname: {
    fontSize: 12,
    color: COLORS.grey,
  },
  messagesList: {
    paddingVertical: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    color: COLORS.white,
    fontSize: 16,
  },
});
```

### Крок 5.3: Створіть файл `app/new-chat.tsx` (вибір користувача для нового чату)

```tsx
// app/new-chat.tsx

import { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Image } from 'expo-image';
import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Id } from '@/convex/_generated/dataModel';

export default function NewChatScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Отримуємо список користувачів, на яких підписаний поточний користувач
  const following = useQuery(api.users.getFollowing);
  const getOrCreateConversation = useMutation(api.conversations.getOrCreateConversation);

  const filteredUsers = following?.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.fullname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectUser = async (userId: Id<'users'>) => {
    try {
      const conversationId = await getOrCreateConversation({
        otherUserId: userId,
      });
      router.replace(`/chat/${conversationId}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Новий чат</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.grey} />
        <TextInput
          style={styles.searchInput}
          placeholder="Пошук..."
          placeholderTextColor={COLORS.grey}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.userItem} onPress={() => handleSelectUser(item._id)}>
            <Image source={item.image} style={styles.avatar} contentFit="cover" />
            <View style={styles.userInfo}>
              <Text style={styles.username}>{item.username}</Text>
              <Text style={styles.fullname}>{item.fullname}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Користувачів не знайдено'
                : 'Підпишіться на користувачів, щоб почати спілкування'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.grey,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: COLORS.white,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.grey,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  fullname: {
    fontSize: 14,
    color: COLORS.grey,
    marginTop: 2,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.grey,
    textAlign: 'center',
  },
});
```

---

## 6. Оновлення навігації

### Крок 6.1: Оновіть файл `app/(tabs)/_layout.tsx`

Додайте новий таб для повідомлень:

```tsx
// app/(tabs)/_layout.tsx

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function TabLayout() {
  // Отримуємо кількість непрочитаних повідомлень для badge
  const conversations = useQuery(api.conversations.getConversations);
  const unreadCount = conversations?.reduce((sum, conv) => sum + conv.unreadCount, 0) || 0;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.grey,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.grey,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Головна',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Чати',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: COLORS.primary,
          },
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Створити',
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Сповіщення',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профіль',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
      {/* Приховуємо bookmarks з табів, якщо потрібно */}
      <Tabs.Screen
        name="bookmarks"
        options={{
          href: null, // Приховує з табів
        }}
      />
    </Tabs>
  );
}
```

### Крок 6.2: Оновіть файл `app/_layout.tsx`

Додайте маршрути для чату:

```tsx
// app/_layout.tsx

import { Stack } from 'expo-router';
import { ClerkAndConvexProvider } from '@/providers/ClerkAndConvexProvider';
import { InitialLayout } from '@/components/InitialLayout';

export default function RootLayout() {
  return (
    <ClerkAndConvexProvider>
      <InitialLayout>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="user/[id]" />
          <Stack.Screen name="chat/[id]" />
          <Stack.Screen
            name="new-chat"
            options={{
              presentation: 'modal',
            }}
          />
        </Stack>
      </InitialLayout>
    </ClerkAndConvexProvider>
  );
}
```

---

## 7. Додаткові покращення

### 7.1: Додайте функцію `getFollowing` в `convex/users.ts`

```typescript
// Додайте в convex/users.ts

export const getFollowing = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const follows = await ctx.db
      .query('follows')
      .withIndex('by_follower', (q) => q.eq('followerId', userId))
      .collect();

    const users = await Promise.all(
      follows.map(async (follow) => {
        const user = await ctx.db.get(follow.followingId);
        return user;
      })
    );

    return users.filter(Boolean);
  },
});
```

### 7.2: Кнопка "Написати" на профілі користувача

Додайте в компонент профілю користувача кнопку для початку чату:

```tsx
// В компоненті профілю користувача

const handleMessage = async () => {
  const conversationId = await getOrCreateConversation({ otherUserId: userId });
  router.push(`/chat/${conversationId}`);
};

// В JSX:
<TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
  <Ionicons name="chatbubble-outline" size={20} color={COLORS.white} />
  <Text style={styles.messageButtonText}>Написати</Text>
</TouchableOpacity>;
```

---

## Чек-лист впровадження

- [ ] Оновити `convex/schema.ts` (додати таблиці `conversations` та `messages`)
- [ ] Створити `convex/conversations.ts`
- [ ] Створити `convex/messages.ts`
- [ ] Додати `getFollowing` в `convex/users.ts`
- [ ] Створити `components/ConversationItem.tsx`
- [ ] Створити `components/MessageBubble.tsx`
- [ ] Створити `components/ChatInput.tsx`
- [ ] Створити `app/(tabs)/messages.tsx`
- [ ] Створити `app/chat/[id].tsx`
- [ ] Створити `app/new-chat.tsx`
- [ ] Оновити `app/(tabs)/_layout.tsx`
- [ ] Оновити `app/_layout.tsx`
- [ ] Запустити `npx convex dev` для синхронізації схеми
- [ ] Протестувати функціонал

---

## Можливі проблеми та рішення

### Проблема: Повідомлення не оновлюються в реальному часі

**Рішення:** Convex автоматично підтримує реактивність. Переконайтеся, що використовуєте `useQuery` замість `useMutation` для отримання даних.

### Проблема: Зображення не завантажуються

**Рішення:** Перевірте, чи правильно налаштований `EXPO_PUBLIC_CONVEX_URL` в `.env.local`.

### Проблема: Помилка авторизації

**Рішення:** Переконайтеся, що `getAuthUserId` правильно імпортований та Clerk налаштований.

---

## Наступні кроки

Після впровадження базового функціоналу можна додати:

1. **Push-сповіщення** про нові повідомлення
2. **Typing indicator** (індикатор набору тексту)
3. **Видалення повідомлень**
4. **Групові чати**
5. **Голосові повідомлення**
6. **Реакції на повідомлення**

---
