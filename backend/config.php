<?php
return [
    'api_key' => getenv('CBC_API_KEY') ?: 'change-me',
    'allow_origin' => getenv('CBC_ALLOW_ORIGIN') ?: '*',
];
