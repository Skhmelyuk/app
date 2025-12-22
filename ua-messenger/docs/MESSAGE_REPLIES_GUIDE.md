# Гайд: Відповіді на повідомлення (Message Replies)

Цей гайд є продовженням `DIRECT_MESSAGES_GUIDE.md` і описує додавання функціоналу відповіді на конкретне повідомлення в чаті.

---

## Зміст

1. [Огляд функціоналу](#1-огляд-функціоналу)
2. [Оновлення схеми бази даних](#2-оновлення-схеми-бази-даних)
3. [Оновлення Convex функцій](#3-оновлення-convex-функцій)
4. [Створення компонента ReplyPreview](#4-створення-компонента-replypreview)
5. [Оновлення MessageBubble](#5-оновлення-messagebubble)
6. [Оновлення ChatInput](#6-оновлення-chatinput)
7. [Оновлення екрану чату](#7-оновлення-екрану-чату)
8. [Додаткові покращення](#8-додаткові-покращення)

---

## 1. Огляд функціоналу

### Що буде реалізовано:

- **Свайп вправо** на повідомленні для відповіді
- **Довге натискання** для виклику контекстного меню з опцією "Відповісти"
- **Превʼю повідомлення** над полем вводу при відповіді
- **Відображення цитати** в бульбашці повідомлення

### Візуальний приклад:

```
┌─────────────────────────────────────┐
│  ┌─────────────────────────────┐    │
│  │ ↩ Відповідь на: "Як справи?"│    │
│  │ Добре, дякую!               │    │
│  │                       15:39 │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ × Відповідь на: Олександр   │    │
│  │   "Як справи?"              │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ Повідомлення...        [>]  │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

---

## 2. Оновлення схеми бази даних

### Крок 2.1: Оновіть таблицю `messages` в `convex/schema.ts`

Додайте поле `replyToId` для зберігання посилання на повідомлення, на яке відповідають:

```typescript
// convex/schema.ts

import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // ... існуючі таблиці

  // Оновлена таблиця повідомлень (messages)
  messages: defineTable({
    conversationId: v.id('conversations'),
    senderId: v.id('users'),
    content: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    storageId: v.optional(v.id('_storage')),
    isRead: v.boolean(),
    // НОВЕ: посилання на повідомлення, на яке відповідають
    replyToId: v.optional(v.id('messages')),
  })
    .index('by_conversation', ['conversationId'])
    .index('by_sender', ['senderId']),
});
```

---

## 3. Оновлення Convex функцій

### Крок 3.1: Оновіть `convex/messages.ts`

#### 3.1.1: Оновіть функцію `getMessages`

Додайте інформацію про повідомлення, на яке відповідають:

```typescript
// convex/messages.ts

import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

// Отримати повідомлення діалогу (ОНОВЛЕНО)
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

    // Додаємо інформацію про відправника та повідомлення-відповідь
    const messagesWithDetails = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);

        // Отримуємо повідомлення, на яке відповідають
        let replyTo = null;
        if (message.replyToId) {
          const replyMessage = await ctx.db.get(message.replyToId);
          if (replyMessage) {
            const replySender = await ctx.db.get(replyMessage.senderId);
            replyTo = {
              _id: replyMessage._id,
              content: replyMessage.content,
              imageUrl: replyMessage.imageUrl,
              sender: replySender
                ? {
                    _id: replySender._id,
                    username: replySender.username,
                  }
                : null,
            };
          }
        }

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
          replyTo,
        };
      })
    );

    return messagesWithDetails;
  },
});
```

#### 3.1.2: Оновіть функцію `sendMessage`

Додайте підтримку `replyToId`:

```typescript
// Відправити текстове повідомлення (ОНОВЛЕНО)
export const sendMessage = mutation({
  args: {
    conversationId: v.id('conversations'),
    content: v.string(),
    replyToId: v.optional(v.id('messages')), // НОВЕ
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

    // Перевіряємо, чи існує повідомлення для відповіді
    if (args.replyToId) {
      const replyMessage = await ctx.db.get(args.replyToId);
      if (!replyMessage || replyMessage.conversationId !== args.conversationId) {
        throw new Error('Reply message not found');
      }
    }

    // Створюємо повідомлення
    const messageId = await ctx.db.insert('messages', {
      conversationId: args.conversationId,
      senderId: userId,
      content: args.content,
      isRead: false,
      replyToId: args.replyToId, // НОВЕ
    });

    // Оновлюємо діалог
    await ctx.db.patch(args.conversationId, {
      lastMessageId: messageId,
      lastMessageTime: Date.now(),
    });

    return messageId;
  },
});
```

#### 3.1.3: Оновіть функцію `sendImageMessage`

Додайте підтримку `replyToId`:

```typescript
// Відправити зображення (ОНОВЛЕНО)
export const sendImageMessage = mutation({
  args: {
    conversationId: v.id('conversations'),
    storageId: v.id('_storage'),
    imageUrl: v.string(),
    replyToId: v.optional(v.id('messages')), // НОВЕ
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

    // Перевіряємо, чи існує повідомлення для відповіді
    if (args.replyToId) {
      const replyMessage = await ctx.db.get(args.replyToId);
      if (!replyMessage || replyMessage.conversationId !== args.conversationId) {
        throw new Error('Reply message not found');
      }
    }

    // Створюємо повідомлення з зображенням
    const messageId = await ctx.db.insert('messages', {
      conversationId: args.conversationId,
      senderId: userId,
      imageUrl: args.imageUrl,
      storageId: args.storageId,
      isRead: false,
      replyToId: args.replyToId, // НОВЕ
    });

    // Оновлюємо діалог
    await ctx.db.patch(args.conversationId, {
      lastMessageId: messageId,
      lastMessageTime: Date.now(),
    });

    return messageId;
  },
});
```

---

## 4. Створення компонента ReplyPreview

### Крок 4.1: Створіть файл `components/ReplyPreview.tsx`

Цей компонент відображається над полем вводу при відповіді на повідомлення:

```tsx
// components/ReplyPreview.tsx

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { Id } from '@/convex/_generated/dataModel';

