using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.AboutUs;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.AboutUsConfigure
{
    public class AboutUsTeamMemberQueryConfiguration : IEntityTypeConfiguration<AboutUsTeamMemberQueryModel>
    {
        public void Configure(EntityTypeBuilder<AboutUsTeamMemberQueryModel> builder)
        {
            builder.ToTable("AboutUsTeamMembers", "Website");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.FullName).HasColumnType("NVARCHAR").HasMaxLength(200);
            builder.Property(x => x.SkillTitle).HasColumnType("NVARCHAR").HasMaxLength(200);
            builder.Property(x => x.ImageUrl).HasColumnType("NVARCHAR").HasMaxLength(600);
            builder.Property(x => x.GithubUrl).HasColumnType("NVARCHAR").HasMaxLength(600);
            builder.Property(x => x.LinkedinUrl).HasColumnType("NVARCHAR").HasMaxLength(600);
            builder.Property(x => x.TwitterUrl).HasColumnType("NVARCHAR").HasMaxLength(600);
            builder.Property(x => x.InstagramUrl).HasColumnType("NVARCHAR").HasMaxLength(600);
            builder.Property(x => x.WebsiteUrl).HasColumnType("NVARCHAR").HasMaxLength(600);
            builder.Property(x => x.DisplayOrder).HasColumnType("INT");

            builder.HasIndex(x => new { x.AboutUsPageId, x.DisplayOrder });

            builder.HasOne(x => x.AboutUsPage)
                .WithMany(x => x.TeamMembers)
                .HasForeignKey(x => x.AboutUsPageId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
