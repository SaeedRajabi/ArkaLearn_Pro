using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Globalization;
using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Windows;
using System.Windows.Input;
using System.Windows.Threading;
using ArkaLearnDesktop.Application.Abstractions;

namespace ArkaLearnDesktop.App.ViewModels;

public sealed class ExamsViewModel : INotifyPropertyChanged, IPageReady, IAsyncDisposable
{
    private readonly IDesktopApiClient _api;
    private readonly DispatcherTimer _examTimer;
    private AssignedExamRowVm? _selectedExam;
    private ExamQuestionVm? _currentQuestion;
    private DesktopExamTaking? _activeExam;
    private string? _statusMessage;
    private bool _isBusy;
    private bool _isTaking;
    private bool _showResult;
    private int _currentQuestionIndex;
    private int _remainingSeconds;
    private DateTime? _attemptExpiresAtUtc;
    private long _activeAttemptId;

    public ExamsViewModel(IDesktopApiClient api)
    {
        _api = api;
        AssignedExams = new ObservableCollection<AssignedExamRowVm>();
        SatisfactionItems = new ObservableCollection<SatisfactionRowVm>();
        Questions = new ObservableCollection<ExamQuestionVm>();

        RefreshCommand = new AsyncRelayCommand(LoadAsync, () => !IsBusy);
        OpenExamCommand = new AsyncRelayCommand(OpenSelectedExamAsync, () => SelectedExam is not null && !IsBusy && !IsTaking);
        StartAttemptCommand = new AsyncRelayCommand(StartAttemptAsync, () => _activeExam is not null && !IsBusy && !IsTaking);
        BackToListCommand = new RelayCommand(BackToList, () => IsTaking || ShowResult);
        PreviousQuestionCommand = new RelayCommand(() => MoveQuestion(-1), () => IsTaking && CurrentQuestionIndex > 0);
        NextQuestionCommand = new RelayCommand(() => MoveQuestion(1), () => IsTaking && CurrentQuestionIndex < Questions.Count - 1);
        SaveAnswersCommand = new AsyncRelayCommand(SaveAnswersAsync, () => IsTaking && _activeAttemptId > 0 && !IsBusy);
        SubmitAttemptCommand = new AsyncRelayCommand(SubmitAttemptAsync, () => IsTaking && _activeAttemptId > 0 && !IsBusy);
        ViewResultCommand = new AsyncRelayCommand(
            ViewResultAsync,
            () => SelectedExam is not null && SelectedExam.AttemptStatus >= 2 && !IsBusy);

        _examTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1) };
        _examTimer.Tick += (_, _) => UpdateRemainingTime();
    }

    public Task PrepareAsync(CancellationToken cancellationToken = default) => LoadAsync();

    public ObservableCollection<AssignedExamRowVm> AssignedExams { get; }
    public ObservableCollection<SatisfactionRowVm> SatisfactionItems { get; }
    public ObservableCollection<ExamQuestionVm> Questions { get; }

    public bool HasSatisfactionItems => SatisfactionItems.Count > 0;

    public AssignedExamRowVm? SelectedExam
    {
        get => _selectedExam;
        set
        {
            if (!Set(ref _selectedExam, value)) return;
            RaiseExamCommands();
        }
    }

    public ExamQuestionVm? CurrentQuestion
    {
        get => _currentQuestion;
        private set => Set(ref _currentQuestion, value);
    }

    public int CurrentQuestionIndex
    {
        get => _currentQuestionIndex;
        private set
        {
            if (!Set(ref _currentQuestionIndex, value)) return;
            CurrentQuestion = value >= 0 && value < Questions.Count ? Questions[value] : null;
            OnPropertyChanged(nameof(QuestionProgressLabel));
            RaiseQuestionCommands();
        }
    }

    public string QuestionProgressLabel =>
        Questions.Count == 0 ? string.Empty : $"سؤال {CurrentQuestionIndex + 1} از {Questions.Count}";

    public string RemainingTimeLabel => FormatTime(_remainingSeconds);

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
            RaiseExamCommands();
        }
    }

    public bool IsTaking
    {
        get => _isTaking;
        private set
        {
            if (!Set(ref _isTaking, value)) return;
            OnPropertyChanged(nameof(ListVisibility));
            OnPropertyChanged(nameof(TakingVisibility));
            RaiseExamCommands();
        }
    }

    public bool ShowResult
    {
        get => _showResult;
        private set
        {
            if (!Set(ref _showResult, value)) return;
            OnPropertyChanged(nameof(ResultVisibility));
            OnPropertyChanged(nameof(ListVisibility));
            RaiseExamCommands();
        }
    }

    public Visibility ListVisibility => IsTaking || ShowResult ? Visibility.Collapsed : Visibility.Visible;
    public Visibility TakingVisibility => IsTaking ? Visibility.Visible : Visibility.Collapsed;
    public Visibility ResultVisibility => ShowResult ? Visibility.Visible : Visibility.Collapsed;

    public string? ResultTitle { get; private set; }
    public string? ResultCourseTitle { get; private set; }
    public string? ResultScoreLabel { get; private set; }
    public string? ResultStatusLabel { get; private set; }
    public string? ResultFeedback { get; private set; }

    public ICommand RefreshCommand { get; }
    public ICommand OpenExamCommand { get; }
    public ICommand StartAttemptCommand { get; }
    public ICommand BackToListCommand { get; }
    public ICommand PreviousQuestionCommand { get; }
    public ICommand NextQuestionCommand { get; }
    public ICommand SaveAnswersCommand { get; }
    public ICommand SubmitAttemptCommand { get; }
    public ICommand ViewResultCommand { get; }

    private async Task LoadAsync()
    {
        IsBusy = true;
        StatusMessage = "در حال بارگذاری آزمون‌ها...";
        try
        {
            var exams = await _api.GetMyAssignedExamsAsync();
            AssignedExams.Clear();
            foreach (var exam in exams.OrderBy(e => e.EndsAtUtc))
                AssignedExams.Add(new AssignedExamRowVm(exam));

            await LoadSatisfactionAsync();

            StatusMessage = AssignedExams.Count == 0
                ? "آزمون فعالی برای شما ثبت نشده است."
                : $"{AssignedExams.Count} آزمون بارگذاری شد.";
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

    private async Task LoadSatisfactionAsync()
    {
        SatisfactionItems.Clear();
        try
        {
            var courses = await _api.GetMyLicensedCoursesAsync();
            var seen = new HashSet<long>();
            foreach (var course in courses.Where(c => c.IsActive))
            {
                if (!seen.Add(course.CourseId)) continue;
                var items = await _api.GetTeacherStudentSatisfactionAsync(courseId: course.CourseId);
                foreach (var item in items)
                {
                    SatisfactionItems.Add(new SatisfactionRowVm(
                        course.CourseTitle,
                        item.Score,
                        item.Note,
                        item.UpdatedAtUtc));
                }
            }
        }
        catch
        {
            // Optional panel — ignore failures.
        }

        OnPropertyChanged(nameof(HasSatisfactionItems));
    }

    private async Task OpenSelectedExamAsync()
    {
        if (SelectedExam is null) return;

        // Result can be shown from list payload when the take endpoint is unavailable
        // (e.g. older API that blocked after deadline). Prefer live data when present.
        if (SelectedExam.AttemptStatus is 2 or 3 or 4)
        {
            await OpenResultAsync(SelectedExam);
            return;
        }

        IsBusy = true;
        StatusMessage = "در حال بارگذاری آزمون...";
        try
        {
            var exam = await _api.GetExamForTakingAsync(SelectedExam.ExamId);
            if (exam is null)
            {
                StatusMessage = "آزمون در دسترس نیست (مهلت تمام شده، یا دسترسی ندارید).";
                return;
            }

            _activeExam = exam;
            _activeAttemptId = exam.AttemptId;
            PopulateQuestions(exam);

            if (exam.AttemptStatus is 2 or 3 or 4)
            {
                ShowExamResult(exam);
                return;
            }

            IsTaking = exam.AttemptStatus == 1;
            ShowResult = false;
            _attemptExpiresAtUtc = exam.ExpiresAtUtc?.ToUniversalTime();
            UpdateRemainingTime();
            if (IsTaking)
                _examTimer.Start();

            StatusMessage = IsTaking
                ? "آزمون در حال انجام است. پاسخ‌ها را ذخیره یا ارسال کنید."
                : "برای شروع آزمون، دکمه شروع را بزنید.";
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

    private async Task OpenResultAsync(AssignedExamRowVm selected)
    {
        IsBusy = true;
        StatusMessage = "در حال بارگذاری نتیجه...";
        try
        {
            var exam = await _api.GetExamForTakingAsync(selected.ExamId);
            if (exam is not null && exam.AttemptStatus is 2 or 3 or 4)
            {
                _activeExam = exam;
                _activeAttemptId = exam.AttemptId;
                ShowExamResult(exam);
                StatusMessage = null;
                return;
            }

            if (selected.AttemptStatus is not (2 or 3 or 4))
            {
                StatusMessage = "هنوز نتیجه‌ای برای این آزمون ثبت نشده است.";
                return;
            }

            // Fallback: show what we already have from the assigned-exams list.
            ShowResult = true;
            IsTaking = false;
            _examTimer.Stop();
            ResultTitle = selected.Title;
            ResultCourseTitle = selected.CourseTitle;
            ResultScoreLabel = selected.FinalScore.HasValue
                ? $"{selected.FinalScore:0.##} / {selected.TotalPoints:0.##}"
                : $"— / {selected.TotalPoints:0.##}";
            ResultStatusLabel = DescribeAttemptStatus(selected.AttemptStatus);
            ResultFeedback = exam is null
                ? "بازخورد استاد از سرور دریافت نشد."
                : "بازخوردی ثبت نشده است.";
            OnPropertyChanged(nameof(ResultTitle));
            OnPropertyChanged(nameof(ResultCourseTitle));
            OnPropertyChanged(nameof(ResultScoreLabel));
            OnPropertyChanged(nameof(ResultStatusLabel));
            OnPropertyChanged(nameof(ResultFeedback));
            StatusMessage = null;
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

    private async Task StartAttemptAsync()
    {
        if (_activeExam is null) return;

        IsBusy = true;
        try
        {
            var started = await _api.StartExamAttemptAsync(_activeExam.ExamId);
            if (started is null || started.AttemptId <= 0)
            {
                StatusMessage = "شروع آزمون ناموفق بود. مهلت آزمون را بررسی کنید.";
                return;
            }

            _activeAttemptId = started.AttemptId;
            _attemptExpiresAtUtc = started.ExpiresAtUtc.ToUniversalTime();

            // Refresh questions/answers after start (important when attempt was created lazily).
            var refreshed = await _api.GetExamForTakingAsync(_activeExam.ExamId);
            if (refreshed is not null)
            {
                _activeExam = refreshed;
                PopulateQuestions(refreshed);
            }

            IsTaking = true;
            ShowResult = false;
            _examTimer.Start();
            StatusMessage = "آزمون آغاز شد.";
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

    private async Task SaveAnswersAsync()
    {
        if (_activeAttemptId <= 0) return;

        IsBusy = true;
        try
        {
            await _api.SaveExamAnswersAsync(_activeAttemptId, BuildAnswerPayloads());
            StatusMessage = "پاسخ‌ها ذخیره شد.";
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

    private async Task SubmitAttemptAsync()
    {
        if (_activeAttemptId <= 0) return;

        IsBusy = true;
        try
        {
            var answers = BuildAnswerPayloads();
            await _api.SubmitExamAttemptAsync(_activeAttemptId, answers);
            _examTimer.Stop();
            IsTaking = false;

            var refreshed = _activeExam is null
                ? null
                : await _api.GetExamForTakingAsync(_activeExam.ExamId);
            if (refreshed is not null)
            {
                _activeExam = refreshed;
                ShowExamResult(refreshed);
            }
            else
            {
                ShowResult = true;
                ResultTitle = _activeExam?.Title;
                ResultStatusLabel = "ارسال شد";
            }

            await LoadAsync();
            StatusMessage = "آزمون با موفقیت ارسال شد.";
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

    private async Task ViewResultAsync()
    {
        if (SelectedExam is null || SelectedExam.AttemptStatus < 2) return;
        await OpenResultAsync(SelectedExam);
    }

    private void ShowExamResult(DesktopExamTaking exam)
    {
        ShowResult = true;
        IsTaking = false;
        _examTimer.Stop();
        ResultTitle = exam.Title;
        ResultCourseTitle = exam.CourseTitle;
        ResultScoreLabel = exam.FinalScore.HasValue
            ? $"{exam.FinalScore:0.##} / {exam.TotalPoints:0.##}"
            : $"— / {exam.TotalPoints:0.##}";
        ResultStatusLabel = DescribeAttemptStatus(exam.AttemptStatus);
        ResultFeedback = string.IsNullOrWhiteSpace(exam.ProfessorFeedback)
            ? "بازخوردی ثبت نشده است."
            : exam.ProfessorFeedback;
        OnPropertyChanged(nameof(ResultTitle));
        OnPropertyChanged(nameof(ResultCourseTitle));
        OnPropertyChanged(nameof(ResultScoreLabel));
        OnPropertyChanged(nameof(ResultStatusLabel));
        OnPropertyChanged(nameof(ResultFeedback));
    }

    private void PopulateQuestions(DesktopExamTaking exam)
    {
        Questions.Clear();
        var answerMap = exam.Answers.ToDictionary(a => a.QuestionId);

        foreach (var question in exam.Questions.OrderBy(q => q.OrderIndex))
        {
            answerMap.TryGetValue(question.Id, out var saved);
            var optionIds = ParseOptionIds(saved?.SelectedOptionIdsJson);
            Questions.Add(new ExamQuestionVm(question, optionIds, saved?.TextAnswer));
        }

        CurrentQuestionIndex = 0;
    }

    private IReadOnlyList<DesktopExamAnswerPayload> BuildAnswerPayloads() =>
        Questions.Select(q => new DesktopExamAnswerPayload(
            q.QuestionId,
            q.SelectedOptionIds.Count > 0 ? JsonSerializer.Serialize(q.SelectedOptionIds) : null,
            string.IsNullOrWhiteSpace(q.TextAnswer) ? null : q.TextAnswer.Trim())).ToList();

    private static List<long> ParseOptionIds(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try
        {
            return JsonSerializer.Deserialize<List<long>>(json) ?? [];
        }
        catch
        {
            return [];
        }
    }

    private void MoveQuestion(int delta)
    {
        var next = CurrentQuestionIndex + delta;
        if (next < 0 || next >= Questions.Count) return;
        CurrentQuestionIndex = next;
    }

    private void UpdateRemainingTime()
    {
        if (_attemptExpiresAtUtc is null)
        {
            _remainingSeconds = 0;
            OnPropertyChanged(nameof(RemainingTimeLabel));
            return;
        }

        _remainingSeconds = Math.Max(0, (int)(_attemptExpiresAtUtc.Value - DateTime.UtcNow).TotalSeconds);
        OnPropertyChanged(nameof(RemainingTimeLabel));

        if (_remainingSeconds <= 0 && IsTaking && _activeAttemptId > 0)
            _ = SubmitAttemptAsync();
    }

    private void BackToList()
    {
        _examTimer.Stop();
        IsTaking = false;
        ShowResult = false;
        _activeExam = null;
        _activeAttemptId = 0;
        Questions.Clear();
        CurrentQuestionIndex = 0;
        StatusMessage = AssignedExams.Count == 0
            ? "آزمون فعالی برای شما ثبت نشده است."
            : $"{AssignedExams.Count} آزمون بارگذاری شد.";
    }

    private void RaiseExamCommands()
    {
        ((AsyncRelayCommand)RefreshCommand).RaiseCanExecuteChanged();
        ((AsyncRelayCommand)OpenExamCommand).RaiseCanExecuteChanged();
        ((AsyncRelayCommand)StartAttemptCommand).RaiseCanExecuteChanged();
        ((RelayCommand)BackToListCommand).RaiseCanExecuteChanged();
        ((AsyncRelayCommand)SaveAnswersCommand).RaiseCanExecuteChanged();
        ((AsyncRelayCommand)SubmitAttemptCommand).RaiseCanExecuteChanged();
        ((AsyncRelayCommand)ViewResultCommand).RaiseCanExecuteChanged();
    }

    private void RaiseQuestionCommands()
    {
        ((RelayCommand)PreviousQuestionCommand).RaiseCanExecuteChanged();
        ((RelayCommand)NextQuestionCommand).RaiseCanExecuteChanged();
    }

    private static string FormatTime(int seconds)
    {
        var span = TimeSpan.FromSeconds(Math.Max(0, seconds));
        return span.ToString(span.TotalHours >= 1 ? @"h\:mm\:ss" : @"mm\:ss");
    }

    private static string DescribeAttemptStatus(byte status) => status switch
    {
        0 => "در انتظار",
        1 => "در حال انجام",
        2 => "ارسال‌شده",
        3 => "منقضی / رها شده",
        4 => "نمره‌دهی شده",
        _ => "نامشخص",
    };

    public ValueTask DisposeAsync()
    {
        _examTimer.Stop();
        return ValueTask.CompletedTask;
    }

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

public sealed class AssignedExamRowVm
{
    public AssignedExamRowVm(DesktopAssignedExam exam)
    {
        ExamId = exam.ExamId;
        AttemptId = exam.AttemptId;
        Title = exam.Title;
        CourseTitle = exam.CourseTitle;
        Level = exam.Level;
        EndsAtUtc = exam.EndsAtUtc;
        DurationMinutes = exam.DurationMinutes;
        TotalPoints = exam.TotalPoints;
        AttemptStatus = exam.AttemptStatus;
        FinalScore = exam.FinalScore;
    }

    public long ExamId { get; }
    public long? AttemptId { get; }
    public string Title { get; }
    public string CourseTitle { get; }
    public string Level { get; }
    public DateTime EndsAtUtc { get; }
    public int DurationMinutes { get; }
    public decimal TotalPoints { get; }
    public byte AttemptStatus { get; }
    public decimal? FinalScore { get; }

    public string StatusLabel => AttemptStatus switch
    {
        0 => "آماده شرکت",
        1 => "در حال انجام",
        2 => "ارسال‌شده",
        3 => "رها شده",
        4 => FinalScore.HasValue ? $"نمره: {FinalScore:0.##}" : "نمره‌دهی شده",
        _ => "—",
    };

    public string EndsAtLabel => EndsAtUtc.ToLocalTime().ToString("yyyy/MM/dd HH:mm", CultureInfo.InvariantCulture);
}

public sealed class SatisfactionRowVm
{
    public SatisfactionRowVm(string courseTitle, byte score, string? note, DateTime updatedAtUtc)
    {
        CourseTitle = courseTitle;
        Score = score;
        Note = note ?? string.Empty;
        UpdatedAtLabel = updatedAtUtc.ToLocalTime().ToString("yyyy/MM/dd", CultureInfo.InvariantCulture);
    }

    public string CourseTitle { get; }
    public byte Score { get; }
    public string Note { get; }
    public string UpdatedAtLabel { get; }
}

public sealed class ExamQuestionVm : INotifyPropertyChanged
{
    private ExamOptionVm? _selectedOption;
    private string? _textAnswer;
    private bool _syncingSelection;

    public ExamQuestionVm(DesktopExamTakingQuestion question, IReadOnlyList<long> selectedOptionIds, string? textAnswer)
    {
        QuestionId = question.Id;
        OrderIndex = question.OrderIndex;
        QuestionType = question.QuestionType;
        Prompt = question.Prompt;
        CodeSnippet = question.CodeSnippet;
        Points = question.Points;
        TypeLabel = QuestionType switch
        {
            1 => "صحیح / غلط",
            2 => "تشریحی",
            _ => "چهارگزینه‌ای",
        };

        Options = new ObservableCollection<ExamOptionVm>(
            question.Options.OrderBy(o => o.OrderIndex).Select(o => new ExamOptionVm(o, OnOptionSelected)));

        SelectedOptionIds = new ObservableCollection<long>(selectedOptionIds);
        if (QuestionType is 0 or 1 && selectedOptionIds.Count > 0)
            SelectedOption = Options.FirstOrDefault(o => o.Id == selectedOptionIds[0]);

        _textAnswer = textAnswer;
    }

    public long QuestionId { get; }
    public int OrderIndex { get; }
    public byte QuestionType { get; }
    public string Prompt { get; }
    public string? CodeSnippet { get; }
    public decimal Points { get; }
    public string TypeLabel { get; }
    public ObservableCollection<ExamOptionVm> Options { get; }
    public ObservableCollection<long> SelectedOptionIds { get; }

    public bool IsShortAnswer => QuestionType == 2;
    public bool IsMultipleChoice => QuestionType == 0;
    public bool IsTrueFalse => QuestionType == 1;

    public Visibility OptionsVisibility => IsShortAnswer ? Visibility.Collapsed : Visibility.Visible;
    public Visibility ShortAnswerVisibility => IsShortAnswer ? Visibility.Visible : Visibility.Collapsed;
    public Visibility CodeSnippetVisibility =>
        string.IsNullOrWhiteSpace(CodeSnippet) ? Visibility.Collapsed : Visibility.Visible;

    public ExamOptionVm? SelectedOption
    {
        get => _selectedOption;
        set
        {
            if (ReferenceEquals(_selectedOption, value)) return;
            _selectedOption = value;
            SelectedOptionIds.Clear();
            if (value is not null)
                SelectedOptionIds.Add(value.Id);
            SyncOptionSelectionFlags();
            OnPropertyChanged();
        }
    }

    public string? TextAnswer
    {
        get => _textAnswer;
        set
        {
            if (_textAnswer == value) return;
            _textAnswer = value;
            OnPropertyChanged();
        }
    }

    private void OnOptionSelected(ExamOptionVm option)
    {
        if (_syncingSelection) return;
        SelectedOption = option;
    }

    private void SyncOptionSelectionFlags()
    {
        _syncingSelection = true;
        try
        {
            foreach (var option in Options)
                option.SetSelected(ReferenceEquals(option, _selectedOption));
        }
        finally
        {
            _syncingSelection = false;
        }
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    private void OnPropertyChanged([CallerMemberName] string? name = null) =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
}

public sealed class ExamOptionVm : INotifyPropertyChanged
{
    private readonly Action<ExamOptionVm> _onSelected;
    private bool _isSelected;

    public ExamOptionVm(DesktopExamTakingOption option, Action<ExamOptionVm> onSelected)
    {
        Id = option.Id;
        Text = option.Text;
        _onSelected = onSelected;
    }

    public long Id { get; }
    public string Text { get; }

    public bool IsSelected
    {
        get => _isSelected;
        set
        {
            if (_isSelected == value) return;
            _isSelected = value;
            OnPropertyChanged();
            if (value)
                _onSelected(this);
        }
    }

    internal void SetSelected(bool value)
    {
        if (_isSelected == value) return;
        _isSelected = value;
        OnPropertyChanged(nameof(IsSelected));
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    private void OnPropertyChanged([CallerMemberName] string? name = null) =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
}
