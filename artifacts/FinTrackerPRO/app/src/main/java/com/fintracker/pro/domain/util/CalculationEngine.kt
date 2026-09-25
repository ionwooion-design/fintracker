package com.fintracker.pro.domain.util

import com.fintracker.pro.domain.model.*
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import kotlin.math.max
import kotlin.math.min

/**
 * Core financial calculation engine for FinTracker PRO.
 * All formulas are pure and deterministic.
 */
object CalculationEngine {

    /**
     * Current Balance =
     *   initialBalance
     *   + sum of all incomes (transactions + past fixed events with positive amount)
     *   - sum of all expenses (transactions + past fixed events with negative amount)
     */
    fun calculateCurrentBalance(
        settings: UserSettings,
        transactions: List<Transaction>,
        fixedEvents: List<FixedEvent>,
        today: LocalDate = LocalDate.now()
    ): Double {
        val incomeFromTx = transactions
            .filter { it.type == TransactionType.INCOME }
            .sumOf { it.amount }

        val expenseFromTx = transactions
            .filter { it.type == TransactionType.EXPENSE }
            .sumOf { it.amount }

        val pastFixed = fixedEvents.filter { !it.eventDate.isAfter(today) }
        val fixedIncome = pastFixed.filter { it.amount > 0 }.sumOf { it.amount }
        val fixedExpense = pastFixed.filter { it.amount < 0 }.sumOf { -it.amount }

        return settings.initialBalance + incomeFromTx + fixedIncome - expenseFromTx - fixedExpense
    }

    /**
     * Daily Limit =
     *   (currentBalance - targetBalance - futureFixedNet) / daysRemaining
     *   where futureFixedNet = sum of future fixed events (positive income, negative expense)
     *
     * If daysRemaining <= 0 → 0
     * Result is clamped to >= 0
     */
    fun calculateDailyLimit(
        currentBalance: Double,
        settings: UserSettings,
        fixedEvents: List<FixedEvent>,
        today: LocalDate = LocalDate.now()
    ): Double {
        val daysRemaining = ChronoUnit.DAYS.between(today, settings.endDate).toInt().coerceAtLeast(0)
        if (daysRemaining == 0) return 0.0

        val futureFixedNet = fixedEvents
            .filter { it.eventDate.isAfter(today) }
            .sumOf { it.amount } // positive = income, negative = expense

        val available = currentBalance - settings.finalTarget - futureFixedNet
        return max(0.0, available / daysRemaining)
    }

    /**
     * Spent today (only EXPENSE transactions for today)
     */
    fun calculateSpentToday(
        transactions: List<Transaction>,
        today: LocalDate = LocalDate.now()
    ): Double {
        return transactions
            .filter { it.transactionDate == today && it.type == TransactionType.EXPENSE }
            .sumOf { it.amount }
    }

    /**
     * Progress percent = spentToday / dailyLimit * 100
     * Clamped 0..200 for visual purposes
     */
    fun calculateProgressPercent(spentToday: Double, dailyLimit: Double): Float {
        if (dailyLimit <= 0) return if (spentToday > 0) 100f else 0f
        return ((spentToday / dailyLimit) * 100).toFloat().coerceIn(0f, 200f)
    }

    /**
     * Color for progress bar according to spec:
     * < 50% → Green
     * < 85% → Yellow
     * ≥ 85% → Red
     */
    fun progressColorThreshold(percent: Float): ProgressColor {
        return when {
            percent < 50f -> ProgressColor.GREEN
            percent < 85f -> ProgressColor.YELLOW
            else -> ProgressColor.RED
        }
    }

    enum class ProgressColor { GREEN, YELLOW, RED }

