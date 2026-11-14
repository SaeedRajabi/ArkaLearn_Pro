using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;

public class AdvertisementAutoBumpPackage : Entity
{
    public string Name { get; private set; } = string.Empty;
    public int DurationDays { get; private set; }
    public long PriceToman { get; private set; }
    public bool IsActive { get; private set; } = true;

    private AdvertisementAutoBumpPackage() { }

    public static AdvertisementAutoBumpPackage Create(string name, int durationDays, long priceToman, bool isActive = true)
    {
        return new AdvertisementAutoBumpPackage
        {
            Name = name.Trim(),
            DurationDays = durationDays > 0 ? durationDays : 7,
            PriceToman = priceToman > 0 ? priceToman : 100000,
            IsActive = isActive,
        };
    }

    public void Update(string name, int durationDays, long priceToman, bool isActive)
    {
        Name = name.Trim();
        DurationDays = durationDays > 0 ? durationDays : DurationDays;
        PriceToman = priceToman > 0 ? priceToman : PriceToman;
        IsActive = isActive;
    }
}
