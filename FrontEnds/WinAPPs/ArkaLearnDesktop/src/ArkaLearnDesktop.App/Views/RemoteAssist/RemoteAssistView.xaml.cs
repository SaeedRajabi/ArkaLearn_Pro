using System.Windows;
using System.Windows.Input;
using ArkaLearnDesktop.App.ViewModels;

namespace ArkaLearnDesktop.App.Views.RemoteAssist;

public partial class RemoteAssistView
{
    public RemoteAssistView()
    {
        InitializeComponent();
    }

    private RemoteAssistViewModel? Vm => DataContext as RemoteAssistViewModel;

    private (double X, double Y)? GetPercent(MouseEventArgs e)
    {
        if (e.Source is not FrameworkElement element || element.ActualWidth <= 0 || element.ActualHeight <= 0)
            return null;

        var position = e.GetPosition(element);
        return (
            Math.Clamp(position.X / element.ActualWidth, 0, 1),
            Math.Clamp(position.Y / element.ActualHeight, 0, 1));
    }

    private void ScreenPreviewImage_OnMouseMove(object sender, MouseEventArgs e)
    {
        if (Vm?.CanRemoteControl != true) return;
        var percent = GetPercent(e);
        if (percent is null) return;
        Vm.SendMouseMove(percent.Value.X, percent.Value.Y);
    }

    private void ScreenPreviewImage_OnMouseLeftButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (Vm?.CanRemoteControl != true) return;
        var percent = GetPercent(e);
        if (percent is null) return;
        Vm.SendMouseButton(0, true, percent.Value.X, percent.Value.Y);
    }

    private void ScreenPreviewImage_OnMouseLeftButtonUp(object sender, MouseButtonEventArgs e)
    {
        if (Vm?.CanRemoteControl != true) return;
        var percent = GetPercent(e);
        if (percent is null) return;
        Vm.SendMouseButton(0, false, percent.Value.X, percent.Value.Y);
    }

    private void ScreenPreviewImage_OnMouseRightButtonDown(object sender, MouseButtonEventArgs e)
    {
        if (Vm?.CanRemoteControl != true) return;
        var percent = GetPercent(e);
        if (percent is null) return;
        Vm.SendMouseButton(2, true, percent.Value.X, percent.Value.Y);
    }

    private void ScreenPreviewImage_OnMouseRightButtonUp(object sender, MouseButtonEventArgs e)
    {
        if (Vm?.CanRemoteControl != true) return;
        var percent = GetPercent(e);
        if (percent is null) return;
        Vm.SendMouseButton(2, false, percent.Value.X, percent.Value.Y);
    }

    private void ScreenPreviewHost_OnPreviewKeyDown(object sender, KeyEventArgs e)
    {
        if (Vm?.CanRemoteControl != true) return;
        var vk = KeyInterop.VirtualKeyFromKey(e.Key);
        if (vk <= 0) return;
        Vm.SendKey(vk, true);
        e.Handled = true;
    }

    private void ScreenPreviewHost_OnPreviewKeyUp(object sender, KeyEventArgs e)
    {
        if (Vm?.CanRemoteControl != true) return;
        var vk = KeyInterop.VirtualKeyFromKey(e.Key);
        if (vk <= 0) return;
        Vm.SendKey(vk, false);
        e.Handled = true;
    }
}
