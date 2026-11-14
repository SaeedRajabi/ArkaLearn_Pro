using ArkaSoftwarePro.Src.Core.Domain.ProjectOrderAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.ProjectOrders.Configs;

public class ProjectOrderConfig : IEntityTypeConfiguration<ProjectOrder>
{
    public void Configure(EntityTypeBuilder<ProjectOrder> builder)
    {
        builder.ToTable("ProjectOrders", "ProjectOrder");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.RequestNumber).IsRequired();
        builder.HasIndex(x => x.RequestNumber).IsUnique();
        builder.Property(x => x.UserId).IsRequired(false);
        builder.HasIndex(x => x.UserId);
        builder.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.LastName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Phone).HasMaxLength(30).IsRequired();
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.ProjectType).HasMaxLength(50).IsRequired();
        builder.Property(x => x.DescriptionHtml).HasColumnType("NVARCHAR(MAX)").IsRequired(false);
        builder.Property(x => x.Status).IsRequired();
        builder.Property(x => x.AdminNote).HasMaxLength(2000);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.Phone);
    }
}