    /**
     * Streak logic:
     * A day is successful if spent_today <= limit_at_start_of_day.
     * Streak continues only if consecutive successful days.
     * Resets to 0 on exceed or skipped day.
     */
    fun updateStreak(
        currentStreak: Int,
        lastBudgetDay: LocalDate?,
        spentToday: Double,
        dailyLimit: Double,
        today: LocalDate = LocalDate.now()
    ): Pair<Int, LocalDate?> {
        val isSuccessful = spentToday <= dailyLimit

        return when {
            !isSuccessful -> 0 to lastBudgetDay
            lastBudgetDay == null -> 1 to today
            lastBudgetDay == today -> currentStreak to lastBudgetDay // already counted
            lastBudgetDay == today.minusDays(1) -> (currentStreak + 1) to today
            else -> 1 to today // gap → restart
        }
    }

    /**
     * Balance projection until end of period.
     * Starts from currentBalance, subtracts dailyLimit each day,
     * adds/subtracts fixed events on their dates.
     */
    fun calculateBalanceProjection(
        currentBalance: Double,
        dailyLimit: Double,
        settings: UserSettings,
        fixedEvents: List<FixedEvent>,
        today: LocalDate = LocalDate.now()
    ): List<BalanceProjectionPoint> {
        val points = mutableListOf<BalanceProjectionPoint>()
        var balance = currentBalance
        var date = today

        while (!date.isAfter(settings.endDate)) {
            // Apply fixed events of this day
            val dayEvents = fixedEvents.filter { it.eventDate == date }
            balance += dayEvents.sumOf { it.amount }

            // Apply daily spending (except today — already reflected in currentBalance)
            if (date.isAfter(today)) {
                balance -= dailyLimit
            }

            points.add(BalanceProjectionPoint(date, balance))
            date = date.plusDays(1)
        }
        return points
    }

    /**
     * Free money = currentBalance - sum of remaining budgets of all envelopes
     * (or more accurately: money not allocated to envelopes)
     */
    fun calculateFreeMoney(
        currentBalance: Double,
        envelopes: List<EnvelopeWithSpent>
    ): Double {
        val allocatedRemaining = envelopes.sumOf { it.remaining.coerceAtLeast(0.0) }
        return currentBalance - allocatedRemaining
    }

    /**
     * Group transactions by day (descending)
     */
    fun groupTransactionsByDay(
        transactions: List<Transaction>
    ): Map<LocalDate, List<Transaction>> {
        return transactions
            .sortedByDescending { it.transactionDate }
            .groupBy { it.transactionDate }
    }

    /**
     * Generate AI tip based on progress percent
     */
    fun generateLocalAiTip(progressPercent: Float, remainingToday: Double): String {
        return when {
            progressPercent >= 100f -> "Вы превысили дневной лимит. Постарайтесь сократить расходы завтра."
            progressPercent >= 85f -> "Вы близки к лимиту. Осталось ${"%.0f".format(remainingToday)} ₽. Будьте осторожны."
            progressPercent >= 50f -> "Вы на правильном пути. Осталось ${"%.0f".format(remainingToday)} ₽ на сегодня."
            progressPercent > 0f -> "Отличный контроль! Вы потратили меньше половины дневного лимита."
            else -> "Новый день — новые возможности. Начните с планирования расходов."
        }
    }

    /**
     * Expense breakdown by category for donut chart
     */
    fun calculateCategoryBreakdown(
        transactions: List<Transaction>,
        categories: List<Category>,
        from: LocalDate,
        to: LocalDate
    ): List<CategoryExpense> {
        val periodTx = transactions.filter {
            it.type == TransactionType.EXPENSE &&
                    !it.transactionDate.isBefore(from) &&
                    !it.transactionDate.isAfter(to)
        }
        val total = periodTx.sumOf { it.amount }
        if (total <= 0) return emptyList()

        return periodTx
            .groupBy { it.categoryId }
            .mapNotNull { (catId, list) ->
                val category = categories.find { it.id == catId } ?: return@mapNotNull null
                val amount = list.sumOf { it.amount }
                CategoryExpense(
                    category = category,
                    amount = amount,
                    percent = ((amount / total) * 100).toFloat()
                )
            }
            .sortedByDescending { it.amount }
    }
}
