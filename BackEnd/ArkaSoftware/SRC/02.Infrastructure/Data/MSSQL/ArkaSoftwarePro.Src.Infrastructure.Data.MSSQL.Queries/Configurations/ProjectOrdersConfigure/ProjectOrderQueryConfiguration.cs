using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.ProjectOrders;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.ProjectOrdersConfigure;

public class ProjectOrderQueryConfiguration : IEntityTypeConfiguration<ProjectOrderQueryModel>
{
    public void Configure(EntityTypeBuilder<ProjectOrderQueryModel> builder)
    {
        builder.ToTable("ProjectOrders", "ProjectOrder");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.FirstName).HasMaxLength(100);
        builder.Property(x => x.LastName).HasMaxLength(100);
        builder.Property(x => x.Phone).HasMaxLength(30);
        builder.Property(x => x.ProjectType).HasMaxLength(50);
        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(x => x.ReviewedByUser)
            .WithMany()
            .HasForeignKey(x => x.ReviewedByUserId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
