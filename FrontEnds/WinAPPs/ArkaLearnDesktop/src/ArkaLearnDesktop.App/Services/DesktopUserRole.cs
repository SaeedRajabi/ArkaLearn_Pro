namespace ArkaLearnDesktop.App.Services;

public static class DesktopUserRole
{
    public static bool IsAdmin(string? role) =>
        role?.Contains("admin", StringComparison.OrdinalIgnoreCase) == true
        || role?.Contains("administrator", StringComparison.OrdinalIgnoreCase) == true
        || role?.Contains("ادمین", StringComparison.Ordinal) == true
        || role?.Trim() == "3";

    public static bool IsTeacher(string? role) =>
        role?.Contains("teacher", StringComparison.OrdinalIgnoreCase) == true
        || role?.Contains("professor", StringComparison.OrdinalIgnoreCase) == true
        || role?.Contains("استاد", StringComparison.Ordinal) == true
        || role?.Trim() == "2";

    public static bool IsTeacherOrAdmin(string? role) => IsTeacher(role) || IsAdmin(role);

    public static bool IsStudent(string? role) =>
        role?.Contains("student", StringComparison.OrdinalIgnoreCase) == true
        || role?.Contains("دانشجو", StringComparison.Ordinal) == true
        || role?.Trim() == "1";
}
