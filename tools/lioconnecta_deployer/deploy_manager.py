from __future__ import annotations

import shlex
import shutil
import subprocess
import tarfile
import time
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Callable, Iterable

from .models import AppConfig, EnvironmentConfig


LogCallback = Callable[[str], None]
APP_ROOT = Path(__file__).resolve().parents[2]


class DeployManager:
    def __init__(self, logger: LogCallback) -> None:
        self.logger = logger

    def _log(self, message: str) -> None:
        self.logger(message)

    def _ensure_tool(self, *candidates: str) -> str:
        for candidate in candidates:
            path = shutil.which(candidate)
            if path:
                return path
        raise RuntimeError(
            f"Ferramenta não encontrada. Esperado um destes comandos: {', '.join(candidates)}"
        )

    def _run(
        self,
        command: Iterable[str],
        *,
        cwd: str | None = None,
        env: dict | None = None,
        display_command: str | None = None,
    ) -> None:
        resolved_command = list(command)
        self._log(f"$ {display_command or ' '.join(resolved_command)}")
        process = subprocess.Popen(
            resolved_command,
            cwd=cwd,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )

        assert process.stdout is not None
        for line in process.stdout:
            self._log(line.rstrip())

        exit_code = process.wait()
        if exit_code != 0:
            raise RuntimeError(
                f"Comando falhou com código {exit_code}: {display_command or ' '.join(resolved_command)}"
            )

    def validate_environment(self, config: AppConfig, environment_name: str) -> None:
        general = config.general
        env = config.environments[environment_name]

        self._log(f"Validando ambiente {environment_name}...")
        self._ensure_tool("git")
        self._ensure_tool("dotnet")
        self._ensure_tool("powershell")

        if general.run_frontend_tests:
            self._ensure_tool("node")
            self._ensure_tool("npm")

        self._validate_paths(general)
        self._validate_remote_access(env)
        self._validate_remote_probe(env)
        self._log("Validação concluída com sucesso.")

    def sync_repository(self, config: AppConfig, environment_name: str) -> Path:
        general = config.general
        env = config.environments[environment_name]
        repo_path = Path(general.local_repo_path)
        repo_path.parent.mkdir(parents=True, exist_ok=True)

        git_executable = self._ensure_tool("git")

        if not (repo_path / ".git").exists():
            self._log(f"Clonando repositório em {repo_path}...")
            self._run([git_executable, "clone", general.repository_url, str(repo_path)])
        else:
            self._log(f"Repositório já existe em {repo_path}. Atualizando conteúdo...")

        self._run([git_executable, "-C", str(repo_path), "fetch", "--all", "--prune"])
        self._run([git_executable, "-C", str(repo_path), "checkout", env.branch])
        self._run([git_executable, "-C", str(repo_path), "pull", "origin", env.branch])
        return repo_path

    def build_and_package(self, config: AppConfig, environment_name: str) -> Path:
        general = config.general
        repo_path = Path(general.local_repo_path)
        if not repo_path.exists():
            raise RuntimeError(
                "Repositório local não encontrado. Execute a sincronização primeiro."
            )

        artifact_root = Path(general.artifact_root)
        package_output = artifact_root / environment_name.lower()
        if package_output.exists():
            shutil.rmtree(package_output)
        package_output.mkdir(parents=True, exist_ok=True)

        dotnet_executable = self._ensure_tool("dotnet")
        api_project_path = self._resolve_repo_path(repo_path, general.api_project_path)
        api_test_project_path = self._resolve_repo_path(repo_path, general.api_test_project_path)
        frontend_root_path = self._resolve_repo_path(repo_path, general.frontend_root_path)
        package_script_path = self._resolve_repo_path(repo_path, general.package_script_path)

        self._log("Restaurando dependências da API...")
        self._run([dotnet_executable, "restore", str(api_project_path)])

        if general.run_api_tests:
            self._log("Restaurando dependências do projeto de testes da API...")
            self._run([dotnet_executable, "restore", str(api_test_project_path)])

        if general.run_api_tests:
            self._log("Executando testes da API...")
            self._run(
                [
                    dotnet_executable,
                    "test",
                    str(api_test_project_path),
                    "--configuration",
                    "Release",
                    "--no-restore",
                ],
                cwd=str(repo_path),
            )

        if general.run_frontend_tests:
            self._log("Executando testes do frontend...")
            self._run(["cmd", "/c", "npm", "test"], cwd=str(frontend_root_path))

        self._log("Gerando pacote de deploy...")
        self._run(
            [
                self._ensure_tool("powershell"),
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                str(package_script_path),
                "-Configuration",
                "Release",
                "-OutputRoot",
                str(package_output),
            ],
            cwd=str(repo_path),
        )

        return package_output

    def deploy_environment(self, config: AppConfig, environment_name: str) -> None:
        env = config.environments[environment_name]
        package_output = Path(config.general.artifact_root) / environment_name.lower()
        if not package_output.exists():
            raise RuntimeError(
                "Pacote não encontrado. Gere o pacote antes de fazer o deploy."
            )

        self._log(f"Iniciando deploy do ambiente {environment_name}...")
        archive_path = (
            package_output.parent
            / f"lioconnecta-{environment_name.lower()}-{datetime.now().strftime('%Y%m%d%H%M%S')}.tar.gz"
        )
        self._create_archive(package_output, archive_path)
        self._upload_archive(env, archive_path)
        self._run_remote_deploy(env, archive_path.name)
        self._run_health_checks(env)
        self._log("Deploy concluído com sucesso.")

    def full_deploy(self, config: AppConfig, environment_name: str) -> None:
        self._log(f"Iniciando pipeline completo do ambiente {environment_name}...")
        self.validate_environment(config, environment_name)
        self.sync_repository(config, environment_name)
        self.build_and_package(config, environment_name)
        self.deploy_environment(config, environment_name)
        self._log(f"Pipeline completo do ambiente {environment_name} finalizado.")

    def _validate_paths(self, general) -> None:
        expected_paths = [
            self._resolve_local_path(general.api_project_path),
            self._resolve_local_path(general.api_test_project_path),
            self._resolve_local_path(general.frontend_root_path),
            self._resolve_local_path(general.package_script_path),
        ]
        for path in expected_paths:
            if not path.exists():
                raise RuntimeError(f"Caminho esperado não encontrado: {path}")

    def _resolve_local_path(self, configured_path: str) -> Path:
        path = Path(configured_path)
        if path.is_absolute():
            return path
        return APP_ROOT / path

    def _resolve_repo_path(self, repo_path: Path, configured_path: str) -> Path:
        path = Path(configured_path)
        if not path.is_absolute():
            return repo_path / path

        try:
            relative = path.relative_to(APP_ROOT)
            return repo_path / relative
        except ValueError:
            return path

    def _validate_remote_access(self, env: EnvironmentConfig) -> None:
        if not env.host or not env.username:
            raise RuntimeError("Host e usuário do ambiente são obrigatórios.")
        if env.auth_mode == "password" and not env.password:
            raise RuntimeError("Senha do ambiente não informada.")
        if env.auth_mode == "key" and not env.ssh_key_path:
            raise RuntimeError("Caminho da chave SSH não informado.")
        if not env.deploy_path:
            raise RuntimeError("Diretório remoto de deploy não informado.")
        if not env.api_service:
            raise RuntimeError("Nome do serviço da API não informado.")

    def _validate_remote_probe(self, env: EnvironmentConfig) -> None:
        self._log("Testando conexão remota...")
        remote_command = "echo connected && hostname && whoami"
        self._run_remote_command(env, remote_command)

    def _append_putty_hostkey(self, command: list[str], env: EnvironmentConfig) -> list[str]:
        fingerprint = env.host_key_fingerprint.strip()
        if fingerprint:
            command.extend(["-hostkey", fingerprint])
        return command

    @staticmethod
    def _mask_secret(value: str) -> str:
        return "********" if value else value

    def _build_service_restart_command(self, env: EnvironmentConfig) -> str:
        service_name = shlex.quote(env.api_service)
        if env.auth_mode == "password":
            password = shlex.quote(env.password)
            return f"echo {password} | sudo -S -p '' systemctl restart {service_name}"
        return f"sudo systemctl restart {service_name}"

    def _create_archive(self, source_dir: Path, archive_path: Path) -> None:
        if archive_path.exists():
            archive_path.unlink()

        self._log(f"Compactando release em {archive_path}...")
        with tarfile.open(archive_path, "w:gz") as tar:
            tar.add(source_dir, arcname=".")

    def _upload_archive(self, env: EnvironmentConfig, archive_path: Path) -> None:
        remote_archive = f"/tmp/{archive_path.name}"
        self._log(f"Enviando pacote para {env.host}:{remote_archive}...")

        if env.auth_mode == "password":
            pscp_executable = self._ensure_tool("pscp")
            command = self._append_putty_hostkey(
                [
                    pscp_executable,
                    "-P",
                    str(env.port),
                    "-pw",
                    env.password,
                ],
                env,
            )
            command.extend([str(archive_path), f"{env.username}@{env.host}:{remote_archive}"])
            display_command = " ".join(
                self._append_putty_hostkey(
                    [
                        pscp_executable,
                        "-P",
                        str(env.port),
                        "-pw",
                        self._mask_secret(env.password),
                    ],
                    env,
                )
                + [str(archive_path), f"{env.username}@{env.host}:{remote_archive}"]
            )
            self._run(command, display_command=display_command)
            return

        scp_executable = self._ensure_tool("scp")
        command = [
            scp_executable,
            "-P",
            str(env.port),
            "-i",
            env.ssh_key_path,
        ]
        if not env.strict_host_key_checking:
            command.extend(["-o", "StrictHostKeyChecking=no"])
        command.extend([str(archive_path), f"{env.username}@{env.host}:{remote_archive}"])
        self._run(command)

    def _run_remote_deploy(self, env: EnvironmentConfig, archive_name: str) -> None:
        release_id = datetime.now().strftime("%Y%m%d%H%M%S")
        deploy_path = env.deploy_path.rstrip("/")
        release_dir = f"{deploy_path}/releases/{release_id}"
        current_dir = f"{deploy_path}/current"
        remote_archive = f"/tmp/{archive_name}"

        commands = [
            "set -e",
            f"mkdir -p {shlex.quote(deploy_path)}/releases",
            f"rm -rf {shlex.quote(release_dir)}",
            f"mkdir -p {shlex.quote(release_dir)}",
            f"tar -xzf {shlex.quote(remote_archive)} -C {shlex.quote(release_dir)}",
            f"ln -sfn {shlex.quote(release_dir)} {shlex.quote(current_dir)}",
        ]

        if env.frontend_target_path:
            target = env.frontend_target_path.rstrip("/")
            commands.extend(
                [
                    f"mkdir -p {shlex.quote(target)}",
                    f"find {shlex.quote(target)} -mindepth 1 -maxdepth 1 -exec rm -rf {{}} +",
                    f"cp -R {shlex.quote(release_dir + '/frontend/.')} {shlex.quote(target)}",
                ]
            )

        commands.extend(
            [
                self._build_service_restart_command(env),
                f"rm -f {shlex.quote(remote_archive)}",
            ]
        )

        if env.post_deploy_command.strip():
            commands.append(env.post_deploy_command.strip())

        remote_command = "; ".join(commands)
        self._log("Executando deploy remoto...")
        self._run_remote_command(env, remote_command)

    def _run_remote_command(self, env: EnvironmentConfig, remote_command: str) -> None:
        if env.auth_mode == "password":
            plink_executable = self._ensure_tool("plink")
            command = self._append_putty_hostkey(
                [
                    plink_executable,
                    "-batch",
                    "-P",
                    str(env.port),
                    "-l",
                    env.username,
                    "-pw",
                    env.password,
                ],
                env,
            )
            command.extend([env.host, remote_command])
            display_command = " ".join(
                self._append_putty_hostkey(
                    [
                        plink_executable,
                        "-batch",
                        "-P",
                        str(env.port),
                        "-l",
                        env.username,
                        "-pw",
                        self._mask_secret(env.password),
                    ],
                    env,
                )
                + [env.host, remote_command.replace(env.password, self._mask_secret(env.password))]
            )
            self._run(command, display_command=display_command)
            return

        ssh_executable = self._ensure_tool("ssh")
        command = [
            ssh_executable,
            "-p",
            str(env.port),
            "-i",
            env.ssh_key_path,
        ]
        if not env.strict_host_key_checking:
            command.extend(["-o", "StrictHostKeyChecking=no"])
        command.extend([f"{env.username}@{env.host}", remote_command])
        self._run(command)

    def _run_health_checks(self, env: EnvironmentConfig) -> None:
        if env.frontend_health_url:
            self._log(f"Validando frontend em {env.frontend_health_url}...")
            self._http_check(env.frontend_health_url)

        if env.api_health_url:
            self._log(f"Validando API em {env.api_health_url}...")
            self._http_check(env.api_health_url)

    def _http_check(self, url: str) -> None:
        request = urllib.request.Request(
            url,
            headers={"User-Agent": "LioConnecta-Deploy-GUI"},
        )
        last_error: Exception | None = None

        for attempt in range(1, 7):
            try:
                with urllib.request.urlopen(request, timeout=20) as response:
                    if response.status >= 400:
                        raise RuntimeError(f"Health check falhou em {url}: HTTP {response.status}")

                    self._log(f"Health check OK: {url} ({response.status})")
                    return
            except Exception as exc:  # noqa: BLE001 - surfaced after retries in GUI
                last_error = exc
                if attempt == 6:
                    break

                self._log(
                    f"Tentativa {attempt}/6 falhou para {url}. Aguardando 5s antes de tentar novamente..."
                )
                time.sleep(5)

        raise RuntimeError(str(last_error) if last_error else f"Health check falhou em {url}")
