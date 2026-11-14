using System.Globalization;
using System.Windows.Data;
using ArkaLearnDesktop.App.Localization;

namespace ArkaLearnDesktop.App.Converters;

public sealed class RemoteAssistStatusConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture) =>
        PersianUi.TranslateRemoteAssistStatus(value as string);

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture) =>
        throw new NotSupportedException();
}
