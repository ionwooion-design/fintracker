# FinTracker PRO

Personal finance tracking & budget planning Android application with gamification and AI assistant.

## Tech Stack

- **Language**: Kotlin
- **UI**: Jetpack Compose + Material 3
- **Architecture**: MVVM + Clean Architecture
- **Local DB**: Room (SQLite)
- **Network**: Retrofit + OkHttp + Kotlin Serialization
- **DI**: Hilt
- **Async**: Coroutines + Flow
- **Charts**: Vico
- **Image loading**: Coil
- **Preferences**: DataStore

## Project Structure

```
app/src/main/java/com/fintracker/pro/
├── di/                     # Hilt modules
├── data/
│   ├── local/              # Room entities, DAOs, Database, Preferences
│   ├── remote/             # Retrofit APIs, DTOs, Interceptors
│   └── repository/         # Repository implementations
├── domain/
│   ├── model/              # Domain models
│   ├── repository/         # Repository interfaces
│   ├── usecase/            # Use cases by feature
│   └── util/               # CalculationEngine (core business logic)
├── presentation/
│   ├── auth/
│   ├── dashboard/
│   ├── stats/
│   ├── envelopes/
│   ├── fixedevents/
│   ├── settings/
│   ├── profile/
│   ├── sms/
│   ├── ai/
│   └── common/             # Theme, Navigation, shared components
└── ui/                     # MainActivity
```

## Key Features Implemented in Foundation

- Full Clean Architecture + Hilt DI
- Room database with all entities from the specification
- CalculationEngine with complete formulas (balance, daily limit, streak, projection)
- Default categories & envelopes seeder
- Theme system (Light/Dark)
- DataStore for tokens and theme
- Retrofit + DeepSeek API interfaces
- Material 3 theming

## Getting Started

1. Open the project in **Android Studio Hedgehog or newer** (or Ladybug / Koala).
2. Sync Gradle.
3. Replace the placeholder base URL in `AppModule.kt` with your backend.
4. Add your DeepSeek API key where needed (recommended: BuildConfig or encrypted storage).
5. Run on a device / emulator (min API 26).

## Calculation Formulas (from CalculationEngine)

**Current Balance**  
`initialBalance + incomes - expenses + past fixed events`

**Daily Limit**  
`(currentBalance - targetBalance - futureFixedNet) / daysRemaining`

**Progress**  
`spentToday / dailyLimit * 100`  
Colors: <50% green, <85% yellow, ≥85% red

**Streak**  
Successful day = spent ≤ limit. Consecutive successful days only.

## Next Steps to Complete the App

1. Finish all Repository implementations
2. Implement Use Cases
3. Build Dashboard UI + custom Compose components
4. Auth screens + flow
5. Remaining feature screens (Stats, Envelopes, AI, SMS, Settings)
6. Unit tests for CalculationEngine
7. UI tests

## License

Private / proprietary – all rights reserved.
