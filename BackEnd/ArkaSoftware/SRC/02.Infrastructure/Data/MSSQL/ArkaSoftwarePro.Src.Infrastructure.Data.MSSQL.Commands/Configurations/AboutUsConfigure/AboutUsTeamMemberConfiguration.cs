using ArkaSoftwarePro.Src.Core.Domain.AboutUsAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.AboutUsConfigure
{
    public class AboutUsTeamMemberConfiguration : IEntityTypeConfiguration<AboutUsTeamMember>
    {
        public void Configure(EntityTypeBuilder<AboutUsTeamMember> builder)
        {
            builder.ToTable("AboutUsTeamMembers", "Website");

            builder.Property(x => x.FullName)
                .HasColumnType("NVARCHAR")
                .HasMaxLength(200)
                .IsRequired();

            builder.Property(x => x.SkillTitle)
                .HasColumnType("NVARCHAR")
                .HasMaxLength(200)
                .IsRequired();

            builder.Property(x => x.ImageUrl)
                .HasColumnType("NVARCHAR")
                .HasMaxLength(600)
                .IsRequired();

            builder.Property(x => x.GithubUrl)
                .HasColumnType("NVARCHAR")
                .HasMaxLength(600)
                .IsRequired();

            builder.Property(x => x.LinkedinUrl)
                .HasColumnType("NVARCHAR")
                .HasMaxLength(600)
                .IsRequired();

            builder.Property(x => x.TwitterUrl)
                .HasColumnType("NVARCHAR")
                .HasMaxLength(600)
                .IsRequired();

            builder.Property(x => x.InstagramUrl)
                .HasColumnType("NVARCHAR")
                .HasMaxLength(600)
                .IsRequired();

            builder.Property(x => x.WebsiteUrl)
                .HasColumnType("NVARCHAR")
                .HasMaxLength(600)
                .IsRequired();

            builder.Property(x => x.DisplayOrder)
                .HasColumnType("INT")
                .IsRequired();

            builder.HasIndex(x => new { x.AboutUsPageId, x.DisplayOrder });

            builder.HasOne(x => x.AboutUsPage)
                .WithMany(x => x.TeamMembers)
                .HasForeignKey(x => x.AboutUsPageId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
