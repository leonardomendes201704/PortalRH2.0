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
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();
    public DbSet<AdminSession> AdminSessions => Set<AdminSession>();
    public DbSet<LdapConfiguration> LdapConfigurations => Set<LdapConfiguration>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(PortalRhDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
