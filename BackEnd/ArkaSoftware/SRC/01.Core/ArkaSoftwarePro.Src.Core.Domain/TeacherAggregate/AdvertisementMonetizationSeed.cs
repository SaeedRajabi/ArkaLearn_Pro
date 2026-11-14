namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate;

/// <summary>Default tariff matrix and bump packages for first-time setup.</summary>
public static class AdvertisementMonetizationSeed
{
    public static readonly (int DurationMonths, int StarLevel, long PriceToman, int DiscountPercent)[] DefaultTariffs =
    [
        (1, 1, 439000, 0), (1, 2, 499000, 0), (1, 3, 559000, 0), (1, 4, 619000, 0), (1, 5, 679000, 0), (1, 6, 739000, 0), (1, 7, 799000, 0),
        (2, 1, 790200, 10), (2, 2, 898200, 10), (2, 3, 1006200, 10), (2, 4, 1114200, 10), (2, 5, 1222200, 10), (2, 6, 1330200, 10), (2, 7, 1438200, 10),
        (3, 1, 1119450, 15), (3, 2, 1272450, 15), (3, 3, 1425450, 15), (3, 4, 1578450, 15), (3, 5, 1731450, 15), (3, 6, 1884450, 15), (3, 7, 2037450, 15),
        (6, 1, 2107200, 20), (6, 2, 2395200, 20), (6, 3, 2683200, 20), (6, 4, 2971200, 20), (6, 5, 3259200, 20), (6, 6, 3547200, 20), (6, 7, 3835200, 20),
        (12, 1, 3951000, 25), (12, 2, 4491000, 25), (12, 3, 5031000, 25), (12, 4, 5571000, 25), (12, 5, 6111000, 25), (12, 6, 6651000, 25), (12, 7, 7191000, 25),
    ];

    public static readonly (string Name, int DurationDays, long PriceToman)[] DefaultAutoBumpPackages =
    [
        ("بسته bump خودکار ۷ روزه", 7, 150000),
        ("بسته bump خودکار ۳۰ روزه", 30, 450000),
    ];
}
