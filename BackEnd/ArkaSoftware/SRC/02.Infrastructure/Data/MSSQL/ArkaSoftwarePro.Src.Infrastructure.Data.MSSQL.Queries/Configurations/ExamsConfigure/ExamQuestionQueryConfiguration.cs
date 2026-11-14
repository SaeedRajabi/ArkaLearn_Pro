using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Exams;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.ExamsConfigure;

public class ExamQuestionQueryConfiguration : IEntityTypeConfiguration<ExamQuestionQueryModel>
{
    public void Configure(EntityTypeBuilder<ExamQuestionQueryModel> builder)
    {
        builder.ToTable("ExamQuestions", "Exam");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Prompt).HasMaxLength(4000);
        builder.Property(x => x.CodeSnippet).HasMaxLength(8000);
        builder.Property(x => x.CodeLanguage).HasMaxLength(50);
        builder.Property(x => x.Points).HasColumnType("DECIMAL(18,4)");
        builder.Property(x => x.BankQuestionId);
        builder.HasMany(x => x.Options).WithOne(x => x.ExamQuestion).HasForeignKey(x => x.ExamQuestionId);
    }
}
