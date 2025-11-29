# Групове завдання v3: Створення твітів з зображеннями

## Опис завдання

Продовжити розробку мобільного додатку **X (Twitter) Clone**, додавши функціонал створення твітів з зображеннями, який ми реалізували на уроці.

---

## Що ми робили на уроці (і що потрібно повторити)

### ✅ Частина 1: Backend — Convex Mutations для постів

- Створення `convex/posts.ts` з двома mutations:
  - `generateUploadUrl` — генерація URL для завантаження файлу
  - `createPost` — створення посту в базі даних

### ✅ Частина 2: Стилізація екрану створення

- Створення `styles/create.styles.ts`
- Використання `Dimensions` для квадратного зображення
- Стилі для header, image section, input section

### ✅ Частина 3: Встановлення залежностей

- `expo-image-picker` — вибір зображень з галереї
- `expo-file-system` — робота з файлами
- `expo-image` — оптимізоване відображення зображень

### ✅ Частина 4: Frontend — Create Screen

- Вибір зображення через `ImagePicker`
- Завантаження файлу на Convex Storage
- Створення посту з caption
- Обробка стану завантаження

---

## Формат роботи

|                             |                                  |
| --------------------------- | -------------------------------- |
| **Тип завдання**            | Групове                          |
| **Розмір команди**          | 4 особи                          |
| **Система контролю версій** | GitHub                           |
| **Методологія**             | Feature branches + Pull Requests |

---

## Розподіл ролей у команді

### 👨‍💼 Team Lead / Backend Developer

**Що робить (як на уроці):**

- Створює `convex/posts.ts` з mutations
- Координує роботу команди
- Мержить Pull Requests

**Файли:**

- `convex/posts.ts`

**Код для `convex/posts.ts`:**

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Генерація URL для завантаження файлу
export const generateUploadUrl = mutation(async (ctx) => {
  // Перевірка автентифікації
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  
  // Генерація підписаного URL (дійсний ~1 годину)
  return await ctx.storage.generateUploadUrl();
});

// Створення посту в базі даних
export const createPost = mutation({
  args: {
    caption: v.optional(v.string()),    // Текст твіту (необов'язковий)
    storageId: v.id("_storage"),        // ID файлу в Storage
  },
  handler: async (ctx, args) => {
    // 1. Перевірка автентифікації
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // 2. Пошук користувача в БД
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!currentUser) throw new Error("User not found");

    // 3. Отримання публічного URL зображення
    const imageUrl = await ctx.storage.getUrl(args.storageId);
    if (!imageUrl) throw new Error("Image URL not found");

    // 4. Створення посту
    const postId = await ctx.db.insert("posts", {
      userId: currentUser._id,
      imageUrl,
      storageId: args.storageId,
      caption: args.caption,
      likes: 0,
      comments: 0,
    });

    // 5. Оновлення лічильника постів користувача
    await ctx.db.patch(currentUser._id, {
      posts: currentUser.posts + 1,
    });
    
    return postId;
  },
});
```

---

### 🎨 Styles Developer

**Що робить (як на уроці):**

- Створює `styles/create.styles.ts`
- Налаштовує стилі для всіх елементів екрану

**Файли:**

- `styles/create.styles.ts`

**Код для `styles/create.styles.ts`:**

```typescript
import { StyleSheet, Dimensions } from "react-native";
import { COLORS } from "@/constants/theme";

// Отримуємо ширину екрану для квадратного зображення
const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  // ========== КОНТЕЙНЕРИ ==========
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentDisabled: {
    opacity: 0.7,
  },

  // ========== HEADER ==========
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.white,
  },

  // ========== КНОПКА SHARE ==========
  shareButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  shareButtonDisabled: {
    opacity: 0.5,
  },
  shareText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  shareTextDisabled: {
    color: COLORS.grey,
  },

  // ========== СТАН БЕЗ ЗОБРАЖЕННЯ ==========
  emptyImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  emptyImageText: {
    color: COLORS.grey,
    fontSize: 16,
  },

  // ========== СЕКЦІЯ ЗОБРАЖЕННЯ ==========
  imageSection: {
    width: width,
    height: width,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  changeImageButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    gap: 6,
  },
  changeImageText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "500",
  },

  // ========== СЕКЦІЯ ВВОДУ ==========
  inputSection: {
    padding: 16,
    flex: 1,
  },
  captionContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  captionInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 16,
    paddingTop: 8,
    minHeight: 40,
  },
});
```

---

### 📦 Dependencies Developer

**Що робить (як на уроці):**

- Встановлює необхідні залежності
- Перевіряє що все працює

**Команди:**

```bash
# 1. Expo Image Picker — вибір зображень
npx expo install expo-image-picker

