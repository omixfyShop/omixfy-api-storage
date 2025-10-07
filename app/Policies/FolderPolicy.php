<?php

namespace App\Policies;

use App\Models\Folder;
use App\Models\User;

class FolderPolicy
{
    public function view(User $user, Folder $folder): bool
    {
        return $folder->owner_id === $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Folder $folder): bool
    {
        return $folder->owner_id === $user->id;
    }

    public function delete(User $user, Folder $folder): bool
    {
        return $folder->owner_id === $user->id;
    }

    public function restore(User $user, Folder $folder): bool
    {
        return $folder->owner_id === $user->id;
    }
}
