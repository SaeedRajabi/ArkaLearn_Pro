using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.TeachersConfigure;

public class TeacherFollowConfiguration : IEntityTypeConfiguration<TeacherFollow>
{
    public void Configure(EntityTypeBuilder<TeacherFollow> builder)
    {
        builder.ToTable("TeacherFollows", "Teacher");
        builder.HasIndex(x => new { x.FollowerUserId, x.TeacherId }).IsUnique();
        builder.HasIndex(x => x.TeacherId);
    }
}
