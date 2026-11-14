using ArkaSoftwarePro.Src.Core.Domain.ProjectQuestionAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.ProjectQuestions.Configs;

public class ProjectQuestionConfig : IEntityTypeConfiguration<ProjectQuestion>
{
    public void Configure(EntityTypeBuilder<ProjectQuestion> builder)
    {
        builder.ToTable("ProjectQuestions", "Project");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ProjectId).IsRequired();
        builder.HasIndex(x => x.ProjectId);
        builder.Property(x => x.UserId).IsRequired();
        builder.Property(x => x.Subject).HasMaxLength(300);
        builder.Property(x => x.ContentHtml).HasColumnType("NVARCHAR(MAX)").IsRequired();
        builder.Property(x => x.AudioUrl).HasMaxLength(500);
        builder.Property(x => x.Status).IsRequired();
        builder.HasIndex(x => x.Status);
        builder.HasMany(x => x.Answers).WithOne().HasForeignKey(x => x.QuestionId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class ProjectAnswerConfig : IEntityTypeConfiguration<ProjectAnswer>
{
    public void Configure(EntityTypeBuilder<ProjectAnswer> builder)
    {
        builder.ToTable("ProjectAnswers", "Project");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.QuestionId).IsRequired();
        builder.Property(x => x.UserId).IsRequired();
        builder.Property(x => x.ContentHtml).HasColumnType("NVARCHAR(MAX)").IsRequired();
        builder.Property(x => x.AudioUrl).HasMaxLength(500);
        builder.Property(x => x.LikeCount).IsRequired();
        builder.HasIndex(x => x.QuestionId);
    }
}

public class ProjectAnswerLikeConfig : IEntityTypeConfiguration<ProjectAnswerLike>
{
    public void Configure(EntityTypeBuilder<ProjectAnswerLike> builder)
    {
        builder.ToTable("ProjectAnswerLikes", "Project");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.AnswerId).IsRequired();
        builder.Property(x => x.UserId).IsRequired();
        builder.HasIndex(x => new { x.AnswerId, x.UserId }).IsUnique();
    }
}
