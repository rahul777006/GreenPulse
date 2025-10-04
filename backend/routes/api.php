<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\admin\OrderController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::get('order_status_check_cron',[OrderController::class,'chkOrdersByCron']);


Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::group(['namespace' => 'api'], function () {

    // Routes that work for both guest and authenticated users
    // The 'authenticate.optional' middleware ensures that if a Bearer token is provided, the user is authenticated
    Route::middleware(['authenticate.optional'])->group(function () {

        // General API routes (accessible to all users)
        Route::get('home', 'ApiController@homepage');
        Route::post('user/signup', 'ApiController@signup');
        Route::get('user/crops/{id}', 'ApiController@getCrops');

    });


});


?>
