using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace ArkaLearnDesktop.App.ViewModels;

public sealed class ManagementPlaceholderViewModel : INotifyPropertyChanged, IPageReady
{
    public ManagementPlaceholderViewModel(string title, string subtitle)
    {
        Title = title;
        Subtitle = subtitle;
    }

    public string Title { get; }
    public string Subtitle { get; }

    public Task PrepareAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;

    public event PropertyChangedEventHandler? PropertyChanged;

    private void OnPropertyChanged([CallerMemberName] string? name = null) =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
}
