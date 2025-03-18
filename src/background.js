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