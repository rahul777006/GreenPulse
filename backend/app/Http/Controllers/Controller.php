<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Support\Facades\Http;
use App\Models\Admin;

class Controller extends BaseController
{
    use AuthorizesRequests, DispatchesJobs, ValidatesRequests;
    
	public function formatDate($date)
	{
		return [
            'timestamp' => date('Y-m-d H:i:s',strtotime($date)),
            'date_1'    => date('d,M Y',strtotime($date)),
            'date_2'    => date('d-m-Y',strtotime($date)),
        ];
	}

    public function sendWhatsapp($num,$msg="")
    {
        $msg = urlencode($msg);
        // $api = 'http://ssd.in.net/api/send.php?number='.$num.'&type=text&message='.$msg.'&instance_id='.$setting['w_instance'].'&access_token='.$setting['w_token'];
        // $api = "https://pusender.com/api/send.php?number=91".$num."&type=text&message=".$msg."&instance_id=6364C0F7CE717&access_token=68db23a2810cbc4e610b98b5c81ca1b3";
        return Http::get($api);

    }



}
