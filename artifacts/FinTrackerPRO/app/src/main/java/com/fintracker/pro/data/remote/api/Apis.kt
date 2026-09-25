package com.fintracker.pro.data.remote.api

import com.fintracker.pro.data.remote.dto.*
import retrofit2.http.*

interface FinTrackerApi {
    @POST("api/v1/auth/login")
    suspend fun login(@Body body: LoginRequest): AuthResponse

    @POST("api/v1/auth/register")
    suspend fun register(@Body body: RegisterRequest): AuthResponse

    @GET("api/v1/user/data")
    suspend fun getUserData(): UserDataResponse

    @POST("api/v1/user/settings")
    suspend fun saveSettings(@Body body: SettingsRequest)

    @POST("api/v1/expenses")
    suspend fun addExpense(@Body body: ExpenseRequest): TransactionDto

    @PUT("api/v1/expenses/{id}")
    suspend fun editExpense(@Path("id") id: Long, @Body body: ExpenseRequest): TransactionDto

    @DELETE("api/v1/expenses/{id}")
    suspend fun deleteExpense(@Path("id") id: Long)

    @POST("api/v1/expenses/bulk-delete")
    suspend fun bulkDelete(@Body body: BulkDeleteRequest)

    @POST("api/v1/fixed-events")
    suspend fun saveFixedEvent(@Body body: FixedEventRequest): FixedEventDto

    @DELETE("api/v1/fixed-events/{id}")
    suspend fun deleteFixedEvent(@Path("id") id: Long)

    @GET("api/v1/envelopes")
    suspend fun getEnvelopes(): List<EnvelopeDto>

    @POST("api/v1/envelopes")
    suspend fun saveEnvelope(@Body body: EnvelopeRequest): EnvelopeDto

    @DELETE("api/v1/envelopes/{id}")
    suspend fun deleteEnvelope(@Path("id") id: Long)

    @POST("api/v1/transactions/import-sms")
    suspend fun importSms(@Body body: SmsImportRequest): SmsImportResponse

    @POST("api/v1/ai/advice")
    suspend fun askAi(@Body body: AiAdviceRequest): AiAdviceResponse

    @PUT("api/v1/user/profile")
    suspend fun updateProfile(@Body body: ProfileRequest)

    @POST("api/v1/user/reset")
    suspend fun resetData()
}

interface DeepSeekApi {
    @POST("v1/chat/completions")
    suspend fun chatCompletions(
        @Header("Authorization") authorization: String,
        @Body body: DeepSeekRequest
    ): DeepSeekResponse
}
