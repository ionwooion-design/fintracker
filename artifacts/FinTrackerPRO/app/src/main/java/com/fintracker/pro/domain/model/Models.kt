package com.fintracker.pro.domain.model

import java.time.LocalDate
import java.time.LocalDateTime

data class User(
    val id: Long = 0,
    val username: String,
    val email: String,
    val emailVerified: Boolean = false,
    val googleId: String? = null,
    val avatarUrl: String? = null,
    val createdAt: LocalDateTime = LocalDateTime.now()
)

data class UserSettings(
    val userId: Long,
    val userName: String = "",
    val avatarUri: String? = null,
    val startDate: LocalDate = LocalDate.now(),
    val initialBalance: Double = 0.0,
    val endDate: LocalDate = LocalDate.now().plusMonths(1),
    val finalTarget: Double = 0.0,
    val currentStreak: Int = 0,
    val lastStreakDate: LocalDate? = null,
    val lastBudgetDay: LocalDate? = null,
    val updatedAt: LocalDateTime = LocalDateTime.now()
)

data class Category(
    val id: Long = 0,
    val userId: Long,
    val name: String,
    val color: String = "#78909C",
    val icon: String = "ri-question-line",
    val createdAt: LocalDateTime = LocalDateTime.now()
)

data class Envelope(
    val id: Long = 0,
    val userId: Long,
    val name: String,
    val budget: Double,
    val color: String = "#26A69A",
    val icon: String = "ri-wallet-3-line",
    val createdAt: LocalDateTime = LocalDateTime.now(),
    val updatedAt: LocalDateTime = LocalDateTime.now()
) {
    fun usagePercent(spent: Double): Float =
        if (budget <= 0) 0f else ((spent / budget) * 100).toFloat().coerceAtMost(200f)

    fun remaining(spent: Double): Double = budget - spent
}

data class Transaction(
    val id: Long = 0,
    val userId: Long,
    val amount: Double,
    val type: TransactionType = TransactionType.EXPENSE,
    val description: String = "Без названия",
    val transactionDate: LocalDate = LocalDate.now(),
    val categoryId: Long? = null,
    val envelopeId: Long? = null,
    val createdAt: LocalDateTime = LocalDateTime.now()
)

enum class TransactionType {
    INCOME, EXPENSE, TRANSFER
}

data class FixedEvent(
    val id: Long = 0,
    val userId: Long,
    val amount: Double, // positive = income, negative = expense
    val description: String,
    val eventDate: LocalDate,
    val createdAt: LocalDateTime = LocalDateTime.now(),
    val updatedAt: LocalDateTime = LocalDateTime.now()
)

data class CategorizationRule(
    val id: Long = 0,
    val userId: Long,
    val pattern: String,
    val categoryId: Long? = null,
    val envelopeId: Long? = null
)

data class Achievement(
    val id: Long = 0,
    val userId: Long,
    val code: String,
    val name: String,
    val description: String,
    val icon: String,
    val unlockedAt: LocalDateTime = LocalDateTime.now()
)

// Dashboard calculation result
data class DashboardData(
    val currentBalance: Double,
    val dailyLimit: Double,
    val spentToday: Double,
    val remainingToday: Double,
    val progressPercent: Float,
    val daysRemaining: Int,
    val targetBalance: Double,
    val currentStreak: Int,
    val envelopes: List<EnvelopeWithSpent>,
    val freeMoney: Double,
    val transactionsByDay: Map<LocalDate, List<Transaction>>,
    val aiTip: String
)

data class EnvelopeWithSpent(
    val envelope: Envelope,
    val spent: Double
) {
    val remaining: Double get() = envelope.remaining(spent)
    val usagePercent: Float get() = envelope.usagePercent(spent)
    val isOverBudget: Boolean get() = spent > envelope.budget
}

data class BalanceProjectionPoint(
    val date: LocalDate,
    val projectedBalance: Double
)

data class CategoryExpense(
    val category: Category,
    val amount: Double,
    val percent: Float
)

data class AuthResult(
    val success: Boolean,
    val token: String? = null,
    val user: User? = null,
    val error: String? = null
)

data class SmsImportResult(
    val successCount: Int,
    val failedCount: Int,
    val messages: List<String>
)
