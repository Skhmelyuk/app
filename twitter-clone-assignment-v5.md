# Групове завдання v5: Взаємодії з постами та оптимізація

## Опис завдання

Продовжити розробку мобільного додатку **X (Twitter) Clone**, додавши функціонал лайків, оптимізацію списку постів (FlatList) та підключення кастомних шрифтів.

---

## Що ми робили на уроці (і що потрібно повторити)

### ✅ Частина 1: Типізація та блок інформації посту

- Додавання типу `PostProps` для компонента Post
- Блок POST INFO з лайками, caption, коментарями, часом
- Встановлення `date-fns` для форматування часу

### ✅ Частина 2: Утиліта автентифікації

- Створення функції `getAuthenticatedUser` в `convex/users.ts`
- Переіспользовування в різних mutations

### ✅ Частина 3: Функціонал лайків

- Mutation `toggleLike` в `convex/posts.ts`
- Оптимістичне оновлення UI в компоненті Post
- Автоматичне створення notifications

### ✅ Частина 4: Оптимізація та шрифти

- Заміна ScrollView на FlatList
- Компонент StoriesSection
- Підключення кастомних шрифтів

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

- Додає `getAuthenticatedUser` в `convex/users.ts`
- Додає `toggleLike` в `convex/posts.ts`
- Координує роботу команди
- Мержить Pull Requests

**Файли:**

- `convex/users.ts`
- `convex/posts.ts`

---

### 🎨 Styles Developer

**Що робить (як на уроці):**

- Оновлює стилі в `styles/feed.styles.ts` (якщо потрібно)
- Допомагає з UI компонентами

**Файли:**

- `styles/feed.styles.ts`

---

### 📦 UI Components Developer

**Що робить (як на уроці):**

- Оновлює `components/Post.tsx` з типізацією та лайками
- Створює `components/StoriesSection.tsx`

**Файли:**

- `components/Post.tsx`
- `components/StoriesSection.tsx`

**Встановлення залежності:**

```bash
npm install date-fns
```

---

### 🖥️ UI Screen Developer

**Що робить (як на уроці):**

- Оновлює `app/(tabs)/index.tsx` з FlatList
- Оновлює `app/_layout.tsx` з шрифтами

**Файли:**

- `app/(tabs)/index.tsx`
- `app/_layout.tsx`

**Встановлення залежностей:**

```bash
npx expo install expo-font expo-splash-screen
```

**Структура папки fonts:**

```
assets/
└── fonts/
    ├── SpaceMono-Regular.ttf
    └── JetBrainsMono-Medium.ttf
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
git checkout -b feature/toggle-like

# Styles Developer
git checkout -b feature/styles-update

# UI Components Developer
git checkout -b feature/post-interactions

# UI Screen Developer
git checkout -b feature/flatlist-fonts
```

### Крок 3: Після завершення роботи

```bash
git add .
git commit -m "feat: add post interactions and optimizations"
git push origin feature/toggle-like
```

### Крок 4: Pull Request

1. Створити PR на GitHub
2. Team Lead робить review та merge

---

## Порядок виконання

