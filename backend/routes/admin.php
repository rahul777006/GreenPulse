<?php
Route::group(['namespace' => 'admin'],function(){
Route::group(['prefix' => env('admin')],function(){

    // Manage Admin Login
    Route::get('','AdminController@index');
    Route::get('login','AdminController@index')->name('login');
    Route::post('login','AdminController@login');
    Route::get('logout','AdminController@logout');


// Group middleware
Route::group(['middleware' => ['admin','admin-only']],function(){

    Route::get('setting','AdminController@edit');
    Route::post('setting','AdminController@update');
   
    
    // admin user routes list/wallet
    Route::get('user','UserController@index');
    Route::get('user/view/{id}','UserController@view');

    // push notification routes 
    Route::get('push','PushController@index');
    Route::post('push/send','PushController@sendPush');

   
    Route::get('clear_cache', function () {
        \Artisan::call('cache:clear');
        \Artisan::call('config:clear');
        \Artisan::call('view:clear');
        dd("Cache is cleared");
    });

    Route::get('send_whatsapp/{number}',function($number){
        sendWhatsapp($number,'Hello Test Message from Aqeedat');
    });


});


Route::group(['middleware' => ['admin']],function(){

 // Manage Dashboard
 Route::get('dashboard','AdminController@dashboard');
         
//  Offer Routes 
Route::resource('offer','OfferController');
Route::get('offer/delete/{id}','OfferController@delete');
Route::get('offer/status/{id}','OfferController@changeStatus');

// load products via ajax in offerproducts section 
Route::get('/ajax/products', 'ProductController@ajaxProducts')->name('ajax.products');

// Manage Category 
Route::resource('cate','CategoryController');
Route::get('cate/status/{id}','CategoryController@status');
Route::get('cate/delete/{id}','CategoryController@delete');
Route::get('cate_image/delete/{id}/{type}','CategoryController@deleteImage');

// Manage Product 
Route::resource('product','ProductController');
Route::get('product/status/{id}','ProductController@status');
Route::get('product/delete/{id}','ProductController@delete');
Route::get('delete-product-image/{id}/{type}', 'ProductController@deleteProductImage');
Route::post('product/update-sort-order', 'ProductController@updateSortOrder')->name('product.updateSortOrder');

 // Manage Carousel 
 Route::resource('coupon','CouponController');
 Route::get('coupon/status/{id}','CouponController@status');
 Route::get('coupon/delete/{id}','CouponController@delete');

// Manage Contact Page queries from contact page 
Route::resource('contact','ContactController');













 // Manage Slider 
 Route::resource('slider','SliderController');
 Route::get('slider/status/{id}','SliderController@status');
 Route::get('slider/delete/{id}','SliderController@delete');

 // Manage Carousel 
 Route::resource('carousel','CarouselController');
 Route::get('carousel/status/{id}','CarouselController@status');
 Route::get('carousel/delete/{id}','CarouselController@delete');


 // Manage Banner 
 Route::resource('banner','BannerController');
 Route::get('banner/status/{id}','BannerController@status');
 Route::get('banner/delete/{id}','BannerController@delete');


 // order routes 
 Route::resource('order','OrderController');
 Route::get('order/view/{id}','OrderController@view');
 Route::post('order_status','OrderController@changeStatus');
 Route::post('order_status_cancelled_confirm','OrderController@moveCancelledToConformed');


 Route::get('check-sms','AdminController@sendSms');
 

}); //admin guard


}); // admin prefix


}); //admin namespace

    
?>
