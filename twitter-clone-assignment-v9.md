# Групове завдання v9: Сторінка профілю іншого користувача (User Profile Page)

## Опис завдання

Продовжити розробку мобільного додатку **X (Twitter) Clone**, реалізувавши сторінку профілю іншого користувача з можливістю підписки/відписки та перегляду постів.

---

## Що ми робили на уроці (і що потрібно повторити)

### ✅ Частина 1: Backend — Отримання профілю користувача

- Query `getUserProfile` для отримання даних користувача за ID
- Використання `ctx.db.get()` для отримання документа

### ✅ Частина 2: Backend — Перевірка підписки

- Query `isFollowing` для перевірки чи поточний користувач підписаний
- Використання індексу `by_both` для пошуку в таблиці `follows`

### ✅ Частина 3: Backend — Toggle Follow

- Mutation `toggleFollow` для підписки/відписки
- Допоміжна функція `updateFollowCounts` для оновлення лічильників
- Створення нотифікації при підписці

### ✅ Частина 4: Роути для User Profile

- Створення `app/user/_layout.tsx` з Stack навігатором
- Створення динамічного роуту `app/user/[id].tsx`

### ✅ Частина 5: User Profile Screen

- Header з кнопкою "назад" та username
- Profile Info з avatar, stats, name, bio
- Кнопка Follow/Following з toggle функціоналом
- Grid постів користувача

### ✅ Частина 6: Інтеграція посилань

- Link у компоненті Post для переходу на профіль автора
- Link у компоненті NotificationItem для переходу на профіль відправника
- Умовна навігація: власний профіль vs профіль іншого користувача

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

- Створює `getUserProfile` query в `convex/users.ts`
- Створює `isFollowing` query в `convex/users.ts`
- Створює `toggleFollow` mutation в `convex/users.ts`
- Створює допоміжну функцію `updateFollowCounts`
- Координує роботу команди
- Мержить Pull Requests

**Файли:**

- `convex/users.ts`

---

### 🎨 Routes & Layout Developer

**Що робить (як на уроці):**

- Створює `app/user/_layout.tsx` з Stack навігатором
- Налаштовує `headerShown: false`

**Файли:**

- `app/user/_layout.tsx`

---

### 📱 User Profile UI Developer

**Що робить (як на уроці):**

- Реалізує основну структуру `app/user/[id].tsx`
- Header з кнопкою "назад" та username
- Profile Info з avatar, stats, name, bio
- Кнопка Follow/Following
- Grid постів користувача

**Файли:**

- `app/user/[id].tsx`

---

### 🔗 Links Integration Developer

**Що робить (як на уроці):**

- Додає Link у компонент `Post.tsx` для переходу на профіль автора
- Додає Link у компонент `NotificationItem.tsx` для переходу на профіль відправника
- Реалізує умовну навігацію (власний профіль vs інший)

**Файли:**

- `components/Post.tsx`
- `components/NotificationItem.tsx`

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
# Team Lead / Backend Developer
git checkout -b feature/user-profile-backend

# Routes & Layout Developer
git checkout -b feature/user-profile-routes

# User Profile UI Developer
git checkout -b feature/user-profile-ui

# Links Integration Developer
git checkout -b feature/user-profile-links
```

### Крок 3: Після завершення роботи

```bash
git add .
git commit -m "feat: add user profile page with follow functionality"
git push origin feature/user-profile-backend
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
│  Team Lead      │ Routes Dev      │ Profile UI Dev  │ Links Dev     │
│  (Backend)      │                 │                 │               │
│                 │                 │                 │               │
│  • getUserProfile│ • _layout.tsx  │ • [id].tsx      │ • Post.tsx    │
│    query        │ • Stack         │ • Header        │   Link        │
│  • isFollowing  │   navigator     │ • Profile Info  │ • Notification│
│    query        │ • headerShown   │ • Avatar        │   Item Link   │
│  • toggleFollow │   false         │ • Stats         │ • Умовна      │
│    mutation     │                 │ • Follow btn    │   навігація   │
│  • updateFollow │                 │ • Posts Grid    │               │
│    Counts       │                 │                 │               │
└─────────────────┴─────────────────┴─────────────────┴───────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Інтеграція                                  │
│              Team Lead мержить всі гілки                            │
│              Команда тестує User Profile Page                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Що має працювати в кінці

