using System.Windows;
using ArkaLearnDesktop.App.Services;
using ArkaLearnDesktop.Application.Abstractions;

namespace ArkaLearnDesktop.App.Views.Messenger;

public partial class NewTopicDialog : Window
{
    private readonly IDesktopApiClient _api;
    private readonly IReadOnlyList<DesktopSupportTeacherOption> _teachers;
    private readonly long? _preselectTeacherUserId;

    public NewTopicDialog(
        IDesktopApiClient api,
        IReadOnlyList<DesktopSupportTeacherOption> teachers,
        Window owner,
        long? preselectTeacherUserId = null)
    {
        _api = api;
        _teachers = teachers;
        _preselectTeacherUserId = preselectTeacherUserId;
        Owner = owner;
        InitializeComponent();

        TeacherCombo.ItemsSource = _teachers;
        if (_preselectTeacherUserId is > 0)
            TeacherCombo.SelectedValue = _preselectTeacherUserId.Value;
        else if (_teachers.Count > 0)
            TeacherCombo.SelectedIndex = 0;
    }

    public long CreatedConversationId { get; private set; }
    public long CreatedTeacherUserId { get; private set; }

    private async void Create_Click(object sender, RoutedEventArgs e)
    {
        if (TeacherCombo.SelectedItem is not DesktopSupportTeacherOption teacher)
        {
            StatusText.Text = "لطفاً یک استاد را انتخاب کنید.";
            return;
        }

        var subject = SubjectBox.Text.Trim();
        if (subject.Length < 3)
        {
            StatusText.Text = "موضوع باید حداقل ۳ کاراکتر باشد.";
            return;
        }

        var message = InitialMessageBox.Text.Trim();
        if (message.Length == 0)
        {
            StatusText.Text = "پیام اولیه الزامی است.";
            return;
        }

        try
        {
            CreateButton.IsEnabled = false;
            StatusText.Text = "در حال ایجاد موضوع...";

            var id = await _api.OpenSupportConversationAsync(
                teacher.TeacherUserId,
                subject,
                ChatHtmlHelper.BuildPlainTextHtml(message));

            if (id is not > 0)
            {
                StatusText.Text = "ایجاد موضوع ناموفق بود.";
                return;
            }

            CreatedConversationId = id.Value;
            CreatedTeacherUserId = teacher.TeacherUserId;
            DialogResult = true;
            Close();
        }
        catch (Exception ex)
        {
            StatusText.Text = ex.Message;
        }
        finally
        {
            CreateButton.IsEnabled = true;
        }
    }

    private void Cancel_Click(object sender, RoutedEventArgs e)
    {
        DialogResult = false;
        Close();
    }
}
