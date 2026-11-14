using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows;
using System.Windows.Input;
using ArkaLearnDesktop.App.Services;
using ArkaLearnDesktop.App.Views.Messenger;
using ArkaLearnDesktop.Application.Abstractions;
using ArkaLearnDesktop.Infrastructure.Messenger;

namespace ArkaLearnDesktop.App.ViewModels;

public sealed class MessengerViewModel : INotifyPropertyChanged, IAsyncDisposable, IPageReady
{
    private readonly ISupportChatSyncService _sync;
    private readonly IVipAccessService _vip;
    private readonly IAuthSessionStore _sessionStore;
    private readonly IDesktopApiClient _api;
    private readonly IDesktopLocalSettings _settings;
    private readonly List<DesktopChatThread> _allThreads = new();
    private readonly List<DesktopTeacherStory> _allStories = new();
    private readonly List<DesktopSupportTeacherOption> _supportTeachers = new();
    private ChatPeerItem? _selectedPeer;
    private ChatThreadItem? _selectedThread;
    private string _composeText = string.Empty;
    private string? _statusMessage;
    private bool _isBusy;
    private bool _hasVipAccess;
    private bool _peerIsOnline;
    private bool _canPublishStories;
    private bool _isStudentUser;
    private ChatMessageItem? _replyTarget;
    private long? _editingMessageId;

    public MessengerViewModel(
        ISupportChatSyncService sync,
        IVipAccessService vip,
        IAuthSessionStore sessionStore,
        IDesktopApiClient api,
        IDesktopLocalSettings settings)
    {
        _sync = sync;
        _vip = vip;
        _sessionStore = sessionStore;
        _api = api;
        _settings = settings;
        Peers = new ObservableCollection<ChatPeerItem>();
        Threads = new ObservableCollection<ChatThreadItem>();
        Messages = new ObservableCollection<ChatMessageItem>();
        StoryGroups = new ObservableCollection<StoryGroupItem>();

        RefreshCommand = new AsyncRelayCommand(LoadAsync);
        BackToPeersCommand = new RelayCommand(BackToPeers, () => SelectedPeer is not null && !IsBusy);
        SendCommand = new AsyncRelayCommand(SendAsync, () => SelectedThread is not null && !IsBusy && HasVipAccess && ComposeText.Trim().Length > 0);
        OpenStoryCommand = new AsyncRelayCommand<StoryGroupItem>(OpenStoryAsync, item => item is not null && !IsBusy);
        PublishStoryCommand = new AsyncRelayCommand(PublishStoryAsync, () => CanPublishStories && !IsBusy);
        NewTopicCommand = new AsyncRelayCommand(OpenNewTopicAsync, () => HasVipAccess && !IsBusy && _isStudentUser);
        AttachImageCommand = new AsyncRelayCommand(() => AttachMediaAsync(DesktopChatMediaKind.Image), CanAttachMedia);
        AttachAudioCommand = new AsyncRelayCommand(() => AttachMediaAsync(DesktopChatMediaKind.Audio), CanAttachMedia);
        AttachVideoCommand = new AsyncRelayCommand(() => AttachMediaAsync(DesktopChatMediaKind.Video), CanAttachMedia);
        AttachFileCommand = new AsyncRelayCommand(() => AttachMediaAsync(DesktopChatMediaKind.File), CanAttachMedia);
        OpenVipActivationCommand = new AsyncRelayCommand(OpenVipActivationPageAsync, () => !HasVipAccess);
        ReplyToMessageCommand = new RelayCommand<ChatMessageItem>(BeginReply, m => m is not null && !m.IsDeleted && !IsBusy && HasVipAccess);
        EditMessageCommand = new RelayCommand<ChatMessageItem>(BeginEdit, m => m is { IsMine: true, IsDeleted: false } && m.RemoteMessageId is > 0 && !IsBusy && HasVipAccess);
        DeleteMessageCommand = new AsyncRelayCommand<ChatMessageItem>(DeleteMessageAsync, m => m is { IsMine: true, IsDeleted: false } && m.RemoteMessageId is > 0 && !IsBusy && HasVipAccess);
        CancelReplyOrEditCommand = new RelayCommand(CancelReplyOrEdit, () => ReplyTarget is not null || EditingMessageId is > 0);
        OpenImageCommand = new RelayCommand<ChatMessageItem>(OpenImage, m => m is not null && !string.IsNullOrWhiteSpace(m.ImageUrl));
        DownloadVideoCommand = new AsyncRelayCommand<ChatMessageItem>(DownloadVideoAsync, m => m is not null && !string.IsNullOrWhiteSpace(m.VideoUrl));
        DownloadFileCommand = new AsyncRelayCommand<ChatMessageItem>(DownloadFileAsync, m => m is not null && !string.IsNullOrWhiteSpace(m.FileUrl));

        _sync.ThreadsChanged += OnThreadsChanged;
        _sync.MessagesChanged += OnMessagesChanged;
        _sync.PresenceChanged += OnPresenceChanged;
    }

    public Task PrepareAsync(CancellationToken cancellationToken = default) => LoadAsync();

