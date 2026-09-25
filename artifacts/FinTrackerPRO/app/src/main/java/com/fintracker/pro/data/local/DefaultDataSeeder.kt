package com.fintracker.pro.data.local

import com.fintracker.pro.data.local.dao.CategoryDao
import com.fintracker.pro.data.local.dao.EnvelopeDao
import com.fintracker.pro.data.local.dao.UserSettingsDao
import com.fintracker.pro.data.local.entity.CategoryEntity
import com.fintracker.pro.data.local.entity.EnvelopeEntity
import com.fintracker.pro.data.local.entity.UserSettingsEntity
import java.time.LocalDate
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DefaultDataSeeder @Inject constructor(
    private val settingsDao: UserSettingsDao,
    private val categoryDao: CategoryDao,
    private val envelopeDao: EnvelopeDao
) {
    suspend fun seedForNewUser(userId: Long) {
        // Default settings
        val today = LocalDate.now()
        settingsDao.insert(
            UserSettingsEntity(
                userId = userId,
                userName = "",
                startDate = today.toEpochDay(),
                initialBalance = 0.0,
                endDate = today.plusMonths(1).toEpochDay(),
                finalTarget = 0.0
            )
        )

        // Default categories
        val defaultCategories = listOf(
            CategoryEntity(userId = userId, name = "Еда", color = "#FF7043", icon = "ri-restaurant-line"),
            CategoryEntity(userId = userId, name = "Транспорт", color = "#42A5F5", icon = "ri-bus-line"),
            CategoryEntity(userId = userId, name = "Развлечения", color = "#AB47BC", icon = "ri-gamepad-line"),
            CategoryEntity(userId = userId, name = "Коммунальные", color = "#FFA726", icon = "ri-home-gear-line"),
            CategoryEntity(userId = userId, name = "Связь", color = "#26C6DA", icon = "ri-phone-line"),
            CategoryEntity(userId = userId, name = "Здоровье", color = "#EF5350", icon = "ri-heart-pulse-line"),
            CategoryEntity(userId = userId, name = "Одежда", color = "#EC407A", icon = "ri-shirt-line"),
            CategoryEntity(userId = userId, name = "Подарки", color = "#7E57C2", icon = "ri-gift-line"),
            CategoryEntity(userId = userId, name = "Другое", color = "#78909C", icon = "ri-more-line")
        )
        categoryDao.insertAll(defaultCategories)

        // Default envelopes
        val defaultEnvelopes = listOf(
            EnvelopeEntity(userId = userId, name = "Еда", budget = 15000.0, color = "#FF7043", icon = "ri-restaurant-line"),
            EnvelopeEntity(userId = userId, name = "Транспорт", budget = 5000.0, color = "#42A5F5", icon = "ri-bus-line"),
            EnvelopeEntity(userId = userId, name = "Развлечения", budget = 8000.0, color = "#AB47BC", icon = "ri-gamepad-line"),
            EnvelopeEntity(userId = userId, name = "Свободные деньги", budget = 10000.0, color = "#26A69A", icon = "ri-wallet-3-line")
        )
        envelopeDao.insertAll(defaultEnvelopes)
    }
}
