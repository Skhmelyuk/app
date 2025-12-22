# Групове завдання v8: Сторінка профілю (Profile Page)

## Опис завдання

Продовжити розробку мобільного додатку **X (Twitter) Clone**, реалізувавши сторінку профілю користувача з можливістю редагування та перегляду постів.

---

## Що ми робили на уроці (і що потрібно повторити)

### ✅ Частина 1: Backend — Пости користувача

- Query `getPostsByUser` для отримання постів
- Підтримка як власного профілю, так і чужого (через userId)
- Використання індексу `by_user`

### ✅ Частина 2: Backend — Оновлення профілю

- Mutation `updateProfile` для зміни fullname та bio
- Використання `ctx.db.patch()` для часткового оновлення

### ✅ Частина 3: Стилі Profile

- Створення `styles/profile.styles.ts`
- Стилі для header, profile info, stats, action buttons
- Стилі для grid постів та модальних вікон

### ✅ Частина 4: Profile Header

- Відображення username
- Кнопка logout з `signOut()` від Clerk

### ✅ Частина 5: Profile Info

- Avatar та статистика (posts, followers, following)
- Name та bio користувача
- Кнопки Edit Profile та Share

### ✅ Частина 6: Grid постів

- FlatList з `numColumns={3}`
- Компонент `NoPostsFound` для пустого стану
- Відкриття посту при натисканні

### ✅ Частина 7: Модальне вікно посту

- Перегляд посту на повний екран
- Анімація `fade`

### ✅ Частина 8: Модальне вікно редагування

- Форма редагування name та bio
- `KeyboardAvoidingView` для роботи з клавіатурою
- Збереження змін через `updateProfile`

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

- Створює `getPostsByUser` query в `convex/posts.ts`
- Створює `updateProfile` mutation в `convex/users.ts`
- Координує роботу команди
- Мержить Pull Requests

**Файли:**

- `convex/posts.ts`
- `convex/users.ts`

---

### 🎨 Styles Developer

**Що робить (як на уроці):**

- Створює `styles/profile.styles.ts`
- Стилі для всіх елементів сторінки профілю

---

### 📱 Profile UI Developer

**Що робить (як на уроці):**

- Реалізує основну структуру `app/(tabs)/profile.tsx`
- Header з username та logout
- Profile Info з avatar, stats, name, bio
- Action buttons (Edit Profile, Share)

**Файли:**

- `app/(tabs)/profile.tsx`

---

### 🖼️ Modals & Grid Developer

**Що робить (як на уроці):**

- Реалізує FlatList з grid постів
- Модальне вікно перегляду посту
- Модальне вікно редагування профілю
- `KeyboardAvoidingView` для форми

**Файли:**

- `app/(tabs)/profile.tsx` (доповнення)

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
git checkout -b feature/profile-backend

# Styles Developer
git checkout -b feature/profile-styles

# Profile UI Developer
git checkout -b feature/profile-ui

# Modals & Grid Developer
git checkout -b feature/profile-modals
```

### Крок 3: Після завершення роботи

```bash
git add .
git commit -m "feat: add profile page with edit functionality"
git push origin feature/profile-backend
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
│  Team Lead      │ Styles Dev      │ Profile UI Dev  │ Modals Dev    │
│  (Backend)      │                 │                 │               │
│                 │                 │                 │               │
│  • getPostsBy   │  • profile.     │  • ProfileScreen│  • FlatList   │
│    User query   │    styles.ts    │    основа       │    grid       │
│  • updateProfile│  • header       │  • Header       │  • Selected   │
│    mutation     │  • profileInfo  │  • Profile Info │    Post Modal │
│                 │  • stats        │  • Action       │  • Edit       │
│                 │  • actionButtons│    Buttons      │    Profile    │
│                 │  • grid         │  • NoPostsFound │    Modal      │
│                 │  • modals       │                 │  • Keyboard   │
│                 │  • input        │                 │    Avoiding   │
└─────────────────┴─────────────────┴─────────────────┴───────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Інтеграція                                  │
│              Team Lead мержить всі гілки                            │
│              Команда тестує Profile Page                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Що має працювати в кінці

### ✅ Обов'язково:

