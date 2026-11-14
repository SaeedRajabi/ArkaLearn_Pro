using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;

namespace ArkaLearnDesktop.App.Views.Auth;

public partial class LoginView : UserControl
{
    public LoginView()
    {
        InitializeComponent();
    }

    private void LoginView_OnLoaded(object sender, RoutedEventArgs e)
    {
        if (DataContext is ViewModels.LoginViewModel { FocusPasswordOnLoad: true })
            PasswordBox.Focus();
        else
            UserNameBox?.Focus();
    }

    private void LoginView_OnPreviewKeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key != Key.Enter) return;

        if (Keyboard.FocusedElement is TextBox)
        {
            PasswordBox.Focus();
            e.Handled = true;
            return;
        }

        if (Keyboard.FocusedElement is PasswordBox
            && DataContext is ViewModels.LoginViewModel vm
            && vm.LoginCommand.CanExecute(null))
        {
            vm.LoginCommand.Execute(null);
            e.Handled = true;
        }
    }

    private void PasswordBox_OnPasswordChanged(object sender, RoutedEventArgs e)
    {
        if (DataContext is ViewModels.LoginViewModel vm && sender is PasswordBox box)
            vm.Password = box.Password;
    }
}
