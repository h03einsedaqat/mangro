<?php
/**
 * messages.php — خواندن و حذف پیام‌های فرم تماس برای پنل مدیریت
 * ------------------------------------------------------------------
 *   GET  /php/messages.php?token=TOKEN                → لیست پیام‌ها
 *   POST /php/messages.php   (X-Auth-Token: TOKEN)
 *        {"action":"delete","index":0}                → حذف یک پیام
 *        {"action":"clear"}                           → حذف همه
 *
 * توکن باید با توکنی که در پنل مدیریت وارد می‌کنید یکی باشد
 * (همان توکن save_content.php).
 */

header('Content-Type: application/json; charset=utf-8');

$TOKEN = 'mangro-save-v1'; // ← همان توکن save_content.php را بگذارید

$file = __DIR__ . '/../data/messages.json';

function readMessages($file) {
    if (!file_exists($file)) return [];
    $d = json_decode(@file_get_contents($file), true);
    return is_array($d) ? $d : [];
}

function writeMessages($file, $list) {
    return @file_put_contents(
        $file,
        json_encode(array_values($list), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
        LOCK_EX
    ) !== false;
}

/* ---------- خواندن ---------- */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $t = isset($_GET['token']) ? $_GET['token'] : '';
    if ($t !== $TOKEN) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'msg' => 'دسترسی غیرمجاز'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    echo json_encode(['ok' => true, 'items' => readMessages($file)], JSON_UNESCAPED_UNICODE);
    exit;
}

/* ---------- حذف ---------- */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $auth = isset($_SERVER['HTTP_X_AUTH_TOKEN']) ? $_SERVER['HTTP_X_AUTH_TOKEN'] : '';
    if ($auth !== $TOKEN) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'msg' => 'دسترسی غیرمجاز'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $body = json_decode(file_get_contents('php://input'), true);
    $action = isset($body['action']) ? $body['action'] : '';
    $list = readMessages($file);

    if ($action === 'clear') {
        $list = [];
    } elseif ($action === 'delete' && isset($body['index'])) {
        $i = (int) $body['index'];
        if ($i >= 0 && $i < count($list)) array_splice($list, $i, 1);
    } else {
        echo json_encode(['ok' => false, 'msg' => 'دستور نامعتبر'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (writeMessages($file, $list)) {
        echo json_encode(['ok' => true, 'items' => $list], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['ok' => false, 'msg' => 'خطا در نوشتن فایل پیام‌ها'], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

http_response_code(405);
echo json_encode(['ok' => false, 'msg' => 'متد مجاز نیست'], JSON_UNESCAPED_UNICODE);
