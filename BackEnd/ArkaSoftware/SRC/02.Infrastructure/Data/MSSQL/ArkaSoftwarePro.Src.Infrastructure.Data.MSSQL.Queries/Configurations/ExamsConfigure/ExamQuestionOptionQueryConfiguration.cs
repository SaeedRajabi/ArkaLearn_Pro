using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Exams;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.ExamsConfigure;

public class ExamQuestionOptionQueryConfiguration : IEntityTypeConfiguration<ExamQuestionOptionQueryModel>
{
    public void Configure(EntityTypeBuilder<ExamQuestionOptionQueryModel> builder)
    {
        builder.ToTable("ExamQuestionOptions", "Exam");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Text).HasMaxLength(1000);
    }
}
