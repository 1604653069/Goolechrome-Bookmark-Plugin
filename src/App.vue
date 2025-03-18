<template>
  <div class="container">
    <div class="header">
      <h1>书签</h1>
    </div>
    <div class="search-bar">
      <div class="search-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>
      <input
        type="text"
        v-model="searchQuery"
        placeholder="书签"
        @input="filterBookmarks"
      />
    </div>
    
    <div class="bookmarks-grid" v-if="filteredBookmarks.length > 0">
      <div
        v-for="bookmark in displayedBookmarks"
        :key="bookmark.id"
        class="bookmark-item"
        @click="openBookmark(bookmark.url)"
        :title="bookmark.title"
      >
        <img :src="getFavicon(bookmark.url)" class="favicon" />
        <div class="bookmark-title">{{ truncateTitle(bookmark.title) }}</div>
      </div>
    </div>
    
    <!--  -->
    <div v-if="hasMoreBookmarks" class="load-more-container">
      <button class="load-more-button" @click="loadMore">加载更多</button>
    </div>
    
    <!--  -->
    <div v-else-if="hasMoreBookmarks <= 0" class="empty-state">
      <div class="empty-icon">📚</div>
      <div class="empty-text">没有更多的书签</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted,computed  } from 'vue'

const wallpaperUrl = ref('linear-gradient(to right, #4a90e2, #63b3ed)')
const isLoadingWallpaper = ref(false)
const wallpapers = ref([])
let wallpaperTimer = null
let currentWallpaperIndex = 0

const switchWallpaper = () => {
  if (wallpapers.value.length > 0) {
    currentWallpaperIndex = (currentWallpaperIndex + 1) % wallpapers.value.length
    wallpaperUrl.value = `url(${wallpapers.value[currentWallpaperIndex]})`
    
    // 触发动画重置
    document.querySelector('.container').style.animation = 'none'
    setTimeout(() => {
      document.querySelector('.container').style.animation = 'bgFade 1.5s ease-in-out'
    }, 10)
  }
}

const getBingWallpaper = async (retryCount = 2) => {
  if (retryCount < 0) {
    console.error('获取必应壁纸失败，已达到最大重试次数')
    return
  }

  isLoadingWallpaper.value = true
  
  try {
    const response = await chrome.runtime.sendMessage({ type: 'getBingWallpaper' })
    if (response.success) {
      wallpapers.value = response.data.images.map(img => 'https://cn.bing.com' + img.url)
      wallpaperUrl.value = `url(${wallpapers.value[0]})`
      
      // 启动定时器，每15秒切换一次壁纸
      if (wallpapers.value.length > 1) {
        wallpaperTimer = setInterval(switchWallpaper, 15000)
      }
    } else {
      throw new Error(response.error)
    }
  } catch (error) {
    console.warn(`获取必应壁纸失败 (重试剩余次数: ${retryCount}):`, error)
    return getBingWallpaper(retryCount - 1)
  } finally {
    isLoadingWallpaper.value = false
  }
}

const searchQuery = ref('')
const bookmarks = ref([])
const filteredBookmarks = ref([])

// 添加默认图标引用
const defaultFavicon = ref(chrome.runtime.getURL('icons/icon16.png'))
const faviconCache = ref({})

