using ArkaSoftwarePro.Src.Core.Domain.QuestionBankAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.ExamConfigure;

public class BankQuestionConfiguration : IEntityTypeConfiguration<BankQuestion>
{
    public void Configure(EntityTypeBuilder<BankQuestion> builder)
    {
        builder.ToTable("BankQuestions", "Exam");
        builder.Property(x => x.Prompt).HasMaxLength(4000).IsRequired();
        builder.Property(x => x.CodeSnippet).HasColumnType("NVARCHAR(MAX)");
        builder.Property(x => x.CodeLanguage).HasMaxLength(50);
        builder.Property(x => x.DefaultPoints).HasColumnType("DECIMAL(18,4)");
        builder.Property(x => x.Category).HasMaxLength(200);
        builder.Property(x => x.Topic).HasMaxLength(200);
        builder.Property(x => x.Tags).HasMaxLength(500);
        builder.Property(x => x.ContentHash).HasMaxLength(64).IsFixedLength().IsRequired();
        builder.Property(x => x.CorrectRate).HasColumnType("DECIMAL(18,4)");
        builder.HasMany(x => x.Options)
            .WithOne(x => x.BankQuestion)
            .HasForeignKey(x => x.BankQuestionId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(x => x.ContentHash);
        builder.HasIndex(x => x.OwnerUserId);
    }
}

public class BankQuestionOptionConfiguration : IEntityTypeConfiguration<BankQuestionOption>
{
    public void Configure(EntityTypeBuilder<BankQuestionOption> builder)
    {
        builder.ToTable("BankQuestionOptions", "Exam");
        builder.Property(x => x.Text).HasMaxLength(1000).IsRequired();
    }
}
