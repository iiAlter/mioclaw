# Mioclaw — 个人 AI 助手

**Mioclaw** 是一个运行在本地设备上的个人 AI 助手，通过飞书渠道响应用户。

## 功能特性

- **多渠道支持**: 飞书 (Feishu)
- **模型支持**: MiniMax 等大语言模型
- **本地运行**: 数据存储在本地，保护隐私
- **TUI 界面**: 终端交互界面

## 快速开始

### 环境要求

- Node.js ≥ 22

### 安装

```bash
# 克隆项目
git clone https://github.com/iiAlter/mioclaw.git
cd mioclaw

# 安装依赖
pnpm install

# 链接 CLI
pnpm link --global
```

### 配置

1. 复制配置文件并修改端口：

```bash
mkdir -p ~/.mioclaw
cp ~/.openclaw/openclaw.json ~/.mioclaw/mioclaw.json
# 编辑 ~/.mioclaw/mioclaw.json 将端口改为 17800
```

2. 设置环境变量：

```bash
export OPENCLAW_CONFIG_PATH=~/.mioclaw/mioclaw.json
```

### 启动服务

```bash
# 启动 Gateway
mioclaw gateway run --bind loopback --port 17800 --force

# 启动 TUI
mioclaw tui ws://127.0.0.1:17800 -agent main -session main
```

## 配置说明

配置文件位于 `~/.mioclaw/mioclaw.json`：

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "minimax-cn/MiniMax-M2.5"
      },
      "workspace": "~/.mioclaw/workspace-main"
    },
    "list": [
      {
        "id": "main",
        "name": "Main Agent",
        "workspace": "~/.mioclaw/workspace-main"
      }
    ]
  },
  "channels": {
    "feishu": {
      "enabled": true,
      "accounts": {
        "main": {
          "appId": "your-app-id",
          "appSecret": "your-app-secret",
          "botName": "机器人名称"
        }
      }
    }
  },
  "gateway": {
    "mode": "local",
    "port": 17800
  }
}
```

## 常用命令

```bash
# 启动 Gateway
mioclaw gateway run --bind loopback --port 17800 --force

# 查看状态
mioclaw status

# 发送消息
mioclaw message send --to xxx --message "Hello"

# 启动交互界面
mioclaw tui ws://127.0.0.1:17800 -agent main -session main
```

## 目录结构

```
~/.mioclaw/
├── mioclaw.json      # 配置文件
├── agents/           # Agent 配置
├── workspace-main/   # 工作空间
├── credentials/      # 凭证
├── logs/            # 日志
├── media/           # 媒体文件
└── memory/         # 记忆存储
```

## 技术栈

- TypeScript
- Node.js ≥ 22
- pnpm
- 飞书开放平台 API

## 相关链接

- 飞书开放平台: https://open.feishu.cn/
- MiniMax API: https://platform.minimaxi.com/
