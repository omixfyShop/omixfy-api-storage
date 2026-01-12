<?php

return [
    'default' => 'default',

    'defaults' => [
        'routes' => [
            'api' => 'api/documentation',
            'docs' => 'docs',
            'oauth2_callback' => 'api/oauth2-callback',
            'middleware' => [
                'api' => [],
                'asset' => [],
                'docs' => [],
                'oauth2_callback' => [],
            ],
        ],

        'paths' => [
            'docs_json' => 'swagger.json',
            'docs_yaml' => 'swagger.yaml',
            'format_to_use_for_docs' => 'json',
            'docs' => storage_path('api-docs'),
            'annotations' => [
                base_path('app'),
            ],
        ],

        'scanOptions' => [
            'analyser' => null,
            'analysis' => null,
            'processors' => [],
            'pattern' => null,
            'exclude' => [],
            'open_api_spec_version' => '3.0.0',
        ],

        'generate_always' => false,
        'generate_yaml_copy' => false,
        'proxy' => false,
        'additional_config_url' => null,
        'operations_sort' => null,
        'validator_url' => null,
        'constants' => [],
    ],
];
