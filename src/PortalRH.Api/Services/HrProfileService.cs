using PortalRH.Api.Contracts.HrProfile;
using PortalRH.Api.Interfaces;
using PortalRH.Api.Models;

namespace PortalRH.Api.Services;

public class HrProfileService : IHrProfileService
{
    public Task<HrProfileResponse> GetProfileAsync(PortalUser user, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        var response = new HrProfileResponse(
            user.DisplayName,
            user.Department ?? string.Empty,
            user.Title ?? string.Empty,
            user.ManagerDisplayName ?? string.Empty,
            [
                new HrProfileItemDto("Ferias (Consultar/Solicitar)", "https://portal.example.local/rh/ferias", "TOTVS RM", true),
                new HrProfileItemDto("Holerite", "https://portal.example.local/rh/holerite", "TOTVS RM", true),
                new HrProfileItemDto("Beneficios (Seguro/VT)", "https://portal.example.local/rh/beneficios", "TOTVS RM", true),
                new HrProfileItemDto("Minha Avaliacao", "https://portal.example.local/rh/avaliacao", "TOTVS RM", true),
                new HrProfileItemDto("Dados Cadastrais", "https://portal.example.local/rh/cadastro", "TOTVS RM", true),
                new HrProfileItemDto("Ponto", "https://portal.example.local/rh/ponto", "TOTVS RM", true),
                new HrProfileItemDto("Treinamentos", "https://portal.example.local/lms", "LMS", true),
                new HrProfileItemDto("Chamados RH", "https://portal.example.local/servicenow/rh", "ServiceNow", true)
            ],
            "TOTVS RM + ServiceNow + LMS",
            true);

        return Task.FromResult(response);
    }
}