interface ReplyPreviewProps {
  replyTo: {
    _id: Id<'messages'>;
    content?: string;
    imageUrl?: string;
    sender: {
      _id: Id<'users'>;
      username: string;
    } | null;
  };
  onCancel: () => void;
}

export const ReplyPreview = ({ replyTo, onCancel }: ReplyPreviewProps) => {
  const getPreviewText = () => {
    if (replyTo.imageUrl) return '📷 Фото';
    return replyTo.content || '';
  };

  return (
    <View style={styles.container}>
      <View style={styles.indicator} />

      <View style={styles.content}>
        <Text style={styles.replyingTo}>
          Відповідь для{' '}
          <Text style={styles.username}>{replyTo.sender?.username || 'Користувач'}</Text>
        </Text>
        <Text style={styles.messagePreview} numberOfLines={1}>
          {getPreviewText()}
        </Text>
      </View>

      <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
        <Ionicons name="close" size={20} color={COLORS.grey} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.grey,
  },
  indicator: {
    width: 3,
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginRight: 10,
  },
  content: {
    flex: 1,
  },
  replyingTo: {
    fontSize: 12,
    color: COLORS.grey,
  },
  username: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  messagePreview: {
    fontSize: 14,
    color: COLORS.white,
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
});
```

---

## 5. Оновлення MessageBubble

### Крок 5.1: Оновіть файл `components/MessageBubble.tsx`

Додайте відображення цитати та підтримку свайпу/довгого натискання:

```tsx
// components/MessageBubble.tsx

import { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  PanResponder,
} from 'react-native';
import { Image } from 'expo-image';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/theme';
import { Id } from '@/convex/_generated/dataModel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_BUBBLE_WIDTH = SCREEN_WIDTH * 0.75;
const SWIPE_THRESHOLD = 60;

interface ReplyToType {
  _id: Id<'messages'>;
  content?: string;
  imageUrl?: string;
  sender: {
    _id: Id<'users'>;
    username: string;
  } | null;
}

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
    replyTo?: ReplyToType | null;
  };
  onReply?: (message: MessageBubbleProps['message']) => void;
  onScrollToMessage?: (messageId: Id<'messages'>) => void;
}

