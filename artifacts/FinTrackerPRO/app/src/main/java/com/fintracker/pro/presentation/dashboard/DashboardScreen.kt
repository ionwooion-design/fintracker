package com.fintracker.pro.presentation.dashboard

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Wallet
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onNavigateToStats: () -> Unit,
    onNavigateToEnvelopes: () -> Unit,
    onNavigateToSettings: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("FinTracker PRO") }
            )
        },
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = true,
                    onClick = {},
                    icon = { Icon(Icons.Default.Home, contentDescription = null) },
                    label = { Text("Главная") }
                )
                NavigationBarItem(
                    selected = false,
                    onClick = onNavigateToStats,
                    icon = { Icon(Icons.Default.BarChart, contentDescription = null) },
                    label = { Text("Статистика") }
                )
                NavigationBarItem(
                    selected = false,
                    onClick = onNavigateToEnvelopes,
                    icon = { Icon(Icons.Default.Wallet, contentDescription = null) },
                    label = { Text("Конверты") }
                )
                NavigationBarItem(
                    selected = false,
                    onClick = onNavigateToSettings,
                    icon = { Icon(Icons.Default.Settings, contentDescription = null) },
                    label = { Text("Настройки") }
                )
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer
                    )
                ) {
                    Column(Modifier = Modifier.padding(20.dp)) {
                        Text(
                            "Осталось на сегодня",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Text(
                            "0 ₽",
                            style = MaterialTheme.typography.displaySmall,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        Spacer(Modifier.height(8.dp))
                        LinearProgressIndicator(
                            progress = { 0f },
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }
            item {
                Text(
                    "Dashboard foundation is ready.\nConnect ViewModel + CalculationEngine next.",
                    style = MaterialTheme.typography.bodyLarge
                )
            }
        }
    }
}
