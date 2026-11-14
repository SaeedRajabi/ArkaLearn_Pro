using ArkaSoftwarePro.Src.Core.Domain.ExamAttemptAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.ExamConfigure;

public class ExamAttemptConfiguration : IEntityTypeConfiguration<ExamAttempt>
{
    public void Configure(EntityTypeBuilder<ExamAttempt> builder)
    {
        builder.ToTable("ExamAttempts", "Exam");
        builder.Property(x => x.AutoScore).HasColumnType("DECIMAL(18,4)");
        builder.Property(x => x.FinalScore).HasColumnType("DECIMAL(18,4)");
        builder.Property(x => x.ProfessorFeedback).HasMaxLength(4000);
        builder.HasIndex(x => new { x.ExamId, x.StudentId }).IsUnique();
        builder.HasMany(x => x.Answers).WithOne(x => x.ExamAttempt).HasForeignKey(x => x.ExamAttemptId).OnDelete(DeleteBehavior.Cascade);
    }
}
