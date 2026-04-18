<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    protected $fillable = ['name'];

    public function passkeys(): HasMany
    {
        return $this->hasMany(Passkey::class);
    }

    public function recoveryCredential(): HasOne
    {
        return $this->hasOne(UserRecoveryCredential::class);
    }

    public function spaces(): BelongsToMany
    {
        return $this->belongsToMany(Space::class, 'space_users')->withPivot('role');
    }
}
