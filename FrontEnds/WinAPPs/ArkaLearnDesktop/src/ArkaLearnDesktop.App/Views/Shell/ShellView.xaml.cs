using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Shapes;
using System.Windows.Threading;
using ArkaLearnDesktop.App.Services;
using ArkaLearnDesktop.App.ViewModels;
using ArkaLearnDesktop.App.Views.About;
using ArkaLearnDesktop.App.Views.Downloads;
using ArkaLearnDesktop.App.Views.Exams;
using ArkaLearnDesktop.App.Views.Management;
using ArkaLearnDesktop.App.Views.Messenger;
using ArkaLearnDesktop.App.Views.Player;
using ArkaLearnDesktop.App.Views.RemoteAssist;
using ArkaLearnDesktop.App.Views.Settings;
using ArkaLearnDesktop.Application.Abstractions;
using Microsoft.Extensions.DependencyInjection;

namespace ArkaLearnDesktop.App.Views.Shell;

public enum ShellSidebarMode
{
    Expanded = 0,
    Compact = 1,
    Hidden = 2,
}

public partial class ShellView : UserControl
{
    private const double ExpandedWidth = 248;
    private const double CompactWidth = 76;

    private readonly IServiceProvider _services;
    private readonly IAuthSessionStore _sessionStore;
    private int _navigationVersion;
    private CancellationTokenSource? _navigationCts;
    private object? _currentPageDataContext;
    private string _startPageTag = "Player";
    private ShellSidebarMode _sidebarMode = ShellSidebarMode.Expanded;
    private ShellSidebarMode _modeBeforeHidden = ShellSidebarMode.Expanded;

    public ShellView(IServiceProvider services, IAuthSessionStore sessionStore)
    {
        _services = services;
        _sessionStore = sessionStore;
        InitializeComponent();
        Loaded += OnLoaded;
    }

    public ShellSidebarMode SidebarMode => _sidebarMode;

    public void SetStartPage(string? tag) =>
        _startPageTag = string.IsNullOrWhiteSpace(tag) ? "Player" : tag.Trim();

    public void NavigateTo(string tag)
    {
        if (string.IsNullOrWhiteSpace(tag)) return;
        if (!IsLoaded)
        {
            SetStartPage(tag);
            return;
        }

        SelectStartNav(tag.Trim());
    }

    public void SetSidebarMode(ShellSidebarMode mode)
    {
        if (mode == ShellSidebarMode.Hidden && _sidebarMode != ShellSidebarMode.Hidden)
            _modeBeforeHidden = _sidebarMode == ShellSidebarMode.Hidden ? ShellSidebarMode.Expanded : _sidebarMode;

        _sidebarMode = mode;
        ApplySidebarMode();
    }

    public void ToggleSidebarCollapsed()
    {
        if (_sidebarMode == ShellSidebarMode.Hidden)
        {
            SetSidebarMode(_modeBeforeHidden == ShellSidebarMode.Hidden
                ? ShellSidebarMode.Expanded
                : _modeBeforeHidden);
            return;
        }

        SetSidebarMode(_sidebarMode == ShellSidebarMode.Expanded
            ? ShellSidebarMode.Compact
            : ShellSidebarMode.Expanded);
    }

    public void HideSidebarForImmersive()
    {
        if (_sidebarMode != ShellSidebarMode.Hidden)
            _modeBeforeHidden = _sidebarMode;
        SetSidebarMode(ShellSidebarMode.Hidden);
    }

    public void RestoreSidebarAfterImmersive()
    {
        SetSidebarMode(_modeBeforeHidden == ShellSidebarMode.Hidden
            ? ShellSidebarMode.Expanded
            : _modeBeforeHidden);
    }

