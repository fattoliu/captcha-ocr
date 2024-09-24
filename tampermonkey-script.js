/*
  油猴脚本：
  1. 安装 tampermonkey 插件
  2. 安装脚本
  3. 修改用户名、密码的元素 id
  4. 修改脚本中的 ocr 服务地址
  5. 打开需要自动填充的网站
  6. 点击登录按钮
*/

// ==UserScript==
// @name         自动填充登录信息
// @namespace    http://tampermonkey.net/
// @version      2024-09-24
// @description  打开页面时自动填写用户名、密码及验证码
// @author       fatto
// @match        *://*/* // 这里填写需要自动填充的网站
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

function getBase64Image(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const dataURL = canvas.toDataURL("image/png"); // 将图片转为base64格式
  return dataURL;
}

(function() {
  'use strict';

  // 自动填充用户名
  const usernameField = document.getElementById('username');
  if (usernameField) {
      usernameField.value = "xxxxxx"; // 在这里填写你的用户名
  }

  // 自动填充密码
  const passwordField = document.getElementById('password');
  if (passwordField) {
      passwordField.value = "******"; // 在这里填写你的密码
  }
  // 获取验证码图片
  const captchaImg = document.getElementById('vali');
  const base64Image = getBase64Image(captchaImg);
  // 调用 nodejs 启动的 ocr服务
  fetch('http://*.*.*.*:xxxx/ocr', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({base64Image: base64Image})
  })
  .then(response => response.json())
  .then(data => {
      console.log('===== data ===== ', data.captcha)
      // 自动填充验证码
      const verifyCodeField = document.getElementById('verifyCode');
      if (verifyCodeField) {
          verifyCodeField.value = data.captcha;
      }
  })
  .catch(error => {
      console.log('识别失败...', error)
  })

})();
