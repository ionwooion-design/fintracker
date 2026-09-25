package com.fintracker.pro.di

import android.content.Context
import androidx.room.Room
import com.fintracker.pro.data.local.FinTrackerDatabase
import com.fintracker.pro.data.local.dao.*
import com.fintracker.pro.data.remote.api.DeepSeekApi
import com.fintracker.pro.data.remote.api.FinTrackerApi
import com.fintracker.pro.data.remote.interceptor.AuthInterceptor
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import java.util.concurrent.TimeUnit
import javax.inject.Named
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): FinTrackerDatabase {
        return Room.databaseBuilder(
            context,
            FinTrackerDatabase::class.java,
            "fintracker.db"
        )
            .fallbackToDestructiveMigration()
            .build()
    }

    @Provides fun provideUserDao(db: FinTrackerDatabase): UserDao = db.userDao()
    @Provides fun provideUserSettingsDao(db: FinTrackerDatabase): UserSettingsDao = db.userSettingsDao()
    @Provides fun provideCategoryDao(db: FinTrackerDatabase): CategoryDao = db.categoryDao()
    @Provides fun provideEnvelopeDao(db: FinTrackerDatabase): EnvelopeDao = db.envelopeDao()
    @Provides fun provideTransactionDao(db: FinTrackerDatabase): TransactionDao = db.transactionDao()
    @Provides fun provideFixedEventDao(db: FinTrackerDatabase): FixedEventDao = db.fixedEventDao()
    @Provides fun provideAchievementDao(db: FinTrackerDatabase): AchievementDao = db.achievementDao()
    @Provides fun provideCategorizationRuleDao(db: FinTrackerDatabase): CategorizationRuleDao = db.categorizationRuleDao()

    @Provides
    @Singleton
    fun provideJson(): Json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

    @Provides
    @Singleton
    fun provideOkHttpClient(authInterceptor: AuthInterceptor): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            })
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    @Named("MainApi")
    fun provideMainRetrofit(client: OkHttpClient, json: Json): Retrofit {
        return Retrofit.Builder()
            .baseUrl("https://api.fintracker.pro/") // placeholder – replace with real backend
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
    }

    @Provides
    @Singleton
    @Named("DeepSeek")
    fun provideDeepSeekRetrofit(json: Json): Retrofit {
        val client = OkHttpClient.Builder()
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            })
            .connectTimeout(60, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .build()

        return Retrofit.Builder()
            .baseUrl("https://api.deepseek.com/")
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
    }

    @Provides
    @Singleton
    fun provideFinTrackerApi(@Named("MainApi") retrofit: Retrofit): FinTrackerApi =
        retrofit.create(FinTrackerApi::class.java)

    @Provides
    @Singleton
    fun provideDeepSeekApi(@Named("DeepSeek") retrofit: Retrofit): DeepSeekApi =
        retrofit.create(DeepSeekApi::class.java)
}
