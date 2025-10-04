<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Crop;
use App\Models\User;



class ApiController extends Controller
{
    // Fetch data for the homepage, including offers and latest products
    public function homepage()
    {
     
        return response()->json([
     
        ]);
    }


    public function signup(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|max:10',
        ]);

        $user  = User::where('phone',$request->phone)->first() ?? new User;
        $user->name = $request->name;
        $user->phone = $request->phone;
        $user->state = $request->state;
        $user->city = $request->city;
        $user->address = $request->address;
        $user->latitude = $request->latitude;
        $user->longitude = $request->longitude;
        $user->save();



        return response()->json([
            'user_id' => $user->id,
        ]);

    }

    public function getCrops($user_id){

        $crops = Crop::where('user_id',$user_id)->get();

        return response()->json([
            'crops' => $crops,
        ]);

    }

    public function addCrop(Request $request){

        $crop  = new Crop;
        $crop->user_id = $request->user_id;
        $crop->cropName = $request->cropName;
        $crop->fieldName = $request->fieldName;
        $crop->fieldSize = $request->fieldSize;
        $crop->plantingDate = $request->plantingDate;
        $crop->image = $request->image;
        $crop->save();

        return response()->json([
            'message' => 'Crop added successfully',
        ]);

    }

}


