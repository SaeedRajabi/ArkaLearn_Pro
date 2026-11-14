using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Diagnostics;
using System.Net;
using System.Runtime.CompilerServices;
using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Input;
using ArkaLearnDesktop.Application.Abstractions;

namespace ArkaLearnDesktop.App.ViewModels;

public sealed class AboutViewModel : INotifyPropertyChanged, IPageReady
{
    private readonly IDesktopApiClient _api;
    private string? _statusMessage;
    private bool _isBusy;
    private string _heroTitle = "آرکا نرم‌افزار";
    private string _heroSubtitle = "شرکت آرکا نرم‌افزار";
    private string? _introTitle;
    private string? _introBody;
    private string? _missionTitle;
    private string? _missionBody;
    private string? _visionTitle;
    private string? _visionBody;
    private string? _valuesTitle;
    private string? _valuesBody;
    private string? _teamTitle;
    private string? _teamBody;
    private string? _contactSectionTitle;
    private string? _phone;
    private string? _email;
    private string? _address;
    private string? _salesPhone;
    private string? _salesEmail;
    private string? _instagramUrl;
    private string? _linkedInUrl;
    private string? _twitterUrl;
    private string? _facebookUrl;

    public AboutViewModel(IDesktopApiClient api)
    {
        _api = api;
        TeamMembers = new ObservableCollection<AboutTeamMemberVm>();
        RefreshCommand = new AsyncRelayCommand(LoadAsync, () => !IsBusy);
        OpenUrlCommand = new RelayCommand<string>(OpenUrl, url => !string.IsNullOrWhiteSpace(url));
    }

    public Task PrepareAsync(CancellationToken cancellationToken = default) => LoadAsync();

    public ObservableCollection<AboutTeamMemberVm> TeamMembers { get; }

    public ICommand RefreshCommand { get; }
    public ICommand OpenUrlCommand { get; }

    public string AppVersion => App.AppVersion;

    public string HeroTitle
    {
        get => _heroTitle;
        private set => Set(ref _heroTitle, value);
    }

    public string HeroSubtitle
    {
        get => _heroSubtitle;
        private set => Set(ref _heroSubtitle, value);
    }

    public string? IntroTitle
    {
        get => _introTitle;
        private set
        {
            if (Set(ref _introTitle, value))
                OnPropertyChanged(nameof(IntroVisibility));
        }
    }

    public string? IntroBody
    {
        get => _introBody;
        private set
        {
            if (Set(ref _introBody, value))
                OnPropertyChanged(nameof(IntroVisibility));
        }
    }

    public Visibility IntroVisibility =>
        string.IsNullOrWhiteSpace(IntroTitle) && string.IsNullOrWhiteSpace(IntroBody)
            ? Visibility.Collapsed
            : Visibility.Visible;

    public string? MissionTitle
    {
        get => _missionTitle;
        private set
        {
            if (Set(ref _missionTitle, value))
                OnPropertyChanged(nameof(MissionVisibility));
        }
    }

    public string? MissionBody
    {
        get => _missionBody;
        private set
        {
            if (Set(ref _missionBody, value))
                OnPropertyChanged(nameof(MissionVisibility));
        }
    }

    public Visibility MissionVisibility =>
        string.IsNullOrWhiteSpace(MissionTitle) && string.IsNullOrWhiteSpace(MissionBody)
            ? Visibility.Collapsed
            : Visibility.Visible;

    public string? VisionTitle
    {
        get => _visionTitle;
        private set
        {
            if (Set(ref _visionTitle, value))
                OnPropertyChanged(nameof(VisionVisibility));
        }
    }

    public string? VisionBody
    {
        get => _visionBody;
        private set
        {
            if (Set(ref _visionBody, value))
                OnPropertyChanged(nameof(VisionVisibility));
        }
    }

    public Visibility VisionVisibility =>
        string.IsNullOrWhiteSpace(VisionTitle) && string.IsNullOrWhiteSpace(VisionBody)
            ? Visibility.Collapsed
            : Visibility.Visible;

    public string? ValuesTitle
    {
        get => _valuesTitle;
        private set
        {
            if (Set(ref _valuesTitle, value))
                OnPropertyChanged(nameof(ValuesVisibility));
        }
    }

