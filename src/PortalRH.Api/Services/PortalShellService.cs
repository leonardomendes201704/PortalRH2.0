using PortalRH.Api.Contracts.Shell;
using PortalRH.Api.Domain;
using PortalRH.Api.Interfaces;
using PortalRH.Api.Models;

namespace PortalRH.Api.Services;

public class PortalShellService : IPortalShellService
{
    private readonly IPortalPanelsComposer _portalPanelsComposer;

    public PortalShellService(IPortalPanelsComposer portalPanelsComposer)
    {
        _portalPanelsComposer = portalPanelsComposer;
    }

    public MeUiResponse BuildMeUi(PortalUser user)
    {
        var template = PortalShellDefaults.CreateMeUiTemplate();

        return template with
        {
            User = template.User with
            {
                Name = user.DisplayName,
                Area = user.Department ?? string.Empty,
                NotificationCount = 0
            },
            NavItems = BuildNavItems(user),
            Composer = template.Composer with
            {
                Enabled = PortalModuleAccessResolver.HasAtLeast(
                    user,
                    PortalModulePermissionCatalog.Feed,
                    PortalModulePermissionCatalog.Interact)
            }
        };
    }

    public Task<PanelsResponse> BuildPanelsAsync(PortalUser user, CancellationToken cancellationToken)
        => _portalPanelsComposer.BuildAsync(user, cancellationToken);

    private static IReadOnlyList<NavItemDto> BuildNavItems(PortalUser user)
    {
        return PortalShellNavigationCatalog.GetDefinitions()
            .Where(item => PortalModuleAccessResolver.HasAtLeast(user, item.ModuleKey, item.MinimumAccessLevel))
            .Select(item => new NavItemDto(item.Label, item.Route, item.ModuleKey, false))
            .ToList();
    }
}
