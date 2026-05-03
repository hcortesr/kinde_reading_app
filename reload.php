<?php

// Leer JSON
$data = json_decode(file_get_contents("php://input"), true);

// Obtener username
$username = $data['username'] ?? 'anonimo';

// Sanitizar
$username = preg_replace('/[^a-zA-Z0-9_-]/', '', $username);

// Ruta del archivo
$file = __DIR__ . "/data/$username.txt";

// Leer contenido
$text = "";

if (file_exists($file)) {
    $text = file_get_contents($file);
}

// Responder JSON
header('Content-Type: application/json');

echo json_encode([
    'text' => $text
]);

?>