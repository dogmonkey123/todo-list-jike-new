# TODOList — 项目说明（当前状态说明）

> 注意：本说明基于仓库当前代码版本撰写。语音输入（按住录音 → 上传到 STT 后端）功能仍处于实验/未完全跑通状态。文档已标注需额外完成的步骤与排查点，以便你在本地或设备上启用并调试该功能。

---

## 1. 技术选型

- 编程语言：JavaScript / TypeScript
  - 本仓库前端使用 React Native + Expo，代码用 TypeScript/JS 混合（`tsconfig.json` 扩展自 `expo/tsconfig.base`）。理由：移动端生态成熟、快速开发，Expo 加速原型验证。
- 框架 / 库：React Native (Expo)、Expo Notifications、@react-native-community/datetimepicker
  - 原生 UI 与跨平台能力好；`expo-notifications` 用于本地提醒；`@react-native-community/datetimepicker` 提供统一的原生日期/时间选择器。
- 后端：Node.js + Express
  - STT 代理示例实现位于 `stt-server/`，使用 `express`、`multer`、`fluent-ffmpeg` 和 `@google-cloud/speech`。
- 媒体处理：ffmpeg（系统依赖）
  - 用于把客户端录音转为 16k、单声道 WAV，符合 Google Speech 要求。
- 数据库存储：无持久化（内存数组）
  - 当前实现把 todos 存于内存（`App.tsx` 的 `useState<Todo[]>`）。理由：演示/原型阶段最简单；生产应接入本地持久化或远端 DB（建议 SQLite / Realm / 各云 DB）。
- 替代方案对比：
  - 为什么不用 MongoDB：该项目为移动端轻量待办，本地存储或 SQLite 更合适；引入 MongoDB 意味着需要后端持久化服务。
  - 为什么不用直接在前端使用 Google STT：安全和配额问题，需保护 service account；把 STT 放在受控后端代理更安全。

---

## 2. 项目结构设计

- 顶层文件/目录（重要项）：
  - `App.tsx` — 主入口，包含 UI、模板模式、编辑面板、语音创建流程、通知调度逻辑（注意：语音流程代码已写入，但要实际可用需在设备上安装依赖并配置后端）。
  - `styles.ts` — 全局样式。
  - `src/hooks/useRecording.ts` — 录音并上传到 STT 后端的 hook（动态 `require` expo-av / expo-file-system）。
  - `src/components/DateTimeRow.tsx` — 可复用的“日期行 + 时间行”组件（互斥展开）。
  - `stt-server/` — 示例后端代理（`server.js`、`package.json`）。

---

- 模块职责说明（当前为简化实现）：
  - `App.tsx`：负责页面/交互逻辑、状态管理、通知调度、STT 结果确认流（实现存在，但需完成运行环境配置才能验证）。
  - `useRecording`：抽象录音生命周期（start/stop）、文件读取与上传，以及上载状态（`isUploading`）。
  - `stt-server/server.js`：接收音频、转换格式、调用 Google Speech API、返回识别文本。

---

## 3. 需求细节与决策

- 输入必填性：
  - 前端 `handleAdd` 会对输入做 `trim()`，空字符串不会被添加到列表（即：必填非空标题）。
- 空输入处理：
  - 如果文本为空，添加按钮会被禁用（UI 层检查），并在 `onSubmitEditing` 中不会触发创建。
- 已完成任务显示：
  - UI 中每条 todo 有一个圆形复选（`TouchableOpacity`），被标记为完成时会改变样式并打勾（`Ionicons`）。
- 任务排序逻辑：
  - 当前实现按创建时间（`createdAt`）将新任务插入数组头部：最新在最上方。
- 提醒 / 通知：
  - 使用 `expo-notifications` 调度基于绝对时间的本地通知（当 `reminderAt` 大于当前时间时会调度）。删除/修改会取消旧的通知 ID。
- 日期/时间交互决策：
  - 模板模式与编辑面板均使用“日期行 + 时间行”两行展示，展开互斥（在 `src/components/DateTimeRow.tsx` 中实现）。
  - 进入模板模式时若未设置 deadline/reminder，会默认：
    - deadline = 当前时间（now）
    - reminder = deadline - 5 分钟
- 语音 / STT（当前状态）：
  - 项目中已实现按住录音的前端代码（`onPressIn` 调用 `startRecording`，`onPressOut` 调用 `stopRecording`），并创建了 `useRecording` hook 与后端示例。但在当前仓库/开发环境中，语音功能在默认情况下无法直接使用，常见原因：
    - 未在项目中安装 `expo-av` / `expo-file-system`（必须安装以启用录音与文件读取）。
    - 在 Expo Go 中，原生模块（例如 `@react-native-voice`）不可用；代码使用动态 `require` 避免崩溃，但需要 dev-client 或自定义构建才能使用原生语音回退。
    - 本地 STT 代理需要正确启动并可从设备访问（ngrok 或局域网地址），且需要配置 `GOOGLE_APPLICATION_CREDENTIALS` 与 ffmpeg。
  - 结论：语音识别路径在代码层已准备，但要让录音与上传成功运行，需要按照下文「运行与调试语音功能」一步步准备环境。

