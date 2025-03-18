# 使用Vite+Vue3创建谷歌浏览器书签插件

## 项目概述

这是一个使用Vite和Vue3开发的谷歌浏览器书签插件，可以帮助用户快速搜索和管理Chrome书签。插件提供了美观的UI界面，支持书签搜索、预览和快速访问功能，并集成了必应每日壁纸作为背景。

## 功能特点

🎯 **核心功能**

🔄 替换Chrome新标签页

🔍 快速搜索和访问书签

✨ 美观的UI界面

🖼️ 必应每日壁纸作为背景

📚 书签预览和快速访问

⚡ 流畅的动画效果

## 技术栈

🚀 **前端框架**: Vue 3 (使用Composition API和`<script setup>`语法)

⚙️ **构建工具**: Vite 6

🔌 **插件**: @vitejs/plugin-vue

🎨 **图标生成**: Sharp

🧩 **Chrome扩展API**: Bookmarks API, Runtime API

🌐 **网络请求**: Fetch API

## 开发环境配置

### 前提条件

🐢 Node.js (推荐v16+)

📦 npm或yarn包管理器

🌐 Chrome浏览器

### 安装依赖

```bash
# 克隆项目
📥 git clone https://github.com/1604653069/Goolechrome-Bookmark-Plugin.git

📂 cd Goolechrome-Bookmark-Plugin

# 安装依赖
🔧 npm install

# 生成图标
🖌️ npm run generate-icons
```

## 项目结构

```
📁 dist/                   # 构建输出目录
📁 public/                 # 静态资源目录
│   ├️📁 icons/             # 插件图标
│   └️📜 manifest.json      # Chrome插件配置文件
📁 scripts/                # 工具脚本
│   └️📜 generate-icons.js  # 图标生成脚本
📁 src/                    # 源代码目录
│   ├️📁 assets/            # 资源文件
│   ├️📁 components/        # Vue组件
│   ├️📄 App.vue            # 主应用组件
│   ├️📄 background.js      # 插件后台脚本
│   ├️📄 main.js            # 应用入口
│   └️📄 style.css          # 全局样式
📄 index.html              # HTML模板
📄 package.json            # 项目配置
📄 vite.config.js          # Vite配置
```

## manifest.json配置详解

`manifest.json`是Chrome扩展的核心配置文件，定义了扩展的各种属性和权限：

```json
{
  "manifest_version": 3,            // 使用Manifest V3规范
  "name": "Quick Bookmarks Retrieval", // 扩展名称
  "version": "1.0.0",              // 扩展版本
  "description": "快速搜索和管理Chrome书签", // 扩展描述
  "permissions": ["bookmarks"],    // 需要的权限
  "host_permissions": [             // 允许访问的域名
    "https://cn.bing.com/*", 
    "https://*.cn.bing.net/*"
  ],
  "background": {                   // 后台脚本
    "service_worker": "background.js"
  },
  "chrome_url_overrides": {         // 覆盖Chrome默认页面
    "newtab": "index.html"         // 替换新标签页
  },
  "action": {                       // 浏览器工具栏图标
    "default_popup": "index.html", // 点击图标显示的页面
    "default_icon": {              // 图标设置
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {                        // 扩展图标
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

## 开发步骤指南

### 1️⃣ 创建Vite项目

```bash
🚀 npm create vite@latest google-bookmark-plugin -- --template vue

📂 cd google-bookmark-plugin

🔧 npm install
```

### 2️⃣ 配置Vite

修改`vite.config.js`以支持Chrome扩展开发：

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        background: resolve(__dirname, 'src/background.js')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  },
  server: {
    port: 3000
  }
})
```

### 3️⃣ 创建manifest.json

在`public`目录下创建`manifest.json`文件：

```json
{
  "manifest_version": 3,
  "name": "Quick Bookmarks Retrieval",
  "version": "1.0.0",
  "description": "快速搜索和管理Chrome书签",
  "permissions": ["bookmarks"],
  "host_permissions": ["https://cn.bing.com/*", "https://*.cn.bing.net/*"],
  "background": {
    "service_worker": "background.js"
  },
  "chrome_url_overrides": {
    "newtab": "index.html"
  },
  "action": {
    "default_popup": "index.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

### 4️⃣ 创建后台脚本

在`src`目录下创建`background.js`：

```javascript
// 监听来自前端的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getBingWallpaper') {
    fetch('https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=8')
      .then(response => response.json())
      .then(data => {
        if (data && data.images && data.images.length > 0) {
          sendResponse({
            success: true,
            data: data
          });
        } else {
          sendResponse({
            success: false,
            error: '无效的必应壁纸数据'
          });
        }
      })
      .catch(error => {
        sendResponse({
          success: false,
          error: error.message
        });
      });

    // 返回true表示将异步发送响应
    return true;
  }
});
```

### 5️⃣ 开发主应用组件

在`src`目录下编辑`App.vue`，实现书签搜索和展示功能。主要功能包括：

🌄 获取并显示必应每日壁纸作为背景

📚 获取Chrome书签数据

🔍 实现书签搜索功能

📃 显示书签列表和分页加载

### 6️⃣ 创建图标生成脚本

在`scripts`目录下创建`generate-icons.js`：

```javascript
import sharp from 'sharp';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sizes = [16, 48, 128];

async function generateIcons() {
  const inputFile = join(__dirname, '..', 'public', 'icons', 'icon.svg');
  
  for (const size of sizes) {
    const outputFile = join(__dirname, '..', 'public', 'icons', `icon${size}.png`);
    await sharp(inputFile)
      .resize(size, size)
      .png()
      .toFile(outputFile);
    console.log(`Generated ${size}x${size} icon`);
  }
}

generateIcons().catch(console.error);
```

## 构建与打包

```bash
# 开发模式
🚀 npm run dev

# 构建插件
🔨 npm run build
```

构建完成后，`dist`目录包含了可以加载到Chrome的扩展文件。

## 在Chrome中加载插件

1️⃣ 🖥️ 打开Chrome浏览器，进入扩展管理页面：chrome://extensions/

2️⃣ 🛠️ 开启右上角的「开发者模式」

3️⃣ 📤 点击「加载已解压的扩展程序」

4️⃣ 📂 选择项目的dist目录

5️⃣ ✅ 现在插件已经安装到Chrome中，打开新标签页即可使用

## 调试插件

1️⃣ 🔍 在扩展管理页面点击「查看视图：背景页」调试后台脚本

2️⃣ 🛠️ 右键点击插件图标，选择「检查弹出内容」调试弹出窗口

3️⃣ 🔧 在新标签页右键选择「检查」调试新标签页

## 发布到Chrome Web Store

1️⃣ 📦 打包项目：npm run build

2️⃣ 📤 压缩dist目录为zip文件

3️⃣ 💻 在Chrome开发者控制台创建开发者账号

4️⃣ 💳 支付一次性开发者注册费

5️⃣ 📝 创建新项目并上传zip文件

6️⃣ ✅ 填写商店详情并提交审核

## 常见问题

### ❓ Q: 为什么我的插件无法获取书签数据？
💡 A: 确保在manifest.json中正确配置了"permissions": ["bookmarks"]权限。

### ❓ Q: 如何修改插件的图标？
💡 A: 替换public/icons/icon.svg文件，然后运行npm run generate-icons重新生成各尺寸图标。

### ❓ Q: 如何调试后台脚本？
💡 A: 在Chrome扩展管理页面找到你的扩展，点击「查看视图：背景页」打开开发者工具。

## 许可证

📜 MIT
