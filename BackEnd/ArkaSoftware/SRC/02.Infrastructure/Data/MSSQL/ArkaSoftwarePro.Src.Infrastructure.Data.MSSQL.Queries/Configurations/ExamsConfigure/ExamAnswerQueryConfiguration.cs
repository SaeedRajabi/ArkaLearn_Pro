using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Exams;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.ExamsConfigure;

public class ExamAnswerQueryConfiguration : IEntityTypeConfiguration<ExamAnswerQueryModel>
{
    public void Configure(EntityTypeBuilder<ExamAnswerQueryModel> builder)
    {
        builder.ToTable("ExamAnswers", "Exam");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.SelectedOptionIdsJson).HasMaxLength(500);
        builder.Property(x => x.TextAnswer).HasMaxLength(int.MaxValue);
        builder.Property(x => x.PointsAwarded).HasColumnType("DECIMAL(18,4)");
    }
}