---

## 4. AI 使用说明

- 使用了 AI 工具：Cursor / Copilot 等（用于草拟文档、辅助生成示例代码片段与调试建议）。
- AI 的作用：
  - 生成样板代码、文档初稿、提议 UI/交互改进点。
  - 协助定位 TypeScript 报错（例如 hook 解构位置导致的 `Cannot find name 'startRecording'` 等）。
- 人工修改策略：
  - 对 AI 提供的代码会进行人工审查并改写以匹配项目风格与实际运行环境（例如把直接导入改为 `require` 动态加载以兼容 Expo Go）。

---

## 5. 运行、调试与测试（含语音功能启用步骤）

前提：已安装 Node.js 与 npm、Expo CLI（可选）。若要启用语音功能，还需按本节步骤补充依赖并配置后端。

A. 启动后端 STT 代理（必需，若你要测试云 STT 路径）

1. 进入目录并安装依赖：
```powershell
cd .\stt-server
npm install
```
2. 准备 Google 凭证并设置环境变量（PowerShell）：
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\path\to\your-service-account.json'
```
3. 安装 ffmpeg（若 Windows，可用 Chocolatey）：
```powershell
choco install ffmpeg -y
```
4. 启动服务：
```powershell
npm start
```
- 默认监听 `3000`，接口 `POST /api/stt/google`，字段名 `file`。

B. 启动前端（基础）

1. 安装前端依赖（项目根）：
```powershell
npm install
# 推荐安装以下 Expo 运行时包以支持录音：
expo install expo-av expo-file-system
```
2. 配置 `STT_BACKEND_URL`（在 `App.tsx`）：
- 在 Android 模拟器上如果后端运行在同一台主机，推荐使用 `http://10.0.2.2:3000/api/stt/google`。
- 真机或 Expo Go 请暴露服务（ngrok 等），例如 `https://<your-ngrok>.ngrok.io/api/stt/google`。
3. 启动 Expo：
```powershell
expo start
```

C. 启用并调试语音功能（步骤）

1. 确保安装了 `expo-av` 与 `expo-file-system`，否则 `useRecording` 无法开始/停止录音。
2. 在运行设备上确认麦克风权限被允许（应用会在启动时请求权限）。
3. 启动 `stt-server` 并确认服务器日志无错误；如果设备无法直接访问本地服务器，使用 `ngrok http 3000` 并把返回的 https 地址填入 `STT_BACKEND_URL`。
4. 在 Android 模拟器上测试：对于模拟器访问本机地址使用 `10.0.2.2`；在 iOS 模拟器则可使用 `localhost`。
5. 如果你希望使用原生 `@react-native-voice`（作为替代或增强），请注意：该模块需要原生构建（dev-client 或自定义原生构建），在 Expo Go 中不可用。

D. 常见排查点（如果录音/识别失败）
- 检查是否安装并正确链接 `expo-av` / `expo-file-system`。运行 `expo install expo-av expo-file-system` 并重启 Metro。 
- 检查 `useRecording` 的控制台输出与 `stt-server` 日志（查看是否收到文件、ffmpeg 转码是否成功、Google Speech 是否返回结果）。
- 若请求被服务器拒绝，确认 `STT_API_KEY`（若设置）或跨域/网络问题。 
- 在 Android 设备上确认麦克风权限、在 iOS 上查看 `NSMicrophoneUsageDescription` 是否在 `app.json` 中配置（当前仓库建议但可能未写入）。
- 如果编辑器报 TypeScript 找不到 `startRecording` / `stopRecording`：确保 `App.tsx` 已在函数组件顶部正确解构 `useRecording` 的返回值，并重启 TypeScript server（或编辑器）。

---

## 6. 已知问题与当前限制（重点）

- 语音功能在默认仓库克隆后可能不可用，原因包括依赖未安装、Expo Go 限制、后端未配置或权限未授予。
- 数据未持久化，刷新/重启后 todos 会丢失。需要新增持久化层（AsyncStorage / SQLite / Realm）。
- 错误提示与重试机制尚不完善，上传失败时用户可见提示较少。

---

## 7. 总结与下一步计划

- 近期优先级：
  1. 让语音功能可在开发环境运行：安装 `expo-av` / `expo-file-system`、启动 `stt-server`、确认 ffmpeg 与 Google 凭证配置。
  2. 增加本地持久化（AsyncStorage 或 SQLite）以保留 todos。
  3. 改善错误反馈与 UI（上传中指示、重试按钮、权限拒绝提示）。
- 长期改进：
  - 引入同步/后端持久化、账号系统、跨设备同步。
  - 增加自动提取语义（更多 NLU 规则，提升 chrono 解析准确率）。


---

