using Microsoft.EntityFrameworkCore;
using PortalRH.Api.Models;

namespace PortalRH.Api.Data;

public class PortalRhDbContext : DbContext
{
    public PortalRhDbContext(DbContextOptions<PortalRhDbContext> options)
        : base(options)
    {
    }

    public DbSet<Communication> Communications => Set<Communication>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(PortalRhDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