1. **Header** — username та кнопка logout
2. **Avatar** — відображається зображення користувача
3. **Stats** — posts, followers, following
4. **Name & Bio** — відображаються дані профілю
5. **Edit Profile кнопка** — відкриває модальне вікно
6. **Share кнопка** — відображається (функціонал опціонально)
7. **Posts Grid** — 3 колонки з постами
8. **NoPostsFound** — якщо немає постів
9. **Selected Post Modal** — перегляд посту на повний екран
10. **Edit Profile Modal** — редагування name та bio
11. **KeyboardAvoidingView** — форма зміщується при клавіатурі
12. **Save Changes** — зберігає зміни профілю

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
│       ├── create.tsx
│       ├── bookmarks.tsx
│       ├── notifications.tsx
│       └── profile.tsx            # ОНОВЛЕНИЙ
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
│   ├── notifications.styles.ts
│   └── profile.styles.ts          # НОВИЙ ФАЙЛ
├── convex/
│   ├── auth.config.ts
│   ├── schema.ts
│   ├── users.ts                   # ОНОВЛЕНИЙ (updateProfile)
│   ├── http.ts
│   ├── posts.ts                   # ОНОВЛЕНИЙ (getPostsByUser)
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

| Критерій                            | Бали    |
| ----------------------------------- | ------- |
| **Backend**                         |         |
| `getPostsByUser` query працює       | 10      |
| `updateProfile` mutation працює     | 10      |
| **Styles**                          |         |
| `profile.styles.ts` створено        | 10      |
| Всі стилі правильно застосовані     | 5       |
| **Profile UI**                      |         |
| Header з username та logout         | 5       |
| Avatar відображається               | 5       |
| Stats (posts, followers, following) | 5       |
| Name та Bio відображаються          | 5       |
| Action Buttons працюють             | 5       |
| NoPostsFound відображається         | 5       |
| **Modals & Grid**                   |         |
| FlatList з numColumns={3}           | 10      |
| Selected Post Modal працює          | 10      |
| Edit Profile Modal працює           | 10      |
| KeyboardAvoidingView працює         | 5       |
| Save Changes зберігає дані          | 5       |
| **Всього**                          | **105** |

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
3. **Перейти на Profile** — має відображатись ваш профіль
4. **Перевірити Header** — username та logout кнопка
5. **Перевірити Stats** — posts, followers, following
6. **Створити пост** — він має з'явитись в grid
7. **Натиснути на пост** — має відкритись модальне вікно
8. **Закрити модальне вікно** — натиснути X
9. **Натиснути Edit Profile** — має відкритись форма
10. **Змінити Name та Bio** — ввести нові дані
11. **Натиснути Save Changes** — дані мають оновитись
12. **Перевірити клавіатуру** — форма має зміщуватись

### Можливі помилки:

| Помилка                        | Причина                        | Рішення                      |
| ------------------------------ | ------------------------------ | ---------------------------- |
| `User not found`               | Немає індексу by_user          | Перевірте schema.ts          |
| Posts не відображаються        | getPostsByUser не працює       | Перевірте query та індекс    |
| Grid не працює                 | numColumns не встановлено      | Додайте numColumns={3}       |
| Модальне вікно не закривається | onRequestClose не встановлено  | Додайте onRequestClose       |
| Клавіатура перекриває форму    | KeyboardAvoidingView відсутній | Додайте KeyboardAvoidingView |
| Зміни не зберігаються          | updateProfile не викликається  | Перевірте handleSaveProfile  |
| Стилі не застосовуються        | Неправильний імпорт            | Перевірте шлях до styles     |

---

## Чек-лист перед здачею

### Team Lead / Backend Developer

- [ ] `getPostsByUser` query створено в `convex/posts.ts`
- [ ] `updateProfile` mutation створено в `convex/users.ts`
- [ ] Індекс `by_user` існує в schema.ts
- [ ] Всі гілки змержені в `main`

### Styles Developer

- [ ] `styles/profile.styles.ts` створено
- [ ] Стилі для header працюють
- [ ] Стилі для profileInfo працюють
- [ ] Стилі для stats працюють
- [ ] Стилі для actionButtons працюють
- [ ] Стилі для grid працюють
- [ ] Стилі для modals працюють
- [ ] Стилі для input працюють

### Profile UI Developer

- [ ] Header з username відображається
- [ ] Logout кнопка працює
- [ ] Avatar відображається
- [ ] Stats відображаються
- [ ] Name та Bio відображаються
- [ ] Edit Profile кнопка відкриває модальне вікно
- [ ] Share кнопка відображається
- [ ] NoPostsFound відображається якщо немає постів

### Modals & Grid Developer

- [ ] FlatList з numColumns={3} працює
- [ ] Пости відображаються в grid
- [ ] Selected Post Modal відкривається при натисканні
- [ ] Selected Post Modal закривається при натисканні X
- [ ] Edit Profile Modal відкривається
- [ ] Edit Profile Modal закривається
- [ ] KeyboardAvoidingView працює
- [ ] Save Changes зберігає дані

