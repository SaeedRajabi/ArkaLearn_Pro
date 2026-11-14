using ArkaSoftwarePro.Src.Core.Domain.ExamAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.ExamConfigure;

public class ExamAssignmentConfiguration : IEntityTypeConfiguration<ExamAssignment>
{
    public void Configure(EntityTypeBuilder<ExamAssignment> builder)
    {
        builder.ToTable("ExamAssignments", "Exam");
        builder.HasIndex(x => new { x.ExamId, x.StudentId }).IsUnique();
    }
}
