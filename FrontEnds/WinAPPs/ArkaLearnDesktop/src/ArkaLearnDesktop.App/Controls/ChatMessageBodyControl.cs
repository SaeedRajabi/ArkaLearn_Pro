using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using ArkaLearnDesktop.App.Services;

namespace ArkaLearnDesktop.App.Controls;

public sealed class ChatMessageBodyControl : RichTextBox
{
    public static readonly DependencyProperty HtmlProperty = DependencyProperty.Register(
        nameof(Html),
        typeof(string),
        typeof(ChatMessageBodyControl),
        new PropertyMetadata(null, OnHtmlChanged));

    public static readonly DependencyProperty IsMineProperty = DependencyProperty.Register(
        nameof(IsMine),
        typeof(bool),
        typeof(ChatMessageBodyControl),
        new PropertyMetadata(false, OnHtmlChanged));

    public ChatMessageBodyControl()
    {
        IsReadOnly = true;
        IsDocumentEnabled = true;
        BorderThickness = new Thickness(0);
        Background = System.Windows.Media.Brushes.Transparent;
        Padding = new Thickness(0);
        Margin = new Thickness(0, 2, 0, 0);
        HorizontalScrollBarVisibility = ScrollBarVisibility.Disabled;
        VerticalScrollBarVisibility = ScrollBarVisibility.Disabled;
        Focusable = false;
        Cursor = System.Windows.Input.Cursors.Arrow;
        FlowDirection = FlowDirection.RightToLeft;
    }

    public string? Html
    {
        get => (string?)GetValue(HtmlProperty);
        set => SetValue(HtmlProperty, value);
    }

    public bool IsMine
    {
        get => (bool)GetValue(IsMineProperty);
        set => SetValue(IsMineProperty, value);
    }

    private static void OnHtmlChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
    {
        if (d is ChatMessageBodyControl control)
            control.Rebuild();
    }

    private void Rebuild()
    {
        var html = Html;
        if (string.IsNullOrWhiteSpace(html))
        {
            Document = new FlowDocument();
            Visibility = Visibility.Collapsed;
            return;
        }

        Document = ChatHtmlFlowHelper.ToFlowDocument(html, IsMine);
        Visibility = Document.Blocks.Count == 0 ? Visibility.Collapsed : Visibility.Visible;
    }
}