    public string? ValuesBody
    {
        get => _valuesBody;
        private set
        {
            if (Set(ref _valuesBody, value))
                OnPropertyChanged(nameof(ValuesVisibility));
        }
    }

    public Visibility ValuesVisibility =>
        string.IsNullOrWhiteSpace(ValuesTitle) && string.IsNullOrWhiteSpace(ValuesBody)
            ? Visibility.Collapsed
            : Visibility.Visible;

    public string? TeamTitle
    {
        get => _teamTitle;
        private set
        {
            if (Set(ref _teamTitle, value))
                OnPropertyChanged(nameof(TeamVisibility));
        }
    }

    public string? TeamBody
    {
        get => _teamBody;
        private set
        {
            if (Set(ref _teamBody, value))
                OnPropertyChanged(nameof(TeamVisibility));
        }
    }

    public Visibility TeamVisibility =>
        TeamMembers.Count == 0 && string.IsNullOrWhiteSpace(TeamTitle) && string.IsNullOrWhiteSpace(TeamBody)
            ? Visibility.Collapsed
            : Visibility.Visible;

    public string? ContactSectionTitle
    {
        get => _contactSectionTitle;
        private set => Set(ref _contactSectionTitle, value);
    }

    public string? Phone
    {
        get => _phone;
        private set
        {
            if (Set(ref _phone, value))
                OnPropertyChanged(nameof(PhoneVisibility));
        }
    }

    public Visibility PhoneVisibility =>
        string.IsNullOrWhiteSpace(Phone) ? Visibility.Collapsed : Visibility.Visible;

    public string? Email
    {
        get => _email;
        private set
        {
            if (Set(ref _email, value))
                OnPropertyChanged(nameof(EmailVisibility));
        }
    }

    public Visibility EmailVisibility =>
        string.IsNullOrWhiteSpace(Email) ? Visibility.Collapsed : Visibility.Visible;

    public string? Address
    {
        get => _address;
        private set
        {
            if (Set(ref _address, value))
                OnPropertyChanged(nameof(AddressVisibility));
        }
    }

    public Visibility AddressVisibility =>
        string.IsNullOrWhiteSpace(Address) ? Visibility.Collapsed : Visibility.Visible;

    public string? SalesPhone
    {
        get => _salesPhone;
        private set
        {
            if (Set(ref _salesPhone, value))
                OnPropertyChanged(nameof(SalesVisibility));
        }
    }

    public string? SalesEmail
    {
        get => _salesEmail;
        private set
        {
            if (Set(ref _salesEmail, value))
                OnPropertyChanged(nameof(SalesVisibility));
        }
    }

    public Visibility SalesVisibility =>
        string.IsNullOrWhiteSpace(SalesPhone) && string.IsNullOrWhiteSpace(SalesEmail)
            ? Visibility.Collapsed
            : Visibility.Visible;

    public string? InstagramUrl
    {
        get => _instagramUrl;
        private set
        {
            if (Set(ref _instagramUrl, value))
            {
                OnPropertyChanged(nameof(SocialVisibility));
                OnPropertyChanged(nameof(InstagramVisibility));
            }
        }
    }

    public Visibility InstagramVisibility =>
        string.IsNullOrWhiteSpace(InstagramUrl) ? Visibility.Collapsed : Visibility.Visible;

    public string? LinkedInUrl
    {
        get => _linkedInUrl;
        private set
        {
            if (Set(ref _linkedInUrl, value))
            {
                OnPropertyChanged(nameof(SocialVisibility));
                OnPropertyChanged(nameof(LinkedInVisibility));
            }
        }
    }

    public Visibility LinkedInVisibility =>
        string.IsNullOrWhiteSpace(LinkedInUrl) ? Visibility.Collapsed : Visibility.Visible;

    public string? TwitterUrl
    {
        get => _twitterUrl;
        private set
        {
            if (Set(ref _twitterUrl, value))
            {
                OnPropertyChanged(nameof(SocialVisibility));
                OnPropertyChanged(nameof(TwitterVisibility));
            }
        }
    }

    public Visibility TwitterVisibility =>
        string.IsNullOrWhiteSpace(TwitterUrl) ? Visibility.Collapsed : Visibility.Visible;

