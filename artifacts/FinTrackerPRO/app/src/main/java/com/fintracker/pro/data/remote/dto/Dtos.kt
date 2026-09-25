package com.fintracker.pro.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class LoginRequest(val email: String, val password: String)

@Serializable
data class RegisterRequest(val username: String, val email: String, val password: String)

@Serializable
data class AuthResponse(
    val success: Boolean,
    val token: String? = null,
    val userId: Long? = null,
    val error: String? = null
)

@Serializable
data class UserDataResponse(
    val settings: SettingsDto? = null,
    val transactions: List<TransactionDto> = emptyList(),
    val envelopes: List<EnvelopeDto> = emptyList(),
    val fixedEvents: List<FixedEventDto> = emptyList(),
    val categories: List<CategoryDto> = emptyList(),
    val achievements: List<AchievementDto> = emptyList()
)

@Serializable
data class SettingsDto(
    val startDate: String,
    val initialBalance: Double,
    val endDate: String,
    val finalTarget: Double,
    val currentStreak: Int = 0
)

@Serializable
data class SettingsRequest(
    val startDate: String,
    val initialBalance: Double,
    val endDate: String,
    val finalTarget: Double
)

@Serializable
data class TransactionDto(
    val id: Long,
    val amount: Double,
    val type: String,
    val description: String,
    val transactionDate: String,
    val categoryId: Long? = null,
    val envelopeId: Long? = null
)

@Serializable
data class ExpenseRequest(
    val amount: Double,
    val description: String = "Без названия",
    val transactionDate: String,
    val categoryId: Long? = null,
    val envelopeId: Long? = null
)

@Serializable
data class BulkDeleteRequest(val day: String? = null, val month: String? = null)

@Serializable
data class EnvelopeDto(
    val id: Long,
    val name: String,
    val budget: Double,
    val color: String,
    val icon: String
)

@Serializable
data class EnvelopeRequest(
    val id: Long? = null,
    val name: String,
    val budget: Double,
    val color: String,
    val icon: String
)

@Serializable
data class FixedEventDto(
    val id: Long,
    val amount: Double,
    val description: String,
    val eventDate: String
)

@Serializable
data class FixedEventRequest(
    val id: Long? = null,
    val amount: Double,
    val description: String,
    val eventDate: String
)

@Serializable
data class CategoryDto(
    val id: Long,
    val name: String,
    val color: String,
    val icon: String
)

@Serializable
data class AchievementDto(
    val id: Long,
    val code: String,
    val name: String,
    val description: String,
    val icon: String,
    val unlockedAt: String
)

@Serializable
data class SmsImportRequest(val text: String)

@Serializable
data class SmsImportResponse(val successCount: Int, val failedCount: Int, val messages: List<String>)

@Serializable
data class AiAdviceRequest(val context: String)

@Serializable
data class AiAdviceResponse(val tips: List<String>)

@Serializable
data class ProfileRequest(val userName: String, val avatarUrl: String? = null)

// DeepSeek
@Serializable
data class DeepSeekRequest(
    val model: String = "deepseek-chat",
    val messages: List<DeepSeekMessage>,
    val temperature: Double = 0.7,
    val max_tokens: Int = 1024
)

@Serializable
data class DeepSeekMessage(
    val role: String,
    val content: String
)

@Serializable
data class DeepSeekResponse(
    val choices: List<DeepSeekChoice> = emptyList()
)

@Serializable
data class DeepSeekChoice(
    val message: DeepSeekMessage
)