```
┌─────────────────────────────────────────────────────────────┐
│              Паралельна робота                              │
├───────────────┬───────────────┬───────────────┬─────────────┤
│  Team Lead    │ Styles Dev    │ UI Components │ UI Screen   │
│               │               │ Developer     │ Developer   │
│  • getAuth-   │  • feed.      │  • Post.tsx   │  • index.   │
│    enticated  │    styles.ts  │    (updated)  │    tsx      │
│    User       │  • оновлення  │  • PostProps  │  • FlatList │
│  • toggleLike │    стилів     │  • handleLike │  • _layout  │
│               │               │  • Stories-   │  • fonts    │
│               │               │    Section    │             │
└───────────────┴───────────────┴───────────────┴─────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Інтеграція                               │
│         Team Lead мержить всі гілки                         │
│         Команда тестує функціонал лайків                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Що має працювати в кінці

### ✅ Обов'язково:

1. **Лайк працює** — натискаємо серце → колір змінюється
2. **Лічильник лайків** — оновлюється при лайку/анлайку
3. **Час посту** — відображається "5 minutes ago", "2 hours ago" тощо
4. **Caption** — відображається під постом (якщо є)
5. **Кількість коментарів** — відображається "View all X comments"
6. **FlatList** — замість ScrollView для оптимізації
7. **Stories в header** — StoriesSection як ListHeaderComponent
8. **Шрифти** — кастомні шрифти завантажуються
9. **Splash Screen** — зникає після завантаження шрифтів
10. **Notifications** — створюються при лайку (перевірити в Convex Dashboard)

---

## Структура проєкту (оновлена)

```
x-clone/
├── app/
│   ├── _layout.tsx              # ОНОВЛЕНИЙ (шрифти)
│   ├── index.tsx
│   ├── (auth)/
│   │   └── login.tsx
│   └── (tabs)/
│       ├── _layout.tsx
│       ├── index.tsx            # ОНОВЛЕНИЙ (FlatList)
│       ├── create.tsx
│       ├── notifications.tsx
│       └── profile.tsx
├── components/
│   ├── InitialLayout.tsx
│   ├── Story.tsx
│   ├── Post.tsx                 # ОНОВЛЕНИЙ (лайки, типізація)
│   ├── Loader.tsx
│   └── StoriesSection.tsx       # НОВИЙ ФАЙЛ
├── providers/
│   └── ClerkAndConvexProvider.tsx
├── constants/
│   ├── theme.ts
│   └── mock-data.ts
├── styles/
│   ├── auth.styles.ts
│   ├── create.styles.ts
│   └── feed.styles.ts
├── convex/
│   ├── auth.config.ts
│   ├── schema.ts
│   ├── users.ts                 # ОНОВЛЕНИЙ (getAuthenticatedUser)
│   ├── http.ts
│   └── posts.ts                 # ОНОВЛЕНИЙ (toggleLike)
├── assets/
│   ├── images/
│   └── fonts/                   # НОВА ПАПКА
│       ├── SpaceMono-Regular.ttf
│       └── JetBrainsMono-Medium.ttf
└── .env
```

---

## Критерії оцінювання

### Оцінка команди (спільна)

| Критерій                              | Бали    |
| ------------------------------------- | ------- |
| **Backend (Convex)**                  |         |
| `getAuthenticatedUser` функція працює | 10      |
| `toggleLike` mutation працює          | 15      |
| Notification створюється при лайку    | 5       |
| **Styles**                            |         |
| Стилі оновлені (якщо потрібно)        | 5       |
| **UI Components**                     |         |
| `PostProps` типізація додана          | 5       |
| `handleLike` працює                   | 10      |
| Іконка серця змінює колір             | 5       |
| Лічильник лайків оновлюється          | 5       |
| `formatDistanceToNow` працює          | 5       |
| Caption відображається                | 5       |
| `StoriesSection` компонент створено   | 5       |
| **UI Screen**                         |         |
| FlatList замість ScrollView           | 10      |
| `ListHeaderComponent` працює          | 5       |
| Шрифти завантажуються                 | 5       |
| SplashScreen працює коректно          | 5       |
| **Всього**                            | **120** |

> **Примітка:** Максимум 100 балів. Додаткові 20 балів — бонус за якість.

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
3. **Перейти на головну** — має відображатись FlatList з постами
4. **Натиснути на серце** — колір має змінитись на червоний
5. **Перевірити лічильник** — кількість лайків має збільшитись
6. **Перевірити час** — має відображатись "X minutes ago"
7. **Перевірити Convex Dashboard** — таблиця `notifications` має містити новий запис
8. **Перезапустити додаток** — splash screen має зникнути після завантаження шрифтів

### Можливі помилки:

| Помилка                        | Причина                        | Рішення                               |
| ------------------------------ | ------------------------------ | ------------------------------------- |
| `Unauthorized`                 | Користувач не автентифікований | Перевірте ClerkProvider               |
| `User not found`               | Користувач не створений        | Перевірте Webhook                     |
| `Post not found`               | Невірний postId                | Перевірте що пост існує               |
| Лайк не працює                 | toggleLike не імпортовано      | Перевірте `api.posts.toggleLike`      |
| Шрифти не завантажуються       | Невірний шлях                  | Перевірте шлях до fonts               |
| `Cannot read property of null` | Індекс не створений            | Додайте індекс в schema.ts            |
| FlatList порожній              | posts === undefined            | Додайте Loader для стану завантаження |

---

## Чек-лист перед здачею

### Team Lead / Backend Developer

- [ ] `getAuthenticatedUser` функція додана в `convex/users.ts`
- [ ] `toggleLike` mutation додано в `convex/posts.ts`
- [ ] Notification створюється при лайку чужого посту
- [ ] Всі гілки змержені в `main`

### Styles Developer

- [ ] Стилі перевірені та оновлені (якщо потрібно)
- [ ] Допомога з UI компонентами

### UI Components Developer

- [ ] `PostProps` типізація додана
- [ ] `handleLike` функція працює
- [ ] Іконка серця змінює колір (heart/heart-outline)
- [ ] Лічильник лайків оновлюється
- [ ] `formatDistanceToNow` відображає час
- [ ] Caption відображається (якщо є)
- [ ] `StoriesSection` компонент створено

### UI Screen Developer

- [ ] FlatList замість ScrollView
- [ ] `ListHeaderComponent={<StoriesSection />}`
- [ ] `contentContainerStyle={{ paddingBottom: 60 }}`
- [ ] Шрифти завантажуються в `_layout.tsx`
- [ ] SplashScreen приховується після завантаження

---

## Здача роботи

### Що потрібно здати:

1. **Посилання на GitHub репозиторій**
2. **Скріншот** посту з лайком (червоне серце)
3. **Скріншот** таблиці `notifications` в Convex Dashboard
4. **Відео** (опціонально) — демонстрація лайка та зміни лічильника

### Формат здачі:

```
Команда: [Назва команди]
Репозиторій: https://github.com/[username]/x-clone

