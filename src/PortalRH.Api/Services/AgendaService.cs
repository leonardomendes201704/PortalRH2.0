using Microsoft.EntityFrameworkCore;
using PortalRH.Api.Contracts.Agenda;
using PortalRH.Api.Data;
using PortalRH.Api.Interfaces;
using PortalRH.Api.Models;

namespace PortalRH.Api.Services;

public class AgendaService : IAgendaService
{
    private static readonly TimeZoneInfo SaoPauloTimeZone = ResolveSaoPauloTimeZone();
    private readonly PortalRhDbContext _dbContext;

    public AgendaService(PortalRhDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<AgendaDayResponse> GetTodayAsync(Guid portalUserId, CancellationToken cancellationToken)
    {
        var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, SaoPauloTimeZone);
        var localDate = DateOnly.FromDateTime(nowLocal);
        var startLocal = localDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified);
        var endLocal = localDate.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified);
        var startUtc = TimeZoneInfo.ConvertTimeToUtc(startLocal, SaoPauloTimeZone);
        var endUtc = TimeZoneInfo.ConvertTimeToUtc(endLocal, SaoPauloTimeZone);

        var events = await _dbContext.AgendaEvents
            .AsNoTracking()
            .Where(item =>
                item.IsActive &&
                (item.PortalUserId == null || item.PortalUserId == portalUserId) &&
                item.StartAtUtc < endUtc &&
                item.EndAtUtc > startUtc)
            .OrderBy(item => item.StartAtUtc)
            .ThenBy(item => item.Title)
            .ToListAsync(cancellationToken);

        var items = events.Select(MapToDto).ToList();

        return new AgendaDayResponse(localDate, items.Count, items);
    }

    private static AgendaItemDto MapToDto(AgendaEvent item)
    {
        var startLocal = TimeZoneInfo.ConvertTimeFromUtc(NormalizeUtc(item.StartAtUtc), SaoPauloTimeZone);

        return new AgendaItemDto(
            item.Id,
            item.Title,
            item.Description,
            item.Location,
            startLocal.ToString("HH:mm"),
            item.Source,
            item.Audience,
            NormalizeUtc(item.StartAtUtc),
            NormalizeUtc(item.EndAtUtc));
    }

    private static DateTime NormalizeUtc(DateTime value)
    {
        return value.Kind == DateTimeKind.Utc
            ? value
            : DateTime.SpecifyKind(value, DateTimeKind.Utc);
    }

    private static TimeZoneInfo ResolveSaoPauloTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
        }
        catch (InvalidTimeZoneException)
        {
            return TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
        }
    }
}
