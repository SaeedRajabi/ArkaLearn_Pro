using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Teachers;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.TeachersConfigure;

public class TeacherFollowQueryConfiguration : IEntityTypeConfiguration<TeacherFollowQueryModel>
{
    public void Configure(EntityTypeBuilder<TeacherFollowQueryModel> builder)
    {
        builder.ToTable("TeacherFollows", "Teacher");
        builder.HasKey(x => x.Id);
    }
}