    public ObservableCollection<ChatPeerItem> Peers { get; }
    public ObservableCollection<ChatThreadItem> Threads { get; }
    public ObservableCollection<ChatMessageItem> Messages { get; }
    public ObservableCollection<StoryGroupItem> StoryGroups { get; }

    public Visibility PeersVisibility => SelectedPeer is null ? Visibility.Visible : Visibility.Collapsed;
    public Visibility TopicsVisibility => SelectedPeer is not null ? Visibility.Visible : Visibility.Collapsed;
    public Visibility PublishStoryVisibility => CanPublishStories ? Visibility.Visible : Visibility.Collapsed;
    public Visibility VipGateVisibility => HasVipAccess ? Visibility.Collapsed : Visibility.Visible;
    public Visibility ComposerVisibility => HasVipAccess ? Visibility.Visible : Visibility.Collapsed;
    public Visibility NewTopicVisibility => HasVipAccess && _isStudentUser ? Visibility.Visible : Visibility.Collapsed;
    public Visibility ReplyBannerVisibility => ReplyTarget is not null || EditingMessageId is > 0
        ? Visibility.Visible
        : Visibility.Collapsed;

    public string SendButtonLabel => EditingMessageId is > 0 ? "ذخیره" : "ارسال";

    public string ReplyBannerTitle => EditingMessageId is > 0
        ? "در حال ویرایش پیام"
        : ReplyTarget is null
            ? string.Empty
            : $"پاسخ به {ReplyTarget.SenderName}";

    public string ReplyBannerPreview => EditingMessageId is > 0
        ? ComposeText
        : ReplyTarget?.BodyPreview ?? string.Empty;

    public string VipActivationUrl =>
        $"{_settings.ClientWebsiteBaseUrl.TrimEnd('/')}/account?view=support-freeze";

    public string SidebarTitle => SelectedPeer is null
        ? "طرف‌های گفتگو"
        : $"موضوعات — {SelectedPeer.DisplayName}";

    public string SidebarHint => SelectedPeer is null
        ? "ابتدا یک استاد/دانشجو را انتخاب کنید"
        : "یک موضوع را برای مشاهده پیام‌ها انتخاب کنید";

    public string? SelectedPeerAvatarUrl => SelectedPeer?.AvatarUrl;

    public ChatPeerItem? SelectedPeer
    {
        get => _selectedPeer;
        set
        {
            if (!Set(ref _selectedPeer, value)) return;
            OnPropertyChanged(nameof(PeersVisibility));
            OnPropertyChanged(nameof(TopicsVisibility));
            OnPropertyChanged(nameof(SidebarTitle));
            OnPropertyChanged(nameof(SidebarHint));
            OnPropertyChanged(nameof(SelectedPeerAvatarUrl));
            ((RelayCommand)BackToPeersCommand).RaiseCanExecuteChanged();
            ((AsyncRelayCommand)NewTopicCommand).RaiseCanExecuteChanged();
            SelectedThread = null;
            Messages.Clear();
            CancelReplyOrEdit();
            RebuildThreadsForSelectedPeer();
        }
    }

    public ChatThreadItem? SelectedThread
    {
        get => _selectedThread;
        set
        {
            if (!Set(ref _selectedThread, value)) return;
            CancelReplyOrEdit();
            ((AsyncRelayCommand)SendCommand).RaiseCanExecuteChanged();
            ((AsyncRelayCommand)NewTopicCommand).RaiseCanExecuteChanged();
            ((AsyncRelayCommand)AttachImageCommand).RaiseCanExecuteChanged();
            ((AsyncRelayCommand)AttachAudioCommand).RaiseCanExecuteChanged();
            ((AsyncRelayCommand)AttachVideoCommand).RaiseCanExecuteChanged();
            ((AsyncRelayCommand)AttachFileCommand).RaiseCanExecuteChanged();
            if (value is not null)
                _ = SelectThreadAsync(value.RemoteConversationId);
            else
            {
                Messages.Clear();
                PeerIsOnline = false;
            }
        }
    }

