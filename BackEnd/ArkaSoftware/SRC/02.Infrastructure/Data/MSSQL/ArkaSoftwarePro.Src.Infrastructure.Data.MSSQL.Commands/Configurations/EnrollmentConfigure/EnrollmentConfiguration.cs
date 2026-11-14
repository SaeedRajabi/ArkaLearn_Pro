using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.EnrollmentConfigure
{
    public class EnrollmentConfiguration : IEntityTypeConfiguration<Enrollment>
    {
        public void Configure(EntityTypeBuilder<Enrollment> builder)
        {
            builder.ToTable("Enrollments", "Enrollment");
            builder.Property(x => x.SpotPlayerLicense).HasMaxLength(200);
            builder.Property(x => x.DesktopLicenseKey).HasMaxLength(256);
            builder.Property(x => x.IsDesktopLicenseActive).HasDefaultValue(true);
            builder.Property(x => x.DesktopLicenseExpiresAtUtc);
            builder.Property(x => x.DesktopLicenseBoundDeviceId).HasMaxLength(128);
            builder.Property(x => x.DesktopLicenseMaxDevices).HasDefaultValue(1);
            // None is the CLR default; treat it as sentinel so DB default (Windows) is applied only when unset.
            builder.Property(x => x.DesktopLicenseAllowedOs)
                .HasDefaultValue(DesktopOsFamily.Windows)
                .HasSentinel(DesktopOsFamily.None);
            builder.Property(x => x.DesktopContentAccessMode).HasDefaultValue(DesktopContentAccessMode.Full);
            builder.HasMany(x => x.Installments)
                .WithOne(x => x.Enrollment)
                .HasForeignKey(x => x.EnrollmentId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.Navigation(x => x.Installments)
                .HasField("_installments")
                .UsePropertyAccessMode(PropertyAccessMode.Field);
        }
    }
}
