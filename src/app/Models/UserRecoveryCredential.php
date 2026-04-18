<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserRecoveryCredential extends Model
{
    protected $fillable = ['user_id', 'email', 'password_hash'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
