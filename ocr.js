const express = require('express');
const cors = require('cors');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const os = require('os');

const app = express();
const port = 36360;

// 获取本机IP地址
const getLocalIPAddress = () => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
};

const host = getLocalIPAddress();

// 启用CORS，允许所有来源
app.use(cors({
    origin: '*', // 允许所有来源
    optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' })); // 解析JSON请求体，限制大小为10MB

// 声明一个可以调用的接口，接收到的验证码图片为base64
app.post('/ocr', async (req, res) => {
    const { base64Image } = req.body;

    if (!base64Image) {
        return res.status(400).send({ error: 'No image provided' });
    }

    try {
        // 去掉base64前缀
        const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
        
        // 将base64图片转换为Buffer
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // 定义不同的图像处理方案
        const processingOptions = [
            { grayscale: true, median: 3, threshold: 150, normalize: true },
            { grayscale: true, median: 5, threshold: 180, normalize: true },
            { grayscale: true, median: 3, threshold: 120, normalize: false },
            { grayscale: true, median: 5, threshold: 200, normalize: false },
            { grayscale: true, median: 7, threshold: 170, normalize: true }
        ];

        let filteredText = '';
        const maxAttempts = processingOptions.length;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const options = processingOptions[attempt];

            // 使用sharp进行图像处理
            let processedImage = sharp(imageBuffer).grayscale(options.grayscale);
            if (options.median) processedImage = processedImage.median(options.median);
            if (options.threshold) processedImage = processedImage.threshold(options.threshold);
            if (options.normalize) processedImage = processedImage.normalize();

            const processedImageBuffer = await processedImage.toBuffer();

            // 使用tesseract.js识别验证码，设置字符白名单
            const { data: { text } } = await Tesseract.recognize(processedImageBuffer, 'eng', {
                tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
                tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE, // 设置页面分割模式为单行
                logger: m => console.log(m) // 可选：用于调试
            });

            // 过滤识别结果中的非字母和数字字符
            filteredText = text.replace(/[^A-Za-z0-9]/g, '').trim();

            // 如果结果为4位，跳出循环
            if (filteredText.length === 4) {
                break;
            }
        }

        // 后处理步骤：纠正常见的错误
        filteredText = filteredText.replace(/A/g, '4');

        // 返回识别结果
        console.log('===', filteredText);
        res.send({ captcha: filteredText });
    } catch (error) {
        console.error('Error recognizing captcha:', error);
        res.status(500).send({ error: 'Failed to recognize captcha' });
    }
});

app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
