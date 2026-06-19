using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using PortalRH.Api.Data;

namespace PortalRH.Api.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<global::Program>
{
    private static readonly InMemoryDatabaseRoot DatabaseRoot = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureLogging(logging => logging.ClearProviders());

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<PortalRhDbContext>>();
            services.RemoveAll<PortalRhDbContext>();

            services.AddDbContext<PortalRhDbContext>(options =>
                options.UseInMemoryDatabase("portalrh-api-tests", DatabaseRoot));
        });
    }
}
