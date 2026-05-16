<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$word = isset($_GET['word']) ? trim($_GET['word']) : '';

if (empty($word)) {
    echo json_encode(['error' => 'No word provided']);
    exit;
}

$url = 'https://jisho.org/api/v1/search/words?keyword=' . urlencode($word);

error_log($url);
error_log("azdsf");

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 8);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$error    = curl_error($ch);

error_log($response);
error_log(gettype($response));

if ($error) {
    echo json_encode(['error' => $error]);
    exit;
}

header('Content-Type: application/json');
echo $response;