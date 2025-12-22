# Групове завдання v7: Сторінки Bookmarks та Notifications

## Опис завдання

Продовжити розробку мобільного додатку **X (Twitter) Clone**, реалізувавши сторінки закладок (Bookmarks) та сповіщень (Notifications).

---

## Що ми робили на уроці (і що потрібно повторити)

### ✅ Частина 1: Сторінка Bookmarks

- Grid-відображення збережених постів (3 колонки)
- Компонент `NoBookmarksFound` для пустого стану
- Використання `useConvexAuth` для перевірки автентифікації

### ✅ Частина 2: Backend — Notifications

- Створення `convex/notifications.ts`
- Query `getNotifications` з збагаченням даних
- Отримання sender, post, comment для кожного notification

### ✅ Частина 3: Стилі Notifications

- Створення `styles/notifications.styles.ts`
- Стилі для header, list, notification item, avatar, icon badge

### ✅ Частина 4: Сторінка Notifications

- FlatList зі сповіщеннями
- Компонент `NotificationItem` з icon badge
- Різні іконки/текст для типів: like, comment, follow

### ✅ Частина 5: Оновлення deletePost

- Каскадне видалення notifications при видаленні посту
- Додавання індексу `by_post` для notifications

### ✅ Частина 6: Перевірка автентифікації

- Використання `useConvexAuth` + "skip" pattern
- Оновлення index.tsx, bookmarks.tsx, notifications.tsx

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

### 👨‍💼 Team Lead / Notifications Backend Developer

**Що робить (як на уроці):**

- Створює `convex/notifications.ts`
- Реалізує `getNotifications` query
- Додає індекс `by_post` для notifications в schema.ts
- Оновлює `deletePost` для видалення notifications
- Координує роботу команди
- Мержить Pull Requests

**Файли:**

- `convex/notifications.ts`
- `convex/posts.ts`
- `convex/schema.ts`

---

### 🎨 Styles Developer

**Що робить (як на уроці):**

- Створює `styles/notifications.styles.ts`
- Стилі для всіх елементів сторінки Notifications

**Файли:**

- `styles/notifications.styles.ts`

---

### 🔖 Bookmarks Page Developer

**Що робить (як на уроці):**

- Реалізує сторінку `app/(tabs)/bookmarks.tsx`
- Grid layout для відображення постів
- Компонент `NoBookmarksFound`
- Перевірка автентифікації

**Файли:**

- `app/(tabs)/bookmarks.tsx`

---

### 🔔 Notifications Page Developer

**Що робить (як на уроці):**

- Реалізує сторінку `app/(tabs)/notifications.tsx`
- Компонент `NotificationItem` з icon badge
- Компонент `NoNotificationsFound`
- Перевірка автентифікації
- Оновлює `app/(tabs)/index.tsx` з перевіркою автентифікації

**Файли:**

- `app/(tabs)/notifications.tsx`
- `app/(tabs)/index.tsx`

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
# Team Lead / Notifications Backend
git checkout -b feature/notifications-backend

# Styles Developer
git checkout -b feature/notifications-styles

# Bookmarks Page Developer
git checkout -b feature/bookmarks-page

