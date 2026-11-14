using ArkaSoftwarePro.Src.Core.Domain.ExamAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.ExamConfigure;

public class ExamConfiguration : IEntityTypeConfiguration<Exam>
{
    public void Configure(EntityTypeBuilder<Exam> builder)
    {
        builder.ToTable("Exams", "Exam");
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(4000);
        builder.Property(x => x.Level).HasMaxLength(50).IsRequired();
        builder.Property(x => x.TotalPoints).HasColumnType("DECIMAL(18,4)");
        builder.Property(x => x.Status).IsRequired();
        builder.Property(x => x.AllowPaste).IsRequired();
        builder.HasIndex(x => x.TeacherId);
        builder.HasIndex(x => x.CourseId);
        builder.HasMany(x => x.Questions).WithOne(x => x.Exam).HasForeignKey(x => x.ExamId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(x => x.Assignments).WithOne(x => x.Exam).HasForeignKey(x => x.ExamId).OnDelete(DeleteBehavior.Cascade);
    }
}