### ✅ Обов'язково:

1. **Перехід з поста** — натиснути на аватар автора → відкривається профіль
2. **Перехід з нотифікації** — натиснути на аватар → відкривається профіль
3. **Умовна навігація** — якщо автор = поточний користувач → власний профіль
4. **Header** — кнопка "назад" та username
5. **Avatar** — відображається зображення користувача
6. **Stats** — posts, followers, following
7. **Name & Bio** — відображаються дані профілю
8. **Follow кнопка** — текст "Follow" якщо не підписаний
9. **Following кнопка** — текст "Following" якщо підписаний
10. **Toggle Follow** — натиснути → змінюється стан підписки
11. **Лічильники оновлюються** — followers збільшується/зменшується
12. **Нотифікація** — при підписці створюється нотифікація
13. **Posts Grid** — 3 колонки з постами користувача
14. **NoPostsFound** — якщо немає постів
15. **Кнопка "назад"** — повертає на попередній екран

---

## Структура проєкту (оновлена)

```
x-clone/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (auth)/
│   │   └── login.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── create.tsx
│   │   ├── bookmarks.tsx
│   │   ├── notifications.tsx
│   │   └── profile.tsx
│   └── user/                        # НОВА ПАПКА
│       ├── _layout.tsx              # НОВИЙ ФАЙЛ
│       └── [id].tsx                 # НОВИЙ ФАЙЛ
├── components/
│   ├── InitialLayout.tsx
│   ├── Story.tsx
│   ├── Post.tsx                     # ОНОВЛЕНИЙ (Link)
│   ├── Loader.tsx
│   ├── StoriesSection.tsx
│   ├── Comment.tsx
│   ├── CommentsModal.tsx
│   └── NotificationItem.tsx         # ОНОВЛЕНИЙ (Link)
├── providers/
│   └── ClerkAndConvexProvider.tsx
├── constants/
│   ├── theme.ts
│   └── mock-data.ts
├── styles/
│   ├── auth.styles.ts
│   ├── create.styles.ts
│   ├── feed.styles.ts
│   ├── notifications.styles.ts
│   └── profile.styles.ts
├── convex/
│   ├── auth.config.ts
│   ├── schema.ts
│   ├── users.ts                     # ОНОВЛЕНИЙ (getUserProfile, isFollowing, toggleFollow)
│   ├── http.ts
│   ├── posts.ts
│   ├── comments.ts
│   ├── bookmarks.ts
│   └── notifications.ts
├── assets/
│   ├── images/
│   └── fonts/
└── .env
```

---

## Критерії оцінювання

### Оцінка команди (спільна)

| Критерій                                | Бали    |
| --------------------------------------- | ------- |
| **Backend**                             |         |
| `getUserProfile` query працює           | 10      |
| `isFollowing` query працює              | 10      |
| `toggleFollow` mutation працює          | 10      |
| `updateFollowCounts` оновлює лічильники | 5       |
| Нотифікація створюється при follow      | 5       |
| **Routes & Layout**                     |         |
| `app/user/_layout.tsx` створено         | 5       |
| Stack навігатор налаштовано             | 5       |
| **User Profile UI**                     |         |
| Header з кнопкою "назад"                | 5       |
| Username відображається                 | 5       |
| Avatar відображається                   | 5       |
| Stats (posts, followers, following)     | 5       |
| Name та Bio відображаються              | 5       |
| Follow/Following кнопка працює          | 10      |
| Posts Grid з numColumns={3}             | 5       |
| NoPostsFound відображається             | 5       |
| **Links Integration**                   |         |
| Link у Post.tsx працює                  | 5       |
| Link у NotificationItem.tsx працює      | 5       |
| Умовна навігація працює                 | 5       |
| **Всього**                              | **105** |

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
3. **Перейти на Home** — має відображатись стрічка постів
4. **Натиснути на аватар автора поста** — має відкритись профіль автора
5. **Перевірити Header** — кнопка "назад" та username
6. **Перевірити Stats** — posts, followers, following
7. **Натиснути Follow** — текст має змінитись на "Following"
8. **Перевірити followers** — лічильник має збільшитись
9. **Натиснути Following** — текст має змінитись на "Follow"
10. **Перевірити followers** — лічильник має зменшитись
11. **Натиснути кнопку "назад"** — має повернутись на попередній екран
12. **Перейти на Notifications** — перевірити нотифікацію про follow
13. **Натиснути на аватар у нотифікації** — має відкритись профіль
14. **Натиснути на власний пост** — має відкритись власний профіль (tabs/profile)

