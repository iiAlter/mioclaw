# Mioclaw 模块架构文档

## 项目概述

Mioclaw 是一个多通道 AI 网关，支持多种消息通道的 extensible 消息集成。核心功能包括：

- **多通道消息接入**: 支持 Telegram、飞书等消息平台
- **AI 智能体**: 嵌入式 AI Agent，支持会话管理、记忆压缩
- **插件系统**: 灵活的扩展机制，支持自定义通道、工具、Hook

---

## 核心模块

### 1. `src/agents` - AI 智能体核心

AI 代理的核心实现，管理智能体的生命周期。

**主要功能**：

| 功能                  | 说明                                                                 |
| --------------------- | -------------------------------------------------------------------- |
| **嵌入式 Agent 运行** | `pi-embedded-runner.ts` 实现嵌入式 AI 智能体的启动、运行、中止、压缩 |
| **模型配置管理**      | 支持多提供商模型配置，包括模型发现、能力检测、认证管理               |
| **技能系统 (Skills)** | AI Agent 的技能扩展，支持安装、刷新、过滤、序列化                    |
| **子代理管理**        | 创建和管理子代理，包含会话深度限制、超时控制                         |
| **沙箱执行环境**      | 安全代码执行，支持 Docker 隔离、文件系统访问控制                     |
| **认证配置**          | 多提供商 API 密钥管理、OAuth 流程支持                                |

**关键文件**：

```
agents/
├── pi-embedded.ts              # 嵌入式 Agent 入口
├── pi-embedded-runner/         # Agent 运行器
│   ├── index.ts               # 运行器主逻辑
│   └── types.ts              # 类型定义
├── skills/                    # 技能系统
│   ├── install.ts            # 技能安装
│   └── filter.ts             # 技能过滤
├── sandbox/                   # 沙箱环境
│   └── docker.ts             # Docker 隔离
├── auth-profiles/            # 认证配置
│   └── types.ts             # 认证类型
├── subagent-registry.ts      # 子代理注册表
└── models-config.ts          # 模型配置
```

**核心类型**：

```typescript
// Agent 元数据
interface EmbeddedPiAgentMeta {
  sessionId: string;
  provider: string;
  model: string;
  compactionCount: number;
  usage: Usage;
}

// Agent 运行结果
interface EmbeddedPiRunResult {
  payloads: ContentBlock[];
  meta: EmbeddedPiAgentMeta;
  didSendViaMessagingTool: boolean;
}

// 压缩结果
interface EmbeddedPiCompactResult {
  ok: boolean;
  compacted: boolean;
  reason?: string;
  result?: EmbeddedPiRunResult;
}
```

---

### 2. `src/gateway` - 服务网关

处理客户端连接、消息转发、WebSocket 通信的网关服务。

**主要功能**：

| 功能                      | 说明                                                    |
| ------------------------- | ------------------------------------------------------- |
| **HTTP/WebSocket 服务器** | 基于 Node.js HTTP + WebSocket 的网关服务                |
| **API 方法处理**          | 提供聊天、工具调用、会话管理、模型查询等 API            |
| **认证与授权**            | 多种认证模式 (token, browser, device, OAuth) 和角色策略 |
| **控制平面**              | 健康检查、探针、速率限制、凭证管理                      |
| **插件 HTTP 路由**        | 支持插件注册自定义 HTTP 端点                            |

**关键文件**：

```
gateway/
├── server.ts                 # 网关服务器入口
├── server-http.ts            # HTTP 服务器实现
├── server/
│   ├── ws-connection.ts     # WebSocket 连接
│   └── methods/            # API 方法实现
│       ├── chat.ts         # 聊天方法
│       ├── tools.ts        # 工具调用
│       └── sessions.ts     # 会话管理
├── auth.ts                  # 认证模块
└── plugins-http.ts          # 插件 HTTP 路由
```

---

### 3. `src/channels` - 消息通道抽象层

统一的消息通道接口抽象。

**主要功能**：

| 功能               | 说明                                |
| ------------------ | ----------------------------------- |
| **通道注册与管理** | 支持 Telegram、Feishu 核心通道      |
| **消息路由与投递** | 处理入站/出站消息、消息类型转换     |
| **通道配置**       | 通道配置 schema、凭据管理、状态检查 |
| **入站/出站适配**  | 消息标准化、媒体处理、指令解析      |

**关键文件**：

```
channels/
├── registry.ts              # 通道注册表
├── plugins/
│   ├── catalog.ts          # 插件通道目录
│   ├── types.ts           # 通道插件类型
│   ├── inbound/           # 入站消息处理
│   └── outbound/          # 出站消息处理
├── thread-bindings.ts     # 线程绑定
└── targets.ts             # 目标解析
```

**核心类型**：

