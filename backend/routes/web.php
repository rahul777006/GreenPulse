<?php

use Illuminate\Support\Facades\Route;
Route::get('/storage-link', function () {
    Artisan::call('storage:link');
    return "Storage link created successfully!";
});


/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/
Route::group(['namespace' => 'admin'], function () {

});

Route::get('/storage-link', function () {
    Artisan::call('storage:link');
    return "Storage link created successfully!";
});


include("admin.php");
