using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalRH.Api.Models;

namespace PortalRH.Api.Data.Configurations;

public class PollOptionConfiguration : IEntityTypeConfiguration<PollOption>
{
    public void Configure(EntityTypeBuilder<PollOption> builder)
    {
        builder.ToTable("poll_options");

        builder.HasKey(item => item.Id);

        builder.Property(item => item.Label)
            .HasMaxLength(240)
            .IsRequired();

        builder.Property(item => item.DisplayOrder)
            .IsRequired();

        builder.HasIndex(item => new { item.PollId, item.DisplayOrder });

        builder.HasMany(item => item.Votes)
            .WithOne(item => item.PollOption)
            .HasForeignKey(item => item.PollOptionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
