using System.Windows;
using System.Windows.Controls;

namespace ArkaLearnDesktop.App;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
    }

    public void SetContent(UserControl content)
    {
        RootHost.Content = content;
    }
}
