package com.fintracker.pro.data.local

import com.fintracker.pro.data.local.entity.*
import com.fintracker.pro.domain.model.*
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneOffset

fun UserEntity.toDomain() = User(
    id = id,
    username = username,
    email = email,
    emailVerified = emailVerified,
    googleId = googleId,
    avatarUrl = avatarUrl,
    createdAt = LocalDateTime.ofInstant(Instant.ofEpochMilli(createdAt), ZoneOffset.UTC)
)

fun UserSettingsEntity.toDomain() = UserSettings(
    userId = userId,
    userName = userName,
    avatarUri = avatarUri,
    startDate = LocalDate.ofEpochDay(startDate),
    initialBalance = initialBalance,
    endDate = LocalDate.ofEpochDay(endDate),
    finalTarget = finalTarget,
    currentStreak = currentStreak,
    lastStreakDate = lastStreakDate?.let { LocalDate.ofEpochDay(it) },
    lastBudgetDay = lastBudgetDay?.let { LocalDate.ofEpochDay(it) },
    updatedAt = LocalDateTime.ofInstant(Instant.ofEpochMilli(updatedAt), ZoneOffset.UTC)
)

fun UserSettings.toEntity() = UserSettingsEntity(
    userId = userId,
    userName = userName,
    avatarUri = avatarUri,
    startDate = startDate.toEpochDay(),
    initialBalance = initialBalance,
    endDate = endDate.toEpochDay(),
    finalTarget = finalTarget,
    currentStreak = currentStreak,
    lastStreakDate = lastStreakDate?.toEpochDay(),
    lastBudgetDay = lastBudgetDay?.toEpochDay(),
    updatedAt = System.currentTimeMillis()
)

fun CategoryEntity.toDomain() = Category(
    id = id,
    userId = userId,
    name = name,
    color = color,
    icon = icon,
    createdAt = LocalDateTime.ofInstant(Instant.ofEpochMilli(createdAt), ZoneOffset.UTC)
)

fun Category.toEntity() = CategoryEntity(
    id = id,
    userId = userId,
    name = name,
    color = color,
    icon = icon
)

fun EnvelopeEntity.toDomain() = Envelope(
    id = id,
    userId = userId,
    name = name,
    budget = budget,
    color = color,
    icon = icon,
    createdAt = LocalDateTime.ofInstant(Instant.ofEpochMilli(createdAt), ZoneOffset.UTC),
    updatedAt = LocalDateTime.ofInstant(Instant.ofEpochMilli(updatedAt), ZoneOffset.UTC)
)

fun Envelope.toEntity() = EnvelopeEntity(
    id = id,
    userId = userId,
    name = name,
    budget = budget,
    color = color,
    icon = icon,
    updatedAt = System.currentTimeMillis()
)

fun TransactionEntity.toDomain() = Transaction(
    id = id,
    userId = userId,
    amount = amount,
    type = TransactionType.valueOf(type),
    description = description,
    transactionDate = LocalDate.ofEpochDay(transactionDate),
    categoryId = categoryId,
    envelopeId = envelopeId,
    createdAt = LocalDateTime.ofInstant(Instant.ofEpochMilli(createdAt), ZoneOffset.UTC)
)

fun Transaction.toEntity() = TransactionEntity(
    id = id,
    userId = userId,
    amount = amount,
    type = type.name,
    description = description,
    transactionDate = transactionDate.toEpochDay(),
    categoryId = categoryId,
    envelopeId = envelopeId
)

fun FixedEventEntity.toDomain() = FixedEvent(
    id = id,
    userId = userId,
    amount = amount,
    description = description,
    eventDate = LocalDate.ofEpochDay(eventDate),
    createdAt = LocalDateTime.ofInstant(Instant.ofEpochMilli(createdAt), ZoneOffset.UTC),
    updatedAt = LocalDateTime.ofInstant(Instant.ofEpochMilli(updatedAt), ZoneOffset.UTC)
)

fun FixedEvent.toEntity() = FixedEventEntity(
    id = id,
    userId = userId,
    amount = amount,
    description = description,
    eventDate = eventDate.toEpochDay(),
    updatedAt = System.currentTimeMillis()
)

fun AchievementEntity.toDomain() = Achievement(
    id = id,
    userId = userId,
    code = code,
    name = name,
    description = description,
    icon = icon,
    unlockedAt = LocalDateTime.ofInstant(Instant.ofEpochMilli(unlockedAt), ZoneOffset.UTC)
)
