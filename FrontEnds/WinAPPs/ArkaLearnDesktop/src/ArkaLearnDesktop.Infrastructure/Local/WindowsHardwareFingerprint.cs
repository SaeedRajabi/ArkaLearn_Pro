using System.Management;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Win32;

namespace ArkaLearnDesktop.Infrastructure.Local;

/// <summary>
/// Stable per-machine id that survives Windows reinstall (SMBIOS/board/CPU/disk),
/// so licenses stay usable on the same PC but not on a different computer.
/// </summary>
public static class WindowsHardwareFingerprint
{
    public static string Compute()
    {
        var parts = new List<string>(6);

        Add(parts, ReadWmi("Win32_ComputerSystemProduct", "UUID"));
        Add(parts, ReadWmi("Win32_BaseBoard", "SerialNumber"));
        Add(parts, ReadWmi("Win32_Processor", "ProcessorId"));
        Add(parts, ReadBiosRegistryFingerprint());
        Add(parts, ReadFirstFixedDiskSerial());
        Add(parts, ReadSystemEnclosureSerial());

        var raw = string.Join('|', parts);
        if (string.IsNullOrWhiteSpace(raw))
        {
            // Last-resort fallback — may change after OS reinstall; prefer hardware parts above.
            raw = $"fallback|{Environment.MachineName}|{Environment.ProcessorCount}";
        }

        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(raw.ToUpperInvariant()));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static void Add(List<string> parts, string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return;
        var trimmed = value.Trim();
        if (IsPlaceholder(trimmed)) return;
        parts.Add(trimmed);
    }

    private static bool IsPlaceholder(string value)
    {
        var v = value.Replace(" ", "", StringComparison.Ordinal).ToUpperInvariant();
        return v is "NONE" or "N/A" or "NA" or "DEFAULTSTRING" or "TOBEFILLEDBYO.E.M."
            or "TOBEFILLEDBYOEM" or "SYSTEMSERIALNUMBER" or "0"
            || v.All(c => c is '0' or '-');
    }

    private static string? ReadWmi(string className, string property)
    {
        try
        {
            using var searcher = new ManagementObjectSearcher($"SELECT {property} FROM {className}");
            foreach (ManagementObject obj in searcher.Get())
            {
                var value = obj[property]?.ToString();
                if (!string.IsNullOrWhiteSpace(value))
                    return value;
            }
        }
        catch
        {
            // WMI may be restricted on some machines.
        }

        return null;
    }

    private static string? ReadFirstFixedDiskSerial()
    {
        try
        {
            using var searcher = new ManagementObjectSearcher(
                "SELECT SerialNumber, MediaType, InterfaceType FROM Win32_DiskDrive WHERE MediaType LIKE '%Fixed%' OR InterfaceType <> 'USB'");
            foreach (ManagementObject obj in searcher.Get())
            {
                var serial = obj["SerialNumber"]?.ToString();
                if (!string.IsNullOrWhiteSpace(serial) && !IsPlaceholder(serial.Trim()))
                    return serial.Trim();
            }
        }
        catch
        {
            // ignore
        }

        return ReadWmi("Win32_DiskDrive", "SerialNumber");
    }

    private static string? ReadSystemEnclosureSerial()
        => ReadWmi("Win32_SystemEnclosure", "SerialNumber");

    private static string? ReadBiosRegistryFingerprint()
    {
        try
        {
            using var key = Registry.LocalMachine.OpenSubKey(@"HARDWARE\DESCRIPTION\System\BIOS");
            if (key is null) return null;

            var manufacturer = key.GetValue("SystemManufacturer")?.ToString();
            var product = key.GetValue("SystemProductName")?.ToString();
            var serial = key.GetValue("SystemSerialNumber")?.ToString();
            var combined = string.Join('|', new[] { manufacturer, product, serial }
                .Where(x => !string.IsNullOrWhiteSpace(x)));
            return string.IsNullOrWhiteSpace(combined) ? null : combined;
        }
        catch
        {
            return null;
        }
    }
}
