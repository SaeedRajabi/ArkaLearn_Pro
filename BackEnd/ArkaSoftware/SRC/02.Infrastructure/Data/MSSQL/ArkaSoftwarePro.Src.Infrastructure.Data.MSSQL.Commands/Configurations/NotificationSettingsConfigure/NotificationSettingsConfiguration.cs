using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NotificationSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.NotificationSettingsAggregate.Entities.NotificationSettings;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.NotificationSettingsConfigure;

public class NotificationSettingsConfiguration : IEntityTypeConfiguration<NotificationSettingsEntity>
{
    public void Configure(EntityTypeBuilder<NotificationSettingsEntity> builder)
    {
        builder.ToTable("NotificationSettings", "Website");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.ApiKey).HasColumnType("NVARCHAR").HasMaxLength(500).IsRequired();
        builder.Property(x => x.EducationPlanMessageTemplate).HasColumnType("NVARCHAR(MAX)").IsRequired();
        builder.Property(x => x.EducationPlanRemovedMessageTemplate).HasColumnType("NVARCHAR(MAX)").IsRequired();
        builder.Property(x => x.EducationPlanInstallmentDueMessageTemplate).HasColumnType("NVARCHAR(MAX)").IsRequired();
        builder.Property(x => x.SupportChatMessageTemplate).HasColumnType("NVARCHAR(MAX)").IsRequired();
        builder.Property(x => x.SupportChatStudentUnreadMessageTemplate).HasColumnType("NVARCHAR(MAX)").IsRequired();
        builder.Property(x => x.StudentSharedFileMessageTemplate).HasColumnType("NVARCHAR(MAX)").IsRequired();
        builder.Property(x => x.TeacherSharedFileDownloadedMessageTemplate).HasColumnType("NVARCHAR(MAX)").IsRequired();
        builder.Property(x => x.CalendarEventMessageTemplate).HasColumnType("NVARCHAR(MAX)").IsRequired();
        builder.Property(x => x.CalendarEventReminderMinutesJson).HasColumnType("NVARCHAR(500)").HasMaxLength(500).IsRequired();
        builder.Property(x => x.EducationPlanInstallmentReminderRulesJson).HasColumnType("NVARCHAR(MAX)").IsRequired();
        builder.Property(x => x.IsDelete).HasColumnType("bit");
    }
}
