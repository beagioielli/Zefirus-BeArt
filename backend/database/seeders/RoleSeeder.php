<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use App\Models\User;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $customer = Role::firstOrCreate(['name' => 'customer']);

        $user = User::firstOrCreate([
            'email' => 'admin@zefirus.com'
        ], [
            'name' => 'Admin Zefirus',
            'password' => bcrypt('password')
        ]);
        
        if (!$user->hasRole('admin')) {
            $user->assignRole($admin);
        }
    }
}
