package com.fintracker.pro.presentation.common.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.fintracker.pro.presentation.auth.LoginScreen
import com.fintracker.pro.presentation.auth.RegisterScreen
import com.fintracker.pro.presentation.auth.PrivacyPolicyScreen
import com.fintracker.pro.presentation.dashboard.DashboardScreen
import com.fintracker.pro.presentation.settings.SettingsViewModel
import com.fintracker.pro.presentation.common.navigation.Routes.DASHBOARD
import com.fintracker.pro.presentation.common.navigation.Routes.LOGIN
import com.fintracker.pro.presentation.common.navigation.Routes.PRIVACY
import com.fintracker.pro.presentation.common.navigation.Routes.REGISTER

object Routes {
    const val PRIVACY = "privacy"
    const val LOGIN = "login"
    const val REGISTER = "register"
    const val DASHBOARD = "dashboard"
    const val STATS = "stats"
    const val ENVELOPES = "envelopes"
    const val SETTINGS = "settings"
}

@Composable
fun FinTrackerNavGraph(
    navController: NavHostController = rememberNavController()
) {
    val settingsViewModel: SettingsViewModel = hiltViewModel()
    val privacyAccepted by settingsViewModel.isPrivacyAccepted.collectAsState(initial = false)
    val isLoggedIn by settingsViewModel.isLoggedIn.collectAsState(initial = false)

    val startDestination = when {
        !privacyAccepted -> PRIVACY
        !isLoggedIn -> LOGIN
        else -> DASHBOARD
    }

    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(PRIVACY) {
            PrivacyPolicyScreen(
                onAccepted = {
                    settingsViewModel.acceptPrivacy()
                    navController.navigate(LOGIN) {
                        popUpTo(PRIVACY) { inclusive = true }
                    }
                }
            )
        }
        composable(LOGIN) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(DASHBOARD) {
                        popUpTo(LOGIN) { inclusive = true }
                    }
                },
                onNavigateToRegister = { navController.navigate(REGISTER) }
            )
        }
        composable(REGISTER) {
            RegisterScreen(
                onRegisterSuccess = {
                    navController.navigate(DASHBOARD) {
                        popUpTo(LOGIN) { inclusive = true }
                    }
                },
                onNavigateToLogin = { navController.popBackStack() }
            )
        }
        composable(DASHBOARD) {
            DashboardScreen(
                onNavigateToStats = { navController.navigate(Routes.STATS) },
                onNavigateToEnvelopes = { navController.navigate(Routes.ENVELOPES) },
                onNavigateToSettings = { navController.navigate(Routes.SETTINGS) }
            )
        }
        // Additional screens will be added here
    }
}
