const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// تقديم واجهة المستخدم مباشرة عند فتح رابط الموقع
app.use(express.static(__dirname));

// نقطة النهاية (API) لاستخراج رابط الـ MP4 المباشر من أي منصة
app.post('/convert', (req, res) => {
    const videoUrl = req.body.url;
    
    if (!videoUrl) {
        return res.status(400).json({ success: false, error: 'الرجاء إدخال رابط الفيديو بشكل صحيح' });
    }

    // تحديد مسار yt-dlp المحلي الذي يتم تثبيته عبر --user على سيرفرات السحابية
    const homeDir = process.env.HOME || '/root';
    const ytDlpBin = path.join(homeDir, '.local', 'bin', 'yt-dlp');
    
    // محاولة استخدام المسار المحلي أولاً، أو الأمر المباشر إذا كان متاحاً في النظام
    const command = `python3 -m yt_dlp -g -f "best[ext=mp4]/best" --no-warnings "${videoUrl}" || yt-dlp -g -f "best[ext=mp4]/best" --no-warnings "${videoUrl}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error("خطأ المعالجة:", stderr || error.message);
            return res.status(500).json({ 
                success: false, 
                error: 'عذراً، فشل استخراج الرابط. تأكد من أن الرابط عام ويدعم التحميل.' 
            });
        }
        
        // جلب أول رابط صالح من مخرجات الأداة
        const directUrl = stdout.trim().split('\n')[0];
        
        if (directUrl) {
            res.json({ success: true, mp4Url: directUrl });
        } else {
            res.status(500).json({ success: false, error: 'لم يتم العثور على رابط مباشر صالح لهذا الفيديو.' });
        }
    });
});

// تحديد المنفذ (يدعم التوافق مع الاستضافات السحابية تلقائياً)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running smoothly on port ${PORT}`);
});
