<?php
/**
 * contact.php — دریافت پیام فرم تماس
 * ------------------------------------------------------------------
 * ۱) پیام را در فایل  data/messages.json  روی هاست ذخیره می‌کند
 *    (تا در پنل مدیریت، تب «پیام‌های تماس» نمایش داده شود)
 * ۲) یک نسخه هم به ایمیل مدیر ارسال می‌کند
 * ۳) در صورت وجود دیتابیس، پیام در جدول contacts هم ثبت می‌شود (اختیاری)
 *
 * پاسخ همیشه JSON است تا فرم سایت بدون رفتن به صفحه‌ی جدید کار کند.
 */

header('Content-Type: application/json; charset=utf-8');

/* ============ تنظیمات ============ */
$ADMIN_EMAIL = 'ghasem76@gmail.com';   // ← ایمیل مقصد
$SITE_NAME   = 'نرم‌افزار حسابداری مانگرو';
$USE_DB      = true;                    // اگر دیتابیس ندارید false کنید

$DB = [
    'host' => 'localhost',
    'user' => 'cp42498',
    'pass' => 'UJfT8GsE8K',
    'name' => 'cp42498_powerwxcel',
];

/* ============ فقط POST ============ */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'msg' => 'فقط POST مجاز است'], JSON_UNESCAPED_UNICODE);
    exit;
}

/* ============ دریافت ورودی (form-data یا JSON) ============ */
$input = $_POST;
if (empty($input)) {
    $raw = file_get_contents('php://input');
    $j = json_decode($raw, true);
    if (is_array($j)) $input = $j;
}

$name    = isset($input['name'])    ? trim(strip_tags($input['name']))    : '';
$phone   = isset($input['phone'])   ? trim(strip_tags($input['phone']))   : '';
$message = isset($input['message']) ? trim(strip_tags($input['message'])) : '';

/* ============ اعتبارسنجی ============ */
$errors = [];
if ($name === '')                       $errors[] = 'نام و نام خانوادگی الزامی است.';
if ($phone === '')                      $errors[] = 'شماره تماس الزامی است.';
if ($message === '')                    $errors[] = 'متن پیام الزامی است.';
if (mb_strlen($name) > 120)             $errors[] = 'نام بیش از حد طولانی است.';
if (mb_strlen($message) > 4000)         $errors[] = 'متن پیام بیش از حد طولانی است.';
if ($phone !== '' && !preg_match('/^[0-9+\-\s()]{7,20}$/u', $phone)) {
    $errors[] = 'شماره تماس معتبر نیست.';
}

if ($errors) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'msg' => implode(' ', $errors)], JSON_UNESCAPED_UNICODE);
    exit;
}

/* ============ ضدّ اسپم ساده: حداکثر ۱ پیام در ۳۰ ثانیه از هر IP ============ */
$ip      = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '0.0.0.0';
$dataDir = __DIR__ . '/../data';
$lockFile = $dataDir . '/.throttle_' . md5($ip);
if (is_dir($dataDir) && file_exists($lockFile) && (time() - filemtime($lockFile)) < 30) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'msg' => 'کمی صبر کنید و دوباره تلاش کنید.'], JSON_UNESCAPED_UNICODE);
    exit;
}

/* ============ ۱) ذخیره در فایل messages.json ============ */
$saved   = false;
$saveMsg = '';
$file = $dataDir . '/messages.json';

if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}

if (is_dir($dataDir) && is_writable($dataDir)) {
    $list = [];
    if (file_exists($file)) {
        $old = json_decode(@file_get_contents($file), true);
        if (is_array($old)) $list = $old;
    }
    array_unshift($list, [
        'name'    => $name,
        'phone'   => $phone,
        'message' => $message,
        'date'    => date('c'),
        'ip'      => $ip,
    ]);
    if (count($list) > 500) $list = array_slice($list, 0, 500);

    $ok = @file_put_contents(
        $file,
        json_encode($list, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
        LOCK_EX
    );
    $saved = ($ok !== false);
    if (!$saved) $saveMsg = 'خطا در نوشتن فایل پیام‌ها.';
    @touch($lockFile);
} else {
    $saveMsg = 'پوشه‌ی data قابل نوشتن نیست (CHMOD 755 یا 775 بدهید).';
}

/* ============ ۲) ارسال ایمیل به مدیر ============ */
$mailSent = false;
if (function_exists('mail')) {
    $host = isset($_SERVER['HTTP_HOST']) ? preg_replace('/[^a-zA-Z0-9\.\-]/', '', $_SERVER['HTTP_HOST']) : 'localhost';
    $from = 'no-reply@' . preg_replace('/^www\./', '', $host);

    $subject = 'پیام جدید از فرم تماس ' . $SITE_NAME;

    $body  = "<div style=\"font-family:Tahoma,Arial,sans-serif;direction:rtl;text-align:right;line-height:2\">";
    $body .= "<h2 style=\"color:#e4570e;margin:0 0 12px\">پیام جدید از سایت</h2>";
    $body .= "<p><b>نام:</b> " . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . "</p>";
    $body .= "<p><b>شماره تماس:</b> <span dir=\"ltr\">" . htmlspecialchars($phone, ENT_QUOTES, 'UTF-8') . "</span></p>";
    $body .= "<p><b>تاریخ:</b> " . date('Y-m-d H:i:s') . "</p>";
    $body .= "<hr style=\"border:none;border-top:1px solid #eee\">";
    $body .= "<p><b>متن پیام:</b><br>" . nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8')) . "</p>";
    $body .= "<hr style=\"border:none;border-top:1px solid #eee\">";
    $body .= "<p style=\"color:#888;font-size:12px\">IP: " . htmlspecialchars($ip, ENT_QUOTES, 'UTF-8') . "</p>";
    $body .= "</div>";

    $headers  = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: " . $SITE_NAME . " <" . $from . ">\r\n";
    $headers .= "Reply-To: " . $from . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $mailSent = @mail($ADMIN_EMAIL, $encodedSubject, $body, $headers, '-f' . $from);
}

/* ============ ۳) ذخیره در دیتابیس (اختیاری) ============ */
if ($USE_DB && class_exists('mysqli')) {
    try {
        $conn = @new mysqli($DB['host'], $DB['user'], $DB['pass'], $DB['name']);
        if (!$conn->connect_error) {
            $conn->set_charset('utf8mb4');
            $stmt = $conn->prepare('INSERT INTO contacts (name, phone, message) VALUES (?, ?, ?)');
            if ($stmt) {
                $stmt->bind_param('sss', $name, $phone, $message);
                @$stmt->execute();
                $stmt->close();
            }
            $conn->close();
        }
    } catch (Exception $e) {
        // دیتابیس اختیاری است؛ خطا نادیده گرفته می‌شود
    }
}

/* ============ پاسخ ============ */
if ($saved || $mailSent) {
    echo json_encode([
        'ok'    => true,
        'saved' => $saved,
        'mail'  => $mailSent,
        'msg'   => 'پیام شما با موفقیت ارسال شد. به زودی با شما تماس می‌گیریم.'
    ], JSON_UNESCAPED_UNICODE);
} else {
    http_response_code(500);
    echo json_encode([
        'ok'  => false,
        'msg' => $saveMsg !== '' ? $saveMsg : 'ارسال پیام ناموفق بود. لطفاً دوباره تلاش کنید.'
    ], JSON_UNESCAPED_UNICODE);
}