```typescript
// 通道 ID
type ChatChannelId = "telegram" | "feishu";

// 通道插件接口
interface ChannelPlugin {
  id: string;
  label: string;
  onInbound: (message: InboundMessage) => Promise<void>;
  onOutbound: (message: OutboundMessage) => Promise<void>;
  // ...
}
```

---

### 4. `src/auto-reply` - 自动回复

处理自动回复逻辑。

**主要功能**：

| 功能         | 说明                                                   |
| ------------ | ------------------------------------------------------ |
| **指令解析** | 解析用户指令 (`/think`, `/verbose`, `/exec`, `/queue`) |
| **回复生成** | 调用 AI Agent 生成回复，支持流式输出                   |
| **会话管理** | 会话状态跟踪、记忆刷新、上下文修剪                     |
| **命令系统** | 命令注册、权限控制、allowlist 管理                     |

**关键文件**：

```
auto-reply/
├── reply.ts                 # 自动回复入口
├── reply/
│   ├── directives.ts       # 指令解析
│   ├── get-reply.ts       # 回复生成主逻辑
│   ├── commands*.ts       # 命令实现
│   └── agent-runner-*.ts  # Agent 运行器
└── inbound.ts              # 入站消息处理
```

---

### 5. `src/providers` - AI 模型提供商

支持多种 AI 模型接入。

**主要功能**：

| 提供商             | 说明                          |
| ------------------ | ----------------------------- |
| **OpenAI**         | GPT-4o, GPT-4o-mini, Codex 等 |
| **Anthropic**      | Claude 3.5, Claude 3 等       |
| **Google**         | Gemini 1.5, Gemini Pro 等     |
| **Azure OpenAI**   | Azure 部署的 OpenAI 模型      |
| **AWS Bedrock**    | Claude on Bedrock, Titan 等   |
| **GitHub Copilot** | Codex 模型                    |
| **Ollama**         | 本地开源模型                  |
| **Moonshot**       | Kimi 系列                     |
| **MiniMax**        | MiniMax API                   |
| **Qwen**           | 阿里 Qwen 系列                |

**关键文件**：

```
providers/
├── config/
│   └── types.models.ts    # 模型配置类型
├── github-copilot-*.ts   # GitHub Copilot 实现
├── qwen-portal-oauth.ts  # Qwen OAuth
└── kilocode-shared.ts    # KiloCode 配置
```

---

### 6. `src/plugins` - 插件系统

动态加载和管理插件。

**主要功能**：

| 功能             | 说明                             |
| ---------------- | -------------------------------- |
| **生命周期管理** | 安装、卸载、启用、禁用、更新插件 |
| **插件发现**     | 从目录、npm 包发现插件           |
| **Hook 系统**    | 支持多种 Hook 阶段               |
| **工具注册**     | 插件可注册自定义工具             |
| **运行时支持**   | 插件环境、配置管理、日志         |

**关键文件**：

```
plugins/
├── install.ts             # 插件安装
├── uninstall.ts          # 插件卸载
├── loader.ts             # 插件加载器
├── hooks.ts              # Hook 系统
├── runtime/
│   └── types.ts         # 运行时类型
└── types.ts              # 插件核心类型
```

**核心类型**：

```typescript
// 插件类型
type PluginKind = "memory" | "context-engine";

// 插件工具工厂
type OpenClawPluginToolFactory = (ctx: PluginContext) => AnyAgentTool | AnyAgentTool[];

// 插件 Hook 选项
interface OpenClawPluginHookOptions {
  entry?: string;
  name?: string;
  register?: (hooks: HookRegistry) => void;
}
```

---

## 消息通道

### 7. `src/telegram` - Telegram 通道

Telegram Bot API 集成。

**主要功能**：

- 消息收发
- Webhook 处理
- 群组管理
- 按钮交互

### 8. `src/feishu` (扩展) - 飞书通道

飞书开放平台集成。

---

## 数据与存储

### 9. `src/sessions` - 会话管理

会话状态管理。

**关键文件**：

- `sessions/session.ts` - 会话主类
- `sessions/store.ts` - 会话存储

### 10. `src/memory` - 记忆存储

会话记忆持久化。

**功能**：

- 记忆读写
- 记忆压缩
- 记忆搜索

### 11. `src/config` - 配置管理

配置加载、合并、验证。

**功能**：

- YAML 配置解析
- 环境变量覆盖
- 配置验证

---

## CLI 命令

### `src/commands` - 命令实现

Mioclaw 提供丰富的 CLI 命令。

**命令分类**：

| 分类           | 命令                 |
| -------------- | -------------------- |
| **Agent 管理** | `agent`, `agents`    |
| **配置管理**   | `config`             |
| **状态查询**   | `status`             |
| **通道管理**   | `telegram`, `feishu` |
| **技能管理**   | `skills`             |
| **插件管理**   | `plugins`            |
| **诊断工具**   | `doctor`             |
| **网关控制**   | `gateway`            |

