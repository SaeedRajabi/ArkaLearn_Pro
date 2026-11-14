namespace ArkaLearnDesktop.App.ViewModels;

/// <summary>
/// Pages that need async setup before their UI should be shown in the shell content area.
/// </summary>
public interface IPageReady
{
    Task PrepareAsync(CancellationToken cancellationToken = default);
}
