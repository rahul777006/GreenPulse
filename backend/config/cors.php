<?php

return [

   'paths' => ['api/*', 'farmer/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['http://localhost:8100', 'http://192.168.100.34:8100'],

    'allowed_origins_patterns' => [],

    // 👇 important part
    'allowed_headers' => ['Content-Type', 'X-Requested-With', 'Authorization', 'Accept', 'Origin', '*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