**关键命令**：

```bash
# 启动 Agent
mioclaw agent --message "Hello"

# 查看状态
mioclaw status

# 配置管理
mioclaw config get <key>
mioclaw config set <key> <value>

# 通道安装
mioclaw telegram install
mioclaw feishu install

# 诊断
mioclaw doctor
```

**命令文件结构**：

```
commands/
├── agent.ts                 # agent 命令主入口
├── agents.ts               # agents 多代理命令
├── agents.commands/        # 子命令
│   ├── add.ts            # 添加代理
│   ├── bind.ts           # 绑定通道
│   ├── delete.ts         # 删除代理
│   ├── identity.ts       # 身份配置
│   └── list.ts           # 列出代理
├── config.ts             # config 命令
├── status.ts             # status 命令
├── doctor.ts              # doctor 诊断
├── telegram/             # Telegram 通道命令
├── feishu/               # 飞书通道命令
└── skills/               # 技能命令
```

---

## 配置文件

### 配置格式

Mioclaw 使用 YAML 格式配置文件。

**配置文件位置**：

- `~/.mioclaw/config.yaml` (用户配置)
- `./mioclaw.config.yaml` (项目配置)

**配置类型定义** (`src/config/types.ts`)：

```typescript
// 主配置接口
interface OpenClawConfig {
  version?: string;
  gateway?: GatewayConfig;
  agents?: AgentsConfig;
  channels?: ChannelsConfig;
  skills?: SkillsConfig;
  plugins?: PluginsConfig;
  models?: ModelsConfig;
  sandbox?: SandboxConfig;
  memory?: MemoryConfig;
  // ...
}
```

### 核心配置项

**1. Gateway 配置**

```yaml
gateway:
  bind: "0.0.0.0"
  port: 17800
  tls:
    enabled: false
  auth:
    mode: "token"
    token: "your-token"
```

**2. Agents 配置**

```yaml
agents:
  list:
    - id: "main"
      model: "claude-sonnet-4-20250514"
      provider: "anthropic"
```

**3. Channels 配置**

```yaml
channels:
  telegram:
    enabled: true
    botToken: "${TELEGRAM_BOT_TOKEN}"
  feishu:
    enabled: true
    appId: "${FEISHU_APP_ID}"
    appSecret: "${FEISHU_APP_SECRET}"
```

**4. Models 配置**

```yaml
models:
  providers:
    anthropic:
      apiKey: "${ANTHROPIC_API_KEY}"
    openai:
      apiKey: "${OPENAI_API_KEY}"
```

### 配置优先级

配置加载优先级（从高到低）：

1. **运行时参数** (`--port`, `--bind`)
2. **环境变量** (`MIOCLAW_*`)
3. **项目配置** (`./mioclaw.config.yaml`)
4. **用户配置** (`~/.mioclaw/config.yaml`)
5. **默认配置**

---

## API 接口

### Gateway API

Mioclaw 通过 HTTP/WebSocket 提供 API。

**基础 URL**：

```
http://localhost:17800/v1/
```

### API 方法

| 方法                  | 说明         |
| --------------------- | ------------ |
| `chat.completions`    | 聊天完成     |
| `chat.tools`          | 工具调用     |
| `sessions.list`       | 列出会话     |
| `sessions.get`        | 获取会话     |
| `sessions.create`     | 创建会话     |
| `sessions.delete`     | 删除会话     |
| `models.list`         | 列出可用模型 |
| `models.capabilities` | 模型能力     |

### WebSocket API

实时消息推送：

```
ws://localhost:17800/v1/stream
```

**事件类型**：

- `message` - 新消息
- `typing` - 打字状态
- `error` - 错误事件
- `done` - 完成事件

---

## 环境变量

### 常用环境变量

| 变量                    | 说明               |
| ----------------------- | ------------------ |
| `MIOCLAW_CONFIG`        | 配置文件路径       |
| `MIOCLAW_GATEWAY_TOKEN` | 网关认证 Token     |
| `MIOCLAW_HOME`          | Mioclaw 数据目录   |
| `ANTHROPIC_API_KEY`     | Anthropic API Key  |
| `OPENAI_API_KEY`        | OpenAI API Key     |
| `TELEGRAM_BOT_TOKEN`    | Telegram Bot Token |
| `FEISHU_APP_ID`         | 飞书 App ID        |
| `FEISHU_APP_SECRET`     | 飞书 App Secret    |

---

## 扩展开发

### 插件开发

创建自定义插件：

```typescript
// my-plugin/index.ts
import type { OpenClawPlugin } from "mioclaw/plugin-sdk";

export const myPlugin: OpenClawPlugin = {
  name: "my-plugin",
  version: "1.0.0",

  setup(ctx) {
    // 注册工具
    ctx.registerTool({
      name: "my-tool",
      description: "My custom tool",
      parameters: {
        /* ... */
      },
      handler: async (params) => {
        return { result: "done" };
      },
    });
  },
};
```

