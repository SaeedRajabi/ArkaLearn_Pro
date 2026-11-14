using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Exams;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.ExamsConfigure;

public class BankQuestionQueryConfiguration : IEntityTypeConfiguration<BankQuestionQueryModel>
{
    public void Configure(EntityTypeBuilder<BankQuestionQueryModel> builder)
    {
        builder.ToTable("BankQuestions", "Exam");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Prompt).HasMaxLength(4000);
        builder.Property(x => x.CodeLanguage).HasMaxLength(50);
        builder.Property(x => x.DefaultPoints).HasColumnType("DECIMAL(18,4)");
        builder.Property(x => x.Category).HasMaxLength(200);
        builder.Property(x => x.Topic).HasMaxLength(200);
        builder.Property(x => x.Tags).HasMaxLength(500);
        builder.Property(x => x.ContentHash).HasMaxLength(64).IsFixedLength();
        builder.Property(x => x.CorrectRate).HasColumnType("DECIMAL(18,4)");
        builder.HasMany(x => x.Options)
            .WithOne(x => x.BankQuestion)
            .HasForeignKey(x => x.BankQuestionId);
        builder.HasQueryFilter(x => !x.IsDelete);
    }
}

public class BankQuestionOptionQueryConfiguration : IEntityTypeConfiguration<BankQuestionOptionQueryModel>
{
    public void Configure(EntityTypeBuilder<BankQuestionOptionQueryModel> builder)
    {
        builder.ToTable("BankQuestionOptions", "Exam");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Text).HasMaxLength(1000);
        builder.HasQueryFilter(x => !x.IsDelete);
    }
}
