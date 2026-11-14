using ArkaSoftwarePro.Src.Core.Domain.ExamAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.ExamConfigure;

public class ExamQuestionOptionConfiguration : IEntityTypeConfiguration<ExamQuestionOption>
{
    public void Configure(EntityTypeBuilder<ExamQuestionOption> builder)
    {
        builder.ToTable("ExamQuestionOptions", "Exam");
        builder.Property(x => x.Text).HasMaxLength(1000).IsRequired();
    }
}
