// ============================================================
// server.js — الخادم الخلفي (Backend)
// يستخدم فقط مكتبات Node.js المدمجة، بدون أي تثبيت خارجي:
//   http          : لتشغيل الخادم واستقبال الطلبات
//   node:sqlite   : قاعدة بيانات SQLite حقيقية، مدمجة بـ Node.js
//   fs, path      : لقراءة ملفات الواجهة (HTML/CSS/JS) وإرسالها للمتصفح
// ============================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const PORT = 3000;

// ============================================================
// الخطوة 1: إنشاء / فتح قاعدة البيانات
// ============================================================
const db = new DatabaseSync(path.join(__dirname, 'department.db'));

// ننشئ الجدول لو ما كان موجود من قبل (IF NOT EXISTS يمنع خطأ لو الجدول موجود مسبقًا)
db.exec(`
    CREATE TABLE IF NOT EXISTS registrations (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        fullname    TEXT NOT NULL,
        email       TEXT NOT NULL,
        phone       TEXT NOT NULL,
        inquiry     TEXT,
        message     TEXT,
        subscribe   INTEGER,
        created_at  TEXT DEFAULT CURRENT_TIMESTAMP
    )
`);

console.log('قاعدة البيانات جاهزة: department.db');


// ============================================================
// الخطوة 2: تجهيز أوامر SQL الجاهزة (Prepared Statements)
// أسرع وأأمن من بناء نص SQL يدويًا في كل مرة (يحمي من SQL Injection)
// ============================================================
const insertStmt = db.prepare(`
    INSERT INTO registrations (fullname, email, phone, inquiry, message, subscribe)
    VALUES (?, ?, ?, ?, ?, ?)
`);

const selectAllStmt = db.prepare(`SELECT * FROM registrations ORDER BY id DESC`);


// ============================================================
// الخطوة 3: دالة صغيرة لتحديد نوع الملف (لإرساله بالـ Content-Type الصحيح)
// ============================================================
function getContentType(filePath) {
    const ext = path.extname(filePath);
    const types = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
    };
    return types[ext] || 'application/octet-stream';
}


// ============================================================
// الخطوة 4: إنشاء الخادم نفسه
// ============================================================
const server = http.createServer((req, res) => {

    // ---------- المسار الأول: POST /api/register ----------
    // يستقبل بيانات النموذج من الواجهة الأمامية، ويحفظها بقاعدة البيانات
    if (req.method === 'POST' && req.url === '/api/register') {
        let body = '';

        // البيانات تصل "مقطّعة" (Streaming)، فنجمعها قطعة قطعة
        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        // لما تكتمل كل البيانات
        req.on('end', () => {
            try {
                const data = JSON.parse(body);

                // نتحقق من الحقول الإلزامية بجانب الخادم أيضًا
                // (مهم جدًا: التحقق بـ JavaScript بالمتصفح وحده غير كافٍ أبدًا،
                //  لأن أي شخص يقدر يرسل طلبًا مباشرًا للخادم متجاوزًا الواجهة كاملة)
                if (!data.fullname || !data.email || !data.phone) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: false, message: 'بيانات ناقصة' }));
                    return;
                }

                // نحفظ البيانات فعليًا بقاعدة البيانات
                insertStmt.run(
                    data.fullname,
                    data.email,
                    data.phone,
                    data.inquiry || '',
                    data.message || '',
                    data.subscribe ? 1 : 0
                );

                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: true, message: 'تم الحفظ بنجاح' }));

            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: false, message: 'خطأ بالخادم' }));
            }
        });
        return;
    }

    // ---------- المسار الثاني: GET /api/registrations ----------
    // يرجّع كل التسجيلات المحفوظة، مفيد للتحقق والعرض الإداري
    if (req.method === 'GET' && req.url === '/api/registrations') {
        const rows = selectAllStmt.all();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(rows));
        return;
    }

    // ---------- أي طلب ثاني: نتعامل معه كطلب ملف ثابت (HTML/CSS/JS) ----------
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, 'public', filePath);

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('الملف غير موجود: 404');
            return;
        }
        res.writeHead(200, { 'Content-Type': getContentType(filePath) });
        res.end(content);
    });
});


// ============================================================
// الخطوة 5: تشغيل الخادم
// ============================================================
server.listen(PORT, () => {
    console.log(`الخادم يعمل الآن على: http://localhost:${PORT}`);
});
