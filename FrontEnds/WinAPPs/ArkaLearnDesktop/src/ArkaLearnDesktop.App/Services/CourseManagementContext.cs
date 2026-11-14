using ArkaLearnDesktop.Application.Abstractions;

namespace ArkaLearnDesktop.App.Services;

public sealed class CourseManagementContext : ICourseManagementContext
{
    private long? _selectedCourseId;
    private string? _selectedCourseTitle;

    public long? SelectedCourseId
    {
        get => _selectedCourseId;
        set
        {
            if (_selectedCourseId == value) return;
            _selectedCourseId = value;
            SelectionChanged?.Invoke();
        }
    }

    public string? SelectedCourseTitle
    {
        get => _selectedCourseTitle;
        set => _selectedCourseTitle = value;
    }

    public event Action? SelectionChanged;
}
