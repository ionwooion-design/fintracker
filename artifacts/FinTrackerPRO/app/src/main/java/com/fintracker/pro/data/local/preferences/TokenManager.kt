package com.fintracker.pro.data.local.preferences

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "secure_prefs")

@Singleton
class TokenManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val TOKEN_KEY = stringPreferencesKey("jwt_token")
    private val USER_ID_KEY = stringPreferencesKey("user_id")

    val tokenFlow: Flow<String?> = context.dataStore.data.map { it[TOKEN_KEY] }
    val userIdFlow: Flow<Long?> = context.dataStore.data.map { it[USER_ID_KEY]?.toLongOrNull() }

    suspend fun getToken(): String? = context.dataStore.data.first()[TOKEN_KEY]
    suspend fun getUserId(): Long? = context.dataStore.data.first()[USER_ID_KEY]?.toLongOrNull()

    suspend fun saveToken(token: String, userId: Long) {
        context.dataStore.edit {
            it[TOKEN_KEY] = token
            it[USER_ID_KEY] = userId.toString()
        }
    }

    suspend fun clear() {
        context.dataStore.edit { it.clear() }
    }
}
