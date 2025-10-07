<?php

namespace App\Providers;

use App\Models\Folder;
use App\Models\User;
use App\Policies\FolderPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Folder::class => FolderPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        Gate::define('manage-users', fn (User $user): bool => (bool) $user->is_master);
        Gate::define('toggle-registration', fn (User $user): bool => (bool) $user->is_master);
    }
}
