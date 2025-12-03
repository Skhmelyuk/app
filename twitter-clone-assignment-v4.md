# Групове завдання v4: Створення Home Page зі стрічкою постів

## Опис завдання

Продовжити розробку мобільного додатку **X (Twitter) Clone**, додавши головну сторінку зі стрічкою постів, stories та компонентами відображення, які ми реалізували на уроці.

---

## Що ми робили на уроці (і що потрібно повторити)

### ✅ Частина 1: Backend — Convex Query для отримання постів

- Додавання `getPosts` query до `convex/posts.ts`
- Отримання постів з інформацією про автора
- Перевірка isLiked та isBookmarked для поточного користувача

### ✅ Частина 2: Стилізація головної сторінки

- Створення `styles/feed.styles.ts`
- Стилі для header, stories, posts
- Стилі для модального вікна коментарів

### ✅ Частина 3: Mock Data та компоненти

- Створення `constants/mock-data.ts` для stories
- Компонент `Story` для відображення однієї story
- Компонент `Post` для відображення посту
- Компонент `Loader` для стану завантаження

### ✅ Частина 4: Frontend — Home Screen

- Використання `useQuery` для реактивних даних
- Відображення stories (горизонтальний скрол)
- Відображення постів (вертикальний скрол)
- Header з logout кнопкою

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

- Додає `getPosts` query до `convex/posts.ts`
- Координує роботу команди
- Мержить Pull Requests

**Файли:**

- `convex/posts.ts` (додати query)

**Важливо:** Переконайтеся, що в `schema.ts` є необхідні індекси:

---

### 🎨 Styles Developer

**Що робить (як на уроці):**

- Створює `styles/feed.styles.ts`
- Налаштовує стилі для header, stories, posts, modal

### 📦 Components Developer

**Що робить (як на уроці):**

- Створює `constants/mock-data.ts`
- Створює `components/Story.tsx`
- Створює `components/Post.tsx`
- Створює `components/Loader.tsx`

**Файли:**

- `constants/mock-data.ts`
- `components/Story.tsx`
- `components/Post.tsx`
- `components/Loader.tsx`

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
git checkout -b feature/get-posts-query

# Styles Developer
git checkout -b feature/feed-styles

# Components Developer
git checkout -b feature/feed-components

# UI Developer
git checkout -b feature/home-screen
```

### Крок 3: Після завершення роботи

```bash
git add .
git commit -m "feat: add home page with posts feed"
git push origin feature/home-screen
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
│  Team Lead    │ Styles Dev    │ Components    │ UI Developer│
│               │               │ Developer     │             │
│  • getPosts   │  • feed.      │  • mock-data  │  • index.   │
│    query      │    styles.ts  │  • Story.tsx  │    tsx      │
│  • schema     │  • header     │  • Post.tsx   │  • useQuery │
│    indexes    │  • stories    │  • Loader.tsx │  • ScrollView
│               │  • post       │               │             │
│               │  • modal      │               │             │
└───────────────┴───────────────┴───────────────┴─────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Інтеграція                               │
│         Team Lead мержить всі гілки                         │
│         Команда тестує відображення постів                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Що має працювати в кінці

### ✅ Обов'язково:

