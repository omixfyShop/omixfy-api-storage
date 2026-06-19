<?php

return [
    'disk' => env('ASSETS_DISK', 'assets'),
    'base_url' => env('ASSETS_BASE_URL', env('APP_URL').'/assets'),
    'max_file_size' => (int) env('ASSETS_MAX_FILE_SIZE', 10 * 1024 * 1024),
    'variants' => [
        'small' => ['width' => 200, 'height' => 300],
        'medium' => ['width' => 500, 'height' => 500],
        'large' => ['width' => 1500, 'height' => 1200],
    ],
    'max_width' => (int) env('ASSETS_MAX_WIDTH', 4000),
    'max_height' => (int) env('ASSETS_MAX_HEIGHT', 4000),
    'variant_format' => env('ASSETS_VARIANT_FORMAT', 'webp'),
    'variant_quality' => (int) env('IMAGE_QUALITY', 82),
    'max_source_pixels' => (int) env('ASSETS_MAX_SOURCE_PIXELS', 24000000),
    'jpg_quality' => (int) env('ASSETS_JPG_QUALITY', 90),
    'jpg_background' => env('ASSETS_JPG_BACKGROUND', '#ffffff'),
    'ml_canvas_size' => (int) env('ASSETS_ML_CANVAS_SIZE', 1200),
    'ml_fill_ratio' => (float) env('ASSETS_ML_FILL_RATIO', 0.92),
    'ml_trim_tolerance' => (int) env('ASSETS_ML_TRIM_TOLERANCE', 18),
    'ml_quality' => (int) env('ASSETS_ML_QUALITY', 90),
    'ml_background' => env('ASSETS_ML_BACKGROUND', '#ffffff'),
];
