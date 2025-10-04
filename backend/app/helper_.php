<?php
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use App\Models\Admin;
use App\Models\User;
use App\Models\Cart;
use App\Models\Cate;
use App\Models\Size;
use App\Models\Order;
use App\Models\Product;
use App\Models\Wishlist;
use App\Models\OrderLog;
use App\Models\ProductSize;
use App\Models\ProductType;
use App\Models\UserAddress;
use App\Models\OrderProduct;
use App\Models\InventoryLog;
use App\Models\HomePageSection;
use App\Models\WalletTransaction;
use App\Models\TransactionResponse;
use App\Models\GatewayTransaction;
use App\Models\ProductNotification;
use Ixudra\Curl\Facades\Curl;
use App\Http\Controllers\admin\ShippingController;
use Illuminate\Support\Facades\Cache;
use App\Models\WhatsappLog;


function sendWhatsapp($num,$msg,$order_id = 0)
{
    // return true;
    $setting = Admin::find(1);
    $_msg = urlencode($msg);
    $api = "https://ndibs.in/api/send?number=".$num."&type=text&message=".$_msg."&instance_id=".$setting->w_instance."&access_token=".$setting->w_token;
    $api_response = Http::get($api);


     $w_log = new WhatsappLog;
    $w_log->message = $msg;
    $w_log->whatsapp_number = $num;
    $w_log->order_id = $order_id;
    $w_log->api_response = $api_response;
    $w_log->url = url()->current();
    $w_log->admin_id = Auth::guard('admin')->user() ? Auth::guard('admin')->user()->id : 0;
    $w_log->save();
}


function isAdmin()
{
    return Auth::guard('admin')->user()->id == 1 || Auth::guard('admin')->user()->id == 3 ? true : false;
}

function isDev() //is logged in user is developer
{
    return Auth::guard('admin')->user()->id == 3 ? true : false;

}

function userId()
{
    return Auth::check() ? Auth::user()->id : null;
}

function pre($arr,$exit = 1)
{
    echo "<pre>";
    print_r($arr);
    echo "</pre>";

    if($exit == 1)
    {
        exit;
    }
}

function formatDate($date,$format = 'd-m-Y')
{
    return date($format,strtotime($date));
}

function getUser($id = null)
{
    if($id) return User::find($id) ?? null;
    return Auth::check() ? Auth::user() : false;

}



// get product stock from product sizes table
function getStock($product_id, $size_id = null)
{
    // Start with the base query
    $query = ProductSize::where('product_id', $product_id);

    if (!is_null($size_id)) {
        // If a specific size ID is provided, filter by it
        $query->where('size_id', $size_id);
    }

    // Sum the 'stock' column to get the total stock
    $stock = $query->sum('stock');

    return $stock;
}

// function getSizeId($product_size_id)
// {
//     $size_id = ProductSize::find($product_size_id)->size_id;
//     return $size_id;
// }


function getLiveCategories()
{
    return Cate::where(['live'=>1,'status'=>1])->select('slug','name')->orderBy('sort_order','DESC')->get();
}

function getBalance($user_id = null)
{

    if(!$user_id) $user_id = userId(); // get from auth

    $add = WalletTransaction::where('user_id',$user_id)->where('type',1)->where('status',1)->sum('amount');
    $min = WalletTransaction::where('user_id',$user_id)->where('type',0)->where('status',1)->sum('amount');

    return $add-$min;
}

function getTransactions($user_id = null,$statuses = [0,1])
{
    if(!$user_id) $user_id = userId(); // get from auth

    return WalletTransaction::where(function($query) use($user_id,$statuses){

        if($user_id){
            $query->where('user_id',$user_id);
        }

        if(isset($_GET['from']) && $_GET['from'] !="")
        {
            $query->whereDate('wallet_transactions.created_at','>=',date('Y-m-d',strtotime($_GET['from'])));
        }

        if(isset($_GET['to']) && $_GET['to'] !="")
        {
            $query->whereDate('wallet_transactions.created_at','<=',date('Y-m-d',strtotime($_GET['to'])));
        }

        if($statuses){
            $query->whereIn('status',$statuses);
        }else
        {
            $query->where('status','!=',-1);
        }



    })
    ->leftJoin('users','wallet_transactions.user_id','=','users.id')
    ->orderBy('wallet_transactions.id','DESC')
    ->select('wallet_transactions.*','users.name as user_name','users.phone_number as user_phone_number','users.id as user_id')
    ->get();
}


