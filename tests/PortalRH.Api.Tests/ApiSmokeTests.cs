using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using PortalRH.Api.Contracts.Admin.Auth;
using PortalRH.Api.Contracts.Admin.Ldap;
using PortalRH.Api.Contracts.Admin.Polls;
using PortalRH.Api.Contracts.Admin.PortalUsers;
using PortalRH.Api.Contracts.Auth;
using PortalRH.Api.Contracts.Communications;
using PortalRH.Api.Contracts.Polls;
using PortalRH.Api.Data;
using PortalRH.Api.Interfaces;

namespace PortalRH.Api.Tests;

public class ApiSmokeTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ApiSmokeTests(CustomWebApplicationFactory factory)
    {
        ResetDatabaseAsync(factory.Services).GetAwaiter().GetResult();
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task HealthEndpoint_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CorsPolicy_AllowsFrontendOriginsOnPorts3020And4173()
    {
        using var request = new HttpRequestMessage(HttpMethod.Options, "/api/admin/auth/login");
        request.Headers.Add("Origin", "http://10.0.0.79:3020");
        request.Headers.Add("Access-Control-Request-Method", "POST");
        request.Headers.Add("Access-Control-Request-Headers", "content-type");

        var response = await _client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.True(response.Headers.TryGetValues("Access-Control-Allow-Origin", out var allowOrigins));
        Assert.Contains("http://10.0.0.79:3020", allowOrigins);
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
    public async Task AdminLdapEndpoint_ReturnsSeededDefaultConfiguration()
    {
        var loginResponse = await _client.PostAsJsonAsync("/api/admin/auth/login", new AdminLoginRequest("super-admin", "Liotec@2026"));
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var adminSession = await loginResponse.Content.ReadFromJsonAsync<AdminLoginResponse>();
        Assert.NotNull(adminSession);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminSession.Token);

        var configuration = await _client.GetFromJsonAsync<LdapConfigurationDto>("/api/admin/ldap");

        Assert.NotNull(configuration);
        Assert.True(configuration.IsEnabled);
        Assert.Equal("dc-virtual-02.liotecnica.com.br", configuration.Server);
        Assert.Equal(389, configuration.Port);
        Assert.Equal("DC=liotecnica,DC=com,DC=br", configuration.BaseDn);
        Assert.Equal("OU=Departamentos,DC=liotecnica,DC=com,DC=br", configuration.UserSearchBase);
        Assert.Equal("LIOTECNICA", configuration.NetbiosDomain);
        Assert.Equal("domain-backslash-samaccountname", configuration.LoginFormat);
        Assert.Equal("(|(mail={0})(userPrincipalName={0})(sAMAccountName={0}))", configuration.SearchFilter);
        Assert.Equal("displayName", configuration.DisplayNameAttribute);
        Assert.False(configuration.UseLdaps);
        Assert.False(configuration.UseStartTls);
        Assert.False(configuration.IgnoreCertificateValidation);
        Assert.False(configuration.HasServiceAccountPassword);
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
        Assert.Equal("Analista de RH", portalLogin.User.Title);
        Assert.Equal("Elizabete Rodrigues da Silva", portalLogin.User.ManagerDisplayName);
        Assert.NotEmpty(portalLogin.User.ModulePermissions);
    }

    [Fact]
    public async Task AdminPortalUsersEndpoint_ReturnsPagedUsersAndRecentLoginData()
    {
        await EnsureLdapEnabledAsync();
        await LoginPortalUserAsync();

        var adminSession = await LoginAdminAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminSession.Token);

        var payload = await _client.GetFromJsonAsync<PortalUserAdminListResponse>("/api/admin/portal-users?query=roberto&status=active&department=Recursos%20Humanos&sortBy=displayName&sortDirection=asc&page=1&pageSize=5");

        Assert.NotNull(payload);
        Assert.NotEmpty(payload.Items);
        Assert.Contains(payload.Items, item => item.Login == "roberto.almeida@liotecnica.com.br");
        Assert.True(payload.TotalItems >= 1);
        Assert.True(payload.Summary.LoginEvents >= 1);
        Assert.NotEmpty(payload.RoleOptions);
        Assert.NotEmpty(payload.DepartmentOptions);
        Assert.NotEmpty(payload.RecentLogins);
        Assert.Equal("Recursos Humanos", payload.Department);
        Assert.Equal("displayName", payload.SortBy);
        Assert.Equal("asc", payload.SortDirection);
        Assert.Contains(payload.Items, item => item.ManagerDisplayName == "Elizabete Rodrigues da Silva");
    }

    [Fact]
    public async Task AdminPortalUsersEndpoint_UpdatesRoleAndStatus_AndBlocksInactiveLogin()
    {
        await EnsureLdapEnabledAsync();
        await LoginPortalUserAsync();

        var adminSession = await LoginAdminAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminSession.Token);

        var usersPayload = await _client.GetFromJsonAsync<PortalUserAdminListResponse>("/api/admin/portal-users?query=roberto&page=1&pageSize=5");
        Assert.NotNull(usersPayload);

        var user = Assert.Single(usersPayload.Items.Where(item => item.Login == "roberto.almeida@liotecnica.com.br"));

        var roleResponse = await _client.PatchAsJsonAsync($"/api/admin/portal-users/{user.Id}/role", new UpdatePortalUserRoleRequest
        {
            Role = "PortalAdmin"
        });
        Assert.Equal(HttpStatusCode.OK, roleResponse.StatusCode);

        var rolePayload = await roleResponse.Content.ReadFromJsonAsync<PortalUserAdminDto>();
        Assert.NotNull(rolePayload);
        Assert.Equal("PortalAdmin", rolePayload.Role);
        Assert.Contains("Acessar configuracoes administrativas", rolePayload.Permissions);

        var permissionResponse = await _client.PatchAsJsonAsync($"/api/admin/portal-users/{user.Id}/permissions", new UpdatePortalUserModulePermissionRequest
        {
            ModuleKey = "feed",
            AccessLevel = "Manage"
        });
        Assert.Equal(HttpStatusCode.OK, permissionResponse.StatusCode);

        var permissionPayload = await permissionResponse.Content.ReadFromJsonAsync<PortalUserAdminDto>();
        Assert.NotNull(permissionPayload);
        Assert.Contains(permissionPayload.ModulePermissions, item => item.ModuleKey == "feed" && item.AccessLevel == "Manage");

        var statusResponse = await _client.PatchAsJsonAsync($"/api/admin/portal-users/{user.Id}/status", new UpdatePortalUserStatusRequest
        {
            IsActive = false
        });
        Assert.Equal(HttpStatusCode.OK, statusResponse.StatusCode);

        var statusPayload = await statusResponse.Content.ReadFromJsonAsync<PortalUserAdminDto>();
        Assert.NotNull(statusPayload);
        Assert.False(statusPayload.IsActive);

        var refreshedPayload = await _client.GetFromJsonAsync<PortalUserAdminListResponse>("/api/admin/portal-users?query=roberto&page=1&pageSize=5");
        Assert.NotNull(refreshedPayload);
        Assert.NotEmpty(refreshedPayload.RecentAuditEntries);
        Assert.Contains(refreshedPayload.RecentAuditEntries, item => item.ActionType == "PerfilAlterado");
        Assert.Contains(refreshedPayload.RecentAuditEntries, item => item.ActionType == "PermissaoModuloAlterada");
        Assert.Contains(refreshedPayload.RecentAuditEntries, item => item.ActionType == "StatusAlterado");

        _client.DefaultRequestHeaders.Authorization = null;

        var blockedLoginResponse = await _client.PostAsJsonAsync("/api/auth/ldap/login", new LdapLoginRequest
        {
            Login = "roberto.almeida@liotecnica.com.br",
            Password = "Liotec@2026"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, blockedLoginResponse.StatusCode);
    }

    [Fact]
    public async Task AuthEndpoint_RegistersFailedLoginAndLogoutAuditTrail()
    {
        await EnsureLdapEnabledAsync();

        _client.DefaultRequestHeaders.Remove("X-Forwarded-For");
        _client.DefaultRequestHeaders.Remove("Origin");
        _client.DefaultRequestHeaders.Add("X-Forwarded-For", "10.20.30.40");
        _client.DefaultRequestHeaders.Add("Origin", "http://127.0.0.1:3020");

        var failedLoginResponse = await _client.PostAsJsonAsync("/api/auth/ldap/login", new LdapLoginRequest
        {
            Login = "roberto.almeida@liotecnica.com.br",
            Password = "senha-invalida"
        });
        Assert.Equal(HttpStatusCode.Unauthorized, failedLoginResponse.StatusCode);

        var portalLogin = await LoginPortalUserAsync();
        _client.DefaultRequestHeaders.Remove("Authorization");
        _client.DefaultRequestHeaders.Remove("X-Portal-Token");
        _client.DefaultRequestHeaders.Add("X-Portal-Token", portalLogin.Token);

        var logoutResponse = await _client.PostAsync("/api/auth/logout", content: null);
        Assert.Equal(HttpStatusCode.NoContent, logoutResponse.StatusCode);

        var adminSession = await LoginAdminAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminSession.Token);
        _client.DefaultRequestHeaders.Remove("X-Portal-Token");

        var payload = await _client.GetFromJsonAsync<PortalUserAdminListResponse>("/api/admin/portal-users?query=roberto&page=1&pageSize=5");
        Assert.NotNull(payload);
        Assert.Equal(1, payload.Summary.LoginEvents);
        Assert.Equal(1, payload.Summary.FailedLoginEvents);
        Assert.Equal(1, payload.Summary.LogoutEvents);
        Assert.Contains(payload.RecentLogins, item => item.EventType == "LoginFailure" && item.FailureReason == "Credenciais invalidas.");
        Assert.Contains(payload.RecentLogins, item => item.EventType == "Logout");

        var user = Assert.Single(payload.Items.Where(item => item.Login == "roberto.almeida@liotecnica.com.br"));
        Assert.Equal(0, user.FailedLoginCount);
        Assert.Equal("10.20.30.40", user.LastKnownIpAddress);
        Assert.Equal("http://127.0.0.1:3020", user.LastOrigin);
    }

    [Fact]
    public async Task PollsEndpoint_CreatesListsAndReturnsPublishedPoll()
    {
        var adminSession = await LoginAdminAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminSession.Token);

        var imageUploadUrl = await UploadPollAssetAsync("image", "enquete-home.png", "image/png", [137, 80, 78, 71, 13, 10, 26, 10]);
        var attachmentUploadUrl = await UploadPollAssetAsync("attachment", "diretrizes.pdf", "application/pdf", [37, 80, 68, 70, 45, 49, 46, 55]);

        var createResponse = await _client.PostAsJsonAsync("/api/admin/polls", new UpsertPollRequest
        {
            Title = "Qual iniciativa deve abrir o proximo trimestre?",
            Summary = "Escolha a frente mais prioritaria para os proximos 90 dias.",
            Body = "A enquete apoia o planejamento das frentes internas da LIOCONNECTA.",
            ImageUrl = imageUploadUrl,
            AttachmentLabel = "Baixar diretrizes",
            AttachmentUrl = attachmentUploadUrl,
            Audience = "Toda a companhia",
            Status = "Published",
            AllowMultipleChoices = false,
            ResultsVisibility = "AfterVote",
            IsFeatured = true,
            PublishedAtUtc = new DateTime(2026, 06, 21, 12, 0, 0, DateTimeKind.Utc),
            ClosesAtUtc = new DateTime(2026, 06, 30, 18, 0, 0, DateTimeKind.Utc),
            Options =
            [
                new UpsertPollOptionRequest { Label = "Nova trilha de onboarding" },
                new UpsertPollOptionRequest { Label = "Programa de lideranca" },
                new UpsertPollOptionRequest { Label = "Revamp dos acessos rapidos" }
            ]
        });

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<PollAdminDto>();
        Assert.NotNull(created);
        Assert.Equal("Published", created.Status);
        Assert.Equal(3, created.Options.Count);
        Assert.Equal(imageUploadUrl, created.ImageUrl);
        Assert.Equal("Baixar diretrizes", created.AttachmentLabel);
        Assert.Equal(attachmentUploadUrl, created.AttachmentUrl);

        _client.DefaultRequestHeaders.Authorization = null;

        var publicItems = await _client.GetFromJsonAsync<List<PollDto>>("/api/polls");
        Assert.NotNull(publicItems);
        Assert.Single(publicItems);
        Assert.Equal("Qual iniciativa deve abrir o proximo trimestre?", publicItems[0].Title);
        Assert.Equal(imageUploadUrl, publicItems[0].ImageUrl);
        Assert.Equal("Baixar diretrizes", publicItems[0].AttachmentLabel);

        var uploadedImageResponse = await _client.GetAsync(new Uri(imageUploadUrl).PathAndQuery);
        Assert.Equal(HttpStatusCode.OK, uploadedImageResponse.StatusCode);

        var detailResponse = await _client.GetAsync($"/api/polls/slug/{created.Slug}");
        Assert.Equal(HttpStatusCode.OK, detailResponse.StatusCode);
    }

    [Fact]
    public async Task PollsEndpoint_RegistersSingleVoteAndBlocksSecondAttempt()
    {
        await EnsureLdapEnabledAsync();

        var adminSession = await LoginAdminAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminSession.Token);

        var createResponse = await _client.PostAsJsonAsync("/api/admin/polls", new UpsertPollRequest
        {
            Title = "Qual canal gera mais engajamento interno?",
            Summary = "Mapeamento rapido para priorizar a proxima campanha.",
            Body = "Vote no canal que mais impulsiona a comunicacao interna hoje.",
            Audience = "Toda a companhia",
            Status = "Published",
            AllowMultipleChoices = false,
            ResultsVisibility = "AfterVote",
            IsFeatured = false,
            PublishedAtUtc = new DateTime(2026, 06, 21, 12, 0, 0, DateTimeKind.Utc),
            ClosesAtUtc = new DateTime(2026, 06, 29, 18, 0, 0, DateTimeKind.Utc),
            Options =
            [
                new UpsertPollOptionRequest { Label = "Portal" },
                new UpsertPollOptionRequest { Label = "Teams" }
            ]
        });

        var poll = await createResponse.Content.ReadFromJsonAsync<PollAdminDto>();
        Assert.NotNull(poll);

        var portalSession = await LoginPortalUserAsync();
        _client.DefaultRequestHeaders.Authorization = null;
        _client.DefaultRequestHeaders.Remove("X-Portal-Token");
        _client.DefaultRequestHeaders.Add("X-Portal-Token", portalSession.Token);

        var voteResponse = await _client.PostAsJsonAsync($"/api/polls/{poll.Id}/vote", new SubmitPollVoteRequest
        {
            OptionIds = [poll.Options[0].Id]
        });

        Assert.Equal(HttpStatusCode.OK, voteResponse.StatusCode);
        var voted = await voteResponse.Content.ReadFromJsonAsync<PollDto>();
        Assert.NotNull(voted);
        Assert.True(voted.HasVoted);
        Assert.True(voted.ResultsVisible);
        Assert.Equal(1, voted.TotalVotes);
        Assert.True(voted.Options[0].IsSelected);
        Assert.Equal(100, voted.Options[0].Percentage);

        var secondVoteResponse = await _client.PostAsJsonAsync($"/api/polls/{poll.Id}/vote", new SubmitPollVoteRequest
        {
            OptionIds = [poll.Options[1].Id]
        });

        Assert.Equal(HttpStatusCode.BadRequest, secondVoteResponse.StatusCode);
    }

    private async Task<AdminLoginResponse> LoginAdminAsync()
    {
        var loginResponse = await _client.PostAsJsonAsync("/api/admin/auth/login", new AdminLoginRequest("super-admin", "Liotec@2026"));
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        var adminSession = await loginResponse.Content.ReadFromJsonAsync<AdminLoginResponse>();
        Assert.NotNull(adminSession);
        return adminSession;
    }

    private async Task<string> UploadPollAssetAsync(string assetType, string fileName, string contentType, byte[] bytes)
    {
        using var formData = new MultipartFormDataContent();
        using var fileContent = new ByteArrayContent(bytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        formData.Add(fileContent, "file", fileName);

        var response = await _client.PostAsync($"/api/admin/polls/assets/{assetType}", formData);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<PollAssetUploadResponse>();
        Assert.NotNull(payload);
        Assert.False(string.IsNullOrWhiteSpace(payload.Url));
        return payload.Url;
    }

    private async Task EnsureLdapEnabledAsync()
    {
        var adminSession = await LoginAdminAsync();
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
    }

    private async Task<PortalLoginResponse> LoginPortalUserAsync()
    {
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/ldap/login", new LdapLoginRequest
        {
            Login = "roberto.almeida@liotecnica.com.br",
            Password = "Liotec@2026"
        });

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        var portalLogin = await loginResponse.Content.ReadFromJsonAsync<PortalLoginResponse>();
        Assert.NotNull(portalLogin);
        return portalLogin;
    }

    private static async Task ResetDatabaseAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<PortalRhDbContext>();
        var adminAuthService = scope.ServiceProvider.GetRequiredService<IAdminAuthService>();
        var ldapConfigurationService = scope.ServiceProvider.GetRequiredService<ILdapConfigurationService>();

        await dbContext.Database.EnsureDeletedAsync();
        await dbContext.Database.EnsureCreatedAsync();
        await adminAuthService.EnsureDefaultSuperAdminAsync(CancellationToken.None);
        await ldapConfigurationService.EnsureDefaultConfigurationAsync(CancellationToken.None);
    }
}