# 2. Expo File System — робота з файлами
npx expo install expo-file-system

# 3. Expo Image — оптимізоване відображення
npx expo install expo-image
```

**Перевірка імпортів:**

```typescript
// Перевірте що ці імпорти працюють без помилок
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { fetch } from "expo/fetch";
import { Image } from "expo-image";
```

---

### 🖥️ UI Developer

**Що робить (як на уроці):**

- Створює/оновлює `app/(tabs)/create.tsx`
- Реалізує вибір зображення
- Реалізує завантаження та створення посту

**Файли:**

- `app/(tabs)/create.tsx`

**Код для `app/(tabs)/create.tsx`:**

```typescript
import { 
  View, 
  Text, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator, 
  ScrollView, 
  TextInput 
} from "react-native";
import { styles } from "@/styles/create.styles";
import { useUser } from "@clerk/clerk-react";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { File } from "expo-file-system";
import { fetch } from "expo/fetch";

export default function CreateScreen() {
  const router = useRouter();
  const { user } = useUser();
  
  // Стан компонента
  const [caption, setCaption] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  // Convex mutations
  const generateUploadUrl = useMutation(api.posts.generateUploadUrl);
  const createPost = useMutation(api.posts.createPost);

  // Вибір зображення з галереї
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  // Публікація посту
  const handleShare = async () => {
    if (!selectedImage) return;

    try {
      setIsSharing(true);

      // 1. Отримуємо URL для завантаження
      const uploadUrl = await generateUploadUrl();

      // 2. Створюємо File з локального URI
      const file = new File(selectedImage);

      // 3. Завантажуємо файл
      const uploadResult = await fetch(uploadUrl, {
        method: "POST",
        body: file,
        headers: {
          "Content-Type": "image/jpeg",
        },
      });

      if (!uploadResult.ok) throw new Error("Upload failed");

      // 4. Отримуємо storageId та створюємо пост
      const { storageId } = await uploadResult.json();
      await createPost({ storageId, caption });

      // 5. Скидаємо форму та переходимо на головну
      setSelectedImage(null);
      setCaption("");
      router.push("/(tabs)");
      
    } catch (error) {
      console.error("Error sharing post:", error);
    } finally {
      setIsSharing(false);
    }
  };

  // Рендер: стан без зображення
  if (!selectedImage) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Post</Text>
          <View style={{ width: 28 }} />
        </View>

        <TouchableOpacity style={styles.emptyImageContainer} onPress={pickImage}>
          <Ionicons name="image-outline" size={48} color={COLORS.grey} />
          <Text style={styles.emptyImageText}>Tap to select an image</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Рендер: стан із зображенням
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 30}
    >
      <View style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              setSelectedImage(null);
              setCaption("");
            }}
            disabled={isSharing}
          >
            <Ionicons
              name="close-outline"
              size={28}
              color={isSharing ? COLORS.grey : COLORS.white}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Post</Text>
          <TouchableOpacity
            style={[styles.shareButton, isSharing && styles.shareButtonDisabled]}
            disabled={isSharing || !selectedImage}
            onPress={handleShare}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.shareText}>Share</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.content, isSharing && styles.contentDisabled]}>
            {/* Image Section */}
            <View style={styles.imageSection}>
              <Image
                source={selectedImage}
                style={styles.previewImage}
                contentFit="cover"
                transition={200}
              />
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={pickImage}
                disabled={isSharing}
              >
                <Ionicons name="image-outline" size={20} color={COLORS.white} />
                <Text style={styles.changeImageText}>Change</Text>
              </TouchableOpacity>
            </View>

            {/* Input Section */}
            <View style={styles.inputSection}>
              <View style={styles.captionContainer}>
                <Image
                  source={user?.imageUrl}
                  style={styles.userAvatar}
                  contentFit="cover"
                  transition={200}
                />
                <TextInput
                  style={styles.captionInput}
                  placeholder="Write a caption..."
                  placeholderTextColor={COLORS.grey}
                  multiline
                  value={caption}
                  onChangeText={setCaption}
                  editable={!isSharing}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
```

---

## Робота з GitHub

### Крок 1: Оновити локальний репозиторій

```bash
cd x-clone
git checkout main
git pull origin main
```

### Крок 2: Створити нові гілки

```bash
# Team Lead / Backend
git checkout -b feature/posts-mutations