### Можливі помилки:

| Помилка                          | Причина                       | Рішення                      |
| -------------------------------- | ----------------------------- | ---------------------------- |
| `User not found`                 | Немає користувача з таким ID  | Перевірте ID у URL           |
| Follow не працює                 | toggleFollow не викликається  | Перевірте useMutation        |
| Лічильники не оновлюються        | updateFollowCounts не працює  | Перевірте функцію            |
| Нотифікація не створюється       | Немає insert в notifications  | Додайте ctx.db.insert        |
| Link не працює                   | Неправильний href             | Перевірте шлях `/user/${id}` |
| Власний профіль не відкривається | Умовна навігація не працює    | Перевірте currentUser?.\_id  |
| Кнопка "назад" не працює         | router.back() не викликається | Перевірте handleBack         |
| Posts не відображаються          | getPostsByUser не працює      | Перевірте query              |

---

## Чек-лист перед здачею

### Team Lead / Backend Developer

- [ ] `getUserProfile` query створено в `convex/users.ts`
- [ ] `isFollowing` query створено в `convex/users.ts`
- [ ] `toggleFollow` mutation створено в `convex/users.ts`
- [ ] `updateFollowCounts` функція працює
- [ ] Нотифікація створюється при follow
- [ ] Індекс `by_both` існує в schema.ts для таблиці follows
- [ ] Всі гілки змержені в `main`

### Routes & Layout Developer

- [ ] `app/user/_layout.tsx` створено
- [ ] Stack навігатор налаштовано
- [ ] `headerShown: false` встановлено

### User Profile UI Developer

- [ ] Header з кнопкою "назад" працює
- [ ] Username відображається
- [ ] Avatar відображається
- [ ] Stats відображаються
- [ ] Name та Bio відображаються
- [ ] Follow кнопка працює
- [ ] Following кнопка працює
- [ ] Стиль кнопки змінюється при toggle
- [ ] Posts Grid з numColumns={3} працює
- [ ] NoPostsFound відображається якщо немає постів

### Links Integration Developer

- [ ] Link у Post.tsx додано
- [ ] При натисканні на аватар автора відкривається профіль
- [ ] Link у NotificationItem.tsx додано
- [ ] При натисканні на аватар у нотифікації відкривається профіль
- [ ] Умовна навігація працює (власний профіль vs інший)

---

## Здача роботи

### Що потрібно здати:

1. **Посилання на GitHub репозиторій**
2. **Скріншот** сторінки профілю іншого користувача
3. **Скріншот** кнопки "Following" (після підписки)
4. **Скріншот** нотифікації про follow
5. **Відео** (опціонально) — демонстрація follow/unfollow

### Формат здачі:

```
Команда: [Назва команди]
Репозиторій: https://github.com/[username]/x-clone

Учасники:
- [Ім'я] — Team Lead / Backend Developer
- [Ім'я] — Routes & Layout Developer
- [Ім'я] — User Profile UI Developer
- [Ім'я] — Links Integration Developer

Скріншоти:
- User Profile Page: [посилання]
- Following Button: [посилання]
- Follow Notification: [посилання]
```

---

## Діаграма структури User Profile Page

