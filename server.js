const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

// عرض واجهة المستخدم عند فتح الموقع
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// مسار معالجة التحويل وتحميل الفيديو
app.post('/convert', (req, res) => {
    const videoUrl = req.body.url;
    if (!videoUrl) {
        return res.status(400).json({ error: 'الرابط مطلوب' });
    }

    const outputFileName = `video_${Date.now()}.mp4`;
    const outputPath = path.join(__dirname, outputFileName);

    // أمر yt-dlp لتحويل الفيديو وصناعته بصيغة MP4
    const command = `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" -o "${outputPath}" "${videoUrl}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`خطأ في التحميل: ${error.message}`);
            return res.status(500).json({ error: 'فشل تحميل الفيديو، تأكد من صحة الرابط' });
        }

        // إرسال الملف للمستخدم ثم حذفه من السيرفر للحفاظ على المساحة
        res.download(outputPath, outputFileName, (err) => {
            if (err) console.error(err);
            if (fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath);
            }
        });
    });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