### 通道插件

创建自定义消息通道：

```typescript
import type { ChannelPlugin } from "mioclaw/plugin-sdk";

export const myChannel: ChannelPlugin = {
  id: "my-channel",
  label: "My Channel",

  async onInbound(message) {
    // 处理入站消息
  },

  async onOutbound(message) {
    // 发送消息
  },
};
```

---

## 部署

### Docker 部署

```bash
# 拉取镜像
docker pull mioclaw/mioclaw:latest

# 运行
docker run -d \
  -p 17800:17800 \
  -v ~/.mioclaw:/home/user/.mioclaw \
  -e TELEGRAM_BOT_TOKEN=xxx \
  mioclaw/mioclaw:latest
```

### Systemd 服务

```ini
# /etc/systemd/system/mioclaw.service
[Unit]
Description=Mioclaw Gateway

[Service]
Type=simple
User=mioclaw
ExecStart=/usr/local/bin/mioclaw gateway run
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## 故障排除

### 常用诊断命令

```bash
# 检查状态
mioclaw status

# 运行诊断
mioclaw doctor

# 查看日志
tail -f ~/.mioclaw/logs/gateway.log

# 检查端口
ss -ltnp | grep 17800
```

### 常见问题

| 问题         | 解决方案         |
| ------------ | ---------------- |
| 启动失败     | 检查配置文件语法 |
| 消息发不出去 | 检查通道凭据     |
| API 调用失败 | 检查 API Key     |
| 内存占用高   | 调整压缩设置     |

---

## 附录

### 目录结构

```
~/.mioclaw/
├── config.yaml          # 用户配置
├── credentials/         # 凭据存储
├── sessions/           # 会话数据
├── skills/             # 技能数据
├── plugins/            # 插件目录
└── logs/               # 日志文件
```

### 相关链接

- [官网](https://mioclaw.ai)
- [GitHub](https://github.com/openclaw/mioclaw)
- [文档](https://docs.mioclaw.ai)

### 12. `src/secrets` - 密钥管理

敏感信息安全管理。

---

## 媒体处理

### 13. `src/media` - 媒体文件处理

图片、音频、视频等媒体文件处理。

**功能**：

- 文件下载
- 格式转换
- 大小限制

### 14. `src/tts` - 文本转语音

Text-to-Speech 服务。

---

## 基础设施

### 15. `src/infra` - 基础设施

底层基础设施功能。

**功能**：

- 环境变量处理
- 路径管理
- 进程工具
- 网络工具

### 16. `src/process` - 进程管理

子进程管理和执行。

### 17. `src/daemon` - 守护进程

系统守护进程支持。

**支持平台**：

- macOS launchd
- Linux systemd
- Windows Task Scheduler

---

## 扩展模块

| 模块                 | 功能           |
| -------------------- | -------------- |
| `src/context-engine` | 对话上下文管理 |
| `src/hooks`          | 生命周期钩子   |
| `src/routing`        | 消息路由分发   |
| `src/security`       | 安全功能       |
| `src/logging`        | 日志系统       |
| `src/i18n`           | 国际化         |
| `src/cron`           | 定时任务       |

---

## 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLI / Gateway                              │
├─────────────────────────────────────────────────────────────────┤
│  commands  │  gateway  │  channels  │  auto-reply  │  plugins  │
├─────────────────────────────────────────────────────────────────┤
│  agents (嵌入式 AI Agent)                                        │
│  ├── pi-embedded-runner     # Agent 运行器                       │
│  ├── skills                 # 技能系统                            │
│  ├── sandbox                # 沙箱环境                            │
│  └── models-config          # 模型配置                            │
├─────────────────────────────────────────────────────────────────┤
│  providers (多模型支持)                                           │
│  ├── OpenAI  │  Anthropic  │  Google  │  Azure  │  Bedrock  │
├─────────────────────────────────────────────────────────────────┤
│  sessions  │  memory  │  config  │  secrets  │  media       │
├─────────────────────────────────────────────────────────────────┤
│  infra  │  process  │  daemon  │  security  │  logging     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 数据流

```
用户消息
    │
    ▼
┌────────────────┐
│   Gateway      │  ← HTTP/WebSocket 接收
└────────┬───────┘
         │
         ▼
┌────────────────┐
│  Auto-Reply    │  ← 指令解析、会话管理
└────────┬───────┘
         │
         ▼
┌────────────────┐
│    Agents      │  ← AI 推理、工具调用
└────────┬───────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│Provider│ │Plugins│  ← 模型 API / 插件扩展
└───────┘ └───────┘
    │
    ▼
┌────────────────┐
│   Channels     │  → 消息发送
└────────────────┘
```
