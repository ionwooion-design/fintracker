package com.fintracker.pro.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.fintracker.pro.data.local.converter.Converters
import com.fintracker.pro.data.local.dao.*
import com.fintracker.pro.data.local.entity.*

@Database(
    entities = [
        UserEntity::class,
        UserSettingsEntity::class,
        CategoryEntity::class,
        EnvelopeEntity::class,
        TransactionEntity::class,
        FixedEventEntity::class,
        CategorizationRuleEntity::class,
        AchievementEntity::class
    ],
    version = 1,
    exportSchema = true
)
@TypeConverters(Converters::class)
abstract class FinTrackerDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun userSettingsDao(): UserSettingsDao
    abstract fun categoryDao(): CategoryDao
    abstract fun envelopeDao(): EnvelopeDao
    abstract fun transactionDao(): TransactionDao
    abstract fun fixedEventDao(): FixedEventDao
    abstract fun achievementDao(): AchievementDao
    abstract fun categorizationRuleDao(): CategorizationRuleDao
}
