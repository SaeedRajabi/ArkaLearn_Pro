using System.Collections.Specialized;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Navigation;
using ArkaLearnDesktop.App.Services;
using ArkaLearnDesktop.App.ViewModels;

namespace ArkaLearnDesktop.App.Views.Messenger;

public partial class MessengerView : UserControl
{
    public MessengerView()
    {
        InitializeComponent();
        DataContextChanged += OnDataContextChanged;
    }

    private void OnDataContextChanged(object sender, DependencyPropertyChangedEventArgs e)
    {
        if (e.OldValue is MessengerViewModel oldVm)
        {
            Unsubscribe(oldVm);
            oldVm.GetComposeHtml = null;
            oldVm.ClearComposeEditor = null;
            oldVm.SetComposeHtml = null;
        }

        if (e.NewValue is MessengerViewModel newVm)
        {
            Subscribe(newVm);
            newVm.GetComposeHtml = () => ChatHtmlFlowHelper.FlowDocumentToHtml(ComposeEditor?.Document);
            newVm.ClearComposeEditor = ClearComposeEditor;
            newVm.SetComposeHtml = LoadComposeHtml;
        }
    }

    private void Subscribe(MessengerViewModel vm)
    {
        vm.Messages.CollectionChanged += OnMessagesChanged;
        vm.PropertyChanged += OnViewModelPropertyChanged;
    }

    private void Unsubscribe(MessengerViewModel vm)
    {
        vm.Messages.CollectionChanged -= OnMessagesChanged;
        vm.PropertyChanged -= OnViewModelPropertyChanged;
    }

    private void OnViewModelPropertyChanged(object? sender, PropertyChangedEventArgs e)
    {
        if (e.PropertyName == nameof(MessengerViewModel.SelectedThread))
            ScrollMessagesToBottom();
    }

    private void OnMessagesChanged(object? sender, NotifyCollectionChangedEventArgs e) =>
        ScrollMessagesToBottom();

    private void ScrollMessagesToBottom()
    {
        if (MessagesScrollViewer is null) return;
        MessagesScrollViewer.Dispatcher.BeginInvoke(() =>
        {
            MessagesScrollViewer.ScrollToEnd();
        }, System.Windows.Threading.DispatcherPriority.Background);
    }

