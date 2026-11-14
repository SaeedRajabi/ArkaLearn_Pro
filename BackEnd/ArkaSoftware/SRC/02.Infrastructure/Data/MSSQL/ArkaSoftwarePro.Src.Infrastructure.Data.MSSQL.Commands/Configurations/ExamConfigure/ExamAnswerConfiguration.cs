using ArkaSoftwarePro.Src.Core.Domain.ExamAttemptAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.ExamConfigure;

public class ExamAnswerConfiguration : IEntityTypeConfiguration<ExamAnswer>
{
    public void Configure(EntityTypeBuilder<ExamAnswer> builder)
    {
        builder.ToTable("ExamAnswers", "Exam");
        builder.Property(x => x.SelectedOptionIdsJson).HasMaxLength(500);
        // Rich HTML answers (formatted text, images, audio) can exceed plain text sizes.
        builder.Property(x => x.TextAnswer).HasMaxLength(int.MaxValue);
        builder.Property(x => x.PointsAwarded).HasColumnType("DECIMAL(18,4)");
        builder.Property(x => x.PasteCount).IsRequired();
        builder.HasIndex(x => new { x.ExamAttemptId, x.ExamQuestionId }).IsUnique();
    }
}