    private void ApplySidebarMode()
    {
        var labelsVisible = _sidebarMode == ShellSidebarMode.Expanded;
        var sidebarVisible = _sidebarMode != ShellSidebarMode.Hidden;

        SidebarPanel.Visibility = sidebarVisible ? Visibility.Visible : Visibility.Collapsed;
        ShowSidebarFab.Visibility = sidebarVisible ? Visibility.Collapsed : Visibility.Visible;
        SidebarColumn.Width = _sidebarMode switch
        {
            ShellSidebarMode.Expanded => new GridLength(ExpandedWidth),
            ShellSidebarMode.Compact => new GridLength(CompactWidth),
            _ => new GridLength(0),
        };

        BrandTextPanel.Visibility = labelsVisible ? Visibility.Visible : Visibility.Collapsed;
        BrandMarkOnly.Visibility = _sidebarMode == ShellSidebarMode.Compact ? Visibility.Visible : Visibility.Collapsed;
        CollapseSidebarButton.Visibility = sidebarVisible ? Visibility.Visible : Visibility.Collapsed;
        CollapseSidebarButton.ToolTip = _sidebarMode == ShellSidebarMode.Compact
            ? "باز کردن منو"
            : "جمع‌کردن منو";

        PageHost.Margin = _sidebarMode == ShellSidebarMode.Hidden
            ? new Thickness(12)
            : new Thickness(24);

        foreach (var label in FindVisualChildren<TextBlock>(SidebarPanel))
        {
            // Keep brand texts under BrandTextPanel; skip path-only tooltips.
            if (IsDescendantOf(label, BrandTextPanel) || IsDescendantOf(label, BrandMarkOnly))
                continue;

            // Nav labels are TextBlocks inside RadioButton content stacks.
            if (label.Parent is StackPanel { Parent: RadioButton })
            {
                label.Visibility = labelsVisible ? Visibility.Visible : Visibility.Collapsed;
                if (label.Parent is StackPanel row && row.Children.OfType<Path>().FirstOrDefault() is { } icon)
                    icon.Margin = labelsVisible ? new Thickness(0, 0, 10, 0) : new Thickness(0);
            }
        }

        foreach (var nav in FindVisualChildren<RadioButton>(SidebarPanel))
        {
            if (nav.GroupName != "MainNav") continue;
            nav.HorizontalContentAlignment = labelsVisible ? HorizontalAlignment.Left : HorizontalAlignment.Center;
            nav.Padding = labelsVisible ? new Thickness(14, 10, 14, 10) : new Thickness(10, 12, 10, 12);
            nav.Margin = labelsVisible ? new Thickness(8, 2, 8, 2) : new Thickness(8, 2, 8, 2);
        }
    }

    private static bool IsDescendantOf(DependencyObject? node, DependencyObject ancestor)
    {
        while (node is not null)
        {
            if (ReferenceEquals(node, ancestor)) return true;
            node = VisualTreeHelper.GetParent(node);
        }

        return false;
    }

    private void CollapseSidebarButton_OnClick(object sender, RoutedEventArgs e) => ToggleSidebarCollapsed();

