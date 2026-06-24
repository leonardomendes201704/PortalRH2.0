# Provisionamento PRD - LIOCONNECTA

Documento inicial do ambiente PRD preparado em 24/06/2026.

## Servidor

- Ambiente: PRD
- Host: `10.0.0.88`
- Hostname: `svr-dev-prod.liotecnica.com.br`
- Sistema operacional: Ubuntu 24.04.4 LTS
- Usuario SSH temporario: `administrator`
- Senha SSH temporaria: `Liotec@2026`
- Fingerprint SSH: `SHA256:9M9YMjH7ECX00M9XhetBNVUhn4OBQvbVFvEdNJYqoVA`

## Portas

- Frontend: `3020`
- API: `3030`
- PostgreSQL: `5432` local no servidor
- SSH: `22`

## Banco de dados

- Engine: PostgreSQL 16
- Database: `lioconnecta_prd`
- Usuario da aplicacao: `lioconnecta_prd_app`
- Senha temporaria da aplicacao: `LioPrd_2026_N8vQ4xZr`
- Connection string configurada em: `/etc/lioconnecta/lioconnecta-api-prd.env`

## Arquivos e diretorios

- Releases: `/home/administrator/lioconnecta/prd/releases`
- Symlink atual: `/home/administrator/lioconnecta/prd/current`
- Frontend publicado: `/var/www/lioconnecta-prd`
- Environment file da API: `/etc/lioconnecta/lioconnecta-api-prd.env`
- Systemd service da API: `/etc/systemd/system/lioconnecta-api-prd.service`
- Nginx site: `/etc/nginx/sites-available/lioconnecta-prd`

## Servicos

- API systemd: `lioconnecta-api-prd`
- Frontend: servido pelo Nginx em `http://10.0.0.88:3020/`
- API health apos deploy: `http://10.0.0.88:3030/api/health`

## LDAP

O servidor PRD consegue resolver e acessar o LDAP corporativo:

- Server: `dc-virtual-02.liotecnica.com.br`
- Port: `389`
- Base DN: `DC=liotecnica,DC=com,DC=br`
- User Search Base: `OU=Departamentos,DC=liotecnica,DC=com,DC=br`
- NetBIOS Domain: `LIOTECNICA`

Tambem foi aplicada compatibilidade de runtime OpenLDAP para Ubuntu 24.04:

- `/usr/lib/x86_64-linux-gnu/libldap-2.5.so.0`
- `/usr/lib/x86_64-linux-gnu/liblber-2.5.so.0`

Esses symlinks apontam para as bibliotecas OpenLDAP 2.6 do sistema e tambem sao reaplicados automaticamente pelo deployer.

## Configuracao sugerida na GUI de deploy

- Ambiente ativo: `PRD`
- Branch: `Lioconnecta_PRD`
- Host: `10.0.0.88`
- Porta SSH: `22`
- Usuario: `administrator`
- Modo: `password`
- Senha: `Liotec@2026`
- Host key fingerprint: `SHA256:9M9YMjH7ECX00M9XhetBNVUhn4OBQvbVFvEdNJYqoVA`
- Pasta base remota do deploy: `/home/administrator/lioconnecta/prd`
- Destino final do frontend: `/var/www/lioconnecta-prd`
- Servico systemd da API: `lioconnecta-api-prd`
- Health URL frontend: `http://10.0.0.88:3020/`
- Health URL API: `http://10.0.0.88:3030/api/health`

## Status atual

- [x] Runtime ASP.NET Core 8 instalado
- [x] PostgreSQL instalado
- [x] Banco PRD criado
- [x] Usuario de banco da aplicacao criado
- [x] Nginx configurado na porta `3020`
- [x] Systemd service da API criado e habilitado
- [x] Compatibilidade OpenLDAP aplicada
- [x] Configuracao local da GUI preenchida para PRD
- [ ] Primeiro deploy da branch `Lioconnecta_PRD`
- [ ] Validacao do login admin no PRD
- [ ] Validacao do login LDAP no PRD

## Observacoes

- O servico `lioconnecta-api-prd` fica habilitado, mas so iniciara com sucesso apos o primeiro deploy publicar a pasta `api` em `/home/administrator/lioconnecta/prd/current/api`.
- Durante a configuracao do Nginx, foi encontrado um site pre-existente `peopleanalytics.conf` habilitado com certificado ausente em `/etc/letsencrypt/live/peopleanalytics.liotecnica.com.br/fullchain.pem`.
- Para permitir `nginx -t` e subir o frontend PRD, foi removido apenas o symlink `/etc/nginx/sites-enabled/peopleanalytics.conf`. O arquivo original em `/etc/nginx/sites-available/peopleanalytics.conf` foi preservado.
- As credenciais temporarias devem ser rotacionadas depois do provisionamento definitivo.
- A branch `Lioconnecta_PRD` precisa receber/promover as alteracoes desejadas antes do primeiro deploy PRD.