---

## Здача роботи

### Що потрібно здати:

1. **Посилання на GitHub репозиторій**
2. **Скріншот** сторінки профілю з постами
3. **Скріншот** модального вікна Edit Profile
4. **Скріншот** модального вікна перегляду посту
5. **Відео** (опціонально) — демонстрація редагування профілю

### Формат здачі:

```
Команда: [Назва команди]
Репозиторій: https://github.com/[username]/x-clone

Учасники:
- [Ім'я] — Team Lead / Backend Developer
- [Ім'я] — Styles Developer
- [Ім'я] — Profile UI Developer
- [Ім'я] — Modals & Grid Developer

Скріншоти:
- Profile Page: [посилання]
- Edit Profile Modal: [посилання]
- Selected Post Modal: [посилання]
```

---

## Діаграма структури Profile Page

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PROFILE PAGE                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  HEADER                                                      │   │
│  │  ┌─────────────────────┐          ┌─────────────────────┐   │   │
│  │  │ headerLeft          │          │ headerRight         │   │   │
│  │  │ [username]          │          │ [logout icon]       │   │   │
│  │  └─────────────────────┘          └─────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  PROFILE INFO                                                │   │
│  │  ┌────────────────┐  ┌────────────────────────────────────┐ │   │
│  │  │ avatarContainer│  │ statsContainer                     │ │   │
│  │  │  ┌──────────┐  │  │ ┌────────┐ ┌────────┐ ┌────────┐  │ │   │
│  │  │  │  avatar  │  │  │ │ Posts  │ │Followers│ │Following│ │ │   │
│  │  │  │  86x86   │  │  │ │   12   │ │  234   │ │  156   │  │ │   │
│  │  │  └──────────┘  │  │ └────────┘ └────────┘ └────────┘  │ │   │
│  │  └────────────────┘  └────────────────────────────────────┘ │   │
│  │                                                              │   │
│  │  name: John Doe                                              │   │
│  │  bio: Software Developer | React Native enthusiast           │   │
│  │                                                              │   │
│  │  actionButtons                                               │   │
│  │  ┌────────────────────────────────────┐ ┌─────────────────┐ │   │
│  │  │ editButton                         │ │ shareButton     │ │   │
│  │  │ [Edit Profile]                     │ │ [share icon]    │ │   │
│  │  └────────────────────────────────────┘ └─────────────────┘ │   │
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

## Діаграма KeyboardAvoidingView

```
┌──────────────────────────────────────────────────────────────────┐
│                    БЕЗ KeyboardAvoidingView                       │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────┐
│  Edit Profile                     [X]   │
│                                         │
│  Name                                   │
│  [___________________________]          │
│                                         │
│  Bio                                    │
│  [___________________________]  ← Курсор│
│                                         │
│  [      Save Changes      ]             │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │  ← Клавіатура
│  │  Q  W  E  R  T  Y  U  I  O  P   │    │    ПЕРЕКРИВАЄ
│  │  A  S  D  F  G  H  J  K  L      │    │    input!
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    З KeyboardAvoidingView                         │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────┐
│  Edit Profile                     [X]   │  ← Контент
│                                         │    ЗМІЩУЄТЬСЯ
│  Name                                   │    ВГОРУ
│  [___________________________]          │
│                                         │
│  Bio                                    │
│  [___________________________]  ← Курсор│
│                                         │
│  [      Save Changes      ]             │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │  ← Клавіатура
│  │  Q  W  E  R  T  Y  U  I  O  P   │    │    НЕ перекриває
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

---

## Корисні ресурси

### Документація

- [React Native Modal](https://reactnative.dev/docs/modal)
- [React Native FlatList](https://reactnative.dev/docs/flatlist)
- [React Native KeyboardAvoidingView](https://reactnative.dev/docs/keyboardavoidingview)
- [Expo Image](https://docs.expo.dev/versions/latest/sdk/image/)
- [Clerk useAuth](https://clerk.com/docs/references/react/use-auth)

### Корисні концепції

- **FlatList numColumns** — grid layout
- **Modal animationType** — "fade" або "slide"
- **KeyboardAvoidingView** — behavior="padding" (iOS) / "height" (Android)
- **TouchableWithoutFeedback** — Keyboard.dismiss()
- **ctx.db.patch()** — часткове оновлення документа

---

## Питання?

Якщо виникли питання — звертайтесь до викладача або в чат групи.

**Успіхів команді!** 🚀
