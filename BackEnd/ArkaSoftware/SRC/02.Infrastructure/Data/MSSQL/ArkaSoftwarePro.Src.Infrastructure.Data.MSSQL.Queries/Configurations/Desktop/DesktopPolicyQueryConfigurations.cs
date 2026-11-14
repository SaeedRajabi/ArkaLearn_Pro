using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Desktop;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.Desktop;

public class CourseDesktopWatermarkPolicyQueryConfiguration : IEntityTypeConfiguration<CourseDesktopWatermarkPolicyQueryModel>
{
    public void Configure(EntityTypeBuilder<CourseDesktopWatermarkPolicyQueryModel> builder)
    {
        builder.ToTable("DesktopWatermarkPolicies", "Course");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TextTemplate).HasMaxLength(500);
        builder.Property(x => x.FontColor).HasMaxLength(32);
        builder.Property(x => x.IsDelete).HasColumnName("IsDeleted");
    }
}

public class DesktopLicenseDeviceBindingQueryConfiguration : IEntityTypeConfiguration<DesktopLicenseDeviceBindingQueryModel>
{
    public void Configure(EntityTypeBuilder<DesktopLicenseDeviceBindingQueryModel> builder)
    {
        builder.ToTable("DesktopLicenseDeviceBindings", "Desktop");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.DeviceId).HasMaxLength(128);
        builder.Property(x => x.MachineName).HasMaxLength(200);
        builder.Property(x => x.RevokeReason).HasMaxLength(500);
        builder.Property(x => x.IsDelete).HasColumnName("IsDeleted");
    }
}

public class DesktopLicenseLessonAccessQueryConfiguration : IEntityTypeConfiguration<DesktopLicenseLessonAccessQueryModel>
{
    public void Configure(EntityTypeBuilder<DesktopLicenseLessonAccessQueryModel> builder)
    {
        builder.ToTable("DesktopLicenseLessonAccess", "Desktop");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.IsDelete).HasColumnName("IsDeleted");
    }
}

public class DesktopPlaybackEventQueryConfiguration : IEntityTypeConfiguration<DesktopPlaybackEventQueryModel>
{
    public void Configure(EntityTypeBuilder<DesktopPlaybackEventQueryModel> builder)
    {
        builder.ToTable("DesktopPlaybackEvents", "Desktop");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.DeviceId).HasMaxLength(128);
        builder.Property(x => x.IsDelete).HasColumnName("IsDeleted");
    }
}

public class TeacherStudentSatisfactionQueryConfiguration : IEntityTypeConfiguration<TeacherStudentSatisfactionQueryModel>
{
    public void Configure(EntityTypeBuilder<TeacherStudentSatisfactionQueryModel> builder)
    {
        builder.ToTable("TeacherStudentRatings", "Desktop");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Note).HasMaxLength(2000);
        builder.Property(x => x.IsDelete).HasColumnName("IsDeleted");
    }
}