    private void MediaHyperlink_OnRequestNavigate(object sender, RequestNavigateEventArgs e)
    {
        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = e.Uri.AbsoluteUri,
                UseShellExecute = true,
            });
        }
        catch
        {
            // ignore open failures
        }

        e.Handled = true;
    }

    private void ComposeEditor_OnTextChanged(object sender, TextChangedEventArgs e)
    {
        if (DataContext is not MessengerViewModel vm || ComposeEditor is null) return;
        vm.ComposeText = ChatHtmlFlowHelper.GetPlainText(ComposeEditor.Document);
    }

    private void ClearComposeEditor()
    {
        if (ComposeEditor is null) return;
        ComposeEditor.Document = new FlowDocument(new Paragraph())
        {
            FontSize = 13.5,
            TextAlignment = TextAlignment.Right,
            FlowDirection = FlowDirection.RightToLeft,
        };
    }

    private void LoadComposeHtml(string html)
    {
        if (ComposeEditor is null) return;
        ComposeEditor.Document = ChatHtmlFlowHelper.ToFlowDocument(html, isMine: false);
        ComposeEditor.Focus();
    }

    private void ComposeBold_OnClick(object sender, RoutedEventArgs e) =>
        EditingCommands.ToggleBold.Execute(null, ComposeEditor);

    private void ComposeItalic_OnClick(object sender, RoutedEventArgs e) =>
        EditingCommands.ToggleItalic.Execute(null, ComposeEditor);

    private void ComposeUnderline_OnClick(object sender, RoutedEventArgs e) =>
        EditingCommands.ToggleUnderline.Execute(null, ComposeEditor);

    private void ComposeHeading_OnClick(object sender, RoutedEventArgs e)
    {
        if (ComposeEditor is null) return;
        ComposeEditor.Focus();
        var selection = ComposeEditor.Selection;
        if (selection.IsEmpty)
        {
            var caret = ComposeEditor.CaretPosition.Paragraph;
            if (caret is null) return;
            ApplyHeading(caret);
            return;
        }

        var startPara = selection.Start.Paragraph;
        var endPara = selection.End.Paragraph;
        if (startPara is null) return;

        for (var block = startPara; block is not null; block = block.NextBlock as Paragraph)
        {
            ApplyHeading(block);
            if (ReferenceEquals(block, endPara)) break;
        }
    }

    private static void ApplyHeading(Paragraph paragraph)
    {
        var isHeading = paragraph.FontSize >= 18;
        paragraph.FontSize = isHeading ? 13.5 : 18;
        paragraph.FontWeight = isHeading ? FontWeights.Normal : FontWeights.Bold;
    }

    private void MessageMenuButton_OnClick(object sender, RoutedEventArgs e)
    {
        if (sender is not Button button || button.ContextMenu is null) return;
        button.ContextMenu.PlacementTarget = button;
        button.ContextMenu.DataContext = DataContext;
        button.ContextMenu.IsOpen = true;
    }

    private void MessageContextMenu_OnOpened(object sender, RoutedEventArgs e)
    {
        if (sender is not ContextMenu menu) return;
        var message = (menu.PlacementTarget as FrameworkElement)?.Tag as ChatMessageItem;
        foreach (var item in menu.Items.OfType<MenuItem>())
        {
            var header = item.Header as string;
            if (header is "ویرایش" or "حذف")
            {
                item.Visibility = message is { IsMine: true, IsDeleted: false, RemoteMessageId: > 0 }
                    ? Visibility.Visible
                    : Visibility.Collapsed;
            }
            else if (header is "پاسخ")
            {
                item.Visibility = message is { IsDeleted: false, RemoteMessageId: > 0, IsPending: false }
                    ? Visibility.Visible
                    : Visibility.Collapsed;
            }
            else if (header is "کپی")
            {
                item.Visibility = message is { IsDeleted: false } && !string.IsNullOrWhiteSpace(message.CopyableText)
                    ? Visibility.Visible
                    : Visibility.Collapsed;
            }
        }
    }

    private void CopyMessageButton_OnClick(object sender, RoutedEventArgs e)
    {
        if (sender is not FrameworkElement { Tag: ChatMessageItem message }) return;
        CopyMessageToClipboard(message);
    }

    private void CopyMenuItem_OnClick(object sender, RoutedEventArgs e)
    {
        if (TryGetMenuMessage(sender, out var message) && message is not null)
            CopyMessageToClipboard(message);
    }

    private static void CopyMessageToClipboard(ChatMessageItem message)
    {
        var text = message.CopyableText;
        if (string.IsNullOrWhiteSpace(text)) return;
        try
        {
            Clipboard.SetText(text);
        }
        catch
        {
            // Clipboard can be locked by another process.
        }
    }

    private void ReplyMenuItem_OnClick(object sender, RoutedEventArgs e)
    {
        if (DataContext is not MessengerViewModel vm) return;
        if (TryGetMenuMessage(sender, out var message))
            vm.ReplyToMessageCommand.Execute(message);
    }

    private void EditMenuItem_OnClick(object sender, RoutedEventArgs e)
    {
        if (DataContext is not MessengerViewModel vm) return;
        if (TryGetMenuMessage(sender, out var message))
            vm.EditMessageCommand.Execute(message);
    }

    private void DeleteMenuItem_OnClick(object sender, RoutedEventArgs e)
    {
        if (DataContext is not MessengerViewModel vm) return;
        if (TryGetMenuMessage(sender, out var message))
            vm.DeleteMessageCommand.Execute(message);
    }

    private static bool TryGetMenuMessage(object sender, out ChatMessageItem? message)
    {
        message = null;
        if (sender is not MenuItem menuItem) return false;
        if (menuItem.Parent is not ContextMenu menu) return false;
        message = (menu.PlacementTarget as FrameworkElement)?.Tag as ChatMessageItem;
        return message is not null;
    }
}
