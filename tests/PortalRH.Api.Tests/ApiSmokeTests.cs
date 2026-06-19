using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using PortalRH.Api.Contracts.Admin.Auth;
using PortalRH.Api.Contracts.Admin.Ldap;
using PortalRH.Api.Contracts.Auth;
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
        var loginResponse = await _client.PostAsJsonAsync("/api/admin/auth/login", new AdminLoginRequest("super-admin", "Liotec@2026"));
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var adminSession = await loginResponse.Content.ReadFromJsonAsync<AdminLoginResponse>();
        Assert.NotNull(adminSession);
        Assert.False(string.IsNullOrWhiteSpace(adminSession.Token));

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

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminSession.Token);

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

    [Fact]
    public async Task CommunicationsEndpoint_RejectsCreateWithoutAdminSession()
    {
        var request = new UpsertCommunicationRequest
        {
            Category = "RH",
            Priority = "Alta prioridade",
            Title = "Comunicado sem sessao admin",
            Summary = "Resumo",
            Body = "Corpo",
            Audience = "Toda a companhia",
            Channel = "Portal",
            Status = "Publicado",
            AttachmentLabel = "Abrir anexo",
            Owner = "Recursos Humanos",
            PublishedAt = new DateTime(2026, 06, 19, 0, 0, 0, DateTimeKind.Utc)
        };

        var client = _client;
        client.DefaultRequestHeaders.Authorization = null;

        var response = await client.PostAsJsonAsync("/api/communications", request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task AdminLdapEndpoint_SavesAndReadsConfiguration()
    {
        var loginResponse = await _client.PostAsJsonAsync("/api/admin/auth/login", new AdminLoginRequest("super-admin", "Liotec@2026"));
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var adminSession = await loginResponse.Content.ReadFromJsonAsync<AdminLoginResponse>();
        Assert.NotNull(adminSession);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminSession.Token);

        var request = new UpsertLdapConfigurationRequest
        {
            IsEnabled = true,
            Server = "dc-virtual-02.liotecnica.com.br",
            Port = 389,
            UseLdaps = false,
            UseStartTls = true,
            IgnoreCertificateValidation = true,
            BaseDn = "DC=liotecnica,DC=com,DC=br",
            UserSearchBase = "OU=Usuarios,DC=liotecnica,DC=com,DC=br",
            NetbiosDomain = "LIOTECNICA",
            LoginFormat = "email-or-upn-or-samaccountname",
            BindDn = "CN=servico-hub,OU=ServiceAccounts,DC=liotecnica,DC=com,DC=br",
            ServiceAccountPassword = "Senha@123",
            SearchFilter = "(|(mail={0})(userPrincipalName={0})(sAMAccountName={0}))",
            DisplayNameAttribute = "displayName"
        };

        var saveResponse = await _client.PutAsJsonAsync("/api/admin/ldap", request);
        Assert.Equal(HttpStatusCode.OK, saveResponse.StatusCode);

        var saved = await saveResponse.Content.ReadFromJsonAsync<LdapConfigurationDto>();
        Assert.NotNull(saved);
        Assert.True(saved.IsEnabled);
        Assert.Equal("dc-virtual-02.liotecnica.com.br", saved.Server);
        Assert.True(saved.HasServiceAccountPassword);

        var getResponse = await _client.GetFromJsonAsync<LdapConfigurationDto>("/api/admin/ldap");
        Assert.NotNull(getResponse);
        Assert.Equal("LIOTECNICA", getResponse.NetbiosDomain);
        Assert.Equal("displayName", getResponse.DisplayNameAttribute);
        Assert.True(getResponse.HasServiceAccountPassword);
    }

    [Fact]
    public async Task AuthEndpoint_AuthenticatesViaLdap_WhenConfigurationIsEnabled()
    {
        var adminLoginResponse = await _client.PostAsJsonAsync("/api/admin/auth/login", new AdminLoginRequest("super-admin", "Liotec@2026"));
        var adminSession = await adminLoginResponse.Content.ReadFromJsonAsync<AdminLoginResponse>();
        Assert.NotNull(adminSession);

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminSession.Token);

        var ldapConfig = new UpsertLdapConfigurationRequest
        {
            IsEnabled = true,
            Server = "dc-virtual-02.liotecnica.com.br",
            Port = 389,
            UseLdaps = false,
            UseStartTls = true,
            IgnoreCertificateValidation = true,
            BaseDn = "DC=liotecnica,DC=com,DC=br",
            UserSearchBase = "OU=Usuarios,DC=liotecnica,DC=com,DC=br",
            NetbiosDomain = "LIOTECNICA",
            LoginFormat = "email-or-upn-or-samaccountname",
            BindDn = "CN=servico-hub,OU=ServiceAccounts,DC=liotecnica,DC=com,DC=br",
            ServiceAccountPassword = "Senha@123",
            SearchFilter = "(|(mail={0})(userPrincipalName={0})(sAMAccountName={0}))",
            DisplayNameAttribute = "displayName"
        };

        var saveResponse = await _client.PutAsJsonAsync("/api/admin/ldap", ldapConfig);
        Assert.Equal(HttpStatusCode.OK, saveResponse.StatusCode);

        _client.DefaultRequestHeaders.Authorization = null;

        var loginResponse = await _client.PostAsJsonAsync("/api/auth/ldap/login", new LdapLoginRequest
        {
            Login = "roberto.almeida@liotecnica.com.br",
            Password = "Liotec@2026"
        });

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var portalLogin = await loginResponse.Content.ReadFromJsonAsync<PortalLoginResponse>();
        Assert.NotNull(portalLogin);
        Assert.False(string.IsNullOrWhiteSpace(portalLogin.Token));
        Assert.Equal("Roberto Almeida", portalLogin.User.DisplayName);
        Assert.Equal("Recursos Humanos", portalLogin.User.Department);
    }
}
