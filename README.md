# ARIES Multi LLM Demo

## Installation & Usage (Windows)

Since Windows environment doesn't support PCIe hardware binding for Docker containers, you should run `flask` websocket server and `next.js` frontend server.

### Frontend

```shell
cd frontend
npm install
npm run dev
```

### Backend

```shell
cd backend
uv sync
uv run src/server.py
```

## Installation (Linux)

The instruction below will install docker, create docker network needed, update this repository, and download needed files to run this demo.

```shell
./update.sh
```

## Settings

### Change list of models, prompts and generation configs

You can change models, prompts and generation configs without any docker rebuild by editing `backend/src/models.json`, `backend/src/prompts/{language}-system.txt`, `backend/src/prompts/{language}-inter-prompt.txt`, and `backend/src/generation_configs/{model_id}/generation_config.json`. You can easily copy & paste models in `model_list.jsonl`. Change of models will be applied when server is restarted. Prompts and generation configs will be applied when conversation is reset.

### Change example questions and idle time for example mode

You can change example questions without any docker rebuild by editing `frontend/app/settings.ts`. These questions are used in example mode. Also you can change requiring idle time for automatically starting example mode.

## Manual Installation & Usage

### Install Docker

Follow the [official instruction](https://docs.docker.com/engine/install/ubuntu/)
Also, set your user as `docker` group by following the [Linux post-installation steps](https://docs.docker.com/engine/install/linux-postinstall/)

### Create Docker Network

```shell
docker network create mblt_int
```

### Build

```shell
docker compose build
```

### Run (NPU mode, default)

```shell
docker compose up
```

### Run (GPU mode)

Before running GPU mode, install [nvidia-container-toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html).

```shell
docker compose -f docker-compose.yml -f docker-compose.gpu.yml up
```

`docker-compose.gpu.yml` sets `gpus: all` so GPU containers are exposed to compose runtime.

### Runtime mode note

This demo is designed for hardware-accelerated inference only (NPU or GPU). CPU-only execution is not supported.

- `docker compose up`: NPU mode
  - uses [backend.Dockerfile](./backend/backend.Dockerfile) and NPU-backed runtime path.
- `docker compose -f docker-compose.yml -f docker-compose.gpu.yml up`: GPU mode
  - uses [backend/backend-gpu.Dockerfile](./backend/backend-gpu.Dockerfile) and requests `gpus: all`.

### Run on background

```shell
docker compose up -d
```

```shell
docker compose -f docker-compose.yml -f docker-compose.gpu.yml up -d
```

### Shutdown background

```shell
docker compose down
```

## Setup Shortcut

Path to this repository should be `~/aries-multi-llm-demo`.

If needed, you can update the path in `multi-llm-demo.desktop` and `run.sh` before copying.

```shell
mkdir -p "$HOME/.local/share/applications"
cp multi-llm-demo.desktop "$HOME/.local/share/applications/"
```

Then, add the `Multi LLM` icon to apps and pin it to favorites.
