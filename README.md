# Mioclaw

**Mioclaw** 是一个本地运行的多渠道 AI gateway/agent 运行时，当前仓库作为独立项目维护。

## 功能特性

- **多渠道支持**: 飞书等消息入口
- **模型支持**: MiniMax 等大语言模型
- **本地运行**: 配置、日志、记忆都保存在本机
- **Control UI**: 内置 Web 控制台

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

# 本地构建
pnpm build

# 链接 CLI
pnpm link --global
```

### 配置

1. 初始化配置目录：

```bash
mkdir -p ~/.mioclaw
cat > ~/.mioclaw/mioclaw.json <<'EOF'
{
  "gateway": {
    "mode": "local",
    "port": 18789
  }
}
EOF
```

2. 可选：显式指定配置文件路径。
   当前代码里环境变量前缀仍兼容 `OPENCLAW_*`，所以这里继续使用 `OPENCLAW_CONFIG_PATH`：

```bash
export OPENCLAW_CONFIG_PATH=~/.mioclaw/mioclaw.json
```

### 启动服务

```bash
# 启动 Gateway
mioclaw gateway run --bind loopback --port 18789 --force

# 启动 TUI
mioclaw tui ws://127.0.0.1:18789 -agent main -session main
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
    "port": 18789
  }
}
```

## 常用命令

```bash
# 启动 Gateway
mioclaw gateway run --bind loopback --port 18789 --force

# 查看状态
mioclaw status

# 发送消息
mioclaw message send --to xxx --message "Hello"

# 启动交互界面
mioclaw tui ws://127.0.0.1:18789 -agent main -session main
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
- GitHub: https://github.com/iiAlter/mioclaw
