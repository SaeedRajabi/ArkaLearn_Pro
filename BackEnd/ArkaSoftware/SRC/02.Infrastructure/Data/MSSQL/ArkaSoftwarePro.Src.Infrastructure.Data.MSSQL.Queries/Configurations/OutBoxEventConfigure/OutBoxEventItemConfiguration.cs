using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.OutBoxEvents;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.OutBoxEventConfigure
{
    public class OutBoxEventItemConfiguration : IEntityTypeConfiguration<OutBoxEventItemQueryModel>
    {
        public void Configure(EntityTypeBuilder<OutBoxEventItemQueryModel> builder)
        {
            builder.ToTable("OutBoxEventItems", "dbo");
            builder.HasKey(x => x.OutBoxEventItemId).HasName("OutBoxEventItemId");
            builder.Property(e => e.AccuredByUserId).HasMaxLength(255);

            builder.Property(e => e.AggregateName).HasMaxLength(255);

            builder.Property(e => e.AggregateTypeName).HasMaxLength(500);

            builder.Property(e => e.EventName).HasMaxLength(255);

            builder.Property(e => e.EventTypeName).HasMaxLength(500);
        }
    }
}
