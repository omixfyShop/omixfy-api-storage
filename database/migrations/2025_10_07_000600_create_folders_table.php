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
        Schema::create('folders', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->string('slug');
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->enum('access_level', ['private', 'token', 'public'])->default('private');
            $table->json('preview_asset_ids')->nullable();
            $table->unsignedInteger('depth')->default(0);
            $table->unsignedInteger('files_count')->default(0);
            $table->unsignedInteger('folders_count')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('parent_id')->references('id')->on('folders')->nullOnDelete();
            $table->index(['parent_id', 'owner_id', 'slug']);
            $table->index(['owner_id', 'depth']);
            $table->index('deleted_at');
            $table->index('name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('folders');
    }
};
