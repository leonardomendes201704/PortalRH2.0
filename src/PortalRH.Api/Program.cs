using MediatR;
using Microsoft.EntityFrameworkCore;
using PortalRH.Api.Data;
using PortalRH.Api.Interfaces;
using PortalRH.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));
builder.Services.AddScoped<ICommunicationService, CommunicationService>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("LioConnectaLocal", policy =>
    {
        policy
            .WithOrigins("http://127.0.0.1:4173", "http://localhost:4173")
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

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("LioConnectaLocal");
app.UseAuthorization();
app.MapControllers();

app.Run();

public partial class Program { }
