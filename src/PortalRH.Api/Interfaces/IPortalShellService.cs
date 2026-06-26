using PortalRH.Api.Contracts.Shell;
using PortalRH.Api.Models;

namespace PortalRH.Api.Interfaces;

public interface IPortalShellService
{
    MeUiResponse BuildMeUi(PortalUser user);

    Task<PanelsResponse> BuildPanelsAsync(PortalUser user, CancellationToken cancellationToken);
}
