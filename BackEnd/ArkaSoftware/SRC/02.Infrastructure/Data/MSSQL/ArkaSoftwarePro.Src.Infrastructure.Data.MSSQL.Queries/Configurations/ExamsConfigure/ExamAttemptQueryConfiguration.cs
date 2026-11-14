using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Exams;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.ExamsConfigure;

public class ExamAttemptQueryConfiguration : IEntityTypeConfiguration<ExamAttemptQueryModel>
{
    public void Configure(EntityTypeBuilder<ExamAttemptQueryModel> builder)
    {
        builder.ToTable("ExamAttempts", "Exam");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.AutoScore).HasColumnType("DECIMAL(18,4)");
        builder.Property(x => x.FinalScore).HasColumnType("DECIMAL(18,4)");
        builder.Property(x => x.ProfessorFeedback).HasMaxLength(4000);
        builder.HasMany(x => x.Answers).WithOne(x => x.ExamAttempt).HasForeignKey(x => x.ExamAttemptId);
    }
}