function countAlerts()
{
    $count = Product::whereNotNull('stock_alert_qty')
    ->whereHas('sizes', function ($query) {
        $query->whereRaw('product_size.stock < (SELECT stock_alert_qty FROM products WHERE products.id = product_size.product_id)');
    })->count();

    return $count;
}

function getCartCount()
{
    return Cart::where('user_unique_id',session()->get('user_unique_id'))->sum('qty');
}

function getWishlistCount()
{
    return Wishlist::where('user_id',userId())->count();
}


function calcCart($cartData,$pin_code = null,$shipping_method = 'delivery')
{
    $admin = Admin::find(1);

    $sub = 0;
    $qty = 0;
    foreach($cartData as $cart)
    {
            $qty += $cart['qty'];
            $sub += ($cart['price']*$cart['qty']);
    }

    if($admin->shipping_type == 1)
    {
        $shipping_charges = $admin->shipping_charges;
    }elseif($admin->shipping_type == 2)
    {
        $shipping_charges = $qty*$admin->shipping_charges;
    }elseif($admin->shipping_type == 3)
    {
        $shipping_charges = getShippingCharges($pin_code,$shipping_method);
    }else{
        $shipping_charges = 0;
    }


    // Calculate grand total
    $grandTotal = $sub + $shipping_charges;

    // Calculate GST rate (8%)
    $gstPercentage = 0;
    $gstRate = $gstPercentage/100;

    // Calculate GST amount
    $gstAmount = $gstPercentage*$grandTotal / 100;

    // Subtract GST amount from grand total
    $grandTotal += $gstAmount;

    return [
        'gst_percentage' => $gstPercentage,
        'gst_amount' => ceil($gstAmount),
        'sub_total' => $sub,
        'shipping_charges' => $shipping_charges,
        'shipping_type'=>$admin->shipping_type,
        'grand_total' => ceil($grandTotal),
    ];
}

function getShippingCharges($pin_code,$shipping_method)
{
    if (!$pin_code) {
        return 0;
    }

    $user_id = userId();
    $total_weight = 0;
    $shippingController = new ShippingController;

    // check pin code availability
    $chk_avail = $shippingController->pinCodes($pin_code);
    if (!isset($chk_avail['delivery_codes'][0])) {
        return redirect()->back()->with('message', 'Sorry we cannot deliver to the entered pin code');
    }

    /**
     * This section of code checks whether the admin has enabled pin code-wise flat shipping.
     * It further verifies if the entered pin code is in the list of defined pin codes from the admin.
     * If the shipping method is set to 'delivery,' it adds flat charges for shipping.
     * For 'pickup' as the shipping method, it provides free shipping.
     */

      $admin = Admin::find(1);
      if($shipping_method == 'delivery')
      {
          $pin_codes_array = explode(',', $admin->pin_codes);

              if($admin->pin_code_wise_enabled == 1 && in_array($pin_code,$pin_codes_array)){
                  $total_charges = $admin->pin_wise_charges;
                    return $total_charges;
              }
      }elseif($shipping_method == 'pickup' && $admin->pickup_enabled == 1  && isLocalPinCode($pin_code)){
          return 0;
      }

    // calculate total weight of the products in cart
    $cart_products = Cart::where('user_id', $user_id)->get();
    foreach($cart_products as $cart_product)
    {
        /***
         *  check if the product has free delivery enabled
         *  calculate charges for products which have free delivery disabled
         **/

        $product = Product::find($cart_product['product_id']);
        if($product->free_delivery == 0)
        {
            $total_weight += ($product->weight_in_gms)*$cart_product['qty'];
        }
    }

    /***
     * after checking the pin code availability check if the cart has only one product and that product has free delivery enabled,
     * then return the function with 0 delivery charges
    **/

    if(count($cart_products) == 1 && $product->free_delivery == 1)
    {
        $total_charges = 0;
        return $total_charges;
    }

    $check_charges = $shippingController->calculateShipping($pin_code, $total_weight);

    if (isset($check_charges[0])) {
        return ceil($check_charges[0]['total_amount']);
    } else {
        return redirect()->back()->with('message', 'Sorry we cannot deliver to the entered pin code');
    }
}


    function getCartWeight($user_id)
    {
        $total_weight = 0;
        $cart_products = Cart::where('user_id', $user_id)->get();
        foreach($cart_products as $cart_product)
        {
            $total_weight += (Product::find($cart_product['product_id'])->weight_in_gms)*$cart_product['qty'];
        }
            return $total_weight;
    }