```
┌─────────────────────────────────────────────────────────────────────┐
│                      USER PROFILE PAGE                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  HEADER                                                      │   │
│  │  ┌─────────────────────┐          ┌─────────────────────┐   │   │
│  │  │ backButton          │          │ empty spacer        │   │   │
│  │  │ [← arrow]           │ @username│ [width: 24]         │   │   │
│  │  └─────────────────────┘          └─────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  PROFILE INFO                                                │   │
│  │  ┌────────────────┐  ┌────────────────────────────────────┐ │   │
│  │  │ avatar         │  │ statsContainer                     │ │   │
│  │  │  ┌──────────┐  │  │ ┌────────┐ ┌────────┐ ┌────────┐  │ │   │
│  │  │  │  Image   │  │  │ │ Posts  │ │Followers│ │Following│ │ │   │
│  │  │  │  86x86   │  │  │ │   12   │ │  234   │ │  156   │  │ │   │
│  │  │  └──────────┘  │  │ └────────┘ └────────┘ └────────┘  │ │   │
│  │  └────────────────┘  └────────────────────────────────────┘ │   │
│  │                                                              │   │
│  │  name: John Doe                                              │   │
│  │  bio: Software Developer | React Native enthusiast           │   │
│  │                                                              │   │
│  │  ┌────────────────────────────────────────────────────────┐ │   │
│  │  │ followButton                                            │ │   │
│  │  │ [Follow] / [Following]                                  │ │   │
│  │  └────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  POSTS GRID (FlatList numColumns={3})                        │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │   │
│  │  │ gridItem    │ │ gridItem    │ │ gridItem    │            │   │
│  │  │ [Post 1]    │ │ [Post 2]    │ │ [Post 3]    │            │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Діаграма потоку даних

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐ │
│  │   Post      │───▶│   Link      │───▶│  /user/[id]             │ │
│  │  Component  │    │  Navigation │    │  UserProfileScreen      │ │
│  └─────────────┘    └─────────────┘    └─────────────────────────┘ │
│         │                                         │                 │
│         │           ┌─────────────┐               ▼                 │
│         │           │  Condition  │    ┌─────────────────────────┐ │
│         └──────────▶│  Check      │    │  Convex Queries:        │ │
│                     │  author._id │    │  - getUserProfile       │ │
│                     │  === user   │    │  - getPostsByUser       │ │
│                     └──────┬──────┘    │  - isFollowing          │ │
│                            │           └─────────────────────────┘ │
│                            ▼                      │                 │
│                     ┌─────────────┐               ▼                 │
│                     │ /(tabs)/    │    ┌─────────────────────────┐ │
│                     │  profile    │    │  Convex Mutation:       │ │
│                     └─────────────┘    │  - toggleFollow         │ │
│                                        └─────────────────────────┘ │
│                                                   │                 │
│  ┌─────────────┐    ┌─────────────┐               ▼                 │
│  │ Notification│───▶│   Link      │    ┌─────────────────────────┐ │
│  │    Item     │    │  Navigation │───▶│  updateFollowCounts     │ │
│  └─────────────┘    └─────────────┘    │  + create notification  │ │
│                                        └─────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Діаграма Follow/Unfollow

```
┌──────────────────────────────────────────────────────────────────┐
│                         FOLLOW FLOW                               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────┐
│  Користувач натискає кнопку "Follow"    │
└─────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────┐
│  toggleFollow mutation викликається     │
│  args: { followingId: userId }          │
└─────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────┐
│  Перевірка: чи існує запис у follows?   │
│  query("follows").withIndex("by_both")  │
└─────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│  Запис існує (unfollow) │    │  Запис НЕ існує (follow)│
│  • ctx.db.delete()      │    │  • ctx.db.insert()      │
│  • updateFollowCounts   │    │  • updateFollowCounts   │
│    (isFollow: false)    │    │    (isFollow: true)     │
│                         │    │  • create notification  │
└─────────────────────────┘    └─────────────────────────┘
              │                               │
              ▼                               ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│  Кнопка: "Follow"       │    │  Кнопка: "Following"    │
│  followers: -1          │    │  followers: +1          │
└─────────────────────────┘    └─────────────────────────┘
```

---

## Корисні ресурси

### Документація

- [Expo Router Dynamic Routes](https://docs.expo.dev/router/reference/url-parameters/)
- [React Native FlatList](https://reactnative.dev/docs/flatlist)
- [Expo Image](https://docs.expo.dev/versions/latest/sdk/image/)
- [Convex Mutations](https://docs.convex.dev/functions/mutation-functions)
- [Convex Queries](https://docs.convex.dev/functions/query-functions)

### Корисні концепції

- **useLocalSearchParams** — отримання параметрів з URL
- **useRouter** — навігація (back, replace)
- **useMutation** — виклик Convex mutations
- **useQuery** — підписка на Convex queries
- **Link asChild** — передача props дочірньому компоненту
- **ctx.db.get()** — отримання документа за ID
- **ctx.db.patch()** — часткове оновлення документа
- **withIndex** — пошук за індексом

---

## Питання?

Якщо виникли питання — звертайтесь до викладача або в чат групи.

**Успіхів команді!** 🚀
