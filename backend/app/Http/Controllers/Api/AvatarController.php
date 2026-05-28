<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

class AvatarController extends Controller
{
    public function index()
    {
        $avatars = [
            url('avatars/avatar1.png'),
            url('avatars/avatar2.png'),
            url('avatars/avatar3.png'),
            url('avatars/avatar4.png'),
        ];
        
        return response()->json($avatars);
    }
}
