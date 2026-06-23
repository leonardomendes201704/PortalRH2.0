# Provisionamento HML - LIOCONNECTA

Documento inicial do ambiente HML preparado em 23/06/2026.

## Servidor

- Ambiente: HML
- Host: `10.0.0.80`
- Sistema operacional: Ubuntu 24.04.4 LTS
- Usuario SSH temporario: `administrator`
- Senha SSH temporaria: `Liotec@2026`
- Fingerprint SSH: `SHA256:DNala8+JpTOmamOs9Kk2XoFiUUMS0bg11uHomtsMjvs`

## Portas

- Frontend: `3020`
- API: `3030`
- PostgreSQL: `5432` local no servidor
- SSH: `22`

## Banco de dados

- Engine: PostgreSQL 16
- Database: `lioconnecta_hml`
- Usuario da aplicacao: `lioconnecta_hml_app`
- Senha temporaria da aplicacao: `LioHml_2026_N8vQ4xZr`
- Connection string configurada em: `/etc/lioconnecta/lioconnecta-api-hml.env`

## Arquivos e diretorios

- Releases: `/home/administrator/lioconnecta/hml/releases`
- Symlink atual: `/home/administrator/lioconnecta/hml/current`
- Frontend publicado: `/var/www/lioconnecta-hml`
- Environment file da API: `/etc/lioconnecta/lioconnecta-api-hml.env`
- Systemd service da API: `/etc/systemd/system/lioconnecta-api-hml.service`
- Nginx site: `/etc/nginx/sites-available/lioconnecta-hml`

## Servicos

- API systemd: `lioconnecta-api-hml`
- Frontend: servido pelo Nginx em `http://10.0.0.80:3020/`
- API health apos deploy: `http://10.0.0.80:3030/api/health`

## LDAP

O servidor HML consegue resolver e acessar o LDAP corporativo:

- Server: `dc-virtual-02.liotecnica.com.br`
- Port: `389`
- Base DN: `DC=liotecnica,DC=com,DC=br`
- User Search Base: `OU=Departamentos,DC=liotecnica,DC=com,DC=br`
- NetBIOS Domain: `LIOTECNICA`

Tambem foi aplicada compatibilidade de runtime OpenLDAP para Ubuntu 24.04:

- `/usr/lib/x86_64-linux-gnu/libldap-2.5.so.0`
- `/usr/lib/x86_64-linux-gnu/liblber-2.5.so.0`

Esses symlinks apontam para as bibliotecas OpenLDAP 2.6 do sistema e tambem foram adicionados ao deployer para reaplicacao automatica durante deploy.

## Configuracao sugerida na GUI de deploy

- Ambiente ativo: `HML`
- Branch: `Lioconnecta_HML`
- Host: `10.0.0.80`
- Porta SSH: `22`
- Usuario: `administrator`
- Modo: `password`
- Senha: `Liotec@2026`
- Host key fingerprint: `SHA256:DNala8+JpTOmamOs9Kk2XoFiUUMS0bg11uHomtsMjvs`
- Pasta base remota do deploy: `/home/administrator/lioconnecta/hml`
- Destino final do frontend: `/var/www/lioconnecta-hml`
- Servico systemd da API: `lioconnecta-api-hml`
- Health URL frontend: `http://10.0.0.80:3020/`
- Health URL API: `http://10.0.0.80:3030/api/health`

## Status atual

- [x] Runtime ASP.NET Core 8 instalado
- [x] PostgreSQL instalado
- [x] Banco HML criado
- [x] Usuario de banco da aplicacao criado
- [x] Nginx configurado na porta `3020`
- [x] Systemd service da API criado e habilitado
- [x] Compatibilidade OpenLDAP aplicada
- [x] Configuracao local da GUI preenchida para HML
- [ ] Primeiro deploy da branch `Lioconnecta_HML`
- [ ] Validacao do login admin no HML
- [ ] Validacao do login LDAP no HML

## Observacoes

- O servico `lioconnecta-api-hml` fica habilitado, mas so iniciara com sucesso apos o primeiro deploy publicar a pasta `api` em `/home/administrator/lioconnecta/hml/current/api`.
- As credenciais temporarias devem ser rotacionadas depois do provisionamento definitivo.
- A branch `Lioconnecta_HML` precisa receber/promover as alteracoes desejadas antes do primeiro deploy HML.
