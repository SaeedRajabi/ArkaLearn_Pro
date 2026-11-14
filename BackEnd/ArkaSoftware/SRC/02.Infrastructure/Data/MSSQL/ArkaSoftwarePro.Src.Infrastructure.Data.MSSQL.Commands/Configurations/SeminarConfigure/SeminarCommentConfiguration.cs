using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.SeminarConfigure
{
    public class SeminarCommentConfiguration : IEntityTypeConfiguration<SeminarComment>
    {
        public void Configure(EntityTypeBuilder<SeminarComment> builder)
        {
            builder.ToTable("SeminarComments", "Seminar");
            builder.Property(x => x.Content).HasMaxLength(600).HasConversion(x => x!.Value, x => new CommentContent(x!)).IsRequired();
            builder.Property(x => x.Rating).HasColumnType("INT");
            builder.Property(x => x.Like).HasColumnType("INT");
            builder.Property(x => x.IsApproved).IsRequired();
        }
    }
}
