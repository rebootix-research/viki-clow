package ai.vikiclow.app.ui

import androidx.compose.runtime.Composable
import ai.vikiclow.app.MainViewModel
import ai.vikiclow.app.ui.chat.ChatSheetContent

@Composable
fun ChatSheet(viewModel: MainViewModel) {
  ChatSheetContent(viewModel = viewModel)
}
