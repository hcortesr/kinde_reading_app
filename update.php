<?php

// Crear carpeta si no existe
$dir = __DIR__ . "/data";
if (!is_dir($dir)) {
    mkdir($dir, 0777, true);
}

// Leer JSON
$data = json_decode(file_get_contents("php://input"), true);

// Obtener valores
$username = $data['username'] ?? 'anonimo';
$text = $data['text'] ?? '';

// ⚠️ Sanitizar username (MUY importante)
$username = preg_replace('/[^a-zA-Z0-9_-]/', '', $username);

// Ruta del archivo
$file = "$dir/$username.txt";

// Guardar contenido
file_put_contents($file, $text);

echo "Guardado en archivo";
?>