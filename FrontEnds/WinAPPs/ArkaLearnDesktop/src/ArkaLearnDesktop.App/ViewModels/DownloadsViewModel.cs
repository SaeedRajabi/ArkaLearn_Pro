using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Globalization;
using System.Runtime.CompilerServices;
using System.Windows.Input;
using ArkaLearnDesktop.Application.Abstractions;
using ArkaLearnDesktop.Domain.Drm;

namespace ArkaLearnDesktop.App.ViewModels;

public sealed class DownloadsViewModel : INotifyPropertyChanged, IPageReady
{
    private readonly IEncryptedMediaCacheStore _cacheStore;
    private DownloadRowItem? _selected;
    private string? _statusMessage;
    private bool _isBusy;
    private string _totalSizeLabel = "۰ بایت";

    public DownloadsViewModel(IEncryptedMediaCacheStore cacheStore)
    {
        _cacheStore = cacheStore;
        RefreshCommand = new AsyncRelayCommand(LoadAsync);
        DeleteSelectedCommand = new AsyncRelayCommand(DeleteSelectedAsync, () => Selected is not null && !IsBusy);
    }

    public Task PrepareAsync(CancellationToken cancellationToken = default) => LoadAsync();

    public ObservableCollection<DownloadRowItem> Items { get; } = new();

    public DownloadRowItem? Selected
    {
        get => _selected;
        set
        {
            if (Set(ref _selected, value))
                ((AsyncRelayCommand)DeleteSelectedCommand).RaiseCanExecuteChanged();
        }
    }

    public string TotalSizeLabel
    {
        get => _totalSizeLabel;
        private set => Set(ref _totalSizeLabel, value);
    }

    public string? StatusMessage
    {
        get => _statusMessage;
        set => Set(ref _statusMessage, value);
    }

    public bool IsBusy
    {
        get => _isBusy;
        set
        {
            if (Set(ref _isBusy, value))
                ((AsyncRelayCommand)DeleteSelectedCommand).RaiseCanExecuteChanged();
        }
    }

    public ICommand RefreshCommand { get; }
    public ICommand DeleteSelectedCommand { get; }

    private async Task LoadAsync()
    {
        IsBusy = true;
        try
        {
            var items = await _cacheStore.ListAsync();
            Items.Clear();
            long totalBytes = 0;
            foreach (var item in items)
            {
                Items.Add(new DownloadRowItem(item, FormatBytes(item.FileSizeBytes)));
                totalBytes += item.FileSizeBytes;
            }

            TotalSizeLabel = FormatBytes(totalBytes);
            StatusMessage = items.Count == 0
                ? "فایل رمزنگاری‌شده‌ای در کش محلی نیست. با پخش ویدیو، فایل‌ها اینجا ذخیره می‌شوند."
                : $"{items.Count} فایل در کش محلی.";
        }
        catch (Exception ex)
        {
            StatusMessage = ex.Message;
        }
        finally
        {
            IsBusy = false;
        }
    }

    private async Task DeleteSelectedAsync()
    {
        if (Selected is null) return;
        IsBusy = true;
        try
        {
            var mediaId = Selected.MediaAssetId;
            var deleted = await _cacheStore.DeleteAsync(mediaId);
            StatusMessage = deleted
                ? $"فایل شناسه {mediaId} از کش حذف شد."
                : "فایل یافت نشد.";
            await LoadAsync();
        }
        catch (Exception ex)
        {
            StatusMessage = ex.Message;
        }
        finally
        {
            IsBusy = false;
        }
    }

    private static string FormatBytes(long bytes)
    {
        string[] units = ["بایت", "کیلوبایت", "مگابایت", "گیگابایت"];
        double size = bytes;
        var unit = 0;
        while (size >= 1024 && unit < units.Length - 1)
        {
            size /= 1024;
            unit++;
        }

        return $"{size.ToString("0.##", CultureInfo.InvariantCulture)} {units[unit]}";
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    private bool Set<T>(ref T field, T value, [CallerMemberName] string? name = null)
    {
        if (Equals(field, value)) return false;
        field = value;
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
        return true;
    }
}

public sealed class DownloadRowItem
{
    public DownloadRowItem(LocalEncryptedMediaCache source, string fileSizeLabel)
    {
        MediaAssetId = source.MediaAssetId;
        Title = source.Title;
        MimeType = source.MimeType;
        DownloadedAtUtc = source.DownloadedAtUtc;
        FileSizeLabel = fileSizeLabel;
    }

    public long MediaAssetId { get; }
    public string Title { get; }
    public string MimeType { get; }
    public DateTime DownloadedAtUtc { get; }
    public string FileSizeLabel { get; }
}