# Notifications Page Developer
git checkout -b feature/notifications-page
```

### Крок 3: Після завершення роботи

```bash
git add .
git commit -m "feat: add bookmarks and notifications pages"
git push origin feature/notifications-backend
```

### Крок 4: Pull Request

1. Створити PR на GitHub
2. Team Lead робить review та merge

---

## Порядок виконання

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Паралельна робота                                │
├─────────────────┬─────────────────┬─────────────────┬───────────────┤
│  Team Lead      │ Styles Dev      │ Bookmarks Dev   │ Notifications │
│  (Backend)      │                 │                 │ Page Dev      │
│                 │                 │                 │               │
│  • notifications│  • notifications│  • bookmarks.   │  • notifica-  │
│    .ts          │    .styles.ts   │    tsx          │    tions.tsx  │
│  • getNotifica- │  • header       │  • Grid layout  │  • Notifica-  │
│    tions        │  • list         │  • NoBookmarks  │    tionItem   │
│  • deletePost   │  • item         │    Found        │  • NoNotifica-│
│    update       │  • avatar       │  • Auth check   │    tionsFound │
│  • schema index │  • iconBadge    │                 │  • index.tsx  │
│                 │                 │                 │    auth check │
└─────────────────┴─────────────────┴─────────────────┴───────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Інтеграція                                  │
│              Team Lead мержить всі гілки                            │
│              Команда тестує bookmarks та notifications              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Що має працювати в кінці

### ✅ Обов'язково:

1. **Сторінка Bookmarks** — відображає збережені пости в grid
2. **Grid layout** — 3 колонки з квадратними зображеннями
3. **NoBookmarksFound** — повідомлення якщо немає закладок
4. **Сторінка Notifications** — відображає список сповіщень
5. **NotificationItem** — аватар, icon badge, текст, час
6. **Icon badge** — різні іконки для like/comment/follow
7. **Текст сповіщення** — відповідний до типу
8. **NoNotificationsFound** — повідомлення якщо немає сповіщень
9. **Каскадне видалення** — notifications видаляються з постом
10. **Auth check** — queries пропускаються якщо не авторизований

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
│       ├── index.tsx              # ОНОВЛЕНИЙ (auth check)
│       ├── create.tsx
│       ├── bookmarks.tsx          # ОНОВЛЕНИЙ
│       ├── notifications.tsx      # ОНОВЛЕНИЙ
│       └── profile.tsx
├── components/
│   ├── InitialLayout.tsx
│   ├── Story.tsx
│   ├── Post.tsx
│   ├── Loader.tsx
│   ├── StoriesSection.tsx
│   ├── Comment.tsx
│   └── CommentsModal.tsx
├── providers/
│   └── ClerkAndConvexProvider.tsx
├── constants/
│   ├── theme.ts
│   └── mock-data.ts
├── styles/
│   ├── auth.styles.ts
│   ├── create.styles.ts
│   ├── feed.styles.ts
│   └── notifications.styles.ts    # НОВИЙ ФАЙЛ
├── convex/
│   ├── auth.config.ts
│   ├── schema.ts                  # ОНОВЛЕНИЙ (by_post index)
│   ├── users.ts
│   ├── http.ts
│   ├── posts.ts                   # ОНОВЛЕНИЙ (deletePost)
│   ├── comments.ts
│   ├── bookmarks.ts
│   └── notifications.ts           # НОВИЙ ФАЙЛ
├── assets/
│   ├── images/
│   └── fonts/
└── .env
```

---

## Критерії оцінювання

### Оцінка команди (спільна)

| Критерій                                  | Бали    |
| ----------------------------------------- | ------- |
| **Backend: Notifications**                |         |
| `getNotifications` query працює           | 15      |
| Збагачення даними (sender, post, comment) | 10      |
| Індекс `by_post` для notifications        | 5       |
| deletePost видаляє notifications          | 10      |
| **Styles**                                |         |
| `notifications.styles.ts` створено        | 10      |
| Всі стилі правильно застосовані           | 5       |
| **Bookmarks Page**                        |         |
| Grid layout працює (3 колонки)            | 10      |
| NoBookmarksFound відображається           | 5       |
| Auth check працює                         | 5       |
| **Notifications Page**                    |         |
| FlatList з NotificationItem               | 10      |
| Icon badge з правильними іконками         | 5       |
| Текст відповідає типу сповіщення          | 5       |
| NoNotificationsFound відображається       | 5       |
| Auth check в index.tsx                    | 5       |
| **Всього**                                | **105** |

> **Примітка:** Максимум 100 балів. Додаткові 5 балів — бонус за якість.

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
3. **Зберегти пост** — натиснути на закладку
4. **Перейти на Bookmarks** — пост має відображатись в grid
5. **Лайкнути чужий пост** — має створитись notification
6. **Перейти на Notifications** — має відображатись сповіщення
7. **Перевірити icon badge** — серце для like, bubble для comment
8. **Видалити пост** — notifications мають видалитись
9. **Вийти з акаунту** — queries не мають викликатись

### Можливі помилки:

| Помилка                        | Причина                     | Рішення                               |
| ------------------------------ | --------------------------- | ------------------------------------- |
| `Cannot read property of null` | Індекс не створений         | Додайте індекс в schema.ts            |
| Notifications не з'являються   | getNotifications не працює  | Перевірте індекс by_receiver          |
| Grid не працює                 | flexWrap не встановлено     | Додайте flexWrap: "wrap"              |
| Icon badge не відображається   | position не absolute        | Перевірте стилі iconBadge             |
| Auth error                     | Query викликається без auth | Додайте isAuthenticated ? {} : "skip" |
| Стилі не застосовуються        | Неправильний імпорт         | Перевірте шлях до styles              |

---

## Чек-лист перед здачею