export const MessageBubble = ({ message, onReply, onScrollToMessage }: MessageBubbleProps) => {
  const { isOwn, content, imageUrl, _creationTime, isRead, replyTo } = message;

  // Анімація для свайпу
  const translateX = useRef(new Animated.Value(0)).current;
  const replyIconOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Активуємо тільки для горизонтального свайпу вправо
        return gestureState.dx > 10 && Math.abs(gestureState.dy) < 20;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0 && gestureState.dx <= SWIPE_THRESHOLD) {
          translateX.setValue(gestureState.dx);
          replyIconOpacity.setValue(gestureState.dx / SWIPE_THRESHOLD);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx >= SWIPE_THRESHOLD && onReply) {
          // Викликаємо функцію відповіді
          onReply(message);
        }

        // Повертаємо на місце
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }),
          Animated.timing(replyIconOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      },
    })
  ).current;

  const handleLongPress = () => {
    if (onReply) {
      onReply(message);
    }
  };

  const handleReplyPress = () => {
    if (replyTo && onScrollToMessage) {
      onScrollToMessage(replyTo._id);
    }
  };

  const getReplyPreviewText = () => {
    if (!replyTo) return '';
    if (replyTo.imageUrl) return '📷 Фото';
    return replyTo.content || '';
  };

  return (
    <View style={[styles.wrapper, isOwn ? styles.ownWrapper : styles.otherWrapper]}>
      {/* Іконка відповіді при свайпі */}
      <Animated.View
        style={[
          styles.replyIconContainer,
          {
            opacity: replyIconOpacity,
            transform: [{ scale: replyIconOpacity }],
          },
        ]}
      >
        <Ionicons name="arrow-undo" size={20} color={COLORS.primary} />
      </Animated.View>

      <Animated.View
        style={[
          styles.container,
          isOwn ? styles.ownContainer : styles.otherContainer,
          { transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        {!isOwn && message.sender && (
          <Image source={message.sender.image} style={styles.avatar} contentFit="cover" />
        )}

        <TouchableOpacity
          style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}
          onLongPress={handleLongPress}
          delayLongPress={300}
          activeOpacity={0.8}
        >
          {/* Цитата повідомлення, на яке відповідають */}
          {replyTo && (
            <TouchableOpacity style={styles.replyContainer} onPress={handleReplyPress}>
              <View style={styles.replyIndicator} />
              <View style={styles.replyContent}>
                <Text style={styles.replyUsername}>{replyTo.sender?.username || 'Користувач'}</Text>
                <Text style={styles.replyText} numberOfLines={1}>
                  {getReplyPreviewText()}
                </Text>
              </View>
            </TouchableOpacity>
          )}

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
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    paddingHorizontal: 12,
  },
  ownWrapper: {
    justifyContent: 'flex-end',
  },
  otherWrapper: {
    justifyContent: 'flex-start',
  },
  replyIconContainer: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 149, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    maxWidth: MAX_BUBBLE_WIDTH,
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
    borderRadius: 16,
    padding: 12,
    maxWidth: MAX_BUBBLE_WIDTH - 40,
  },
  ownBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#333',
    borderBottomLeftRadius: 4,
  },
  // Стилі для цитати
  replyContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  replyIndicator: {
    width: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyUsername: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 2,
  },
  replyText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  image: {
    width: MAX_BUBBLE_WIDTH - 64,
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

---

## 6. Оновлення ChatInput

### Крок 6.1: Оновіть файл `components/ChatInput.tsx`

Додайте підтримку `replyToId`:

```tsx
// components/ChatInput.tsx

import { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '@/constants/theme';
import { Id } from '@/convex/_generated/dataModel';

interface ChatInputProps {
  onSendText: (text: string, replyToId?: Id<'messages'>) => Promise<void>;
  onSendImage: (uri: string, replyToId?: Id<'messages'>) => Promise<void>;
  replyToId?: Id<'messages'>;
  disabled?: boolean;
}

export const ChatInput = ({ onSendText, onSendImage, replyToId, disabled }: ChatInputProps) => {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendText = async () => {
    if (!text.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendText(text.trim(), replyToId);
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
        await onSendImage(result.assets[0].uri, replyToId);
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

## 7. Оновлення екрану чату

### Крок 7.1: Оновіть файл `app/chat/[id].tsx`

Повна версія з підтримкою відповідей:

```tsx
// app/chat/[id].tsx

import { useEffect, useRef, useState, useCallback } from 'react';
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
import { ReplyPreview } from '@/components/ReplyPreview';
import { Loader } from '@/components/Loader';
import { COLORS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

// Тип для повідомлення
interface MessageType {
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
  replyTo?: {
    _id: Id<'messages'>;
    content?: string;
    imageUrl?: string;
    sender: {
      _id: Id<'users'>;
      username: string;
    } | null;
  } | null;
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  // Стан для відповіді на повідомлення
  const [replyTo, setReplyTo] = useState<MessageType | null>(null);

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

  // Обробник відповіді на повідомлення
  const handleReply = useCallback((message: MessageType) => {
    setReplyTo(message);
  }, []);

  // Скасування відповіді
  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  // Прокрутка до повідомлення при натисканні на цитату
  const handleScrollToMessage = useCallback(
    (messageId: Id<'messages'>) => {
      if (!messages) return;

      const index = messages.findIndex((m) => m._id === messageId);
      if (index !== -1) {
        flatListRef.current?.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5,
        });
      }
    },
    [messages]
  );

  const handleSendText = async (text: string, replyToId?: Id<'messages'>) => {
    await sendMessage({
      conversationId,
      content: text,
      replyToId,
    });
    setReplyTo(null); // Скидаємо відповідь після відправки
  };

  const handleSendImage = async (uri: string, replyToId?: Id<'messages'>) => {
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
        replyToId,
      });

      setReplyTo(null); // Скидаємо відповідь після відправки
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
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            onReply={handleReply}
            onScrollToMessage={handleScrollToMessage}
          />
        )}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        onScrollToIndexFailed={(info) => {
          // Обробка помилки прокрутки
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
            });
          }, 100);
        }}
      />

      {/* Reply Preview */}
      {replyTo && (
        <ReplyPreview
          replyTo={{
            _id: replyTo._id,
            content: replyTo.content,
            imageUrl: replyTo.imageUrl,
            sender: replyTo.sender,
          }}
          onCancel={handleCancelReply}
        />
      )}

      {/* Input */}
      <ChatInput
        onSendText={handleSendText}
        onSendImage={handleSendImage}
        replyToId={replyTo?._id}
      />
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
    paddingTop: 50,
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

