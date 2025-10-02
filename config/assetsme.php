<?php

return [
    'disk' => env('ASSETS_DISK', 'assets'),
    'base_url' => env('ASSETS_BASE_URL', env('APP_URL').'/assets'),
    'max_file_size' => (int) env('ASSETS_MAX_FILE_SIZE', 10 * 1024 * 1024),
];
