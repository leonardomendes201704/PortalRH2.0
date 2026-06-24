using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using PortalRH.Api.Data;
using PortalRH.Api.Interfaces;
using PortalRH.Api.Models;
using PortalRH.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICommunicationService, CommunicationService>();
builder.Services.AddScoped<IAdminAuthService, AdminAuthService>();
builder.Services.AddScoped<ILdapConfigurationService, LdapConfigurationService>();
builder.Services.AddScoped<IPortalAuthService, PortalAuthService>();
builder.Services.AddScoped<IPortalUserAdminService, PortalUserAdminService>();
builder.Services.AddScoped<IPollService, PollService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<ILdapDirectoryAuthenticator, LdapDirectoryAuthenticator>();
builder.Services.AddScoped<IPasswordHasher<AdminUser>, PasswordHasher<AdminUser>>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("LioConnectaLocal", policy =>
    {
        policy
            .SetIsOriginAllowed(static origin =>
            {
                if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                {
                    return false;
                }

                if (!string.Equals(uri.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase) &&
                    !string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }

                return uri.Port is 3020 or 4173;
            })
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (!string.IsNullOrWhiteSpace(connectionString))
{
    builder.Services.AddDbContext<PortalRhDbContext>(options =>
        options.UseNpgsql(connectionString));
}

var app = builder.Build();
await PortalRhDbInitializer.InitializeAsync(app.Services);

var webRootPath = builder.Environment.WebRootPath;
if (string.IsNullOrWhiteSpace(webRootPath))
{
    webRootPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot");
}

Directory.CreateDirectory(webRootPath);
Directory.CreateDirectory(Path.Combine(webRootPath, "uploads"));

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("LioConnectaLocal");
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(webRootPath),
    RequestPath = ""
});
app.UseAuthorization();
app.MapControllers();

app.Run();

public partial class Program { }
