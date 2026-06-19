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
    'derivative_default_format' => env('ASSETS_DERIVATIVE_DEFAULT_FORMAT', 'jpg'),
    'derivative_default_quality' => (int) env('ASSETS_DERIVATIVE_DEFAULT_QUALITY', 90),
    'derivative_default_background' => env('ASSETS_DERIVATIVE_DEFAULT_BACKGROUND', 'ffffff'),
    'derivative_default_fill' => (float) env('ASSETS_DERIVATIVE_DEFAULT_FILL', 0.92),
    'derivative_trim_tolerance' => (int) env('ASSETS_DERIVATIVE_TRIM_TOLERANCE', 18),
    'derivative_max_size' => (int) env('ASSETS_DERIVATIVE_MAX_SIZE', 4000),
];
