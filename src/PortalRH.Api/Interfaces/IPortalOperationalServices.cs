using PortalRH.Api.Contracts.CorporateSystems;
using PortalRH.Api.Contracts.HrProfile;
using PortalRH.Api.Contracts.Journey;
using PortalRH.Api.Contracts.Kpis;
using PortalRH.Api.Contracts.QuickLinks;
using PortalRH.Api.Models;

namespace PortalRH.Api.Interfaces;

public interface IQuickLinkService
{
    Task<QuickLinkListResponse> GetActiveAsync(CancellationToken cancellationToken);
    Task EnsureSeedAsync(CancellationToken cancellationToken);
}

public interface IJourneyService
{
    Task<JourneySummaryResponse> GetSummaryAsync(PortalUser user, CancellationToken cancellationToken);
}

public interface IKpiService
{
    Task<KpiSummaryResponse> GetSummaryAsync(PortalUser user, CancellationToken cancellationToken);
}

public interface IHrProfileService
{
    Task<HrProfileResponse> GetProfileAsync(PortalUser user, CancellationToken cancellationToken);
}

public interface ICorporateSystemsService
{
    Task<CorporateSystemsResponse> GetSystemsAsync(PortalUser user, CancellationToken cancellationToken);
}

public interface IPortalPanelsComposer
{
    Task<Contracts.Shell.PanelsResponse> BuildAsync(PortalUser user, CancellationToken cancellationToken);
}

public interface IPortalUserSeedService
{
    Task EnsureSeedAsync(CancellationToken cancellationToken);
}
