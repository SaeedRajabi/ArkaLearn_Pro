namespace ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Enumerations;

[Flags]
public enum DesktopOsFamily : byte
{
    None = 0,
    Windows = 1,
    Mac = 2,
    Linux = 4,
    All = Windows | Mac | Linux,
}