    public string? FacebookUrl
    {
        get => _facebookUrl;
        private set
        {
            if (Set(ref _facebookUrl, value))
            {
                OnPropertyChanged(nameof(SocialVisibility));
                OnPropertyChanged(nameof(FacebookVisibility));
            }
        }
    }

    public Visibility FacebookVisibility =>
        string.IsNullOrWhiteSpace(FacebookUrl) ? Visibility.Collapsed : Visibility.Visible;

    public Visibility SocialVisibility =>
        string.IsNullOrWhiteSpace(InstagramUrl)
        && string.IsNullOrWhiteSpace(LinkedInUrl)
        && string.IsNullOrWhiteSpace(TwitterUrl)
        && string.IsNullOrWhiteSpace(FacebookUrl)
            ? Visibility.Collapsed
            : Visibility.Visible;

    public string? StatusMessage
    {
        get => _statusMessage;
        private set => Set(ref _statusMessage, value);
    }

    public bool IsBusy
    {
        get => _isBusy;
        private set
        {
            if (!Set(ref _isBusy, value)) return;
            ((AsyncRelayCommand)RefreshCommand).RaiseCanExecuteChanged();
        }
    }

    private async Task LoadAsync()
    {
        IsBusy = true;
        StatusMessage = "در حال دریافت اطلاعات درباره ما...";
        try
        {
            var aboutTask = _api.GetAboutUsPageAsync();
            var contactTask = _api.GetContactUsPageAsync();
            await Task.WhenAll(aboutTask, contactTask);

            ApplyAbout(aboutTask.Result);
            ApplyContact(contactTask.Result);

            StatusMessage = aboutTask.Result is null && contactTask.Result is null
                ? "دریافت اطلاعات از سرور ممکن نشد. در صورت اتصال، دکمه بروزرسانی را بزنید."
                : null;
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

    private void ApplyAbout(DesktopAboutUsPage? about)
    {
        if (about is null)
        {
            HeroTitle = "آرکا نرم‌افزار";
            HeroSubtitle = "پلتفرم آموزش تخصصی آرکا لرن";
            IntroTitle = "درباره شرکت";
            IntroBody = "شرکت آرکا نرم‌افزار ارائه‌دهنده پلتفرم‌های آموزشی و نرم‌افزاری است. مدیریت: سعید رجبی.";
            TeamMembers.Clear();
            TeamMembers.Add(new AboutTeamMemberVm(
                "سعید رجبی",
                "مدیر عامل",
                null, null, null, null, null));
            TeamTitle = "مدیریت و تیم";
            TeamBody = null;
            OnPropertyChanged(nameof(TeamVisibility));
            return;
        }

        HeroTitle = FirstNonEmpty(about.HeroTitle, "آرکا نرم‌افزار");
        HeroSubtitle = FirstNonEmpty(about.HeroSubtitle, "شرکت آرکا نرم‌افزار");
        IntroTitle = NullIfEmpty(about.IntroTitle);
        IntroBody = HtmlToPlain(about.IntroContentHtml);
        MissionTitle = NullIfEmpty(about.MissionTitle);
        MissionBody = HtmlToPlain(about.MissionContentHtml);
        VisionTitle = NullIfEmpty(about.VisionTitle);
        VisionBody = HtmlToPlain(about.VisionContentHtml);
        ValuesTitle = NullIfEmpty(about.ValuesTitle);
        ValuesBody = HtmlToPlain(about.ValuesContentHtml);
        TeamTitle = NullIfEmpty(about.TeamTitle) ?? (about.TeamMembers.Count > 0 ? "تیم ما" : null);
        TeamBody = HtmlToPlain(about.TeamContentHtml);

        TeamMembers.Clear();
        foreach (var member in about.TeamMembers)
        {
            TeamMembers.Add(new AboutTeamMemberVm(
                member.FullName,
                member.SkillTitle,
                member.LinkedinUrl,
                member.GithubUrl,
                member.InstagramUrl,
                member.TwitterUrl,
                member.WebsiteUrl));
        }

        OnPropertyChanged(nameof(TeamVisibility));
    }

    private void ApplyContact(DesktopContactUsPage? contact)
    {
        if (contact is null)
        {
            ContactSectionTitle = "اطلاعات تماس";
            Phone = "09367991020";
            Email = "admin.arkasoftware@gmail.com";
            Address = null;
            SalesPhone = null;
            SalesEmail = null;
            InstagramUrl = null;
            LinkedInUrl = null;
            TwitterUrl = null;
            FacebookUrl = null;
            return;
        }

        ContactSectionTitle = FirstNonEmpty(contact.ContactInfoTitle, contact.PageTitle, "اطلاعات تماس");
        Phone = FirstNonEmpty(contact.ContactInfoPhone, contact.HeadquartersPhone);
        Email = FirstNonEmpty(contact.ContactInfoEmail, contact.HeadquartersEmail);
        Address = NullIfEmpty(contact.HeadquartersAddress);
        SalesPhone = NullIfEmpty(contact.SalesSupportPhone);
        SalesEmail = NullIfEmpty(contact.SalesSupportEmail);
        InstagramUrl = contact.InstagramUrl;
        LinkedInUrl = contact.LinkedInUrl;
        TwitterUrl = contact.TwitterUrl;
        FacebookUrl = contact.FacebookUrl;
    }

    private static void OpenUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return;
        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = url.Trim(),
                UseShellExecute = true,
            });
        }
        catch
        {
            // ignore launch failures
        }
    }

    private static string? HtmlToPlain(string? html)
    {
        if (string.IsNullOrWhiteSpace(html)) return null;
        var text = Regex.Replace(html, "<br\\s*/?>", "\n", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, "</p\\s*>", "\n\n", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, "<[^>]+>", " ");
        text = WebUtility.HtmlDecode(text);
        text = Regex.Replace(text, "[ \\t]+", " ");
        text = Regex.Replace(text, "(\\r?\\n){3,}", "\n\n").Trim();
        return string.IsNullOrWhiteSpace(text) ? null : text;
    }

    private static string FirstNonEmpty(params string?[] values)
    {
        foreach (var value in values)
        {
            if (!string.IsNullOrWhiteSpace(value))
                return value.Trim();
        }

        return string.Empty;
    }

    private static string? NullIfEmpty(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    public event PropertyChangedEventHandler? PropertyChanged;

    private void OnPropertyChanged([CallerMemberName] string? name = null) =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));

    private bool Set<T>(ref T field, T value, [CallerMemberName] string? name = null)
    {
        if (Equals(field, value)) return false;
        field = value;
        OnPropertyChanged(name);
        return true;
    }
}

