<?php
/**
 * save_content.php — ذخیره‌ی داده‌ی محتوای سایت روی هاست (اختیاری)
 * ---------------------------------------------------------------
 * از پنل مدیریت (در صورت فعال بودن PHP روی هاست) محتوای ویرایش‌شده را
 * به شکل JSON دریافت و در فایل  data/content.json  ذخیره می‌کند تا
 * برای همه‌ی بازدیدکننده‌ها اعمال شود.
 *
 * کاربرد (Post):
 *   POST  /php/save_content.php
 *   Header:  X-Auth-Token: <TOKEN>
 *   Body :    JSON کامل داده‌ی content.json
 *
 * توجه: برای امنیت، مقدار TOKEN پایین را حتماً تغییر دهید و در پنل
 * مدیریت هم همان را وارد کنید.
 */
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'msg' => 'فقط POST مجاز است']);
    exit;
}

$TOKEN = 'mangro-save-v1'; // ← این توکن را تغییر دهید

$auth = isset($_SERVER['HTTP_X_AUTH_TOKEN']) ? $_SERVER['HTTP_X_AUTH_TOKEN'] : '';
if ($auth !== $TOKEN) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'msg' => 'دسترسی غیرمجاز']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if ($data === null || !is_array($data)) {
    echo json_encode(['ok' => false, 'msg' => 'داده‌ی نامعتبر']);
    exit;
}

$dir = __DIR__ . '/../data';
$file = $dir . '/content.json';

if (!is_dir($dir) || !is_writable($dir)) {
    echo json_encode(['ok' => false, 'msg' => 'پوشه‌ی data قابل نوشتن نیست. اجازه‌ی نوشتن (CHMOD 755 یا 775) بدهید.']);
    exit;
}

$json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
if (file_put_contents($file, $json, LOCK_EX) === false) {
    echo json_encode(['ok' => false, 'msg' => 'خطا در نوشتن فایل']);
    exit;
}

echo json_encode(['ok' => true, 'msg' => 'ذخیره شد']);