function statusName($status)
{
    $name = "Unknown Status";
        if($status == -1)
        {
            $name = "On Hold";
        }elseif($status == 'placed')
        {
            $name = "Placed";
        }elseif($status == 'confirmed'){
            $name = "Confirmed";
        }elseif($status == 'packed'){
            $name = "Packed";
        }elseif($status == 'shipped'){
            $name = "Shipped";
        }elseif($status == 'cancelled'){
            $name = "Cancelled";
        }elseif($status == 'returned'){
            $name = "Returned";
        }elseif($status == 'completed'){
            $name = "Completed";
        }
        return $name;
}

function orderCount($status)
{
    return Order::where('status',$status)->count();
}

function getOrderProducts($order_id)
{
    return OrderProduct::where('order_id',$order_id)->get();
}

function trimText($string, $length = 40) {
    // Check if the length of the string is greater than the specified length
    if (mb_strlen($string) > $length) {
        return mb_substr($string, 0, $length).'...';
    }

    return $string;
}

function orderAddress($order_id)
{
    return UserAddress::where('order_id',$order_id)->first();
}

function createOrderLog($order_id,$operation,$message = null)
{
    $order_log = new OrderLog;

    $order_log->order_id    = $order_id;
    $order_log->operation   = $operation;
    $order_log->message     = $message;
    $order_log->admin_id    = Auth::guard('admin')->check() ? Auth::guard('admin')->user()->id : 0;

    $order_log->save();
}

function checkPhonePeStatus($transaction_id)
{
    $merchantId= env('PHONEPE_MERCHANT_ID');
    $saltKey = env('PHONEPE_SALT_KEY');
    $saltIndex = 1;
    $xVerifyHeader = hash('sha256',env('PHONEPE_STATUS_API_ENDPOINT').$merchantId.'/'.$transaction_id.$saltKey).'###'.$saltIndex;

    $response = Curl::to(env('PHONEPE_STATUS_API_URL').$merchantId.'/'.$transaction_id)
            ->withHeader('Content-Type:application/json')
            ->withHeader('accept:application/json')
            ->withHeader('X-VERIFY:'.$xVerifyHeader)
            ->withHeader('X-MERCHANT-ID:'.$merchantId)
            ->get();

    return json_decode($response);
}

function saveTransactionResponse($data,$order_id = 0,$wallet_txn_id = 0,$log_mode = 'cron',)
{
    $TxnResponse = new TransactionResponse;

    $TxnResponse->order_id = $order_id;
    $TxnResponse->wallet_txn_id = $wallet_txn_id;
    $TxnResponse->log_mode = $log_mode;

    $TxnResponse->success = $data->success ?? null;
    $TxnResponse->code = $data->code ?? null;
    $TxnResponse->message = $data->message ?? null;

    $TxnResponse->merchantId = $data->data->merchantId ?? null;
    $TxnResponse->merchantTransactionId = $data->data->merchantTransactionId ?? null;
    $TxnResponse->transactionId = $data->data->transactionId ?? null;
    $TxnResponse->amount = $data->data->amount ?? null;
    $TxnResponse->state = $data->data->state ?? null;
    $TxnResponse->responseCode = $data->data->responseCode ?? null;

    $TxnResponse->paymentType = $data->data->paymentInstrument->type ?? null;
    $TxnResponse->utr = $data->data->paymentInstrument->utr ?? null;
    $TxnResponse->accountType = $data->data->paymentInstrument->accountType ?? null;

    $TxnResponse->save();
}