Учасники:
- [Ім'я] — Team Lead / Backend Developer
- [Ім'я] — Styles Developer
- [Ім'я] — UI Components Developer
- [Ім'я] — UI Screen Developer

Скріншоти:
- Post з лайком: [посилання]
- Notifications: [посилання]
```

---

## Діаграма потоку лайка

```
┌──────────────────────────────────────────────────────────────────┐
│                     Користувач натискає ❤️                        │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  1. handleLike()                                                  │
│     └─► toggleLike({ postId: post._id })                         │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  2. Convex Server: toggleLike()                                  │
│     └─► getAuthenticatedUser(ctx)                                │
│     └─► Перевірка чи є лайк в таблиці "likes"                    │
└──────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────┐           ┌─────────────────────┐
│     ІСНУЄ (like)    │           │   НЕ ІСНУЄ          │
├─────────────────────┤           ├─────────────────────┤
│ • delete(like._id)  │           │ • insert("likes")   │
│ • patch(likes - 1)  │           │ • patch(likes + 1)  │
│ • return false      │           │ • insert notif      │
└─────────────────────┘           │ • return true       │
              │                   └─────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  3. Frontend отримує результат                                   │
│     └─► setIsLiked(newIsLiked)                                   │
│     └─► setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1)  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  4. UI оновлюється                                               │
│     └─► Іконка: heart (червона) / heart-outline (біла)           │
│     └─► Текст: "X likes" / "Be the first to like"                │
└──────────────────────────────────────────────────────────────────┘
```

---

## Порівняння ScrollView vs FlatList

| Характеристика      | ScrollView                   | FlatList              |
| ------------------- | ---------------------------- | --------------------- |
| **Рендеринг**       | Всі елементи одразу          | Тільки видимі         |
| **Пам'ять**         | Високе споживання            | Оптимізоване          |
| **Продуктивність**  | Повільна при великих списках | Швидка                |
| **Header**          | Вкладений ScrollView         | `ListHeaderComponent` |
| **Ключі**           | `key` prop                   | `keyExtractor`        |
| **Рендер елемента** | JSX напряму                  | `renderItem` функція  |

---

## Корисні ресурси

### Документація

- [Convex Mutations](https://docs.convex.dev/functions/mutation-functions)
- [React Native FlatList](https://reactnative.dev/docs/flatlist)
- [date-fns formatDistanceToNow](https://date-fns.org/docs/formatDistanceToNow)
- [Expo Fonts](https://docs.expo.dev/versions/latest/sdk/font/)
- [Expo SplashScreen](https://docs.expo.dev/versions/latest/sdk/splash-screen/)

### Корисні концепції

- **Оптимістичне оновлення** — UI оновлюється до отримання відповіді від сервера
- **DRY** — Don't Repeat Yourself (getAuthenticatedUser)
- **Типізація** — TypeScript для безпеки коду
- **Virtualization** — FlatList рендерить тільки видимі елементи

---

## Питання?

Якщо виникли питання — звертайтесь до викладача або в чат групи.

**Успіхів команді!** 🚀
