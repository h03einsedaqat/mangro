<?php
// ===== تنظیم هدر برای UTF-8 (نمایش صحیح در مرورگر) =====
header('Content-Type: text/html; charset=utf-8');

// ===== تنظیمات اتصال به دیتابیس =====
$servername = "localhost";
$username   = "cp42498";
$password   = "UJfT8GsE8K";
$dbname     = "cp42498_powerwxcel";

// ایجاد اتصال
$conn = new mysqli($servername, $username, $password, $dbname);

// بررسی اتصال
if ($conn->connect_error) {
    die("اتصال به دیتابیس: " . $conn->connect_error);
}

// ===== تنظیم کدگذاری اتصال به UTF-8 (برای ذخیره و خواندن صحیح فارسی) =====
$conn->set_charset("utf8mb4");

// ===== دریافت داده‌های ارسال‌شده از فرم =====
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // دریافت و پاکسازی ورودی‌ها
    $name    = htmlspecialchars(trim($_POST['name']));
    $phone   = htmlspecialchars(trim($_POST['phone']));
    $message = htmlspecialchars(trim($_POST['message']));

    // اعتبارسنجی ساده
    $errors = [];
    if (empty($name))    $errors[] = "نام و نام خانوادگی الزامی است.";
    if (empty($phone))   $errors[] = "شماره تماس الزامی است.";
    if (empty($message)) $errors[] = "متن پیام الزامی است.";

    if (count($errors) > 0) {
        echo "<h3>❌ خطا در ارسال فرم:</h3><ul>";
        foreach ($errors as $error) {
            echo "<li>$error</li>";
        }
        echo "</ul><a href='javascript:history.back()'>بازگشت به فرم</a>";
        exit;
    }

    // ===== ذخیره در دیتابیس =====
    $stmt = $conn->prepare("INSERT INTO contacts (name, phone, message) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $name, $phone, $message);

    if ($stmt->execute()) {
        // نمایش پیام موفقیت با استایل زیبا
        echo '<!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>پیام ارسال شد</title>
            <style>
                body { font-family: system-ui, sans-serif; background: #f8f9fa; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; direction: rtl; }
                .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
                .btn { display: inline-block; margin-top: 20px; padding: 12px 35px; background: #FF9800; color: white; text-decoration: none; border-radius: 50px; font-weight: 600; }
                .btn:hover { background: #e68900; }
                .icon { font-size: 50px; }
                .green { color: #28a745; }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="icon green">✅</div>
                <h2 style="color:#28a745;">پیام شما با موفقیت ذخیره شد.</h2>
                <p>از اعتماد شما سپاسگزاریم. به زودی با شما تماس می‌گیریم.</p>
                <a href="../index.html" class="btn">بازگشت به صفحه اصلی</a>
            </div>
        </body>
        </html>';
    } else {
        // نمایش پیام خطا
        echo '<!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>خطا</title>
            <style>
                body { font-family: system-ui, sans-serif; background: #f8f9fa; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; direction: rtl; }
                .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); text-align: center; max-width: 500px; }
                .btn { display: inline-block; margin-top: 20px; padding: 12px 35px; background: #dc3545; color: white; text-decoration: none; border-radius: 50px; font-weight: 600; }
                .btn:hover { background: #c82333; }
                .icon { font-size: 50px; }
                .red { color: #dc3545; }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="icon red">❌</div>
                <h2 style="color:#dc3545;">خطا در ذخیره پیام.</h2>
                <p>لطفاً دوباره تلاش کنید.</p>
                <a href="javascript:history.back()" class="btn">بازگشت به فرم</a>
            </div>
        </body>
        </html>';
    }

    $stmt->close();
    $conn->close();
} else {
    header("Location: ../index.html");
    exit;
}
?>