using System.DirectoryServices.Protocols;
using System.Net;
using System.Text;
using PortalRH.Api.Interfaces;

namespace PortalRH.Api.Services;

public class LdapDirectoryAuthenticator : ILdapDirectoryAuthenticator
{
    public Task<LdapAuthenticatedUser?> AuthenticateAsync(
        LdapRuntimeConfiguration configuration,
        string login,
        string password,
        CancellationToken cancellationToken)
    {
        return Task.Run(() =>
        {
            using var directoryConnection = CreateConnection(configuration);

            if (!string.IsNullOrWhiteSpace(configuration.BindDn) && !string.IsNullOrWhiteSpace(configuration.BindPassword))
            {
                directoryConnection.Credential = new NetworkCredential(configuration.BindDn, configuration.BindPassword);
                directoryConnection.Bind();
            }
            else
            {
                directoryConnection.Bind();
            }

            var baseDn = string.IsNullOrWhiteSpace(configuration.UserSearchBase)
                ? configuration.BaseDn
                : configuration.UserSearchBase;

            var filter = configuration.SearchFilter.Replace("{0}", EscapeFilterValue(login), StringComparison.Ordinal);
            var request = new SearchRequest(
                baseDn,
                filter,
                SearchScope.Subtree,
                new[]
                {
                    configuration.DisplayNameAttribute,
                    "mail",
                    "userPrincipalName",
                    "sAMAccountName",
                    "department",
                    "title",
                    "distinguishedName"
                });

            var response = (SearchResponse)directoryConnection.SendRequest(request);
            var entry = response.Entries.Count > 0 ? response.Entries[0] : null;
            if (entry is null)
            {
                return (LdapAuthenticatedUser?)null;
            }

            var userPrincipalName = ReadAttribute(entry, "userPrincipalName");
            var samAccountName = ReadAttribute(entry, "sAMAccountName");
            var email = ReadAttribute(entry, "mail");
            var displayName = ReadAttribute(entry, configuration.DisplayNameAttribute) ?? samAccountName ?? userPrincipalName ?? login;
            var distinguishedName = ReadAttribute(entry, "distinguishedName");
            var bindLogin = BuildBindLogin(configuration, login, samAccountName, userPrincipalName, email);

            using var authenticationConnection = CreateConnection(configuration);
            authenticationConnection.Credential = BuildCredential(configuration, bindLogin, password);
            authenticationConnection.Bind();

            return new LdapAuthenticatedUser(
                login,
                samAccountName,
                userPrincipalName,
                email,
                displayName,
                ReadAttribute(entry, "department"),
                ReadAttribute(entry, "title"),
                distinguishedName);
        }, cancellationToken);
    }

    private static LdapConnection CreateConnection(LdapRuntimeConfiguration configuration)
    {
        var identifier = new LdapDirectoryIdentifier(configuration.Server, configuration.Port);
        var connection = new LdapConnection(identifier)
        {
            AuthType = AuthType.Basic,
            Timeout = TimeSpan.FromSeconds(20)
        };

        connection.SessionOptions.ProtocolVersion = 3;

        if (configuration.UseLdaps)
        {
            connection.SessionOptions.SecureSocketLayer = true;
        }

        if (configuration.UseStartTls)
        {
            connection.SessionOptions.StartTransportLayerSecurity(null);
        }

        if (configuration.IgnoreCertificateValidation)
        {
            connection.SessionOptions.VerifyServerCertificate += (_, _) => true;
        }

        return connection;
    }

    private static NetworkCredential BuildCredential(LdapRuntimeConfiguration configuration, string bindLogin, string password)
    {
        if (bindLogin.Contains('\\', StringComparison.Ordinal))
        {
            var parts = bindLogin.Split('\\', 2);
            return new NetworkCredential(parts[1], password, parts[0]);
        }

        return new NetworkCredential(bindLogin, password);
    }

    private static string BuildBindLogin(
        LdapRuntimeConfiguration configuration,
        string login,
        string? samAccountName,
        string? userPrincipalName,
        string? email)
    {
        return configuration.LoginFormat switch
        {
            "domain-backslash-samaccountname" => $"{configuration.NetbiosDomain}\\{samAccountName ?? login}",
            "userprincipalname" => userPrincipalName ?? login,
            "mail" => email ?? login,
            _ => login.Contains('@', StringComparison.Ordinal)
                ? login
                : (samAccountName ?? login)
        };
    }

    private static string? ReadAttribute(SearchResultEntry entry, string attributeName)
    {
        if (!entry.Attributes.Contains(attributeName))
        {
            return null;
        }

        var values = entry.Attributes[attributeName];
        return values?.Count > 0 ? values[0]?.ToString() : null;
    }

    private static string EscapeFilterValue(string value)
    {
        var builder = new StringBuilder();
        foreach (var ch in value)
        {
            builder.Append(ch switch
            {
                '\\' => "\\5c",
                '*' => "\\2a",
                '(' => "\\28",
                ')' => "\\29",
                '\0' => "\\00",
                _ => ch.ToString()
            });
        }

        return builder.ToString();
    }
}