    public string ComposeText
    {
        get => _composeText;
        set
        {
            if (!Set(ref _composeText, value)) return;
            ((AsyncRelayCommand)SendCommand).RaiseCanExecuteChanged();
            if (EditingMessageId is > 0)
                OnPropertyChanged(nameof(ReplyBannerPreview));
        }
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
            if (!Set(ref _isBusy, value)) return;
            ((AsyncRelayCommand)SendCommand).RaiseCanExecuteChanged();
            ((RelayCommand)BackToPeersCommand).RaiseCanExecuteChanged();
            ((AsyncRelayCommand<StoryGroupItem>)OpenStoryCommand).RaiseCanExecuteChanged();
            ((AsyncRelayCommand)PublishStoryCommand).RaiseCanExecuteChanged();
            ((AsyncRelayCommand)NewTopicCommand).RaiseCanExecuteChanged();
            ((AsyncRelayCommand)AttachImageCommand).RaiseCanExecuteChanged();
            ((AsyncRelayCommand)AttachAudioCommand).RaiseCanExecuteChanged();
            ((AsyncRelayCommand)AttachVideoCommand).RaiseCanExecuteChanged();
            ((AsyncRelayCommand)AttachFileCommand).RaiseCanExecuteChanged();
            ((AsyncRelayCommand)OpenVipActivationCommand).RaiseCanExecuteChanged();
            RaiseMessageActionCommands();
        }
    }

    public bool HasVipAccess
    {
        get => _hasVipAccess;
        set
        {
            if (!Set(ref _hasVipAccess, value)) return;
            OnPropertyChanged(nameof(VipGateVisibility));
            OnPropertyChanged(nameof(ComposerVisibility));
            OnPropertyChanged(nameof(NewTopicVisibility));
            ((AsyncRelayCommand)SendCommand).RaiseCanExecuteChanged();
            ((AsyncRelayCommand)NewTopicCommand).RaiseCanExecuteChanged();
            ((AsyncRelayCommand)AttachImageCommand).RaiseCanExecuteChanged();
            ((AsyncRelayCommand)AttachAudioCommand).RaiseCanExecuteChanged();
            ((AsyncRelayCommand)AttachVideoCommand).RaiseCanExecuteChanged();
            ((AsyncRelayCommand)AttachFileCommand).RaiseCanExecuteChanged();
            ((AsyncRelayCommand)OpenVipActivationCommand).RaiseCanExecuteChanged();
            RaiseMessageActionCommands();
        }
    }

    public ChatMessageItem? ReplyTarget
    {
        get => _replyTarget;
        private set
        {
            if (!Set(ref _replyTarget, value)) return;
            OnPropertyChanged(nameof(ReplyBannerVisibility));
            OnPropertyChanged(nameof(ReplyBannerTitle));
            OnPropertyChanged(nameof(ReplyBannerPreview));
            ((RelayCommand)CancelReplyOrEditCommand).RaiseCanExecuteChanged();
        }
    }

    public long? EditingMessageId
    {
        get => _editingMessageId;
        private set
        {
            if (!Set(ref _editingMessageId, value)) return;
            OnPropertyChanged(nameof(ReplyBannerVisibility));
            OnPropertyChanged(nameof(ReplyBannerTitle));
            OnPropertyChanged(nameof(ReplyBannerPreview));
            OnPropertyChanged(nameof(SendButtonLabel));
            ((RelayCommand)CancelReplyOrEditCommand).RaiseCanExecuteChanged();
        }
    }

    public bool PeerIsOnline
    {
        get => _peerIsOnline;
        set => Set(ref _peerIsOnline, value);
    }

    public bool CanPublishStories
    {
        get => _canPublishStories;
        private set
        {
            if (!Set(ref _canPublishStories, value)) return;
            OnPropertyChanged(nameof(PublishStoryVisibility));
            ((AsyncRelayCommand)PublishStoryCommand).RaiseCanExecuteChanged();
        }
    }

    public ICommand RefreshCommand { get; }
    public ICommand BackToPeersCommand { get; }
    public ICommand SendCommand { get; }
    public ICommand OpenStoryCommand { get; }
    public ICommand PublishStoryCommand { get; }
    public ICommand NewTopicCommand { get; }
    public ICommand AttachImageCommand { get; }
    public ICommand AttachAudioCommand { get; }
    public ICommand AttachVideoCommand { get; }
    public ICommand AttachFileCommand { get; }
    public ICommand OpenVipActivationCommand { get; }
    public ICommand ReplyToMessageCommand { get; }
    public ICommand EditMessageCommand { get; }
    public ICommand DeleteMessageCommand { get; }
    public ICommand CancelReplyOrEditCommand { get; }
    public ICommand OpenImageCommand { get; }
    public ICommand DownloadVideoCommand { get; }
    public ICommand DownloadFileCommand { get; }

    private bool CanAttachMedia() => SelectedThread is not null && !IsBusy && HasVipAccess;

    private void RaiseMessageActionCommands()
    {
        ((RelayCommand<ChatMessageItem>)ReplyToMessageCommand).RaiseCanExecuteChanged();
        ((RelayCommand<ChatMessageItem>)EditMessageCommand).RaiseCanExecuteChanged();
        ((AsyncRelayCommand<ChatMessageItem>)DeleteMessageCommand).RaiseCanExecuteChanged();
        ((RelayCommand)CancelReplyOrEditCommand).RaiseCanExecuteChanged();
        ((RelayCommand<ChatMessageItem>)OpenImageCommand).RaiseCanExecuteChanged();
        ((AsyncRelayCommand<ChatMessageItem>)DownloadVideoCommand).RaiseCanExecuteChanged();
        ((AsyncRelayCommand<ChatMessageItem>)DownloadFileCommand).RaiseCanExecuteChanged();
    }

    private async Task LoadAsync()
    {
        IsBusy = true;
        StatusMessage = "در حال اتصال به پیام‌رسان پشتیبانی...";
        try
        {
            var user = await _sessionStore.GetCurrentUserAsync();
            CanPublishStories = DesktopUserRole.IsTeacherOrAdmin(user?.Role);
            _isStudentUser = !CanPublishStories;
            OnPropertyChanged(nameof(NewTopicVisibility));

            HasVipAccess = await _vip.HasActiveVipSupportAsync();
            if (!HasVipAccess)
                StatusMessage = "اشتراک پشتیبانی فعال نیست. برای فعال‌سازی وارد سایت شوید.";

            await _sync.StartAsync();
            await _sync.RefreshAsync();

            if (_isStudentUser)
            {
                _supportTeachers.Clear();
                _supportTeachers.AddRange(await _api.GetStudentSupportTeachersAsync());
            }

            await ReloadUiAsync();
            StatusMessage = HasVipAccess
                ? "متصل — ابتدا طرف گفتگو را انتخاب کنید یا موضوع جدید بسازید."
                : "برای ارسال پیام و ایجاد موضوع، اشتراک پشتیبانی را از سایت فعال کنید.";
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

    private async Task OpenStoryAsync(StoryGroupItem? group)
    {
        if (group is null || group.Stories.Count == 0) return;

        var owner = System.Windows.Application.Current?.MainWindow;
        if (owner is null) return;

        var stories = group.Stories.ToList();
        var startIndex = stories.FindIndex(s => s.HasUnseen);
        if (startIndex < 0) startIndex = 0;
        var viewer = new StoryViewerWindow(stories, startIndex, _api, _settings.ApiBaseUrl);
        viewer.Owner = owner;
        viewer.ShowDialog();

        await _sync.RefreshAsync();
        await ReloadUiAsync();
    }

    private async Task PublishStoryAsync()
    {
        var owner = System.Windows.Application.Current?.MainWindow;
        if (owner is null) return;

        var dialog = new PublishStoryDialog(_api, owner);
        if (dialog.ShowDialog() != true || !dialog.Published) return;

        await _sync.RefreshAsync();
        await ReloadUiAsync();
        StatusMessage = "استوری با موفقیت منتشر شد.";
    }

    private void BackToPeers()
    {
        SelectedPeer = null;
        StatusMessage = "طرف گفتگو را انتخاب کنید.";
    }

    private async Task OpenVipActivationPageAsync()
    {
        const string returnUrl = "/account?view=support-freeze";
        var baseUrl = _settings.ClientWebsiteBaseUrl.TrimEnd('/');
        string? code = null;
        string? handoffError = null;

        try
        {
            StatusMessage = "در حال آماده‌سازی ورود امن به سایت...";
            code = await _api.CreateWebHandoffCodeAsync(returnUrl);
        }
        catch (Exception ex)
        {
            handoffError = ex.Message;
        }

        try
        {
            var url = string.IsNullOrWhiteSpace(code)
                ? $"{baseUrl}{returnUrl}"
                : $"{baseUrl}/auth/desktop-handoff?code={Uri.EscapeDataString(code)}&returnUrl={Uri.EscapeDataString(returnUrl)}";

            System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
            {
                FileName = url,
                UseShellExecute = true,
            });

            if (!string.IsNullOrWhiteSpace(code))
                StatusMessage = "سایت با احراز هویت دسکتاپ باز شد.";
            else if (!string.IsNullOrWhiteSpace(handoffError))
                StatusMessage = $"آماده‌سازی ورود امن ناموفق بود ({handoffError}). سایت بدون handoff باز شد.";
            else
                StatusMessage = "سایت باز شد. اگر لاگین خواست، دوباره از همین دکمه تلاش کنید.";
        }
        catch (Exception ex)
        {
            StatusMessage = $"باز کردن سایت ناموفق بود: {ex.Message}";
        }
    }

    private async Task OpenNewTopicAsync()
    {
        if (!HasVipAccess) return;

        var owner = System.Windows.Application.Current?.MainWindow;
        if (owner is null) return;

        IReadOnlyList<DesktopSupportTeacherOption> teachers;
        if (_supportTeachers.Count == 0)
            _supportTeachers.AddRange(await _api.GetStudentSupportTeachersAsync());
        teachers = _supportTeachers;

        if (teachers.Count == 0)
        {
            StatusMessage = "استادی برای گفتگو یافت نشد. ابتدا باید دوره‌ای از استاد خریده باشید.";
            return;
        }

        var dialog = new NewTopicDialog(
            _api,
            teachers,
            owner,
            SelectedPeer?.PeerUserId);
        if (dialog.ShowDialog() != true || dialog.CreatedConversationId <= 0)
            return;

        await _sync.RefreshAsync();
        await ReloadUiAsync();

        var peer = Peers.FirstOrDefault(p => p.PeerUserId == dialog.CreatedTeacherUserId)
                   ?? Peers.FirstOrDefault();
        if (peer is not null)
            SelectedPeer = peer;

        var thread = Threads.FirstOrDefault(t => t.RemoteConversationId == dialog.CreatedConversationId);
        if (thread is not null)
            SelectedThread = thread;

        StatusMessage = "موضوع جدید ایجاد شد.";
    }

    private async Task AttachMediaAsync(DesktopChatMediaKind kind)
    {
        if (SelectedThread is null || !HasVipAccess) return;

        var filter = kind switch
        {
            DesktopChatMediaKind.Image => "تصویر|*.jpg;*.jpeg;*.png;*.webp;*.gif|همه فایل‌ها|*.*",
            DesktopChatMediaKind.Audio => "صوت / ویس|*.mp3;*.wav;*.ogg;*.m4a;*.aac;*.webm|همه فایل‌ها|*.*",
            DesktopChatMediaKind.Video => "ویدیو|*.mp4;*.webm;*.mov;*.m4v|همه فایل‌ها|*.*",
            _ => "فایل|*.pdf;*.zip;*.doc;*.docx;*.txt;*.rar|همه فایل‌ها|*.*",
        };

        var dialog = new Microsoft.Win32.OpenFileDialog
        {
            Title = kind switch
            {
                DesktopChatMediaKind.Image => "انتخاب تصویر",
                DesktopChatMediaKind.Audio => "انتخاب ویس یا فایل صوتی",
                DesktopChatMediaKind.Video => "انتخاب ویدیو",
                _ => "انتخاب فایل",
            },
            Filter = filter,
        };

        if (dialog.ShowDialog() != true) return;

        IsBusy = true;
        StatusMessage = "در حال آپلود پیوست...";
        try
        {
            var upload = await _api.UploadSupportChatMediaAsync(dialog.FileName, kind);
            if (!upload.Success || string.IsNullOrWhiteSpace(upload.MediaUrl))
            {
                StatusMessage = upload.ErrorMessage ?? "آپلود ناموفق بود.";
                return;
            }

            var html = ChatHtmlHelper.BuildMediaHtml(
                kind,
                upload.MediaUrl,
                upload.FileName,
                ComposeText.Trim());
            await _sync.SendHtmlMessageAsync(SelectedThread.RemoteConversationId, html);
            ComposeText = string.Empty;
            await ReloadMessagesAsync(SelectedThread.RemoteConversationId);
            StatusMessage = "پیوست ارسال شد.";
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

    private async Task SelectThreadAsync(long remoteConversationId)
    {
        IsBusy = true;
        try
        {
            await _sync.SelectConversationAsync(remoteConversationId);
            await ReloadMessagesAsync(remoteConversationId);
            if (SelectedThread is not null)
                PeerIsOnline = _sync.IsPeerOnline(SelectedThread.PeerUserId);
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

    /// <summary>Optional hook from the view to read RichTextBox HTML for send.</summary>
    public Func<string?>? GetComposeHtml { get; set; }

    /// <summary>Optional hook from the view to clear the RichTextBox after send.</summary>
    public Action? ClearComposeEditor { get; set; }

    /// <summary>Optional hook from the view to load HTML into the RichTextBox for edit.</summary>
    public Action<string>? SetComposeHtml { get; set; }

    private async Task SendAsync()
    {
        if (SelectedThread is null) return;

        var html = GetComposeHtml?.Invoke()?.Trim();
        if (string.IsNullOrWhiteSpace(html))
        {
            var text = ComposeText.Trim();
            if (text.Length == 0) return;
            html = ChatHtmlHelper.BuildPlainTextHtml(text);
        }

        IsBusy = true;
        try
        {
            if (EditingMessageId is > 0)
            {
                await _sync.UpdateMessageAsync(SelectedThread.RemoteConversationId, EditingMessageId.Value, html);
                StatusMessage = "پیام ویرایش شد.";
            }
            else
            {
                await _sync.SendHtmlMessageAsync(
                    SelectedThread.RemoteConversationId,
                    html,
                    ReplyTarget?.RemoteMessageId);
                StatusMessage = "پیام ارسال شد.";
            }

            ComposeText = string.Empty;
            ClearComposeEditor?.Invoke();
            CancelReplyOrEdit();
            await ReloadMessagesAsync(SelectedThread.RemoteConversationId);
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

    private void BeginReply(ChatMessageItem? message)
    {
        if (message is null || message.IsDeleted) return;
        EditingMessageId = null;
        ReplyTarget = message;
    }

    private void BeginEdit(ChatMessageItem? message)
    {
        if (message is null || !message.IsMine || message.IsDeleted || message.RemoteMessageId is not > 0)
            return;

        ReplyTarget = null;
        EditingMessageId = message.RemoteMessageId;
        SetComposeHtml?.Invoke(message.OriginalHtml);
        ComposeText = message.BodyPreview;
        OnPropertyChanged(nameof(ReplyBannerPreview));
    }

    private void CancelReplyOrEdit()
    {
        ReplyTarget = null;
        if (EditingMessageId is > 0)
        {
            EditingMessageId = null;
            ComposeText = string.Empty;
            ClearComposeEditor?.Invoke();
        }
        else
        {
            EditingMessageId = null;
        }
    }

    private async Task DeleteMessageAsync(ChatMessageItem? message)
    {
        if (SelectedThread is null || message?.RemoteMessageId is not > 0 || !message.IsMine)
            return;

        var confirm = MessageBox.Show(
            "این پیام حذف شود؟",
            "حذف پیام",
            MessageBoxButton.YesNo,
            MessageBoxImage.Question,
            MessageBoxResult.No,
            MessageBoxOptions.RightAlign | MessageBoxOptions.RtlReading);
        if (confirm != MessageBoxResult.Yes) return;

        IsBusy = true;
        try
        {
            await _sync.DeleteMessageAsync(SelectedThread.RemoteConversationId, message.RemoteMessageId.Value);
            if (EditingMessageId == message.RemoteMessageId || ReplyTarget?.RemoteMessageId == message.RemoteMessageId)
                CancelReplyOrEdit();
            await ReloadMessagesAsync(SelectedThread.RemoteConversationId);
            StatusMessage = "پیام حذف شد.";
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

    private void OpenImage(ChatMessageItem? message)
    {
        if (string.IsNullOrWhiteSpace(message?.ImageUrl)) return;
        var window = new ImageLightboxWindow(message.ImageUrl)
        {
            Owner = System.Windows.Application.Current?.MainWindow,
        };
        window.ShowDialog();
    }

    private async Task DownloadVideoAsync(ChatMessageItem? message)
    {
        if (string.IsNullOrWhiteSpace(message?.VideoUrl)) return;
        try
        {
            StatusMessage = "در حال دانلود ویدیو...";
            var path = await ChatMediaDownloadHelper.DownloadAsync(message.VideoUrl, message.FileName ?? "video.mp4");
            StatusMessage = path is null ? "دانلود لغو شد." : $"ویدیو ذخیره شد: {path}";
        }
        catch (Exception ex)
        {
            StatusMessage = ex.Message;
        }
    }

    private async Task DownloadFileAsync(ChatMessageItem? message)
    {
        if (string.IsNullOrWhiteSpace(message?.FileUrl)) return;
        try
        {
            StatusMessage = "در حال دانلود فایل...";
            var path = await ChatMediaDownloadHelper.DownloadAsync(message.FileUrl, message.FileName);
            StatusMessage = path is null ? "دانلود لغو شد." : $"فایل ذخیره شد: {path}";
        }
        catch (Exception ex)
        {
            StatusMessage = ex.Message;
        }
    }

    private async void OnThreadsChanged() => await ReloadUiAsync();

    private async void OnMessagesChanged(long conversationId)
    {
        if (SelectedThread?.RemoteConversationId == conversationId)
            await ReloadMessagesAsync(conversationId);
    }

    private void OnPresenceChanged(long userId, bool isOnline)
    {
        if (SelectedThread?.PeerUserId == userId)
            PeerIsOnline = isOnline;
    }

    private async Task ReloadUiAsync()
    {
        var threads = await _sync.GetThreadsAsync();
        _allThreads.Clear();
        _allThreads.AddRange(threads);

        _allStories.Clear();
        _allStories.AddRange(_sync.GetStories());

        var selectedPeerId = SelectedPeer?.PeerUserId;
        var selectedThreadId = SelectedThread?.RemoteConversationId;

        RebuildPeers();

        ChatPeerItem? restoredPeer = null;
        if (selectedPeerId is > 0)
            restoredPeer = Peers.FirstOrDefault(p => p.PeerUserId == selectedPeerId);

        if (!Equals(_selectedPeer, restoredPeer))
        {
            _selectedPeer = restoredPeer;
            OnPropertyChanged(nameof(SelectedPeer));
            OnPropertyChanged(nameof(PeersVisibility));
            OnPropertyChanged(nameof(TopicsVisibility));
            OnPropertyChanged(nameof(SidebarTitle));
            OnPropertyChanged(nameof(SidebarHint));
            OnPropertyChanged(nameof(SelectedPeerAvatarUrl));
            ((RelayCommand)BackToPeersCommand).RaiseCanExecuteChanged();
        }
        else
        {
            OnPropertyChanged(nameof(SelectedPeerAvatarUrl));
        }

        RebuildThreadsForSelectedPeer();

        if (selectedThreadId is > 0)
        {
            var restoredThread = Threads.FirstOrDefault(t => t.RemoteConversationId == selectedThreadId);
            if (!Equals(_selectedThread, restoredThread))
            {
                _selectedThread = restoredThread;
                OnPropertyChanged(nameof(SelectedThread));
                ((AsyncRelayCommand)SendCommand).RaiseCanExecuteChanged();
            }
        }

        RebuildStoryGroups();
    }

    private void RebuildStoryGroups()
    {
        StoryGroups.Clear();
        foreach (var group in _allStories
                     .GroupBy(s => s.TeacherUserId)
                     .Select(g =>
                     {
                         var ordered = g.OrderBy(x => x.ExpiresAtUtc).ToList();
                         var first = ordered[0];
                         return new StoryGroupItem(
                             first.TeacherUserId,
                             first.TeacherName,
                             DesktopMediaUriHelper.Resolve(first.TeacherAvatarUrl ?? first.ThumbnailUrl, _settings.ApiBaseUrl)?.ToString(),
                             ordered.Any(x => x.HasUnseen),
                             ordered);
                     })
                     .OrderByDescending(g => g.HasUnseen)
                     .ThenBy(g => g.TeacherName))
        {
            StoryGroups.Add(group);
        }
    }

    private void RebuildPeers()
    {
        var avatarByTeacher = _allStories
            .GroupBy(s => s.TeacherUserId)
            .ToDictionary(
                g => g.Key,
                g => DesktopMediaUriHelper.Resolve(
                        g.Select(x => x.TeacherAvatarUrl).FirstOrDefault(u => !string.IsNullOrWhiteSpace(u))
                        ?? g.Select(x => x.ThumbnailUrl).FirstOrDefault(u => !string.IsNullOrWhiteSpace(u)),
                        _settings.ApiBaseUrl)
                    ?.ToString());

        var peerMap = new Dictionary<long, ChatPeerItem>();

        foreach (var group in _allThreads.GroupBy(t => t.PeerUserId))
        {
            var latest = group.OrderByDescending(x => x.LastMessageAtUtc ?? DateTime.MinValue).First();
            avatarByTeacher.TryGetValue(group.Key, out var avatar);
            peerMap[group.Key] = new ChatPeerItem(
                group.Key,
                latest.PeerDisplayName,
                group.Count(),
                group.Sum(x => x.UnreadCount),
                latest.LastMessagePreview,
                latest.LastMessageAtUtc,
                avatar);
        }

        if (_isStudentUser)
        {
            foreach (var teacher in _supportTeachers)
            {
                if (peerMap.ContainsKey(teacher.TeacherUserId))
                    continue;
                avatarByTeacher.TryGetValue(teacher.TeacherUserId, out var avatar);
                peerMap[teacher.TeacherUserId] = new ChatPeerItem(
                    teacher.TeacherUserId,
                    teacher.DisplayName,
                    0,
                    0,
                    "هنوز موضوعی ندارید — موضوع جدید بسازید",
                    null,
                    avatar);
            }
        }

        Peers.Clear();
        foreach (var peer in peerMap.Values
                     .OrderByDescending(p => p.LastMessageAtUtc ?? DateTime.MinValue)
                     .ThenBy(p => p.DisplayName))
            Peers.Add(peer);
    }

    private void RebuildThreadsForSelectedPeer()
    {
        Threads.Clear();
        if (SelectedPeer is null) return;

        foreach (var thread in _allThreads
                     .Where(t => t.PeerUserId == SelectedPeer.PeerUserId)
                     .OrderByDescending(t => t.LastMessageAtUtc ?? DateTime.MinValue))
        {
            var preview = string.IsNullOrWhiteSpace(thread.LastMessagePreview)
                ? "—"
                : MessengerMemoryStore.StripHtml(thread.LastMessagePreview, 60);

            Threads.Add(new ChatThreadItem(
                thread.RemoteConversationId,
                thread.PeerUserId,
                thread.PeerDisplayName,
                thread.Subject,
                preview,
                thread.UnreadCount));
        }
    }

    private async Task ReloadMessagesAsync(long conversationId)
    {
        var messages = await _sync.GetMessagesAsync(conversationId);
        Messages.Clear();
        foreach (var message in messages)
        {
            if (message.IsDeleted)
            {
                Messages.Add(new ChatMessageItem(
                    message.SenderName,
                    "این پیام حذف شده است.",
                    message.SentAtUtc.ToLocalTime().ToString("HH:mm", System.Globalization.CultureInfo.InvariantCulture),
                    message.IsMine,
                    message.IsPending,
                    message.SendError,
                    RemoteMessageId: message.RemoteMessageId,
                    IsDeleted: true,
                    OriginalHtml: message.ContentHtml));
                continue;
            }

            var parts = ChatHtmlHelper.Parse(message.ContentHtml, _settings.ApiBaseUrl);
            var richHtml = string.IsNullOrWhiteSpace(parts.RichHtml) ? null : parts.RichHtml;
            var bodyFallback = string.IsNullOrWhiteSpace(parts.Text)
                ? (parts.FileName ?? (string.IsNullOrWhiteSpace(parts.AudioUrl) && string.IsNullOrWhiteSpace(parts.ImageUrl) && string.IsNullOrWhiteSpace(parts.VideoUrl)
                    ? "پیام رسانه‌ای"
                    : string.Empty))
                : parts.Text;
            Messages.Add(new ChatMessageItem(
                message.SenderName,
                bodyFallback,
                message.SentAtUtc.ToLocalTime().ToString("HH:mm", System.Globalization.CultureInfo.InvariantCulture),
                message.IsMine,
                message.IsPending,
                message.SendError,
                parts.ImageUrl,
                parts.AudioUrl,
                parts.VideoUrl,
                parts.FileUrl,
                parts.FileName,
                richHtml,
                message.RemoteMessageId,
                message.IsDeleted,
                message.ContentHtml,
                message.EditedAtUtc is not null,
                message.ReplyToSenderName,
                message.ReplyToContentPreview));
        }
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    private bool Set<T>(ref T field, T value, [CallerMemberName] string? name = null)
    {
        if (Equals(field, value)) return false;
        field = value;
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
        return true;
    }

    private void OnPropertyChanged([CallerMemberName] string? name = null) =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));

    public async ValueTask DisposeAsync()
    {
        _sync.ThreadsChanged -= OnThreadsChanged;
        _sync.MessagesChanged -= OnMessagesChanged;
        _sync.PresenceChanged -= OnPresenceChanged;
        if (_sync is IAsyncDisposable disposable)
            await disposable.DisposeAsync();
    }
}

public sealed record ChatPeerItem(
    long PeerUserId,
    string DisplayName,
    int TopicCount,
    int UnreadCount,
    string? LastMessagePreview,
    DateTime? LastMessageAtUtc,
    string? AvatarUrl = null)
{
    public string Preview => string.IsNullOrWhiteSpace(LastMessagePreview)
        ? "هنوز پیامی رد و بدل نشده"
        : MessengerMemoryStore.StripHtml(LastMessagePreview, 50);

    public string TopicCountLabel => TopicCount <= 0 ? "بدون موضوع" : $"{TopicCount} موضوع";

    public string UnreadLabel => UnreadCount > 0 ? $"{UnreadCount} خوانده‌نشده" : string.Empty;

    public Visibility UnreadVisibility => UnreadCount > 0 ? Visibility.Visible : Visibility.Collapsed;
}

public sealed record ChatThreadItem(
    long RemoteConversationId,
    long PeerUserId,
    string PeerDisplayName,
    string Subject,
    string? LastMessagePreview,
    int UnreadCount)
{
    public string Title
    {
        get
        {
            var raw = string.IsNullOrWhiteSpace(Subject) ? PeerDisplayName : Subject;
            return raw.Length <= 42 ? raw : raw[..42] + "…";
        }
    }

    public string Preview => LastMessagePreview ?? "—";
}

public sealed record ChatMessageItem(
    string SenderName,
    string Body,
    string TimeLabel,
    bool IsMine,
    bool IsPending,
    string? Error,
    string? ImageUrl = null,
    string? AudioUrl = null,
    string? VideoUrl = null,
    string? FileUrl = null,
    string? FileName = null,
    string? RichHtml = null,
    long? RemoteMessageId = null,
    bool IsDeleted = false,
    string OriginalHtml = "",
    bool IsEdited = false,
    string? ReplyToSenderName = null,
    string? ReplyToContentPreview = null)
{
    public Visibility ImageVisibility => string.IsNullOrWhiteSpace(ImageUrl) ? Visibility.Collapsed : Visibility.Visible;
    public Visibility AudioVisibility => string.IsNullOrWhiteSpace(AudioUrl) ? Visibility.Collapsed : Visibility.Visible;
    public Visibility VideoVisibility => string.IsNullOrWhiteSpace(VideoUrl) ? Visibility.Collapsed : Visibility.Visible;
    public Visibility FileVisibility => string.IsNullOrWhiteSpace(FileUrl) ? Visibility.Collapsed : Visibility.Visible;
    public Visibility BodyVisibility =>
        IsDeleted || (!string.IsNullOrWhiteSpace(RichHtml) || !string.IsNullOrWhiteSpace(Body))
            ? Visibility.Visible
            : Visibility.Collapsed;
    public Visibility ReplyQuoteVisibility =>
        !IsDeleted && (!string.IsNullOrWhiteSpace(ReplyToSenderName) || !string.IsNullOrWhiteSpace(ReplyToContentPreview))
            ? Visibility.Visible
            : Visibility.Collapsed;
    public Visibility EditedVisibility => IsEdited && !IsDeleted ? Visibility.Visible : Visibility.Collapsed;
    public Visibility OwnerActionsVisibility => IsMine && !IsDeleted && RemoteMessageId is > 0
        ? Visibility.Visible
        : Visibility.Collapsed;
    /// <summary>Shown for any non-deleted message so Copy (and reply/edit when allowed) is available.</summary>
    public Visibility MenuVisibility => !IsDeleted ? Visibility.Visible : Visibility.Collapsed;

    public string CopyableText
    {
        get
        {
            if (IsDeleted) return string.Empty;
            if (!string.IsNullOrWhiteSpace(Body))
                return Body.Trim();
            if (!string.IsNullOrWhiteSpace(RichHtml))
                return MessengerMemoryStore.StripHtml(RichHtml, 8000);
            if (!string.IsNullOrWhiteSpace(FileUrl))
                return string.IsNullOrWhiteSpace(FileName) ? FileUrl! : $"{FileName}\n{FileUrl}";
            if (!string.IsNullOrWhiteSpace(VideoUrl))
                return VideoUrl!;
            if (!string.IsNullOrWhiteSpace(AudioUrl))
                return AudioUrl!;
            if (!string.IsNullOrWhiteSpace(ImageUrl))
                return ImageUrl!;
            return string.Empty;
        }
    }
    public string FileLabel => string.IsNullOrWhiteSpace(FileName) ? "دانلود فایل" : FileName;
    public string BodyPreview
    {
        get
        {
            var text = string.IsNullOrWhiteSpace(Body) ? "پیام رسانه‌ای" : Body;
            return text.Length <= 80 ? text : text[..80] + "…";
        }
    }
    public string ReplyQuoteText
    {
        get
        {
            var preview = string.IsNullOrWhiteSpace(ReplyToContentPreview) ? "…" : ReplyToContentPreview!;
            preview = MessengerMemoryStore.StripHtml(preview, 70);
            return string.IsNullOrWhiteSpace(ReplyToSenderName)
                ? preview
                : $"{ReplyToSenderName}: {preview}";
        }
    }
    public string DisplayHtml => IsDeleted
        ? "<p><em>این پیام حذف شده است.</em></p>"
        : !string.IsNullOrWhiteSpace(RichHtml)
            ? RichHtml!
            : (string.IsNullOrWhiteSpace(Body) ? string.Empty : $"<p>{System.Net.WebUtility.HtmlEncode(Body)}</p>");
}

public sealed record StoryGroupItem(
    long TeacherUserId,
    string TeacherName,
    string? AvatarUrl,
    bool HasUnseen,
    IReadOnlyList<DesktopTeacherStory> Stories);

