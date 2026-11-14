using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Exams;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.ExamsConfigure;

public class ExamQueryConfiguration : IEntityTypeConfiguration<ExamQueryModel>
{
    public void Configure(EntityTypeBuilder<ExamQueryModel> builder)
    {
        builder.ToTable("Exams", "Exam");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(300);
        builder.Property(x => x.Description).HasMaxLength(4000);
        builder.Property(x => x.Level).HasMaxLength(50);
        builder.Property(x => x.TotalPoints).HasColumnType("DECIMAL(18,4)");
        builder.HasMany(x => x.Questions).WithOne(x => x.Exam).HasForeignKey(x => x.ExamId);
        builder.HasMany(x => x.Assignments).WithOne(x => x.Exam).HasForeignKey(x => x.ExamId);
        builder.HasMany(x => x.Attempts).WithOne(x => x.Exam).HasForeignKey(x => x.ExamId);
    }
}
