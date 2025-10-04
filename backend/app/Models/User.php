<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;
    
    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function address(){
        return $this->hasOne(UserAddress::class)->latestOfMany();
    }

    
    public function getAll()
    {
        return User::select('users.*')
            ->withCount('orders') // This will add the 'orders_count' attribute to each user
            ->where(function($query){
                if(isset($_GET['name']) && $_GET['name'] != ""){
                    $query->where('name', 'LIKE', '%' . $_GET['name'] . '%');
                }
    
                if(isset($_GET['phone']) && $_GET['phone'] != ""){
                    $query->where(function ($q) {
                        $q->where('phone_number', $_GET['phone'])
                          ->orWhere('whatsapp_number', $_GET['phone']);
                    });
                }
            })
            ->latest()
            ->paginate(100);
    }

    public function getHomeData()
    {

        $qr_codes = QrCode::where('user_id',userId())->get();

        foreach ($qr_codes as $key => $qr_code) {
            $qr_code->details =   QrCodeDetail::where('qr_code_id',$qr_code->id)->first();
        }

        $alerts = Alert::where('user_id',userId())->latest('created_at')->limit(5)->get();

        return ['qr_codes'=>$qr_codes,'alerts'=>$alerts];

    }

    // public function routeNotificationFor(){
        
    // }


}


