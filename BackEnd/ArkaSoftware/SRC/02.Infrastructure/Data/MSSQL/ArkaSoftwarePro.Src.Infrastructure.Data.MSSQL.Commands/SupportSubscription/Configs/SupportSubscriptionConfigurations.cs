using ArkaSoftwarePro.Src.Core.Domain.SupportSubscriptionAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.SupportSubscription.Configs;

public class SupportPlanTariffConfig : IEntityTypeConfiguration<SupportPlanTariff>
{
    public void Configure(EntityTypeBuilder<SupportPlanTariff> builder)
    {
        builder.ToTable("SupportPlanTariffs", "Support");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.DurationMonths).IsRequired();
        builder.Property(x => x.PriceToman).IsRequired();
        builder.HasIndex(x => x.DurationMonths).IsUnique();
        builder.HasMany(x => x.Features)
            .WithOne()
            .HasForeignKey(x => x.SupportPlanTariffId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(x => x.Features)
            .UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}

public class SupportPlanTariffFeatureConfig : IEntityTypeConfiguration<SupportPlanTariffFeature>
{
    public void Configure(EntityTypeBuilder<SupportPlanTariffFeature> builder)
    {
        builder.ToTable("SupportPlanTariffFeatures", "Support");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.FeatureCode).HasMaxLength(64).IsRequired();
        builder.HasIndex(x => new { x.SupportPlanTariffId, x.FeatureCode }).IsUnique();
    }
}

public class StudentSupportSubscriptionConfig : IEntityTypeConfiguration<StudentSupportSubscription>
{
    public void Configure(EntityTypeBuilder<StudentSupportSubscription> builder)
    {
        builder.ToTable("StudentSupportSubscriptions", "Support");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.StudentUserId).IsRequired();
        builder.Property(x => x.ActiveFreezeReason).HasMaxLength(500);
        builder.HasIndex(x => x.StudentUserId).IsUnique();
        builder.HasMany(x => x.FreezeHistory)
            .WithOne()
            .HasForeignKey(x => x.StudentSupportSubscriptionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(x => x.FreezeHistory)
            .UsePropertyAccessMode(PropertyAccessMode.Field);
        builder.HasMany(x => x.FeatureGrants)
            .WithOne()
            .HasForeignKey(x => x.StudentSupportSubscriptionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(x => x.FeatureGrants)
            .UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}

public class StudentSupportFeatureGrantConfig : IEntityTypeConfiguration<StudentSupportFeatureGrant>
{
    public void Configure(EntityTypeBuilder<StudentSupportFeatureGrant> builder)
    {
        builder.ToTable("StudentSupportFeatureGrants", "Support");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.FeatureCode).HasMaxLength(64).IsRequired();
        builder.HasIndex(x => new { x.StudentSupportSubscriptionId, x.FeatureCode }).IsUnique();
    }
}

public class SupportPlanPendingPurchaseConfig : IEntityTypeConfiguration<SupportPlanPendingPurchase>
{
    public void Configure(EntityTypeBuilder<SupportPlanPendingPurchase> builder)
    {
        builder.ToTable("SupportPlanPendingPurchases", "Support");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.FeatureCodesCsv).HasMaxLength(1000).IsRequired();
        builder.HasIndex(x => new { x.StudentUserId, x.TariffId, x.IsConsumed });
    }
}

public class StudentSupportFreezeRecordConfig : IEntityTypeConfiguration<StudentSupportFreezeRecord>
{
    public void Configure(EntityTypeBuilder<StudentSupportFreezeRecord> builder)
    {
        builder.ToTable("StudentSupportFreezeRecords", "Support");
        builder.Property(x => x.Id).UseIdentityColumn();
        builder.Property(x => x.Reason).HasMaxLength(500).IsRequired();
        builder.HasIndex(x => x.StudentUserId);
    }
}
