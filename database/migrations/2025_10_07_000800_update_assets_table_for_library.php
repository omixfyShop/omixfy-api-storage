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
        Schema::table('assets', function (Blueprint $table) {
            if (!Schema::hasColumn('assets', 'folder_id')) {
                $table->unsignedBigInteger('folder_id')->nullable()->after('id');
            }
            if (!Schema::hasColumn('assets', 'owner_id')) {
                $table->foreignId('owner_id')->nullable()->after('folder_id')->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('assets', 'width')) {
                $table->unsignedInteger('width')->nullable()->after('mime');
            }
            if (!Schema::hasColumn('assets', 'height')) {
                $table->unsignedInteger('height')->nullable()->after('width');
            }
            if (!Schema::hasColumn('assets', 'size_bytes')) {
                $table->unsignedBigInteger('size_bytes')->nullable()->after('height');
            }
            if (!Schema::hasColumn('assets', 'generated_thumbs')) {
                $table->json('generated_thumbs')->nullable()->after('size_bytes');
            }
        });

        Schema::table('assets', function (Blueprint $table) {
            $table->foreign('folder_id')->references('id')->on('folders')->nullOnDelete();
            $table->index(['folder_id', 'owner_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            if (Schema::hasColumn('assets', 'generated_thumbs')) {
                $table->dropColumn('generated_thumbs');
            }
            if (Schema::hasColumn('assets', 'size_bytes')) {
                $table->dropColumn('size_bytes');
            }
            if (Schema::hasColumn('assets', 'height')) {
                $table->dropColumn('height');
            }
            if (Schema::hasColumn('assets', 'width')) {
                $table->dropColumn('width');
            }
            if (Schema::hasColumn('assets', 'owner_id')) {
                $table->dropForeign(['owner_id']);
                $table->dropColumn('owner_id');
            }
            if (Schema::hasColumn('assets', 'folder_id')) {
                $table->dropForeign(['folder_id']);
                $table->dropColumn('folder_id');
            }
            if (Schema::hasColumn('assets', 'width')) {
                $table->dropColumn('width');
            }
            if (Schema::hasColumn('assets', 'height')) {
                $table->dropColumn('height');
            }
            if (Schema::hasColumn('assets', 'size_bytes')) {
                $table->dropColumn('size_bytes');
            }
            if (Schema::hasColumn('assets', 'generated_thumbs')) {
                $table->dropColumn('generated_thumbs');
            }
        });
    }
};
