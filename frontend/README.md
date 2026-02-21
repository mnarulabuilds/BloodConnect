
# 🩸 BloodConnect Universal App

A premium, cross-platform React Native application designed to connect blood donors directly with those in need, eliminating the hospital middleman for faster, life-saving interactions.

## 🚀 Key Features

- **Direct Peer-to-Peer Connection**: Search and filter donors directly by blood group and location.
- **Urgent Request System**: Post emergency blood needs that are broadcasted to all nearby donors.
- **Secure Donor Profiles**: Donors can manage their availability status to protect their privacy.
- **Premium UX**: Modern, high-performance UI with support for both Light and Dark modes.
- **Universal Support**: Runs on **Android, iOS, and Web** from a single codebase.

## 🛠️ Technology Stack

- **Framework**: React Native with Expo (SDK 51+)
- **Navigation**: Expo Router (File-based navigation)
- **Styling**: Native StyleSheet with custom Theme tokens
- **Icons**: Expo Vector Icons (Ionicons)
- **State**: React Hooks & Context API

## 🏃 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Developing
```bash
npx expo start
```

- Press **`a`** for Android
- Press **`i`** for iOS
- Press **`w`** for Web

## 📂 Project Structure

- `app/(auth)`: Secure Login and Role-based Registration.
- `app/(tabs)`: Main application navigation (Home, Donors, Profile).
- `app/request-blood.tsx`: Modal for creating urgent blood requests.
- `constants/theme.ts`: Global design system tokens.
- `constants/data.ts`: Mock data for donors and requests.

---
Built with ❤️ by BloodConnect Team.
