<?php
/*
Plugin Name: Absensi Bubs
Plugin URI: https://example.com/absensi-bubs
Description: Plugin untuk sistem absensi sekolah Bubs.
Version: 1.0
Author: Nama Anda
License: GPL2
*/

defined('ABSPATH') || exit;

require_once plugin_dir_path(__FILE__) . 'model.php';
require_once plugin_dir_path(__FILE__) . 'controller.php';

add_action('rest_api_init', function () {
  register_rest_route('expenses/v1', '/all', [
    'methods'  => 'GET',
    'callback' => [new Expenses_Controller(), 'get_all'],
    'permission_callback' => '__return_true' // <- untuk testing tanpa auth, nanti diganti ya
  ]);

  register_rest_route('expenses/v1', '/add', [
    'methods'  => 'POST',
    'callback' => [new Expenses_Controller(), 'add'],
    'permission_callback' => '__return_true' // <- nanti diganti auth ya
    ]);

    register_rest_route('expenses/v1', '/delete/(?P<id>\d+)', [
        'methods'  => 'DELETE',
        'callback' => [new Expenses_Controller(), 'delete'],
        'permission_callback' => '__return_true' // untuk testing tanpa auth
        ]);

        register_rest_route('expenses/v1', '/update/(?P<id>\d+)', [
            'methods'  => 'PUT',
            'callback' => [new Expenses_Controller(), 'update'],
            'permission_callback' => '__return_true' // untuk sementara tanpa auth
            ]);


});

add_action('send_headers', function() {
    // Ganti '*' dengan origin spesifik jika perlu keamanan lebih
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Headers: Authorization, Content-Type");
});