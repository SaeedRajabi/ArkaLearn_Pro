using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Enumerations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Enrollments;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.EnrollmentsConfigure
{
    public class EnrollmentConfiguration : IEntityTypeConfiguration<EnrollmentQueryModel>
    {
        public void Configure(EntityTypeBuilder<EnrollmentQueryModel> builder)
        {
            builder.ToTable("Enrollments", "Enrollment");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.StudentId).HasColumnName("StudentId").HasColumnType("BIGINT");
            builder.Property(x => x.CourseId).HasColumnName("CourseId").HasColumnType("BIGINT");
            builder.Property(x => x.IsActive);
            builder.Property(x => x.SpotPlayerLicense).HasMaxLength(200);
            builder.Property(x => x.DesktopLicenseKey).HasMaxLength(256);
            builder.Property(x => x.IsDesktopLicenseActive);
            builder.Property(x => x.DesktopLicenseExpiresAtUtc);
            builder.Property(x => x.DesktopLicenseBoundDeviceId).HasMaxLength(128);
            builder.Property(x => x.DesktopLicenseMaxDevices).HasDefaultValue(1);
            builder.Property(x => x.DesktopLicenseAllowedOs).HasDefaultValue(DesktopOsFamily.Windows);
            builder.Property(x => x.DesktopContentAccessMode).HasDefaultValue(DesktopContentAccessMode.Full);
            builder.Property(x => x.EnrollmentDateTime);
        }
    }
}
