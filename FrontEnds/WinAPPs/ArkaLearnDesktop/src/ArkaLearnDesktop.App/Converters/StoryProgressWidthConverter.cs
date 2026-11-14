using System.Globalization;
using System.Windows.Data;

namespace ArkaLearnDesktop.App.Converters;

public sealed class StoryProgressWidthConverter : IMultiValueConverter
{
    public object Convert(object[] values, Type targetType, object parameter, CultureInfo culture)
    {
        if (values.Length < 2) return 0d;
        var progress = values[0] is double d ? d : 0d;
        var totalWidth = values[1] is double width ? width : 0d;
        return Math.Max(0, Math.Min(1, progress)) * totalWidth;
    }

    public object[] ConvertBack(object value, Type[] targetTypes, object parameter, CultureInfo culture) =>
        throw new NotSupportedException();
}
