package com.fintracker.pro.data.local.preferences

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.themeDataStore: DataStore<Preferences> by preferencesDataStore(name = "theme_prefs")

@Singleton
class ThemePreferences @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val DARK_THEME_KEY = booleanPreferencesKey("dark_theme")
    private val PRIVACY_ACCEPTED_KEY = booleanPreferencesKey("privacy_accepted")

    val isDarkTheme: Flow<Boolean> = context.themeDataStore.data
        .map { it[DARK_THEME_KEY] ?: false }

    val isPrivacyAccepted: Flow<Boolean> = context.themeDataStore.data
        .map { it[PRIVACY_ACCEPTED_KEY] ?: false }

    suspend fun setDarkTheme(enabled: Boolean) {
        context.themeDataStore.edit { it[DARK_THEME_KEY] = enabled }
    }

    suspend fun setPrivacyAccepted(accepted: Boolean) {
        context.themeDataStore.edit { it[PRIVACY_ACCEPTED_KEY] = accepted }
    }
}