1. **Header** — відображається назва додатку та кнопка logout
2. **Stories** — горизонтальний скрол з аватарами
3. **Кольорові рамки** — якщо `hasStory: true` — кольорова, інакше сіра
4. **Loader** — показується під час завантаження постів
5. **Пости** — відображаються всі пости з БД
6. **Аватар автора** — відображається в header посту
7. **Username автора** — відображається поруч з аватаром
8. **Зображення посту** — квадратне, на всю ширину екрану
9. **Кнопки дій** — like, comment, bookmark (поки без функціоналу)
10. **Logout** — кнопка виходу працює

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
│       ├── index.tsx              # ОНОВЛЕНИЙ ФАЙЛ
│       ├── create.tsx
│       ├── notifications.tsx
│       └── profile.tsx
├── components/
│   ├── InitialLayout.tsx
│   ├── Story.tsx                  # НОВИЙ ФАЙЛ
│   ├── Post.tsx                   # НОВИЙ ФАЙЛ
│   └── Loader.tsx                 # НОВИЙ ФАЙЛ
├── providers/
│   └── ClerkAndConvexProvider.tsx
├── constants/
│   ├── theme.ts
│   └── mock-data.ts               # НОВИЙ ФАЙЛ
├── styles/
│   ├── auth.styles.ts
│   ├── create.styles.ts
│   └── feed.styles.ts             # НОВИЙ ФАЙЛ
├── convex/
│   ├── auth.config.ts
│   ├── schema.ts                  # ОНОВЛЕНИЙ (індекси)
│   ├── users.ts
│   ├── http.ts
│   └── posts.ts                   # ОНОВЛЕНИЙ (query)
├── assets/
│   └── images/
└── .env
```

---

## Критерії оцінювання

### Оцінка команди (спільна)

| Критерій                                | Бали    |
| --------------------------------------- | ------- |
| **Backend (Convex)**                    |         |
| `getPosts` query додано                 | 10      |
| Отримання автора посту працює           | 10      |
| Перевірка isLiked працює                | 5       |
| Перевірка isBookmarked працює           | 5       |
| Індекси в schema.ts додані              | 5       |
| **Стилі**                               |         |
| `feed.styles.ts` створено               | 5       |
| Стилі для header                        | 5       |
| Стилі для stories                       | 5       |
| Стилі для post                          | 5       |
| Стилі для modal (підготовка)            | 5       |
| **Компоненти**                          |         |
| `mock-data.ts` створено                 | 5       |
| `Story.tsx` працює                      | 10      |
| `Post.tsx` працює                       | 10      |
| `Loader.tsx` працює                     | 5       |
| **UI (Home Screen)**                    |         |
| Header відображається                   | 5       |
| Stories скролляться горизонтально       | 5       |
| Пости відображаються                    | 10      |
| Loader показується під час завантаження | 5       |
| Logout працює                           | 5       |
| **Всього**                              | **120** |

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
3. **Головна сторінка** — має відображатись header та stories
4. **Створити пост** (з попереднього завдання)
5. **Повернутись на головну** — пост має з'явитись в стрічці
6. **Перевірити** — аватар, username, зображення відображаються
7. **Logout** — кнопка виходу працює

### Можливі помилки:

| Помилка                      | Причина                          | Рішення                                          |
| ---------------------------- | -------------------------------- | ------------------------------------------------ |
| `Unauthorized`               | Користувач не автентифікований   | Перевірте ClerkProvider                          |
| `User not found`             | Користувач не створений в Convex | Перевірте Webhook                                |
| Пости не відображаються      | Query не працює                  | Перевірте `api.posts.getPosts`                   |
| Помилка індексу              | Індекс не створений              | Додайте індекси в schema.ts                      |
| Stories не скролляться       | Немає `horizontal` prop          | Додайте `horizontal` до ScrollView               |
| Зображення не відображається | Невірний source                  | Перевірте `post.imageUrl` та `post.author.image` |

---

## Чек-лист перед здачею

### Team Lead / Backend Developer

- [ ] `getPosts` query додано до `convex/posts.ts`
- [ ] Отримання автора посту працює
- [ ] Перевірка isLiked працює
- [ ] Перевірка isBookmarked працює
- [ ] Індекси `by_user_and_post` та `by_both` додані
- [ ] Всі гілки змержені в `main`

### Styles Developer

- [ ] `styles/feed.styles.ts` створено
- [ ] Стилі для container, header
- [ ] Стилі для storiesContainer, storyWrapper, storyRing
- [ ] Стилі для post, postHeader, postImage, postActions
- [ ] Стилі для modal (commentContainer, commentInput)

### Components Developer

- [ ] `constants/mock-data.ts` створено з STORIES
- [ ] `components/Story.tsx` створено та працює
- [ ] `components/Post.tsx` створено та працює
- [ ] `components/Loader.tsx` створено та працює
- [ ] Умовна стилізація story ring працює

### UI Developer

- [ ] `app/(tabs)/index.tsx` оновлено
- [ ] `useQuery(api.posts.getPosts)` підключено
- [ ] Loader відображається під час завантаження
- [ ] Header з logout відображається
- [ ] Stories скролляться горизонтально
- [ ] Пости відображаються вертикально

---

## Здача роботи

### Що потрібно здати:

1. **Посилання на GitHub репозиторій**
2. **Скріншот** головної сторінки з постами
3. **Скріншот** stories секції
4. **Відео** (опціонально) — демонстрація скролу та logout

### Формат здачі:

```
Команда: [Назва команди]
Репозиторій: https://github.com/[username]/x-clone

Учасники:
- [Ім'я] — Team Lead / Backend Developer
- [Ім'я] — Styles Developer
- [Ім'я] — Components Developer
- [Ім'я] — UI Developer

Скріншоти:
- Home Page: [посилання]
- Stories: [посилання]
```

---

## Діаграма потоку даних

```
┌──────────────────────────────────────────────────────────────────┐
│                     HomeScreen                                    │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  1. useQuery(api.posts.getPosts)                                 │
│     └─► Підписка на дані Convex                                  │
│     └─► Автоматичне оновлення при змінах                         │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  2. Convex Server: getPosts()                                    │
│     └─► ctx.auth.getUserIdentity()                               │
│     └─► ctx.db.query("posts").order("desc")                      │
│     └─► Promise.all(posts.map(...))                              │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  3. Для кожного посту:                                           │
│     └─► ctx.db.get(post.userId) — автор                          │
│     └─► ctx.db.query("likes") — чи лайкнув                       │
│     └─► ctx.db.query("bookmarks") — чи в закладках               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  4. Повернення збагачених даних                                  │
│     └─► { ...post, author, isLiked, isBookmarked }               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  5. Рендер компонентів                                           │
│     └─► <Loader /> якщо posts === undefined                      │
│     └─► <Story /> для кожної story                               │
│     └─► <Post /> для кожного посту                               │
└──────────────────────────────────────────────────────────────────┘
```

---

## Структура компонента Post

```
┌─────────────────────────────────────────────────────────────┐
│  POST HEADER                                                │
│  ┌──────┐                                                   │
│  │Avatar│  username                           [🗑️ Delete]  │
│  └──────┘                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                                                             │
│                      POST IMAGE                             │
│                    (width x width)                          │
│                                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  POST ACTIONS                                               │
│  [❤️ Like]  [💬 Comment]                         [🔖 Save]  │
└─────────────────────────────────────────────────────────────┘
```

---

## Корисні ресурси

### Документація

- [Convex Queries](https://docs.convex.dev/functions/query-functions)
- [Convex Indexes](https://docs.convex.dev/database/indexes)
- [React Native ScrollView](https://reactnative.dev/docs/scrollview)
- [Expo Image](https://docs.expo.dev/versions/latest/sdk/image/)
- [Expo Router Link](https://docs.expo.dev/router/navigating-pages/)

### Корисні концепції

- **Реактивність Convex** — UI автоматично оновлюється при зміні даних в БД
- **Promise.all** — паралельне виконання асинхронних операцій
- **Індекси** — прискорюють пошук в базі даних
- **Умовна стилізація** — `[styles.base, condition && styles.conditional]`

---

## Питання?

Якщо виникли питання — звертайтесь до викладача або в чат групи.

**Успіхів команді!** 🚀