### Team Lead / Notifications Backend Developer

- [ ] `convex/notifications.ts` створено
- [ ] `getNotifications` query працює
- [ ] Збагачення даними (sender, post, comment) працює
- [ ] Індекс `by_post` додано в schema.ts
- [ ] deletePost видаляє notifications
- [ ] Всі гілки змержені в `main`

### Styles Developer

- [ ] `styles/notifications.styles.ts` створено
- [ ] Стилі для container, header працюють
- [ ] Стилі для notificationItem працюють
- [ ] Стилі для avatar, iconBadge працюють
- [ ] Стилі для centered працюють

### Bookmarks Page Developer

- [ ] `app/(tabs)/bookmarks.tsx` оновлено
- [ ] Grid layout працює (3 колонки)
- [ ] NoBookmarksFound відображається
- [ ] useConvexAuth + "skip" працює

### Notifications Page Developer

- [ ] `app/(tabs)/notifications.tsx` оновлено
- [ ] NotificationItem компонент працює
- [ ] Icon badge відображає правильні іконки
- [ ] Текст відповідає типу сповіщення
- [ ] NoNotificationsFound відображається
- [ ] `app/(tabs)/index.tsx` оновлено з auth check

---

## Здача роботи

### Що потрібно здати:

1. **Посилання на GitHub репозиторій**
2. **Скріншот** сторінки Bookmarks з постами
3. **Скріншот** сторінки Notifications зі сповіщеннями
4. **Скріншот** таблиці `notifications` в Convex Dashboard
5. **Відео** (опціонально) — демонстрація роботи сторінок

### Формат здачі:

```
Команда: [Назва команди]
Репозиторій: https://github.com/[username]/x-clone

Учасники:
- [Ім'я] — Team Lead / Notifications Backend Developer
- [Ім'я] — Styles Developer
- [Ім'я] — Bookmarks Page Developer
- [Ім'я] — Notifications Page Developer

Скріншоти:
- Bookmarks: [посилання]
- Notifications: [посилання]
- Convex Dashboard: [посилання]
```

---

## Діаграма потоку Notifications

```
┌──────────────────────────────────────────────────────────────────┐
│                 Користувач лайкає пост                           │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  1. toggleLike mutation                                          │
│     └─► insert("notifications", { type: "like", ... })           │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  2. Власник посту відкриває Notifications                        │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  3. getNotifications query                                       │
│     ├─► query("notifications").withIndex("by_receiver")          │
│     └─► Збагачення: sender, post, comment                        │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  4. FlatList відображає NotificationItem                         │
│     ├─► Avatar + Icon Badge (heart)                              │
│     ├─► Username                                                 │
│     ├─► "liked your post"                                        │
│     ├─► Time ago                                                 │
│     └─► Post image                                               │
└──────────────────────────────────────────────────────────────────┘
```

---

## Діаграма Icon Badge

```
┌──────────────────────────────────────────────────────────────────┐
│                    notification.type                             │
└──────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
┌─────────────────┐ ┌──────────────────┐ ┌─────────────────────┐
│     "like"      │ │    "follow"      │ │       "comment"     │
├─────────────────┤ ├──────────────────┤ ├─────────────────────┤
│ Icon: heart     │ │ Icon: person-add │ │ Icon: chatbubble    │
│ Color: #primary │ │ Color: #8B5CF6   │ │ Color: #3B82F6      │
│ Text: "liked    │ │ Text: "started   │ │ Text: "commented    │
│  your post"     │ │  following you"  │ │  : {comment}"       │
└─────────────────┘ └──────────────────┘ └─────────────────────┘
```

---

## Корисні ресурси

### Документація

- [Convex Queries](https://docs.convex.dev/functions/query-functions)
- [React Native FlatList](https://reactnative.dev/docs/flatlist)
- [React Native ScrollView](https://reactnative.dev/docs/scrollview)
- [Expo Image](https://docs.expo.dev/versions/latest/sdk/image/)
- [useConvexAuth](https://docs.convex.dev/api/modules/react#useconvexauth)

### Корисні концепції

- **Grid Layout** — `flexWrap: "wrap"` + `width: "33.33%"`
- **Icon Badge** — `position: "absolute"` на аватарі
- **Conditional rendering** — різні іконки/текст для типів
- **Auth check** — `isAuthenticated ? {} : "skip"`

---

## Питання?

Якщо виникли питання — звертайтесь до викладача або в чат групи.

**Успіхів команді!** 🚀