    private void ShowSidebarFab_OnClick(object sender, RoutedEventArgs e) =>
        SetSidebarMode(_modeBeforeHidden == ShellSidebarMode.Hidden
            ? ShellSidebarMode.Expanded
            : _modeBeforeHidden);

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        Loaded -= OnLoaded;
        ApplySidebarMode();
        await ApplyRoleNavigationAsync();
        SelectStartNav(_startPageTag);
    }

    private async Task ApplyRoleNavigationAsync()
    {
        var user = await _sessionStore.GetCurrentUserAsync();
        var role = user?.Role;
        var isTeacher = DesktopUserRole.IsTeacher(role);
        var isAdmin = DesktopUserRole.IsAdmin(role);
        var isStudent = DesktopUserRole.IsStudent(role);
        var showManagement = isTeacher || isAdmin;

        ManagementSeparator.Visibility = showManagement ? Visibility.Visible : Visibility.Collapsed;
        CoursesNav.Visibility = showManagement ? Visibility.Visible : Visibility.Collapsed;
        StudentsNav.Visibility = showManagement ? Visibility.Visible : Visibility.Collapsed;
        TeachersNav.Visibility = isAdmin ? Visibility.Visible : Visibility.Collapsed;
        OnlineUsersNav.Visibility = isAdmin ? Visibility.Visible : Visibility.Collapsed;
        ExamsNav.Visibility = isStudent ? Visibility.Visible : Visibility.Collapsed;
    }

    private void SelectStartNav(string tag)
    {
        var target = FindNavRadio(tag) ?? PlayerNav;
        if (target.IsChecked == true)
            _ = ShowPageAsync(tag);
        else
            target.IsChecked = true;
    }

    private RadioButton? FindNavRadio(string tag)
    {
        foreach (var button in FindVisualChildren<RadioButton>(this))
        {
            if (button.GroupName == "MainNav" && button.Tag is string t && t == tag)
                return button;
        }

        return null;
    }

    private static IEnumerable<T> FindVisualChildren<T>(DependencyObject parent)
        where T : DependencyObject
    {
        var count = VisualTreeHelper.GetChildrenCount(parent);
        for (var i = 0; i < count; i++)
        {
            var child = VisualTreeHelper.GetChild(parent, i);
            if (child is T match)
                yield return match;

            foreach (var nested in FindVisualChildren<T>(child))
                yield return nested;
        }
    }

    private void Nav_Checked(object sender, RoutedEventArgs e)
    {
        if (PageHost is null) return;
        if (sender is RadioButton { Tag: string tag })
            _ = ShowPageAsync(tag);
    }

    private async Task ShowPageAsync(string tag)
    {
        var version = ++_navigationVersion;
        _navigationCts?.Cancel();
        _navigationCts?.Dispose();
        _navigationCts = new CancellationTokenSource();
        var ct = _navigationCts.Token;

        SetLoading(true, GetLoadingLabel(tag));
        PageHost.Content = null;
        await DisposeCurrentPageAsync();

        await Dispatcher.Yield(DispatcherPriority.Background);

        FrameworkElement? view = null;
        object? dataContext = null;

        try
        {
            (view, dataContext) = CreatePage(tag);

            if (dataContext is IPageReady ready)
                await ready.PrepareAsync(ct);

            await Dispatcher.Yield(DispatcherPriority.Background);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            if (dataContext is IAsyncDisposable canceledDisposable)
                await canceledDisposable.DisposeAsync();
            return;
        }
        catch (Exception ex)
        {
            if (version != _navigationVersion) return;
            SetLoading(false);
            PageHost.Content = CreatePlaceholder("خطا در بارگذاری", ex.Message);
            return;
        }

        if (version != _navigationVersion || ct.IsCancellationRequested)
        {
            if (dataContext is IAsyncDisposable staleDisposable)
                await staleDisposable.DisposeAsync();
            return;
        }

        _currentPageDataContext = dataContext;
        PageHost.Content = view;
        SetLoading(false);
    }

    private (FrameworkElement View, object DataContext) CreatePage(string tag)
    {
        return tag switch
        {
            "Player" => Create(() => new SecurePlayerView(), _services.GetRequiredService<PlayerViewModel>()),
            "Messenger" => Create(() => new MessengerView(), _services.GetRequiredService<MessengerViewModel>()),
            "RemoteAssist" => Create(() => new RemoteAssistView(), _services.GetRequiredService<RemoteAssistViewModel>()),
            "Downloads" => Create(() => new DownloadsView(), _services.GetRequiredService<DownloadsViewModel>()),
            "Exams" => Create(() => new ExamsView(), _services.GetRequiredService<ExamsViewModel>()),
            "About" => Create(() => new AboutView(), _services.GetRequiredService<AboutViewModel>()),
            "Settings" => Create(() => new SettingsView(), _services.GetRequiredService<SettingsViewModel>()),
            "Courses" => Create(() => new CoursesView(), _services.GetRequiredService<CoursesViewModel>()),
            "Students" => Create(() => new StudentsView(), _services.GetRequiredService<StudentsViewModel>()),
            "Teachers" => Create(() => new TeachersView(), _services.GetRequiredService<TeachersViewModel>()),
            "OnlineUsers" => Create(() => new OnlineUsersView(), _services.GetRequiredService<OnlineUsersViewModel>()),
            _ => ((FrameworkElement)CreatePlaceholder("صفحه", "صفحه نامعتبر."), new object()),
        };

        static (FrameworkElement View, object DataContext) Create<TView, TVm>(Func<TView> factory, TVm vm)
            where TView : FrameworkElement
        {
            var view = factory();
            view.DataContext = vm;
            return (view, vm!);
        }
    }

    private void SetLoading(bool isLoading, string? label = null)
    {
        if (label is not null)
            LoadingText.Text = label;

        LoadingOverlay.Visibility = isLoading ? Visibility.Visible : Visibility.Collapsed;
    }

    private static string GetLoadingLabel(string tag) => tag switch
    {
        "Player" => "در حال آماده‌سازی پخش‌کننده...",
        "Messenger" => "در حال اتصال به پیام‌رسان...",
        "RemoteAssist" => "در حال آماده‌سازی کمک از راه دور...",
        "Downloads" => "در حال بارگذاری دانلودها...",
        "Exams" => "در حال بارگذاری آزمون‌ها...",
        "About" => "در حال بارگذاری درباره ما...",
        "Settings" => "در حال بارگذاری تنظیمات...",
        "Courses" => "در حال بارگذاری دوره‌ها...",
        "Students" => "در حال بارگذاری دانشجویان...",
        "Teachers" => "در حال بارگذاری اساتید...",
        "OnlineUsers" => "در حال بارگذاری کاربران آنلاین...",
        _ => "در حال بارگذاری...",
    };

    private async Task DisposeCurrentPageAsync()
    {
        if (_currentPageDataContext is RemoteAssistViewModel)
        {
            _currentPageDataContext = null;
            return;
        }

        if (_currentPageDataContext is IAsyncDisposable disposable)
        {
            try
            {
                await disposable.DisposeAsync();
            }
            catch
            {
                // Ignore dispose errors when switching pages.
            }
        }

        _currentPageDataContext = null;
    }

    private static UIElement CreatePlaceholder(string title, string subtitle)
    {
        return new StackPanel
        {
            VerticalAlignment = VerticalAlignment.Center,
            HorizontalAlignment = HorizontalAlignment.Center,
            Children =
            {
                new TextBlock
                {
                    Text = title,
                    FontSize = 28,
                    FontWeight = FontWeights.SemiBold,
                    Foreground = System.Windows.Application.Current.Resources["TextPrimaryBrush"] as Brush,
                    HorizontalAlignment = HorizontalAlignment.Center,
                },
                new TextBlock
                {
                    Text = subtitle,
                    Margin = new Thickness(0, 10, 0, 0),
                    TextWrapping = TextWrapping.Wrap,
                    MaxWidth = 480,
                    Foreground = System.Windows.Application.Current.Resources["TextMutedBrush"] as Brush,
                    HorizontalAlignment = HorizontalAlignment.Center,
                    TextAlignment = TextAlignment.Center,
                },
            },
        };
    }
}
