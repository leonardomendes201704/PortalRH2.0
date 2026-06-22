from __future__ import annotations

import queue
import threading
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

from .deploy_manager import DeployManager
from .models import AppConfig
from .storage import CONFIG_FILE, load_config, save_config


class DeployGui(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("LIOCONNECTA Deploy Manager")
        self.geometry("1320x920")
        self.minsize(1180, 860)

        self.log_queue: queue.Queue[str] = queue.Queue()
        self.worker_thread: threading.Thread | None = None

        self.config_model = load_config()
        self.general_vars: dict[str, tk.Variable] = {}
        self.environment_vars: dict[str, dict[str, tk.Variable]] = {}
        self.last_result_message: str = ""
        self.last_result_success: bool = False

        self._build_ui()
        self._hydrate_form()
        self.after(150, self._flush_logs)

    def _build_ui(self) -> None:
        self.columnconfigure(0, weight=1)
        self.rowconfigure(1, weight=1)

        header = ttk.Frame(self, padding=(18, 18, 18, 10))
        header.grid(row=0, column=0, sticky="ew")
        header.columnconfigure(1, weight=1)

        ttk.Label(
            header,
            text="LIOCONNECTA Deploy Manager",
            font=("Segoe UI", 18, "bold"),
        ).grid(row=0, column=0, sticky="w")
        ttk.Label(
            header,
            text="Configure DEV / HML / PRD uma vez e execute sync, build, deploy e validação pela GUI.",
        ).grid(row=1, column=0, sticky="w", pady=(4, 0))
        ttk.Label(
            header,
            text=f"Config salva em: {CONFIG_FILE}",
            foreground="#5e7a9a",
        ).grid(row=2, column=0, sticky="w", pady=(6, 0))

        main = ttk.Panedwindow(self, orient=tk.HORIZONTAL)
        main.grid(row=1, column=0, sticky="nsew", padx=18, pady=(0, 18))

        left = ttk.Frame(main, padding=(0, 0, 12, 0))
        right = ttk.Frame(main)
        main.add(left, weight=3)
        main.add(right, weight=2)

        left.columnconfigure(0, weight=1)
        left.rowconfigure(1, weight=1)
        right.columnconfigure(0, weight=1)
        right.rowconfigure(2, weight=1)

        actions = ttk.Frame(left)
        actions.grid(row=0, column=0, sticky="ew", pady=(0, 12))
        actions.columnconfigure(7, weight=1)

        self.environment_choice = tk.StringVar(value="DEV")
        ttk.Label(actions, text="Ambiente ativo").grid(
            row=0, column=0, sticky="w", padx=(0, 8)
        )
        ttk.Combobox(
            actions,
            textvariable=self.environment_choice,
            values=["DEV", "HML", "PRD"],
            state="readonly",
            width=8,
        ).grid(row=0, column=1, sticky="w")

        ttk.Button(
            actions,
            text="Salvar configuração",
            command=self.save_current_config,
        ).grid(row=0, column=2, padx=(12, 6))
        ttk.Button(
            actions,
            text="Validar ambiente",
            command=lambda: self.run_action(self._validate_selected),
        ).grid(row=0, column=3, padx=6)
        ttk.Button(
            actions,
            text="Sincronizar código",
            command=lambda: self.run_action(self._sync_selected),
        ).grid(row=0, column=4, padx=6)
        ttk.Button(
            actions,
            text="Gerar pacote",
            command=lambda: self.run_action(self._package_selected),
        ).grid(row=0, column=5, padx=6)
        ttk.Button(
            actions,
            text="Deploy completo",
            command=lambda: self.run_action(self._deploy_selected),
        ).grid(row=0, column=6, padx=6)

        self.status_var = tk.StringVar(value="Pronto.")
        ttk.Label(actions, textvariable=self.status_var, foreground="#0f3f75").grid(
            row=0, column=7, sticky="e"
        )

        notebook = ttk.Notebook(left)
        notebook.grid(row=1, column=0, sticky="nsew")
        self._build_general_tab(notebook)
        for env_name in ("DEV", "HML", "PRD"):
            self._build_environment_tab(notebook, env_name)

        ttk.Label(
            right,
            text="Log operacional",
            font=("Segoe UI", 13, "bold"),
        ).grid(row=0, column=0, sticky="w", pady=(0, 8))

        ttk.Label(
            right,
            text="Dica: senha e SSH key podem ficar salvas na configuração local. Para produção, prefira chave SSH dedicada.",
            wraplength=420,
            foreground="#5e7a9a",
        ).grid(row=1, column=0, sticky="ew", pady=(0, 10))

        self.log_widget = tk.Text(
            right,
            wrap="word",
            state="disabled",
            background="#07182d",
            foreground="#dcecff",
            font=("Consolas", 10),
        )
        self.log_widget.grid(row=2, column=0, sticky="nsew")

    def _build_general_tab(self, notebook: ttk.Notebook) -> None:
        frame = ttk.Frame(notebook, padding=16)
        frame.columnconfigure(1, weight=1)
        notebook.add(frame, text="Geral")

        fields = [
            ("repository_url", "URL do Git"),
            ("local_repo_path", "Pasta local do código"),
            ("api_project_path", "Projeto da API (.csproj)"),
            ("api_test_project_path", "Projeto de testes da API"),
            ("frontend_root_path", "Pasta do frontend"),
            ("package_script_path", "Script de empacotamento (.ps1)"),
            ("artifact_root", "Pasta dos artefatos"),
        ]

        for row, (key, label) in enumerate(fields):
            ttk.Label(frame, text=label).grid(
                row=row,
                column=0,
                sticky="w",
                pady=6,
                padx=(0, 12),
            )
            self.general_vars[key] = tk.StringVar()
            ttk.Entry(frame, textvariable=self.general_vars[key]).grid(
                row=row,
                column=1,
                sticky="ew",
                pady=6,
            )

            if key in {"local_repo_path", "frontend_root_path", "artifact_root"}:
                ttk.Button(
                    frame,
                    text="...",
                    width=3,
                    command=lambda current_key=key: self._pick_path(
                        self.general_vars[current_key]
                    ),
                ).grid(row=row, column=2, padx=(8, 0))
            elif key in {
                "api_project_path",
                "api_test_project_path",
                "package_script_path",
            }:
                ttk.Button(
                    frame,
                    text="...",
                    width=3,
                    command=lambda current_key=key: self._pick_file(
                        self.general_vars[current_key]
                    ),
                ).grid(row=row, column=2, padx=(8, 0))

        self.general_vars["run_api_tests"] = tk.BooleanVar()
        self.general_vars["run_frontend_tests"] = tk.BooleanVar()
        ttk.Checkbutton(
            frame,
            text="Executar testes da API antes do deploy",
            variable=self.general_vars["run_api_tests"],
        ).grid(row=len(fields), column=0, columnspan=2, sticky="w", pady=(16, 6))
        ttk.Checkbutton(
            frame,
            text="Executar testes do frontend antes do deploy",
            variable=self.general_vars["run_frontend_tests"],
        ).grid(row=len(fields) + 1, column=0, columnspan=2, sticky="w", pady=6)

    def _build_environment_tab(self, notebook: ttk.Notebook, env_name: str) -> None:
        frame = ttk.Frame(notebook, padding=16)
        frame.columnconfigure(1, weight=1)
        frame.columnconfigure(3, weight=1)
        notebook.add(frame, text=env_name)

        env_vars: dict[str, tk.Variable] = {
            "branch": tk.StringVar(),
            "host": tk.StringVar(),
            "port": tk.IntVar(),
            "username": tk.StringVar(),
            "auth_mode": tk.StringVar(),
            "password": tk.StringVar(),
            "ssh_key_path": tk.StringVar(),
            "host_key_fingerprint": tk.StringVar(),
            "strict_host_key_checking": tk.BooleanVar(),
            "deploy_path": tk.StringVar(),
            "frontend_target_path": tk.StringVar(),
            "api_service": tk.StringVar(),
            "frontend_health_url": tk.StringVar(),
            "api_health_url": tk.StringVar(),
            "post_deploy_command": tk.StringVar(),
        }
        self.environment_vars[env_name] = env_vars

        layout = [
            ("branch", "Branch", 0, 0),
            ("host", "Host", 0, 2),
            ("port", "Porta SSH", 1, 0),
            ("username", "Usuário", 1, 2),
            ("auth_mode", "Modo de autenticação", 2, 0),
            ("password", "Senha", 2, 2),
            ("ssh_key_path", "Caminho da chave SSH", 3, 0),
            ("host_key_fingerprint", "Fingerprint do host SSH", 3, 2),
            ("deploy_path", "Pasta base remota do deploy", 4, 0),
            ("frontend_target_path", "Destino final do frontend no servidor", 5, 0),
            ("api_service", "Serviço systemd da API", 6, 0),
            ("frontend_health_url", "Health/URL do frontend", 7, 0),
            ("api_health_url", "Health/URL da API", 7, 2),
            ("post_deploy_command", "Comando remoto pós-deploy (opcional)", 8, 0),
        ]

        for key, label, row, column in layout:
            ttk.Label(frame, text=label).grid(
                row=row,
                column=column,
                sticky="w",
                pady=6,
                padx=(0, 12),
            )
            variable = env_vars[key]
            if key == "auth_mode":
                ttk.Combobox(
                    frame,
                    textvariable=variable,
                    values=["password", "key"],
                    state="readonly",
                ).grid(row=row, column=column + 1, sticky="ew", pady=6)
            elif key == "password":
                ttk.Entry(frame, textvariable=variable, show="*").grid(
                    row=row,
                    column=column + 1,
                    sticky="ew",
                    pady=6,
                )
            else:
                ttk.Entry(frame, textvariable=variable).grid(
                    row=row,
                    column=column + 1,
                    sticky="ew",
                    pady=6,
                )
                if key == "ssh_key_path":
                    ttk.Button(
                        frame,
                        text="...",
                        width=3,
                        command=lambda current_key=key, current_env=env_name: self._pick_file(
                            self.environment_vars[current_env][current_key]
                        ),
                    ).grid(row=row, column=column + 2, padx=(8, 0))

        ttk.Checkbutton(
            frame,
            text="Exigir host key checking",
            variable=env_vars["strict_host_key_checking"],
        ).grid(row=9, column=0, columnspan=2, sticky="w", pady=(16, 6))

        ttk.Label(
            frame,
            text="Dica: em autenticação por senha com PuTTY/Plink, informe o fingerprint para a primeira conexão em modo batch.",
            foreground="#5e7a9a",
            wraplength=780,
        ).grid(row=10, column=0, columnspan=4, sticky="w", pady=(4, 0))

    @staticmethod
    def _default_frontend_health_url(host: str) -> str:
        normalized_host = (host or "").strip() or "localhost"
        return f"http://{normalized_host}:3020/"

    @staticmethod
    def _default_api_health_url(host: str) -> str:
        normalized_host = (host or "").strip() or "localhost"
        return f"http://{normalized_host}:3030/api/health"

    def _hydrate_form(self) -> None:
        general = self.config_model.general
        for key, variable in self.general_vars.items():
            variable.set(getattr(general, key))

        for env_name, variables in self.environment_vars.items():
            env = self.config_model.environments[env_name]
            for key, variable in variables.items():
                variable.set(getattr(env, key))

            host = variables["host"].get()
            if not variables["frontend_health_url"].get().strip():
                variables["frontend_health_url"].set(
                    self._default_frontend_health_url(host)
                )
            if not variables["api_health_url"].get().strip():
                variables["api_health_url"].set(
                    self._default_api_health_url(host)
                )

    def _build_model_from_form(self) -> AppConfig:
        config = AppConfig.from_dict(self.config_model.to_dict())
        for key, variable in self.general_vars.items():
            setattr(config.general, key, variable.get())

        for env_name, variables in self.environment_vars.items():
            env = config.environments[env_name]
            host_value = variables["host"].get()
            for key, variable in variables.items():
                value = variable.get()
                if key == "port":
                    value = int(value or 22)
                elif key == "frontend_health_url" and not str(value).strip():
                    value = self._default_frontend_health_url(host_value)
                elif key == "api_health_url" and not str(value).strip():
                    value = self._default_api_health_url(host_value)
                setattr(env, key, value)

        return config

    def save_current_config(self) -> None:
        self.config_model = self._build_model_from_form()
        path = save_config(self.config_model)
        self.status_var.set("Configuração salva.")
        self._append_log(f"Configuração salva em {path}")

    def run_action(self, callback) -> None:
        if self.worker_thread and self.worker_thread.is_alive():
            messagebox.showinfo(
                "Operação em andamento",
                "Já existe uma operação em execução. Aguarde terminar.",
            )
            return

        self.save_current_config()
        action_name = self._describe_callback(callback)
        self.last_result_message = ""
        self.last_result_success = False
        self.status_var.set(f"Executando: {action_name}...")
        self._append_log(f"--- {action_name} iniciado ---")
        self.worker_thread = threading.Thread(
            target=self._execute_callback,
            args=(callback, action_name),
            daemon=True,
        )
        self.worker_thread.start()

    def _execute_callback(self, callback, action_name: str) -> None:
        try:
            callback()
            self.log_queue.put(f"__RESULT__::success::{action_name} concluído com sucesso.")
        except Exception as exc:
            self.log_queue.put(f"ERRO: {exc}")
            self.log_queue.put(f"__RESULT__::error::{action_name} finalizado com erro. Verifique o log.")

    def _validate_selected(self) -> None:
        DeployManager(self._append_log).validate_environment(
            self.config_model,
            self.environment_choice.get(),
        )

    def _sync_selected(self) -> None:
        repo_path = DeployManager(self._append_log).sync_repository(
            self.config_model,
            self.environment_choice.get(),
        )
        self._append_log(f"Repositório sincronizado em {repo_path}")

    def _package_selected(self) -> None:
        package_dir = DeployManager(self._append_log).build_and_package(
            self.config_model,
            self.environment_choice.get(),
        )
        self._append_log(f"Pacote gerado em {package_dir}")

    def _deploy_selected(self) -> None:
        DeployManager(self._append_log).full_deploy(
            self.config_model,
            self.environment_choice.get(),
        )

    def _append_log(self, message: str) -> None:
        self.log_queue.put(message)

    def _flush_logs(self) -> None:
        while not self.log_queue.empty():
            message = self.log_queue.get()
            if message.startswith("__RESULT__::"):
                _, status, text = message.split("::", 2)
                self.last_result_message = text
                self.last_result_success = status == "success"
                self.status_var.set(text)
                if self.last_result_success:
                    messagebox.showinfo("LIOCONNECTA Deploy Manager", text)
                else:
                    messagebox.showerror("LIOCONNECTA Deploy Manager", text)
                continue
            self.log_widget.configure(state="normal")
            self.log_widget.insert("end", f"{message}\n")
            self.log_widget.see("end")
            self.log_widget.configure(state="disabled")

        self.after(150, self._flush_logs)

    @staticmethod
    def _describe_callback(callback) -> str:
        names = {
            "_validate_selected": "Validação do ambiente",
            "_sync_selected": "Sincronização do código",
            "_package_selected": "Geração do pacote",
            "_deploy_selected": "Deploy completo",
        }
        return names.get(getattr(callback, "__name__", ""), "Operação")

    def _pick_path(self, variable: tk.Variable) -> None:
        current = variable.get()
        selected = filedialog.askdirectory(initialdir=current or None)
        if selected:
            variable.set(selected)

    def _pick_file(self, variable: tk.Variable) -> None:
        current = variable.get()
        selected = filedialog.askopenfilename(initialdir=current or None)
        if selected:
            variable.set(selected)
