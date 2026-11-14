using ArkaSoftwarePro.Src.Core.Domain.ExamAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.ExamConfigure;

public class ExamQuestionConfiguration : IEntityTypeConfiguration<ExamQuestion>
{
    public void Configure(EntityTypeBuilder<ExamQuestion> builder)
    {
        builder.ToTable("ExamQuestions", "Exam");
        builder.Property(x => x.Prompt).HasMaxLength(4000).IsRequired();
        builder.Property(x => x.CodeSnippet).HasMaxLength(8000);
        builder.Property(x => x.CodeLanguage).HasMaxLength(50);
        builder.Property(x => x.Points).HasColumnType("DECIMAL(18,4)");
        builder.Property(x => x.BankQuestionId);
        builder.HasIndex(x => x.BankQuestionId);
        builder.HasMany(x => x.Options).WithOne(x => x.ExamQuestion).HasForeignKey(x => x.ExamQuestionId).OnDelete(DeleteBehavior.Cascade);
    }
}
