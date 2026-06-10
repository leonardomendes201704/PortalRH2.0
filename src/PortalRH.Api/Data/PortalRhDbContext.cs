using Microsoft.EntityFrameworkCore;

namespace PortalRH.Api.Data;

public class PortalRhDbContext : DbContext
{
    public PortalRhDbContext(DbContextOptions<PortalRhDbContext> options)
        : base(options)
    {
    }
}
