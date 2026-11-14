using System.Windows;
using ArkaLearnDesktop.Application.Abstractions;
using Microsoft.Win32;

namespace ArkaLearnDesktop.App.Views.Messenger;

public partial class PublishStoryDialog : Window
{
    private readonly IDesktopApiClient _api;
    private string? _selectedFilePath;

    public PublishStoryDialog(IDesktopApiClient api, Window owner)
    {
        _api = api;
        Owner = owner;
        InitializeComponent();
    }

    public bool Published { get; private set; }

    private void Browse_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new OpenFileDialog
        {
            Filter = "تصویر یا ویدیو|*.jpg;*.jpeg;*.png;*.webp;*.gif;*.mp4;*.webm;*.mov;*.m4v|همه فایل‌ها|*.*",
            Title = "انتخاب فایل استوری",
        };

        if (dialog.ShowDialog(this) != true) return;

        _selectedFilePath = dialog.FileName;
        SelectedFileText.Text = System.IO.Path.GetFileName(_selectedFilePath);
        StatusText.Text = string.Empty;
    }

    private async void Publish_Click(object sender, RoutedEventArgs e)
    {
        if (string.IsNullOrWhiteSpace(_selectedFilePath))
        {
            StatusText.Text = "لطفاً یک فایل تصویر یا ویدیو انتخاب کنید.";
            return;
        }

        try
        {
            PublishButton.IsEnabled = false;
            StatusText.Foreground = (System.Windows.Media.Brush)FindResource("TextMutedBrush");
            StatusText.Text = "در حال آپلود...";

            var ext = System.IO.Path.GetExtension(_selectedFilePath).ToLowerInvariant();
            var kindHint = ext is ".mp4" or ".webm" or ".mov" or ".m4v" ? "video" : "image";
            var upload = await _api.UploadStoryMediaAsync(_selectedFilePath, kindHint);
            if (!upload.Success || string.IsNullOrWhiteSpace(upload.MediaUrl))
            {
                StatusText.Foreground = (System.Windows.Media.Brush)FindResource("TextMutedBrush");
                StatusText.Text = upload.ErrorMessage ?? "آپلود ناموفق بود.";
                return;
            }

            StatusText.Text = "در حال انتشار...";
            var publish = await _api.PublishStoryAsync(
                CaptionBox.Text.Trim(),
                upload.MediaUrl,
                (int)upload.MediaKind);

            if (!publish.Success)
            {
                StatusText.Text = publish.ErrorMessage ?? "انتشار ناموفق بود.";
                return;
            }

            Published = true;
            DialogResult = true;
            Close();
        }
        catch (Exception ex)
        {
            StatusText.Text = ex.Message;
        }
        finally
        {
            PublishButton.IsEnabled = true;
        }
    }

    private void Cancel_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }
}
