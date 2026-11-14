using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.ValueOBJs;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.TeachersConfigure
{
    public class ExpertiseAreaConfiguration : IEntityTypeConfiguration<TeacherExpertiseArea>
    {
        public void Configure(EntityTypeBuilder<TeacherExpertiseArea> builder)
        {
            builder.ToTable("ExpertiseAreas", "Teacher");

            builder.Property(x => x.Name)
                .HasConversion(x => x!.Value , x => new SkillName(x!))
                .HasColumnType("NVARCHAR")
                .HasMaxLength(400);

            builder.Property(x => x.Rate)
                .HasConversion(x => x!.Value, x => new SkillRate(x ?? 0))
                .HasColumnType("INT");

            builder.HasIndex(x => x.Name);
            builder.HasIndex(x => new { x.TeacherId, x.Name }).IsUnique();

            builder.HasOne(x => x.Teacher).WithMany(x => x.TeacherExpertiseAreas)
                .HasForeignKey(x => x.TeacherId)
                .OnDelete(DeleteBehavior.Cascade);

        }
    }
}