public sealed class AboutTeamMemberVm
{
    public AboutTeamMemberVm(
        string fullName,
        string skillTitle,
        string? linkedInUrl,
        string? githubUrl,
        string? instagramUrl,
        string? twitterUrl,
        string? websiteUrl)
    {
        FullName = fullName;
        SkillTitle = skillTitle;
        LinkedInUrl = linkedInUrl;
        GithubUrl = githubUrl;
        InstagramUrl = instagramUrl;
        TwitterUrl = twitterUrl;
        WebsiteUrl = websiteUrl;
    }

    public string FullName { get; }
    public string SkillTitle { get; }
    public string? LinkedInUrl { get; }
    public string? GithubUrl { get; }
    public string? InstagramUrl { get; }
    public string? TwitterUrl { get; }
    public string? WebsiteUrl { get; }

    public Visibility LinkedInVisibility =>
        string.IsNullOrWhiteSpace(LinkedInUrl) ? Visibility.Collapsed : Visibility.Visible;

    public Visibility GithubVisibility =>
        string.IsNullOrWhiteSpace(GithubUrl) ? Visibility.Collapsed : Visibility.Visible;

    public Visibility InstagramVisibility =>
        string.IsNullOrWhiteSpace(InstagramUrl) ? Visibility.Collapsed : Visibility.Visible;

    public Visibility TwitterVisibility =>
        string.IsNullOrWhiteSpace(TwitterUrl) ? Visibility.Collapsed : Visibility.Visible;

    public Visibility WebsiteVisibility =>
        string.IsNullOrWhiteSpace(WebsiteUrl) ? Visibility.Collapsed : Visibility.Visible;
}
