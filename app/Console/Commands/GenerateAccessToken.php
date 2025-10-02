<?php

namespace App\Console\Commands;

use App\Models\AccessToken;
use App\Models\User;
use Illuminate\Console\Command;

class GenerateAccessToken extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'assetsme:token {user : ID ou e-mail do usuário} {--name= : Nome opcional para identificar o token}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Gera um token de acesso permanente vinculado ao usuário informado.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $identifier = (string) $this->argument('user');

        $user = User::query()
            ->where(function ($query) use ($identifier) {
                $query->where('email', $identifier);

                if (is_numeric($identifier)) {
                    $query->orWhere('id', (int) $identifier);
                }
            })
            ->first();

        if (! $user) {
            $this->error('Usuário não encontrado. Informe um ID numérico ou e-mail válido.');

            return static::FAILURE;
        }

        $name = $this->option('name');
        if (is_string($name)) {
            $name = trim($name);
            if ($name === '') {
                $name = null;
            }
        } else {
            $name = null;
        }

        [$token, $plainToken] = AccessToken::createForUser($user, $name);

        $this->info(sprintf('Token criado para %s (ID %d).', $user->email, $user->id));
        $this->newLine();
        $this->line('<comment>'.$plainToken.'</comment>');
        $this->newLine();
        $this->warn('Guarde este token — ele não será exibido novamente.');

        return static::SUCCESS;
    }
}
