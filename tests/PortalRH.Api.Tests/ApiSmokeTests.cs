using System.Net;
using System.Net.Http.Json;
using PortalRH.Api.Contracts.Communications;

namespace PortalRH.Api.Tests;

public class ApiSmokeTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ApiSmokeTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task HealthEndpoint_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CommunicationsEndpoint_CreatesAndReadsCommunication()
    {
        var request = new UpsertCommunicationRequest
        {
            Category = "RH",
            Priority = "Alta prioridade",
            Title = "Comunicado inicial de RH",
            Summary = "Resumo do comunicado inicial.",
            Body = "Corpo do comunicado inicial.",
            Audience = "Toda a companhia",
            Channel = "Portal",
            Status = "Publicado",
            AttachmentLabel = "Abrir anexo",
            Owner = "Recursos Humanos",
            ImageUrl = "https://example.com/comunicado.png",
            IsFeatured = true,
            PublishedAt = new DateTime(2026, 06, 19, 0, 0, 0, DateTimeKind.Utc)
        };

        var createResponse = await _client.PostAsJsonAsync("/api/communications", request);

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var created = await createResponse.Content.ReadFromJsonAsync<CommunicationDto>();
        Assert.NotNull(created);
        Assert.Equal("Comunicado inicial de RH", created.Title);
        Assert.NotEqual(Guid.Empty, created.Id);
        Assert.False(string.IsNullOrWhiteSpace(created.Slug));

        var listResponse = await _client.GetFromJsonAsync<List<CommunicationDto>>("/api/communications");
        Assert.NotNull(listResponse);
        Assert.Single(listResponse);
    }
}