# Styles Developer
git checkout -b feature/create-styles

# Dependencies Developer
git checkout -b feature/dependencies

# UI Developer
git checkout -b feature/create-screen
```

### Крок 3: Після завершення роботи

```bash
git add .
git commit -m "feat: add create post functionality"
git push origin feature/create-screen
```

### Крок 4: Pull Request

1. Створити PR на GitHub
2. Team Lead робить review та merge

---

## Порядок виконання

```
┌─────────────────────────────────────────────────────────────┐
│              Паралельна робота                               │
├───────────────┬───────────────┬───────────────┬─────────────┤
│  Team Lead    │ Styles Dev    │ Dependencies  │ UI Developer│
│               │               │               │             │
│  • posts.ts   │  • create.    │  • expo-image │  • create.  │
│  • mutations  │    styles.ts  │    -picker    │    tsx      │
│               │               │  • expo-file  │  • pickImage│
│               │               │    -system    │  • handleShare
│               │               │  • expo-image │             │
└───────────────┴───────────────┴───────────────┴─────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Інтеграція                                │
│         Team Lead мержить всі гілки                         │
│         Команда тестує створення постів                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Що має працювати в кінці

### ✅ Обов'язково:

1. **Екран Create** — відкривається з табу
2. **Вибір зображення** — натискаємо → відкривається галерея → вибираємо фото
3. **Превью зображення** — вибране фото відображається на екрані
4. **Зміна зображення** — кнопка "Change" дозволяє вибрати інше фото
5. **Введення тексту** — можна написати caption
6. **Кнопка Share** — публікує пост
7. **Індикатор завантаження** — показується під час публікації
8. **Редірект** — після публікації переходимо на головну
9. **Пост в БД** — з'являється в таблиці `posts` в Convex Dashboard

---

## Структура проєкту (оновлена)

```
x-clone/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (auth)/
│   │   └── login.tsx
│   └── (tabs)/
│       ├── _layout.tsx
│       ├── index.tsx
│       ├── create.tsx            # ОНОВЛЕНИЙ ФАЙЛ
│       ├── notifications.tsx
│       └── profile.tsx
├── components/
│   └── InitialLayout.tsx
├── providers/
│   └── ClerkAndConvexProvider.tsx
├── constants/
│   └── theme.ts
├── styles/
│   ├── auth.styles.ts
│   └── create.styles.ts          # НОВИЙ ФАЙЛ
├── convex/
│   ├── auth.config.ts
│   ├── schema.ts
│   ├── users.ts
│   ├── http.ts
│   └── posts.ts                  # НОВИЙ ФАЙЛ
├── assets/
│   └── images/
└── .env
```

---

## Критерії оцінювання

### Оцінка команди (спільна)

| Критерій                                    | Бали    |
| ------------------------------------------- | ------- |
| **Backend (Convex)**                        |         |
| `posts.ts` створено                         | 5       |
| `generateUploadUrl` mutation працює         | 10      |
| `createPost` mutation працює                | 15      |
| Перевірка автентифікації в mutations        | 5       |
| Оновлення лічильника постів користувача     | 5       |
| **Стилі**                                   |         |
| `create.styles.ts` створено                 | 5       |
| Стилі для header                            | 5       |
| Стилі для image section                     | 5       |
| Стилі для input section                     | 5       |
| **Залежності**                              |         |
| `expo-image-picker` встановлено             | 5       |
| `expo-file-system` встановлено              | 5       |
| `expo-image` встановлено                    | 5       |
| **UI (Create Screen)**                      |         |
| Екран без зображення відображається         | 5       |
| `pickImage` працює (вибір з галереї)        | 10      |
| Превью зображення відображається            | 5       |
| `handleShare` працює (завантаження + пост)  | 10      |
| `ActivityIndicator` під час завантаження    | 5       |
| Редірект після публікації                   | 5       |
| **Всього**                                  | **115** |

> **Примітка:** Максимум 100 балів. Додаткові 15 балів — бонус за якість.

### Оцінка роботи з GitHub (обов'язково)

| Критерій                     | Так/Ні |
| ---------------------------- | ------ |
| Використано feature branches | ☐      |
| Є Pull Requests              | ☐      |
| Коміти мають зрозумілі назви | ☐      |

> Якщо GitHub не використано — **мінус 20 балів**

---

## Тестування

### Як перевірити, що все працює:

