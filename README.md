# Terminal Nav

一个基于 `public/config.json` 配置驱动的终端风导航页。使用 React 18 + Vite 构建，提供分类展示、实时搜索过滤，以及偏命令行审美的暗色 UI。

## 技术栈

- React 18
- Vite
- 纯 CSS（无 UI 组件库）
- 外部 JSON 配置文件

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化配置

```bash
npm run init:config
# 等价于：cp public/config.template.json public/config.json
```

`public/config.json` 已在 `.gitignore` 中排除，是你的个人配置，不会提交到 git。`config.template.json` 才是入库的模板。

### 3. 启动开发服务器

```bash
npm run dev
```

打开终端输出的地址（默认 `http://localhost:5173`）即可。

### 4. 构建生产版本

```bash
npm run build
```

产物输出到 `dist/`。

---

## 本地调试

### 调试配置文件

直接编辑 `public/config.json`，保存后浏览器**热重载**，无需重启 dev server。

```bash
npm run dev        # 保持运行
# 另开终端编辑：
code public/config.json
```

### 调试构建产物

`dist/index.html` 不能直接双击打开（`file://` 协议下 fetch 会失败）。构建后用以下方式预览：

```bash
# 方式 1：vite preview（推荐）
npm run build && npm run preview
# 访问 http://localhost:4173

# 方式 2：Python 临时服务器
npm run build && cd dist && python3 -m http.server 8080
# 访问 http://localhost:8080
```

> 注意：`dist/config.json` 是构建时从 `public/` 复制的快照。改了 `public/config.json` 后需重新 `npm run build` 才会更新 dist 里的版本。

### 运行单元测试

```bash
npm test
```

---

## 项目结构

```text
.
├── index.html
├── package.json
├── vite.config.js
├── README.md
├── public/
│   ├── config.json          # 个人配置（.gitignore 排除，不入库）
│   └── config.template.json # 模板（入库）
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── components/
    │   ├── Category.jsx
    │   ├── LinkItem.jsx
    │   └── SearchBar.jsx
    ├── utils/
    │   ├── computeLayout.js
    │   └── __tests__/
    │       └── computeLayout.test.js
    └── styles/
        └── App.css
```

---

## 配置文件说明

所有可见文案均可通过 `public/config.json` 的 `ui` 字段定制，所有字段均有内置默认值，缺省时自动回退。

```json
{
  "ui": {
    "shellTitle": "[nav@terminal ~]$",
    "appTitle": "TERMINAL NAV",
    "subtitle": "基于配置驱动的命令行风格导航页。",
    "eyebrowSuffix": "./launch --config",
    "stats": {
      "categoriesLabel": "categories",
      "linksLabel": "links",
      "statusLabel": "status",
      "statusLoading": "loading",
      "statusError": "error",
      "statusReady": "ready"
    },
    "search": {
      "prompt": "$ find",
      "placeholder": "输入分类或链接名称…"
    },
    "loading": {
      "primary": "$ booting interface...",
      "secondary": "正在读取"
    },
    "error": {
      "primary": "$ error --config-load",
      "secondary": "请检查 public/config.json 的格式是否正确。"
    },
    "empty": {
      "fallbackQuery": "all",
      "secondary": "未找到匹配项。"
    },
    "category": {
      "pathPrefix": "~/",
      "suffix": "$"
    },
    "link": {
      "prompt": "➜",
      "hint": "[open]"
    }
  },
  "categories": [
    {
      "name": "常用工具",
      "links": [
        { "name": "Google", "url": "https://google.com" }
      ]
    }
  ]
}
```

### ui 字段说明

| 字段 | 说明 |
|------|------|
| `shellTitle` | 顶部命令行前缀 |
| `appTitle` | 大标题 |
| `subtitle` | 标题下方说明文案 |
| `eyebrowSuffix` | 眉标中紧跟 shellTitle 的命令片段 |
| `stats.*` | 统计栏各标签文案（categories / links / status 及三种状态值） |
| `search.prompt` | 搜索框左侧提示符 |
| `search.placeholder` | 搜索框 placeholder |
| `loading.primary/secondary` | 加载中状态两行文案 |
| `error.primary/secondary` | 错误状态两行文案 |
| `empty.fallbackQuery` | 无结果时 `$ find` 后的占位词 |
| `empty.secondary` | 无结果时的说明文案 |
| `category.pathPrefix` | 分类标题前缀（如 `~/`） |
| `category.suffix` | 分类标题后缀（如 `$`） |
| `link.prompt` | 链接行左侧提示符（如 `➜`） |
| `link.hint` | 链接行右侧悬停提示（如 `[open]`） |

### categories 字段说明

| 字段 | 说明 |
|------|------|
| `categories[].name` | 分类名称 |
| `categories[].links[].name` | 链接显示名称 |
| `categories[].links[].url` | 链接地址，点击后在新标签页打开 |

---

## 自定义样式

主要样式位于 `src/styles/App.css`，推荐优先调整 CSS 变量：

```css
:root {
  --bg: #0a0e12;
  --text: #d8fff5;
  --muted: #7cb3a7;
  --accent: #5effcb;
  --accent-strong: #8bf7ff;
}
```

---

## 构建与部署

> `dist/index.html` 必须通过 HTTP 服务访问，不支持 `file://` 直接打开。

### 最简流程

```bash
npm run build
# 将 dist/ 部署到你的静态文件目录，例如：
# rsync -av --delete dist/ <你的服务器目录>/
```

### GitHub Pages / Netlify / Vercel

- Build Command: `npm run build`
- Publish Directory: `dist`

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name _;
    root <你的静态文件目录>;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # config.json 不缓存，改完立即生效
    location = /config.json {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        try_files $uri =404;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }
}
```