---

## 8. Додаткові покращення

### 8.1: Вібрація при свайпі

Додайте тактильний відгук при активації відповіді:

```tsx
// В MessageBubble.tsx

import * as Haptics from 'expo-haptics';

// В onPanResponderRelease:
if (gestureState.dx >= SWIPE_THRESHOLD && onReply) {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  onReply(message);
}
```

### 8.2: Підсвічування повідомлення при прокрутці

Додайте анімацію підсвічування при переході до цитованого повідомлення:

```tsx
// В MessageBubble.tsx

const [isHighlighted, setIsHighlighted] = useState(false);

// Додайте prop highlightedMessageId та перевіряйте:
useEffect(() => {
  if (highlightedMessageId === message._id) {
    setIsHighlighted(true);
    setTimeout(() => setIsHighlighted(false), 1500);
  }
}, [highlightedMessageId]);

// В стилях bubble:
<View style={[
  styles.bubble,
  isOwn ? styles.ownBubble : styles.otherBubble,
  isHighlighted && styles.highlightedBubble,
]}>

// Стиль:
highlightedBubble: {
  backgroundColor: 'rgba(0, 149, 246, 0.3)',
}
```

### 8.3: Контекстне меню з додатковими опціями

```tsx
// Використовуйте react-native-context-menu-view або власне модальне вікно

import ContextMenu from 'react-native-context-menu-view';

<ContextMenu
  actions={[
    { title: 'Відповісти', systemIcon: 'arrowshape.turn.up.left' },
    { title: 'Копіювати', systemIcon: 'doc.on.doc' },
    { title: 'Видалити', systemIcon: 'trash', destructive: true },
  ]}
  onPress={(e) => {
    if (e.nativeEvent.name === 'Відповісти') {
      onReply?.(message);
    }
    // ... інші дії
  }}
>
  {/* Bubble content */}
</ContextMenu>;
```

---

## Чек-лист впровадження

- [ ] Оновити `convex/schema.ts` (додати `replyToId` в таблицю `messages`)
- [ ] Оновити `convex/messages.ts`:
  - [ ] Оновити `getMessages` для отримання `replyTo`
  - [ ] Оновити `sendMessage` з підтримкою `replyToId`
  - [ ] Оновити `sendImageMessage` з підтримкою `replyToId`
- [ ] Створити `components/ReplyPreview.tsx`
- [ ] Оновити `components/MessageBubble.tsx`:
  - [ ] Додати відображення цитати
  - [ ] Додати свайп для відповіді
  - [ ] Додати довге натискання
- [ ] Оновити `components/ChatInput.tsx` (підтримка `replyToId`)
- [ ] Оновити `app/chat/[id].tsx`:
  - [ ] Додати стан `replyTo`
  - [ ] Додати `ReplyPreview`
  - [ ] Передати props в `MessageBubble`
- [ ] Запустити `npx convex dev` для синхронізації схеми
- [ ] Встановити залежності (якщо потрібно):
  - [ ] `expo install expo-haptics`
- [ ] Протестувати функціонал

---

## Можливі проблеми та рішення

### Проблема: Свайп конфліктує з прокруткою списку

**Рішення:** Налаштуйте `onMoveShouldSetPanResponder` для активації тільки при горизонтальному русі:

```tsx
onMoveShouldSetPanResponder: (_, gestureState) => {
  return gestureState.dx > 10 && Math.abs(gestureState.dy) < 20;
};
```

### Проблема: Помилка при прокрутці до повідомлення

**Рішення:** Додайте обробник `onScrollToIndexFailed`:

```tsx
onScrollToIndexFailed={(info) => {
  setTimeout(() => {
    flatListRef.current?.scrollToIndex({
      index: info.index,
      animated: true,
    });
  }, 100);
}}
```

### Проблема: Цитата не відображається для старих повідомлень

**Рішення:** Переконайтеся, що схема оновлена та виконано міграцію даних.

---

## Наступні кроки

Після впровадження відповідей можна додати:

1. **Пересилання повідомлень** в інші чати
2. **Редагування повідомлень**
3. **Видалення повідомлень**
4. **Реакції на повідомлення** (емодзі)
5. **Голосові повідомлення**

---
