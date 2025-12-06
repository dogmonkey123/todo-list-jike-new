# todo-list-jike-new

本仓库包含一个 React Native (Expo) 待办应用与一个用于语音识别的简易 STT 代理服务器（Google Speech-to-Text）。

结构概览

- App.tsx - 主应用（带模板模式、原生/云语音输入、通知）
- styles.ts - 样式文件
- stt-server/ - STT 代理服务（node + express + ffmpeg + Google STT）
  - server.js - 最小实现
  - package.json

快速启动指南

A. 启动 STT 代理（开发机或云）

1. 安装依赖并准备 Google 凭证

- 进入 `stt-server` 目录：
  ```powershell
  cd .\stt-server
  npm install
  ```

- 在 Google Cloud Console 中启用 Speech-to-Text API，创建 Service Account 并下载 JSON 密钥文件（例如保存为 `C:\keys\gcloud-stt.json`）。

- 设置环境变量（当前 PowerShell 会话）：
  ```powershell
  $env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\keys\gcloud-stt.json'
  ```

2. 安装 ffmpeg（二进制需在系统 PATH）

- Windows 推荐使用 Chocolatey：
  ```powershell
  choco install ffmpeg -y
  ```

3. 启动服务器：

```powershell
npm start
```

服务器默认监听 3000，接口： `POST /api/stt/google`，接收 multipart/form-data，字段名 `file`。

B. 运行客户端（Expo）

1. 安装依赖：
```powershell
cd ..\
expo install
expo install expo-av expo-file-system
```

2. 配置 STT 后端地址

在 `App.tsx` 中找到 `STT_BACKEND_URL`，将其修改为你的服务器地址，例如使用 ngrok 时：
```
const STT_BACKEND_URL = 'https://<your-ngrok>.ngrok.io/api/stt/google';
```

如果你在 `stt-server` 中设置了 `STT_API_KEY`，在 `App.tsx` 中设置相应的 `STT_API_KEY` 值，并确保上传请求带上该 key（已在 hook 中支持通过 header `x-stt-key`）。

3. 启动 Expo：
```powershell
expo start
```

4. 在手机 Expo 客户端上打开项目并按住麦克风图标说话（按住录音），松开后应用会把录音上传到后端并显示识别结果以确认创建待办。

注意事项

- 切勿将 Google service account JSON 上传到公共仓库。
- 如果手机无法访问本机服务器，可使用 ngrok 暴露：`ngrok http 3000`。
- 生产环境请在 `stt-server` 加入鉴权、限流与日志监控。