1. **Запустити додаток** — `npm start`
2. **Увійти** через Google OAuth
3. **Перейти на таб Create**
4. **Вибрати фото** з галереї
5. **Написати caption** (необов'язково)
6. **Натиснути Share**
7. **Перевірити Convex Dashboard** — таблиця `posts` має містити новий запис

### Можливі помилки:

| Помилка | Причина | Рішення |
|---------|---------|---------|
| `Unauthorized` | Користувач не автентифікований | Перевірте ClerkProvider та ConvexProviderWithClerk |
| `User not found` | Користувач не створений в Convex | Перевірте Webhook (v2 завдання) |
| `Upload failed` | Помилка завантаження файлу | Перевірте generateUploadUrl та Content-Type |
| `Image URL not found` | storageId невалідний | Перевірте що файл завантажився успішно |

---

## Чек-лист перед здачею

### Team Lead / Backend Developer

- [ ] `convex/posts.ts` створено
- [ ] `generateUploadUrl` mutation працює
- [ ] `createPost` mutation працює
- [ ] Перевірка автентифікації додана
- [ ] Лічильник постів оновлюється
- [ ] Всі гілки змержені в `main`

### Styles Developer

- [ ] `styles/create.styles.ts` створено
- [ ] Стилі для container, header
- [ ] Стилі для emptyImageContainer
- [ ] Стилі для imageSection, previewImage
- [ ] Стилі для inputSection, captionInput
- [ ] Стилі для shareButton, shareButtonDisabled

### Dependencies Developer

- [ ] `expo-image-picker` встановлено
- [ ] `expo-file-system` встановлено
- [ ] `expo-image` встановлено
- [ ] Імпорти працюють без помилок

### UI Developer

- [ ] `app/(tabs)/create.tsx` оновлено
- [ ] `pickImage` функція працює
- [ ] `handleShare` функція працює
- [ ] Стан без зображення відображається
- [ ] Стан із зображенням відображається
- [ ] ActivityIndicator показується під час завантаження
- [ ] Редірект на головну після публікації

---

## Здача роботи

### Що потрібно здати:

1. **Посилання на GitHub репозиторій**
2. **Скріншот** таблиці `posts` в Convex Dashboard з даними посту
3. **Скріншот** екрану Create з вибраним зображенням

### Формат здачі:

```
Команда: [Назва команди]
Репозиторій: https://github.com/[username]/x-clone

Учасники:
- [Ім'я] — Team Lead / Backend Developer
- [Ім'я] — Styles Developer
- [Ім'я] — Dependencies Developer
- [Ім'я] — UI Developer

Скріншоти:
- Convex Dashboard (posts): [посилання]
- Create Screen: [посилання]
```

---

## Діаграма потоку створення посту

```
┌──────────────────────────────────────────────────────────────────┐
│                     Користувач                                    │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  1. pickImage()                                                   │
│     └─► ImagePicker.launchImageLibraryAsync()                    │
│     └─► Вибір фото з галереї                                     │
│     └─► setSelectedImage(uri)                                    │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  2. handleShare()                                                 │
│     └─► setIsSharing(true)                                       │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  3. generateUploadUrl()                                          │
│     └─► Convex mutation                                          │
│     └─► ctx.storage.generateUploadUrl()                          │
│     └─► Повертає підписаний URL                                  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  4. new File(selectedImage)                                      │
│     └─► Створення File об'єкта з локального URI                  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  5. fetch(uploadUrl, { body: file })                             │
│     └─► POST запит на Convex Storage                             │
│     └─► Файл завантажується                                      │
│     └─► Відповідь: { storageId: "kg2..." }                       │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  6. createPost({ storageId, caption })                           │
│     └─► Convex mutation                                          │
│     └─► ctx.db.insert("posts", {...})                            │
│     └─► ctx.db.patch(user, { posts: +1 })                        │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  7. router.push("/(tabs)")                                       │
│     └─► Перехід на головну сторінку                              │
└──────────────────────────────────────────────────────────────────┘
```

---

## Корисні ресурси

### Документація

- [Expo ImagePicker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [Expo FileSystem](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- [Expo Image](https://docs.expo.dev/versions/latest/sdk/image/)
- [Convex File Storage](https://docs.convex.dev/file-storage)
- [Convex Mutations](https://docs.convex.dev/functions/mutation-functions)

---

## Питання?

Якщо виникли питання — звертайтесь до викладача або в чат групи.

**Успіхів команді!** 🚀
