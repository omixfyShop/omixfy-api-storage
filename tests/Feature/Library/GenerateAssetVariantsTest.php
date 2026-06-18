<?php

use App\Features\Convert\VariantKey;
use App\Features\Convert\VariantSize;
use App\Jobs\GenerateAssetVariants;

it('does nothing when the asset no longer exists', function () {
    $job = new GenerateAssetVariants(999999, [
        VariantKey::Small->value => new VariantSize(200, 300),
    ]);

    $job->handle();
})->throwsNoExceptions();

it('dispatches variant generation instead of resizing inside the upload request', function () {
    $source = file_get_contents(app_path('Services/Asset/AssetUploadService.php'));

    expect($source)
        ->toContain('GenerateAssetVariants::dispatch')
        ->not->toContain('->generateVariants(');
});