function getCategoryNames($productId) {
    // Retrieve the product by its ID
    $product = Product::findOrFail($productId);

    // Get the categories associated with the product
    $categories = $product->categories()->pluck('name')->toArray();

    return $categories;
}


function createGateWayTransactionLog($amount,$response,$user_id,$for,$order_id = 0,$wallet_txn_id = 0)
{
    $txn = new GatewayTransaction;

    $txn->success = $response->success ?? null;
    $txn->code = $response->code ?? null;
    $txn->message = $response->message ?? null;
    $txn->merchantId = $response->data->merchantId ?? null;
    $txn->merchantTransactionId = $response->data->merchantTransactionId ?? null;
    $txn->type = $response->data->instrumentResponse->type ?? null;
    $txn->url = $response->data->instrumentResponse->redirectInfo->url ?? null;

    $txn->amount = $amount;
    $txn->for = $for;
    $txn->user_id = $user_id;
    $txn->order_id = $order_id;
    $txn->wallet_txn_id = $wallet_txn_id;

    $txn->save();
}


function getGatewayTxn($order_id = null,$wallet_txn_id = null ,$user_id = null)
{
    $res = GatewayTransaction::where(function($query) use ($order_id,$wallet_txn_id,$user_id){

        if($order_id){
            $query->where('order_id',$order_id);
        }

        if($wallet_txn_id){
            $query->where('wallet_txn_id',$wallet_txn_id);
        }

        if($user_id){
            $query->where('user_id',$user_id);
        }

    })->get();

    return $res;
}

function getTransactionResponse($txn_id)
{
    return TransactionResponse::where('merchantTransactionId',$txn_id)->get();
}

function getOrderStatusLogs($id)
{
    return OrderLog::where('order_id',$id)->get();
}

function getGst($amount,$gst_percentage = null)
{
        $gst_percentage = $gst_percentage ?? env('gst');
        $price_without_gst = ($amount*100)/(100+$gst_percentage);

        $gst_amount = $amount-$price_without_gst;

        return $gst_amount/2;
}

function getShippingType()
{
    return Admin::find(1)->shipping_type;
}

function isLocalPinCode($pin_code)
{
    $admin = Admin::find(1);
    $pin_codes_array = explode(',', $admin->pin_codes);
    return in_array($pin_code,$pin_codes_array);
}

function getAdmin()
{
    return Admin::find(1);
}

function ifSalesPopupEnabled($page)
{
    $res = HomePageSection::find(1);
    return strpos($res->sales_popup_pages, $page) !== false;
}


function notifyUserforProduct($product_id)
{
    ProductNotification::where('product_id',$product_id)->update(['status'=>1]);
}

// returns product_ids
function getProductAlerts($count = false)
{
    $query = ProductNotification::where('user_id',userId())->where('status',1);
    return $count ? $query->count() : $query->pluck('product_id')->toArray();
}

