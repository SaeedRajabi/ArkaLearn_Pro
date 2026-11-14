using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.ProjectQuestions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.ProjectQuestionsConfigure;

public class ProjectQuestionQueryConfiguration : IEntityTypeConfiguration<ProjectQuestionQueryModel>
{
    public void Configure(EntityTypeBuilder<ProjectQuestionQueryModel> builder)
    {
        builder.ToTable("ProjectQuestions", "Project");
        builder.HasKey(x => x.Id);
        builder.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(x => x.ReviewedByUser).WithMany().HasForeignKey(x => x.ReviewedByUserId).OnDelete(DeleteBehavior.NoAction);
        builder.HasMany(x => x.Answers).WithOne().HasForeignKey(x => x.QuestionId);
    }
}

public class ProjectAnswerQueryConfiguration : IEntityTypeConfiguration<ProjectAnswerQueryModel>
{
    public void Configure(EntityTypeBuilder<ProjectAnswerQueryModel> builder)
    {
        builder.ToTable("ProjectAnswers", "Project");
        builder.HasKey(x => x.Id);
        builder.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.NoAction);
    }
}

public class ProjectAnswerLikeQueryConfiguration : IEntityTypeConfiguration<ProjectAnswerLikeQueryModel>
{
    public void Configure(EntityTypeBuilder<ProjectAnswerLikeQueryModel> builder)
    {
        builder.ToTable("ProjectAnswerLikes", "Project");
        builder.HasKey(x => x.Id);
    }
}
