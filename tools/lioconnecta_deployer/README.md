# LIOCONNECTA Deploy Manager

Ferramenta GUI local em Python para operar deploy da LIOCONNECTA nos ambientes:

- DEV
- HML
- PRD

## O que ela faz

1. salva a configuração localmente
2. sincroniza o código do Git pela branch do ambiente
3. executa restore, testes, build e empacotamento
4. envia o pacote para o servidor
5. aplica a release remota
6. reinicia o serviço da API
7. valida URLs de saúde do frontend e da API

## Como executar

Pelo `.bat` na raiz:

- `start-lioconnecta-deployer.bat`

Ou por Python:

```powershell
python -m tools.lioconnecta_deployer.main
```

## Onde a configuração fica salva

Arquivo local:

- `tools/lioconnecta_deployer/config/deployer-config.json`

Esse arquivo fica fora do Git para não subir credenciais acidentalmente.

## Requisitos da máquina local

- Python 3 com Tkinter
- Git
- .NET 8 SDK
- PowerShell
- Node.js + npm

### Para deploy remoto

#### Com senha

- `plink.exe`
- `pscp.exe`

#### Com chave SSH

- `ssh`
- `scp`

## Requisitos no servidor

- acesso SSH
- `tar`
- `systemctl`
- serviço da API previamente configurado

## Observações

- A senha pode ser salva localmente no JSON da ferramenta. Para produção, prefira chave SSH dedicada.
- Em autenticação por senha com `plink/pscp`, informe o campo `Fingerprint do host SSH` para permitir a primeira conexão em modo batch sem depender do cache do PuTTY.
- O campo `Destino final do frontend no servidor` é opcional, mas recomendado quando o frontend for servido por `nginx` ou pasta estática dedicada.
- O campo `Comando remoto pós-deploy` serve para cenários como `nginx -s reload`, limpeza de cache ou outros acertos do servidor.
- No primeiro deploy, a ferramenta cria automaticamente a pasta base remota do deploy, a subpasta `releases` e também o destino do frontend, se ele tiver sido preenchido.
