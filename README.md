# README Stats Playground

[![CI](https://github.com/bohecola/readme-stats-playground/actions/workflows/ci.yml/badge.svg)](https://github.com/bohecola/readme-stats-playground/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

简体中文 | [English](./README.en.md)

[github-readme-stats](https://github.com/anuraghazra/github-readme-stats) 卡片的可视化调参工具：左侧改参数，右侧实时预览，一键复制 URL / Markdown / HTML 到你的 GitHub 主页 README。

![README Stats Playground 截图](./docs/screenshot.zh-CN.png)

> 本项目是社区工具，与 github-readme-stats 官方无关联。卡片由你指定的 github-readme-stats 实例渲染。

## 功能

- **覆盖全部 5 种卡片**：Stats 统计卡、Top Languages 语言卡、Pin 仓库卡、WakaTime 卡、Gist 卡
- **完整参数表单**：每个参数都有名称和原始参数名对照，关键参数附带说明；写入 URL 的参数会被标记
- **实时预览**：深色 / 浅色 / 透明棋盘格三种预览背景
- **一键复制**：URL、Markdown、HTML 三种格式
- **取色器**：HEX / RGB / HSL、透明度、预设色与最近使用；`bg_color` 支持可视化编辑渐变
- **可切换实例**：页面顶部可改为任意自建的 github-readme-stats 实例
- **本地保存**：参数和设置保存在浏览器 localStorage，不上传任何数据
- **明暗主题**：默认跟随系统
- **中英双语**：默认跟随浏览器语言（非中英文时为英文），可在顶栏切换

## 快速开始

需要 Node.js 20+ 和 pnpm 11（推荐用 `corepack enable` 自动安装 `package.json` 中指定的版本）。

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # 类型检查 + 生产构建，产物在 dist/
pnpm preview    # 本地预览生产构建
```

## 配置

通过构建时环境变量设置默认值。复制 `.env.example` 为 `.env.local`（不会被提交），或在托管平台中设置：

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `VITE_DEFAULT_BASE_URL` | 默认使用的 github-readme-stats 实例 | `https://github-readme-stats.vercel.app` |
| `VITE_DEFAULT_USERNAME` | 首次打开时预填的 GitHub 用户名 | 空 |

> 公共实例由所有人共享，经常触发 GitHub API 限流。建议按照 [官方文档](https://github.com/anuraghazra/github-readme-stats#deploy-on-your-own) 部署自己的实例，再填到 `VITE_DEFAULT_BASE_URL`。

## 部署

这是一个纯静态站点，`pnpm build` 后把 `dist/` 部署到任意静态托管即可。

- **Vercel / Netlify**：导入仓库，构建命令 `pnpm build`，输出目录 `dist`，按需添加上面的环境变量。

  [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbohecola%2Freadme-stats-playground)

- **GitHub Pages**：站点部署在子路径（`https://<user>.github.io/<repo>/`）时，需要构建时指定 base：`pnpm build --base=/<repo>/`。

## 常见问题

预览里显示的错误信息来自你所用的 github-readme-stats 实例，Playground 只是如实展示：

| 提示 | 原因 | 处理 |
| --- | --- | --- |
| `This username is not whitelisted` | 实例设置了 `WHITELIST` 环境变量，只允许名单内的用户名 | 换成允许的用户名，或在实例中移除 `WHITELIST` |
| `Bad credentials` | 实例的 `PAT_1`（GitHub Personal Access Token）过期或无效 | 在实例中更新 token |
| `Maximum retries exceeded` / 限流 | 实例的 GitHub API 额度用完（公共实例常见） | 稍后再试，或部署自己的实例 |

## 项目结构

```
src/
├── App.tsx                  # 页面布局、状态管理
├── components/
│   ├── CardTabs.tsx         # 卡片类型切换
│   ├── CardForm.tsx         # 按卡片渲染参数表单
│   ├── ParamControl.tsx     # 按参数类型渲染控件
│   ├── ColorPicker.tsx      # 取色器（含渐变编辑）
│   ├── Preview.tsx          # 实时预览 + URL/Markdown/HTML 输出
│   ├── NumberInput.tsx      # 带步进按钮的数值输入
│   ├── LanguageToggle.tsx   # 语言切换
│   └── ui/                  # shadcn/ui 组件
├── i18n.ts                  # i18next 初始化与语言检测
├── locales/                 # 翻译文件（en.json / zh.json）
└── lib/
    ├── config.ts            # 环境变量读取的默认配置
    ├── endpoints.ts         # 各卡片的参数结构（类型、默认值、取值范围）
    ├── paramText.ts         # 参数文案查找（卡片覆盖 → 通用）
    ├── buildUrl.ts          # 拼接卡片 URL（省略默认值与空值）
    ├── color.ts             # 颜色格式换算与渐变解析
    └── themes.ts            # 内置主题列表
```

## 技术栈

[Vite](https://vitejs.dev/) · [React 18](https://react.dev/) · TypeScript · [Tailwind CSS](https://tailwindcss.com/) · [shadcn/ui](https://ui.shadcn.com/) · [react-i18next](https://react.i18next.com/) · [react-colorful](https://github.com/omgovich/react-colorful) · [lucide](https://lucide.dev/)

## 参与贡献

欢迎提交 Issue 和 Pull Request。提交前请确保 `pnpm lint` 和 `pnpm build` 通过（CI 会自动检查）。

- **新增或调整参数**：在 `src/lib/endpoints.ts` 中定义结构，并在 `src/locales/*.json` 的 `params` 下补充名称和说明（某张卡片含义不同时写在 `cardParams.<卡片>` 下覆盖）。
- **新增语言**：复制 `src/locales/en.json` 翻译后，在 `src/i18n.ts` 中注册即可。两份语言文件的 key 需保持一致。

## 许可证

[MIT](./LICENSE)