function getCountryCodes()
{
        $countryCodes = ['91' => 'India (+91)','44' => 'UK (+44)','1' => 'USA (+1)','213' => 'Algeria (+213)','376' => 'Andorra (+376)','244' => 'Angola (+244)','1264' => 'Anguilla (+1264)','1268' => 'Antigua & Barbuda (+1268)','54' => 'Argentina (+54)','374' => 'Armenia (+374)','297' => 'Aruba (+297)','61' => 'Australia (+61)','43' => 'Austria (+43)','994' => 'Azerbaijan (+994)','1242' => 'Bahamas (+1242)','973' => 'Bahrain (+973)','880' => 'Bangladesh (+880)','1246' => 'Barbados (+1246)','375' => 'Belarus (+375)','32' => 'Belgium (+32)','501' => 'Belize (+501)','229' => 'Benin (+229)','1441' => 'Bermuda (+1441)','975' => 'Bhutan (+975)','591' => 'Bolivia (+591)','387' => 'Bosnia Herzegovina (+387)','267' => 'Botswana (+267)','55' => 'Brazil (+55)','673' => 'Brunei (+673)','359' => 'Bulgaria (+359)','226' => 'Burkina Faso (+226)','257' => 'Burundi (+257)','855' => 'Cambodia (+855)','237' => 'Cameroon (+237)','1' => 'Canada (+1)','238' => 'Cape Verde Islands (+238)','1345' => 'Cayman Islands (+1345)','236' => 'Central African Republic (+236)','56' => 'Chile (+56)','86' => 'China (+86)','57' => 'Colombia (+57)','269' => 'Comoros (+269)','242' => 'Congo (+242)','682' => 'Cook Islands (+682)','506' => 'Costa Rica (+506)','385' => 'Croatia (+385)','53' => 'Cuba (+53)','90392' => 'Cyprus North (+90392)','357' => 'Cyprus South (+357)','42' => 'Czech Republic (+42)','45' => 'Denmark (+45)','253' => 'Djibouti (+253)','1809' => 'Dominica (+1809)','1809' => 'Dominican Republic (+1809)','593' => 'Ecuador (+593)','20' => 'Egypt (+20)','503' => 'El Salvador (+503)','240' => 'Equatorial Guinea (+240)','291' => 'Eritrea (+291)','372' => 'Estonia (+372)','251' => 'Ethiopia (+251)','500' => 'Falkland Islands (+500)','298' => 'Faroe Islands (+298)','679' => 'Fiji (+679)','358' => 'Finland (+358)','33' => 'France (+33)','594' => 'French Guiana (+594)','689' => 'French Polynesia (+689)','241' => 'Gabon (+241)','220' => 'Gambia (+220)','7880' => 'Georgia (+7880)','49' => 'Germany (+49)','233' => 'Ghana (+233)','350' => 'Gibraltar (+350)','30' => 'Greece (+30)','299' => 'Greenland (+299)','1473' => 'Grenada (+1473)','590' => 'Guadeloupe (+590)','671' => 'Guam (+671)','502' => 'Guatemala (+502)','224' => 'Guinea (+224)','245' => 'Guinea - Bissau (+245)','592' => 'Guyana (+592)','509' => 'Haiti (+509)','504' => 'Honduras (+504)','852' => 'Hong Kong (+852)','36' => 'Hungary (+36)','354' => 'Iceland (+354)','62' => 'Indonesia (+62)','98' => 'Iran (+98)','964' => 'Iraq (+964)','353' => 'Ireland (+353)','972' => 'Israel (+972)','39' => 'Italy (+39)','1876' => 'Jamaica (+1876)','81' => 'Japan (+81)','962' => 'Jordan (+962)','7' => 'Kazakhstan (+7)','254' => 'Kenya (+254)','686' => 'Kiribati (+686)','850' => 'Korea North (+850)','82' => 'Korea South (+82)','965' => 'Kuwait (+965)','996' => 'Kyrgyzstan (+996)','856' => 'Laos (+856)','371' => 'Latvia (+371)','961' => 'Lebanon (+961)','266' => 'Lesotho (+266)','231' => 'Liberia (+231)','218' => 'Libya (+218)','417' => 'Liechtenstein (+417)','370' => 'Lithuania (+370)','352' => 'Luxembourg (+352)','853' => 'Macao (+853)','389' => 'Macedonia (+389)','261' => 'Madagascar (+261)','265' => 'Malawi (+265)','60' => 'Malaysia (+60)','960' => 'Maldives (+960)','223' => 'Mali (+223)','356' => 'Malta (+356)','692' => 'Marshall Islands (+692)','596' => 'Martinique (+596)','222' => 'Mauritania (+222)','269' => 'Mayotte (+269)','52' => 'Mexico (+52)','691' => 'Micronesia (+691)','373' => 'Moldova (+373)','377' => 'Monaco (+377)','976' => 'Mongolia (+976)','1664' => 'Montserrat (+1664)','212' => 'Morocco (+212)','258' => 'Mozambique (+258)','95' => 'Myanmar (+95)','264' => 'Namibia (+264)','674' => 'Nauru (+674)','977' => 'Nepal (+977)','31' => 'Netherlands (+31)','687' => 'New Caledonia (+687)','64' => 'New Zealand (+64)','505' => 'Nicaragua (+505)','227' => 'Niger (+227)','234' => 'Nigeria (+234)','683' => 'Niue (+683)','672' => 'Norfolk Islands (+672)','670' => 'Northern Marianas (+670)','47' => 'Norway (+47)','968' => 'Oman (+968)','680' => 'Palau (+680)','507' => 'Panama (+507)','675' => 'Papua New Guinea (+675)','595' => 'Paraguay (+595)','51' => 'Peru (+51)','63' => 'Philippines (+63)','48' => 'Poland (+48)','351' => 'Portugal (+351)','1787' => 'Puerto Rico (+1787)','974' => 'Qatar (+974)','262' => 'Reunion (+262)','40' => 'Romania (+40)','7' => 'Russia (+7)','250' => 'Rwanda (+250)','378' => 'San Marino (+378)','239' => 'Sao Tome & Principe (+239)','966' => 'Saudi Arabia (+966)','221' => 'Senegal (+221)','381' => 'Serbia (+381)','248' => 'Seychelles (+248)','232' => 'Sierra Leone (+232)','65' => 'Singapore (+65)','421' => 'Slovak Republic (+421)','386' => 'Slovenia (+386)','677' => 'Solomon Islands (+677)','252' => 'Somalia (+252)','27' => 'South Africa (+27)','34' => 'Spain (+34)','94' => 'Sri Lanka (+94)','290' => 'St. Helena (+290)','1869' => 'St. Kitts (+1869)','1758' => 'St. Lucia (+1758)','249' => 'Sudan (+249)','597' => 'Suriname (+597)','268' => 'Swaziland (+268)','46' => 'Sweden (+46)','41' => 'Switzerland (+41)','963' => 'Syria (+963)','886' => 'Taiwan (+886)','7' => 'Tajikstan (+7)','66' => 'Thailand (+66)','228' => 'Togo (+228)','676' => 'Tonga (+676)','1868' => 'Trinidad & Tobago (+1868)','216' => 'Tunisia (+216)','90' => 'Turkey (+90)','7' => 'Turkmenistan (+7)','993' => 'Turkmenistan (+993)','1649' => 'Turks & Caicos Islands (+1649)','688' => 'Tuvalu (+688)','256' => 'Uganda (+256)','380' => 'Ukraine (+380)','971' => 'United Arab Emirates (+971)','598' => 'Uruguay (+598)','7' => 'Uzbekistan (+7)','678' => 'Vanuatu (+678)','379' => 'Vatican City (+379)','58' => 'Venezuela (+58)','84' => 'Vietnam (+84)','84' => 'Virgin Islands - British (+1284)','84' => 'Virgin Islands - US (+1340)','681' => 'Wallis & Futuna (+681)','969' => 'Yemen (North)(+969)','967' => 'Yemen (South)(+967)','260' => 'Zambia (+260)','263' => 'Zimbabwe (+263)',];

        //  $cc =  Cache::rememberForever('country_codes', function () use ($countryCodes) {
        //         return $countryCodes;
        // });

        return $countryCodes;
}

function getProductTypes()
{
    return ProductType::all();
}

function escapeChar($string)
{
    $replacements = [
        '&' => ' and ',
        '"' => '-',
        '/' => '-',
        ';' => ',',
        "'" => '-',
        '\\' => '-',
        '#' => '-',
        '.' => '-',
        '(' => ' ',
        ')' => ' ',
    ];

    return str_replace(array_keys($replacements), array_values($replacements), $string);
}


// save inventory log
function saveInventoryLog($product_size_id,$qty,$type,$done_by,$notes = null,$order_product_id = 0)
{

    $product_size = ProductSize::find($product_size_id);
    $size = Size::find($product_size->size_id);
    $order_id = OrderProduct::find($order_product_id)->order_id ?? 0;

    $log                    = new InventoryLog;
    $log->product_id        = $product_size->product_id;
    $log->product_size_id   = $product_size->id;
    $log->size_name         = $size->name;
    $log->qty               = abs($qty);
    $log->type              = $type;
    $log->done_by           = $done_by;
    $log->notes             = $notes;
    $log->order_product_id  = $order_product_id;
    $log->order_id          = $order_id;
    $log->admin_id          = Auth::guard('admin')->check() ? Auth::guard('admin')->user()->id : 0;
    $log->save();

}
