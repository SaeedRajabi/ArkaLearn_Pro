using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Exams;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.ExamsConfigure;

public class ExamAssignmentQueryConfiguration : IEntityTypeConfiguration<ExamAssignmentQueryModel>
{
    public void Configure(EntityTypeBuilder<ExamAssignmentQueryModel> builder)
    {
        builder.ToTable("ExamAssignments", "Exam");
        builder.HasKey(x => x.Id);
    }
}
