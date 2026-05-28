<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $user = \App\Models\User::where('email', $request->email)->first();

        if (!$user || !\Illuminate\Support\Facades\Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Credenciais incorretas'], 401);
        }

        // Check se o usuário tem cargo admin
        if (!$user->hasRole('admin')) {
            return response()->json(['message' => 'Acesso negado. Essa área é restrita.'], 403);
        }

        // Cria o token de API usando Sanctum
        $token = $user->createToken('admin-auth-token')->plainTextToken;
        
        return response()->json([
            'message' => 'Successfully logged in',
            'user' => $user->load('roles'),
            'token' => $token
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }

    public function user(Request $request)
    {
        return response()->json($request->user()->load('roles'));
    }
}
