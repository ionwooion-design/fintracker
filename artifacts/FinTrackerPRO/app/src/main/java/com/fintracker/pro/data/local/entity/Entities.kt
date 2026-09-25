package com.fintracker.pro.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val username: String,
    val email: String,
    val passwordHash: String? = null,
    val emailVerified: Boolean = false,
    val verificationToken: String? = null,
    val googleId: String? = null,
    val avatarUrl: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "user_settings",
    foreignKeys = [ForeignKey(
        entity = UserEntity::class,
        parentColumns = ["id"],
        childColumns = ["userId"],
        onDelete = ForeignKey.CASCADE
    )]
)
data class UserSettingsEntity(
    @PrimaryKey val userId: Long,
    val userName: String = "",
    val avatarUri: String? = null,
    val startDate: Long,          // epoch day
    val initialBalance: Double = 0.0,
    val endDate: Long,             // epoch day
    val finalTarget: Double = 0.0,
    val currentStreak: Int = 0,
    val lastStreakDate: Long? = null,
    val lastBudgetDay: Long? = null,
    val updatedAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "categories",
    foreignKeys = [ForeignKey(
        entity = UserEntity::class,
        parentColumns = ["id"],
        childColumns = ["userId"],
        onDelete = ForeignKey.CASCADE
    )],
    indices = [Index(value = ["userId", "name"], unique = true)]
)
data class CategoryEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val userId: Long,
    val name: String,
    val color: String = "#78909C",
    val icon: String = "ri-question-line",
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "envelopes",
    foreignKeys = [ForeignKey(
        entity = UserEntity::class,
        parentColumns = ["id"],
        childColumns = ["userId"],
        onDelete = ForeignKey.CASCADE
    )],
    indices = [Index(value = ["userId", "name"], unique = true)]
)
data class EnvelopeEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val userId: Long,
    val name: String,
    val budget: Double,
    val color: String = "#26A69A",
    val icon: String = "ri-wallet-3-line",
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "transactions",
    foreignKeys = [
        ForeignKey(entity = UserEntity::class, parentColumns = ["id"], childColumns = ["userId"], onDelete = ForeignKey.CASCADE),
        ForeignKey(entity = CategoryEntity::class, parentColumns = ["id"], childColumns = ["categoryId"], onDelete = ForeignKey.SET_NULL),
        ForeignKey(entity = EnvelopeEntity::class, parentColumns = ["id"], childColumns = ["envelopeId"], onDelete = ForeignKey.SET_NULL)
    ],
    indices = [
        Index(value = ["userId", "transactionDate"]),
        Index(value = ["categoryId"]),
        Index(value = ["envelopeId"])
    ]
)
data class TransactionEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val userId: Long,
    val amount: Double,
    val type: String,               // INCOME / EXPENSE / TRANSFER
    val description: String = "Без названия",
    val transactionDate: Long,      // epoch day
    val categoryId: Long? = null,
    val envelopeId: Long? = null,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "fixed_events",
    foreignKeys = [ForeignKey(
        entity = UserEntity::class,
        parentColumns = ["id"],
        childColumns = ["userId"],
        onDelete = ForeignKey.CASCADE
    )],
    indices = [Index(value = ["userId"])]
)
data class FixedEventEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val userId: Long,
    val amount: Double,
    val description: String,
    val eventDate: Long,            // epoch day
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "categorization_rules",
    foreignKeys = [
        ForeignKey(entity = UserEntity::class, parentColumns = ["id"], childColumns = ["userId"], onDelete = ForeignKey.CASCADE),
        ForeignKey(entity = CategoryEntity::class, parentColumns = ["id"], childColumns = ["categoryId"], onDelete = ForeignKey.SET_NULL),
        ForeignKey(entity = EnvelopeEntity::class, parentColumns = ["id"], childColumns = ["envelopeId"], onDelete = ForeignKey.SET_NULL)
    ],
    indices = [Index(value = ["userId", "pattern"])]
)
data class CategorizationRuleEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val userId: Long,
    val pattern: String,
    val categoryId: Long? = null,
    val envelopeId: Long? = null
)

@Entity(
    tableName = "achievements",
    foreignKeys = [ForeignKey(
        entity = UserEntity::class,
        parentColumns = ["id"],
        childColumns = ["userId"],
        onDelete = ForeignKey.CASCADE
    )],
    indices = [Index(value = ["userId", "code"], unique = true)]
)
data class AchievementEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val userId: Long,
    val code: String,
    val name: String,
    val description: String,
    val icon: String,
    val unlockedAt: Long = System.currentTimeMillis()
)