const getFavicon = (url) => {
  // 如果已经缓存过这个URL的图标，直接返回缓存结果
  if (faviconCache.value[url]) {
    return faviconCache.value[url]
  }
  
  try {
    const urlObj = new URL(url)
    // 使用本地缓存的方式获取favicon，避免直接请求可能导致的超时
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=16`
    
    // 创建一个Image对象来预加载图标，并设置超时处理
    const img = new Image()
    img.onerror = () => {
      console.warn(`无法加载图标: ${url}，使用默认图标`)
      faviconCache.value[url] = defaultFavicon.value
    }
    
    // 设置图标加载超时
    setTimeout(() => {
      if (!faviconCache.value[url]) {
        faviconCache.value[url] = defaultFavicon.value
      }
    }, 3000) // 3秒超时
    
    img.onload = () => {
      faviconCache.value[url] = faviconUrl
    }
    
    img.src = faviconUrl
    
    // 初始返回默认图标，等待异步加载完成后会自动更新
    return defaultFavicon.value
  } catch (error) {
    console.warn(`解析URL失败: ${url}`, error)
    return defaultFavicon.value
  }
}

const currentPage = ref(1)
const itemsPerPage = 9

const displayedBookmarks = computed(() => {
  return bookmarks.value.slice(0, currentPage.value * itemsPerPage)
})

const hasMoreBookmarks = computed(() => {
  const remainingBookmarks = bookmarks.value.length - displayedBookmarks.value.length
  return remainingBookmarks > 0
})

const loadMore = () => {
  if (hasMoreBookmarks.value) {
    currentPage.value++
  }
}

const filterBookmarks = () => {
  currentPage.value = 1
  const query = searchQuery.value.toLowerCase()
  const filtered = bookmarks.value.filter(bookmark => 
    bookmark.title.toLowerCase().includes(query) ||
    bookmark.url.toLowerCase().includes(query)
  )
  filteredBookmarks.value = filtered
}

const openBookmark = (url) => {
  chrome.tabs.create({ url })
}

onMounted(async () => {
  await getBingWallpaper()

onUnmounted(() => {
  if (wallpaperTimer) {
    clearInterval(wallpaperTimer)
    wallpaperTimer = null
  }
})
  
  const getBookmarksRecursively = (nodes) => {
    let result = []
    for (const node of nodes) {
      if (node.url) {
        result.push({
          id: node.id,
          title: node.title,
          url: node.url
        })
      }
      if (node.children) {
        result = result.concat(getBookmarksRecursively(node.children))
      }
    }
    return result
  }

  const tree = await chrome.bookmarks.getTree()
  bookmarks.value = getBookmarksRecursively(tree)
  filteredBookmarks.value = bookmarks.value.slice(0, 9)
})

const truncateTitle = (title) => {
  return title.length > 10 ? title.slice(0, 10) + '...' : title
}
</script>

<style>
.container {
  width: 100%;
  height: 100vh;
  font-family: system-ui, -apple-system, sans-serif;
  background: v-bind(wallpaperUrl);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  animation: bgFade 1.5s ease-in-out; /* 修改为渐变动画 */
}

/* 删除旧动画相关代码 */
@keyframes bgFade {
  0% {
    opacity: 0.8;
    filter: brightness(0.8);
  }
  50% {
    opacity: 1;
    filter: brightness(1.2);
  }
  100% {
    opacity: 1;
    filter: brightness(1);
  }
}

/* 百叶窗动画相关样式 */
.blinds-animation {
  animation: blinds-effect 1.2s ease-in-out;
}

@keyframes blinds-effect {
  0% {
    clip-path: inset(0 0 0 0);
  }
  100% {
    clip-path: inset(0 0 0 100%);
  }
}

.blinds-animation::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, 
    rgba(255,255,255,0) 0%,
    rgba(255,255,255,0.4) 50%,
    rgba(255,255,255,0) 100%);
  z-index: 10;
  animation: blinds-sweep 1.2s ease-in-out;
}



.container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  z-index: 0;
}

.container > * {
  position: relative;
  z-index: 1;
}

.header {
  text-align: center;
  margin-top: 21px;
}

.header h1 {
  color: rgba(255, 255, 255);
  font-size: 33px;
  margin: 0 0 4px 0;
}

.author {
  font-size: 12px;
  color: #666;
}

.search-bar {
  position: relative;
  margin-bottom: 32px;
  width: 100%;
  max-width: 600px;
  margin-top: 21px;
}

.search-bar input {
  width: 100%;
  height: 40px;
  padding: 8px 8px 8px 48px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: rgba(248, 248, 248, 0.3);
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.2s;
}

.search-bar input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.search-bar input:focus {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.6);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.3);
  width: 20px;
  height: 20px;
  pointer-events: none;
}

.filter-icon {
  position: absolute;
  right: 1px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  width: 20px;
  height: 20px;
}

.bookmarks-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 16px 8px; /* 底部增加8px留出滚动条空间 */
  max-height: 60vh;   /* 限制最大高度为视口的60% */
  overflow-y: auto;    /* 垂直方向自动滚动 */
  align-items: start;  /* 保持内容顶部对齐 */
}

.bookmark-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 40px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  gap: 12px;
}

.favicon {
  width: 16px;
  height: 16px;
  min-width: 16px;
  object-fit: contain;
  border-radius: 2px;
}

.bookmark-item:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  color:black;
}

.bookmark-title {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bookmark-title:hover {
  color: #000;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: #666;
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.empty-text {
  font-size: 14px;
  color: white;
}

.load-more-container {
  width: 100%;
  max-width: 800px;
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding: 0 16px;
}

.load-more-button {
  background: rgba(255, 255, 255, 0.3);
  border: none;
  border-radius: 8px;
  padding: 8px 24px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.load-more-button:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
}
</style>

/* 淡入淡出动画 */
.blinds-animation {
  animation: fade-effect 0.5s ease-in-out;
}

@keyframes fade-effect {
  0% {
    opacity: 0;
    transform: scale(0.98);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
