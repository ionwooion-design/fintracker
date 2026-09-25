package com.fintracker.pro.presentation.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fintracker.pro.data.local.preferences.ThemePreferences
import com.fintracker.pro.data.local.preferences.TokenManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val themePreferences: ThemePreferences,
    private val tokenManager: TokenManager
) : ViewModel() {

    val isDarkTheme: StateFlow<Boolean> = themePreferences.isDarkTheme
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), false)

    val isPrivacyAccepted: StateFlow<Boolean> = themePreferences.isPrivacyAccepted
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), false)

    val isLoggedIn: StateFlow<Boolean> = tokenManager.tokenFlow
        .map { it != null }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), false)

    fun toggleTheme() {
        viewModelScope.launch {
            themePreferences.setDarkTheme(!isDarkTheme.value)
        }
    }

    fun acceptPrivacy() {
        viewModelScope.launch {
            themePreferences.setPrivacyAccepted(true)
        }
    }

    fun logout() {
        viewModelScope.launch {
            tokenManager.clear()
        }
    }
}
