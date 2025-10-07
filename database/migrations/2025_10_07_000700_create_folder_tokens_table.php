<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('folder_tokens', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('folder_id');
            $table->char('token', 64)->unique();
            $table->boolean('can_create_subfolders')->default(true);
            $table->boolean('can_upload')->default(true);
            $table->dateTime('expires_at')->nullable();
            $table->timestamps();

            $table->foreign('folder_id')->references('id')->on('folders')->cascadeOnDelete();
            $table->index('folder_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('folder_tokens');
    }
};
