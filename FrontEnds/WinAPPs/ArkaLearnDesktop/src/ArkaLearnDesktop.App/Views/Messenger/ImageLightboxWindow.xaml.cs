using System.Windows;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;

namespace ArkaLearnDesktop.App.Views.Messenger;

public partial class ImageLightboxWindow : Window
{
    private double _zoom = 1;

    public ImageLightboxWindow(string imageUrl)
    {
        InitializeComponent();
        try
        {
            var bitmap = new BitmapImage();
            bitmap.BeginInit();
            bitmap.UriSource = new Uri(imageUrl, UriKind.Absolute);
            bitmap.CacheOption = BitmapCacheOption.OnLoad;
            bitmap.EndInit();
            PreviewImage.Source = bitmap;
        }
        catch
        {
            TitleText.Text = "بارگذاری تصویر ممکن نیست";
        }
    }

    private void Close_OnClick(object sender, RoutedEventArgs e) => Close();

    private void Window_OnKeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.Escape) Close();
        if (e.Key == Key.OemPlus || e.Key == Key.Add) ApplyZoom(0.15);
        if (e.Key == Key.OemMinus || e.Key == Key.Subtract) ApplyZoom(-0.15);
    }

    private void PreviewImage_OnMouseWheel(object sender, MouseWheelEventArgs e)
    {
        ApplyZoom(e.Delta > 0 ? 0.12 : -0.12);
        e.Handled = true;
    }

    private void ZoomIn_OnClick(object sender, RoutedEventArgs e) => ApplyZoom(0.15);

    private void ZoomOut_OnClick(object sender, RoutedEventArgs e) => ApplyZoom(-0.15);

    private void ResetZoom_OnClick(object sender, RoutedEventArgs e)
    {
        _zoom = 1;
        PreviewImage.LayoutTransform = Transform.Identity;
        ZoomLabel.Text = "100%";
    }

    private void ApplyZoom(double delta)
    {
        _zoom = Math.Clamp(_zoom + delta, 0.4, 5);
        PreviewImage.LayoutTransform = new ScaleTransform(_zoom, _zoom);
        ZoomLabel.Text = $"{(int)(_zoom * 100)}%";
    }

    private void Backdrop_OnMouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (e.OriginalSource == Backdrop)
            Close();
    }
}
