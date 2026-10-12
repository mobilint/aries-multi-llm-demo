# ARIES Multi LLM Demo

Offline multi-model LLM demo for ARIES / Mobilint hardware.

The current implementation uses:

- `Flask-SocketIO` backend for model execution and prompt-bundle synchronization
- `Next.js` frontend for the multi-model UI
- frontend-owned locale resources, example questions, and prompt bundles
- backend-owned model deployment config in `backend/src/models.json`

## Repository Structure

- [backend/src/server.py](./backend/src/server.py): websocket server, task queues, prompt sync orchestration
- [backend/src/pipeline_handler.py](./backend/src/pipeline_handler.py): per-model load/reset/generation loop
- [backend/src/models.json](./backend/src/models.json): deployed model list and hardware placement
- [frontend/app/i18n](./frontend/app/i18n): UI text resources by locale
- [frontend/app/questions/locales](./frontend/app/questions/locales): example question resources by locale
- [frontend/public/prompt-bundles](./frontend/public/prompt-bundles): locale-specific `system.txt` / `inter.txt`

## Supported Locales

Frontend locale resources are prepared for:

- `en`
- `ko`
- `ja`
- `zh`

The frontend loads the selected locale's prompt bundle and sends it to the backend through the `prompt_config` socket event.

When the language changes:

1. frontend aborts all running generations
2. backend clears queued tasks and waits for handlers to become idle
3. backend applies the new prompt bundle to every model handler
4. frontend resumes automatic example prompting only after `prompt_config_saved`

## Installation & Usage (Windows)

Windows does not support the Docker PCIe/NPU binding flow used on Linux, so run the backend and frontend directly.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

### Backend

```powershell
cd backend
uv sync
uv run src/server.py
```

Open `http://localhost:3000`.

## Installation & Usage (Linux)

The helper script installs dependencies, prepares the Docker network, updates the repository, and downloads the model revisions declared in `backend/src/models.json`.

```bash
./update.sh
```

## Manual Linux Setup

### Install Docker

Follow the official Docker Engine instructions:

- <https://docs.docker.com/engine/install/ubuntu/>
- <https://docs.docker.com/engine/install/linux-postinstall/>

### Create Docker Network

```bash
docker network create mblt_int
```

### Build

```bash
docker compose build
```

### Run (NPU mode)

```bash
docker compose up
```

### Run (GPU mode)

Install NVIDIA Container Toolkit first:

- <https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html>

Then run:

```bash
docker compose -f docker-compose.yml -f docker-compose.gpu.yml up
```

`docker-compose.gpu.yml` sets `gpus: all`.

### Run in Background

```bash
docker compose up -d
docker compose -f docker-compose.yml -f docker-compose.gpu.yml up -d
```

### Stop

```bash
docker compose down
```

## Runtime Notes

### Hardware requirement

This demo is designed for hardware-accelerated inference only.
CPU-only execution is not supported.

### Prompt ownership

Prompt text is not stored on the backend as the active source of truth.

- frontend loads prompt bundle files from [frontend/public/prompt-bundles](./frontend/public/prompt-bundles)
- frontend sends `system_prompt` / `inter_prompt` to the backend
- backend applies the selected prompt bundle to every model handler

The backend also rejects `ask` requests until the prompt bundle has been synchronized.

### Frontend/backend state flow

Frontend model state includes:

- `IDLE`
- `ASKING`
- `ANSWERING`
- `ABORTING`
- `APPLYING_LANGUAGE`

Backend readiness is exposed through:

- `loading_state`: backend readiness
- `prompt_config_state`: whether locale prompt synchronization is in progress

The frontend disables question submission while any selected model is busy or while prompt synchronization is in progress. This avoids races where a new question immediately cancels an earlier request.

## Configuration

### Change the list of deployed models

Edit [backend/src/models.json](./backend/src/models.json).

Each entry defines:

- `model_id`
- optional `revision` (default: `main`)
- `dev_no`
- `target_cores`
- default prompt file paths used only for initial startup
- generation config path

Changes take effect when the backend restarts.

### Change prompt text

Edit the locale files under [frontend/public/prompt-bundles](./frontend/public/prompt-bundles):

- `system.txt`
- `inter.txt`

The frontend reloads and sends the selected locale's prompt bundle to the backend.

### Change UI text

Edit the locale JSON files under [frontend/app/i18n](./frontend/app/i18n).

### Change example questions

Edit the locale JSON files under [frontend/app/questions/locales](./frontend/app/questions/locales).

## Development Checks

Frontend production build:

```powershell
cd frontend
npm run build
```

Backend syntax check:

```powershell
python -m py_compile backend/src/server.py backend/src/pipeline_handler.py
```

## Desktop Shortcut

If you use the provided desktop shortcut, this repository is expected at `~/aries-multi-llm-demo`.

If needed, update the path in:

- [multi-llm-demo.desktop](./multi-llm-demo.desktop)
- [run.sh](./run.sh)

Then install the desktop entry:

```bash
mkdir -p "$HOME/.local/share/applications"
cp multi-llm-demo.desktop "$HOME/.local/share/applications/"
```
