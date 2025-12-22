# Гайд: Локальна збірка Android APK для Expo проєкту на Windows

Цей гайд описує повний процес створення Android APK (Debug та Release) для Expo/React Native проєкту на Windows без використання EAS Cloud.

---

## Зміст

1. [Вимоги](#вимоги)
2. [Встановлення залежностей](#встановлення-залежностей)
3. [Налаштування додатку (app.config.ts)](#налаштування-додатку-appconfigts)
4. [Генерація нативного Android проєкту](#генерація-нативного-android-проєкту)
5. [Збірка Debug APK](#збірка-debug-apk)
6. [Збірка Release APK](#збірка-release-apk)
7. [Встановлення APK](#встановлення-apk)
8. [Вирішення типових проблем](#вирішення-типових-проблем)

---

## Вимоги

- **Node.js** (LTS версія)
- **JDK 17** (Java Development Kit) — **не JRE, не Java 25+**
- **Android SDK** (через Android Studio або окремо)
- **Expo CLI** (`npx expo`)

---

## Встановлення залежностей

### 1. Встановити JDK 17

Завантажити з [Eclipse Adoptium (Temurin)](https://adoptium.net/temurin/releases/?os=windows&arch=x64&package=jdk&version=17):

- Обрати **Windows x64 .msi**
- Встановити

> ⚠️ **Важливо**: React Native/Gradle не підтримує Java 25+. Використовуй JDK 17.

### 2. Встановити Android Studio (для SDK)

Завантажити з [developer.android.com/studio](https://developer.android.com/studio):

- Під час встановлення обрати: Android SDK, Android SDK Platform, Android NDK

### 3. Налаштувати змінні середовища

Відкрити **System Properties → Environment Variables** і додати:

| Змінна         | Значення (приклад)                                 |
| -------------- | -------------------------------------------------- |
| `JAVA_HOME`    | `C:\Program Files\Eclipse Adoptium\jdk-17.0.13+11` |
| `JAVA_HOME`    | `C:\Program Files\Android\Android Studio\jbr`      |
| `ANDROID_HOME` | `C:\Users\<username>\AppData\Local\Android\Sdk`    |

Додати до `PATH`:

- `%JAVA_HOME%\bin`
- `%ANDROID_HOME%\platform-tools`
- `%ANDROID_HOME%\build-tools\35.0.0`

### 4. Перевірити встановлення

```bash
javac -version
# Має показати: javac 17.x.x

```

---

## Налаштування додатку (app.config.ts)

Всі параметри додатку налаштовуються у файлі `app.config.ts` в корені проєкту.

### Основні параметри

```typescript
// Базові налаштування (рядки 9-12)
const APP_NAME = 'UA Messenger'; // Ім'я додатку в лаунчері
const BUNDLE_IDENTIFIER = 'com.skhmelyuk.uamesseger'; // iOS bundle ID
const PACKAGE_NAME = 'com.skhmelyuk.uamesseger'; // Android package name
const SCHEME = 'ua-messeger'; // Deep link scheme
```

### Іконки

```typescript
// Шляхи до іконок (рядки 15-17)
const ICON = './assets/images/icon.png';
const ADAPTIVE_ICON_FOREGROUND = './assets/images/android-icon-foreground.png';
const ADAPTIVE_ICON_BACKGROUND = './assets/images/android-icon-background.png';
```

### Версії

| Параметр              | Розташування | Опис                                          |
| --------------------- | ------------ | --------------------------------------------- |
| `version`             | рядок 36     | Версія для користувачів (напр. `1.0.0`)       |
| `android.versionCode` | рядок 55     | Внутрішня версія для Google Play (ціле число) |
| `ios.buildNumber`     | рядок 46     | Номер білда для App Store                     |

### Android-специфічні налаштування

```typescript
android: {
  package: 'com.skhmelyuk.uamesseger',  // Package name (унікальний ID в Play Store)
  versionCode: 1,                        // Збільшувати при кожному релізі
  adaptiveIcon: {
    backgroundColor: '#000000',
    foregroundImage: './assets/images/android-icon-foreground.png',
    backgroundImage: './assets/images/android-icon-background.png',
  },
  permissions: [
    'android.permission.CAMERA',
    'android.permission.READ_EXTERNAL_STORAGE',
    'android.permission.WRITE_EXTERNAL_STORAGE',
    'android.permission.RECORD_AUDIO',
  ],
}
```

### Середовища (environments)

Конфіг підтримує різні середовища через змінну `APP_ENV`:

| Середовище    | Ім'я додатку         | Package name                       |
| ------------- | -------------------- | ---------------------------------- |
| `development` | UA Messenger Dev     | `com.skhmelyuk.uamesseger.dev`     |
| `preview`     | UA Messenger Preview | `com.skhmelyuk.uamesseger.preview` |
| `production`  | UA Messenger         | `com.skhmelyuk.uamesseger`         |

Середовище задається в `.env.local`:

```
APP_ENV=development
```

---

## Генерація нативного Android проєкту

З кореневої папки проєкту виконати:

```bash
npx expo prebuild -p android
```

Це створить папку `android/` з нативним Android проєктом.

---

## Збірка Debug APK

### 1. Створити `local.properties`

Створити файл `android/local.properties` з вмістом:

```properties
sdk.dir=C:\\Users\\<username>\\AppData\\Local\\Android\\Sdk
sdk.dir=C:/Users/<username>/AppData/Local/Android/Sdk

```

> Замінити `<username>` на своє ім'я користувача Windows.

Файл `android/gradle.properties` з вмістом:

```
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m -Dfile.encoding=UTF-8
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.workers.max=2
```

### 2. Запустити збірку

```bash
cd android
NODE_ENV=development ./gradlew assembleDebug
```

### 3. Знайти APK

Після успішної збірки файл буде тут:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Збірка Release APK

Змінити в `.env.local`:

```
APP_ENV=production
```

### Після зміни параметрів

Якщо змінюєш ім'я, package name, іконки або permissions — потрібно перегенерувати нативний проєкт:

```bash

npx expo prebuild -p android --clean
```

Зупини Gradle daemons

```bash
./gradlew --stop
```

Видалити папку

```bash
rm -rf ../node_modules/expo-modules-core/android/build
```

Створити файл `android/local.properties` з вмістом:

```properties
sdk.dir=C:\\Users\\<username>\\AppData\\Local\\Android\\Sdk
sdk.dir=C:/Users/<username>/AppData/Local/Android/Sdk
```

### 1. Створити Keystore (ключ підпису)

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore ua-messenger.keystore -alias ua-messenger -keyalg RSA -keysize 2048 -validity 10000
```

Ввести:

- Пароль для keystore (запам'ятати!)
- Ім'я, організація, місто, країна (можна пропустити Enter)

> ⚠️ **Важливо**: Зберегти keystore файл і пароль надійно! Без них неможливо оновлювати додаток у Google Play.

### 2. Перемістити keystore

```bash
mv ua-messenger.keystore android/app/
```

### 3. Налаштувати `gradle.properties`

Файл `android/gradle.properties` з вмістом:

```
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m -Dfile.encoding=UTF-8
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.workers.max=2
```

І додати в кінець:

```properties
MYAPP_UPLOAD_STORE_FILE=ua-messenger.keystore
MYAPP_UPLOAD_KEY_ALIAS=ua-messenger
MYAPP_UPLOAD_STORE_PASSWORD=твій_пароль
MYAPP_UPLOAD_KEY_PASSWORD=твій_пароль
```

### 4. Налаштувати `build.gradle`

Відкрити `android/app/build.gradle`.

**Додати всередині блоку `android {`** (перед `buildTypes`):

```gradle
signingConfigs {
    release {
        if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
            storeFile file(MYAPP_UPLOAD_STORE_FILE)
            storePassword MYAPP_UPLOAD_STORE_PASSWORD
            keyAlias MYAPP_UPLOAD_KEY_ALIAS
            keyPassword MYAPP_UPLOAD_KEY_PASSWORD
        }
    }
}
```

**Змінити блок `buildTypes { release { ... } }`**:

```gradle
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

### 5. Запустити збірку

```bash
cd android
NODE_ENV=production ./gradlew assembleRelease
```

### 6. Знайти APK

```
android/app/build/outputs/apk/release/app-release.apk
```

---

## Встановлення APK

### На фізичний пристрій

1. Скопіювати APK на телефон (USB, Google Drive, Telegram тощо)
2. Дозволити встановлення з невідомих джерел
3. Відкрити файл і встановити

### Поділитися з тестерами

- Надіслати файл напряму
- Завантажити на [Diawi](https://www.diawi.com/)
- Використати Firebase App Distribution

---

## Вирішення типових проблем

### `No Java compiler found`

**Причина**: Встановлено JRE замість JDK, або `JAVA_HOME` не налаштовано.

**Рішення**: Встановити JDK 17 і налаштувати `JAVA_HOME`.

### `> 25.0.1` (помилка версії Java)

**Причина**: Java 25 занадто нова для React Native/Gradle.

**Рішення**: Встановити JDK 17 і перемкнути `JAVA_HOME` на нього.

### `SDK location not found`

**Причина**: Gradle не знає шлях до Android SDK.

**Рішення**: Створити `android/local.properties` з `sdk.dir=...` або налаштувати `ANDROID_HOME`.

### `ENOENT spawn cmd.exe`

**Причина**: Команда запущена з неправильної директорії.

**Рішення**: Переконатися, що ви в кореневій папці проєкту (не в `android/`).

---

## Корисні команди

| Команда                        | Опис                                |
| ------------------------------ | ----------------------------------- |
| `npx expo prebuild -p android` | Згенерувати нативний Android проєкт |
| `./gradlew assembleDebug`      | Зібрати Debug APK                   |
| `./gradlew assembleRelease`    | Зібрати Release APK                 |
| `./gradlew bundleRelease`      | Зібрати AAB для Google Play         |
| `./gradlew clean`              | Очистити кеш збірки                 |
| `adb install <path.apk>`       | Встановити APK на пристрій/емулятор |

---

## Структура файлів після збірки

```
ua-messenger/
├── android/
│   ├── app/
│   │   ├── build/
│   │   │   └── outputs/
│   │   │       └── apk/
│   │   │           ├── debug/
│   │   │           │   └── app-debug.apk      ← Debug APK
│   │   │           └── release/
│   │   │               └── app-release.apk    ← Release APK
│   │   ├── ua-messenger.keystore              ← Ключ підпису
│   │   └── build.gradle                       ← Конфігурація збірки
│   ├── gradle.properties                      ← Паролі keystore
│   └── local.properties                       ← Шлях до SDK
└── ...
```

---

## Додаткові ресурси

- [Expo: Local app development](https://docs.expo.dev/guides/local-app-development/)
- [React Native: Publishing to Google Play Store](https://reactnative.dev/docs/signed-apk-android)
- [Android: App signing](https://developer.android.com/studio/publish/app-signing)

---

_Гайд створено на основі реального досвіду збірки проєкту ua-messenger на Windows._
