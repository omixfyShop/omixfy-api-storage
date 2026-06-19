<?php

use App\Features\Convert\ImageDerivativeSpecResolver;

it('defaults to a format-only spec when no size is given', function () {
    $spec = (new ImageDerivativeSpecResolver())->resolve([]);

    expect($spec->isFormatOnly())->toBeTrue()
        ->and($spec->format)->toBe('jpg')
        ->and($spec->cacheSuffix())->toBe('jpg');
});

it('treats size zero as format-only', function () {
    $spec = (new ImageDerivativeSpecResolver())->resolve(['size' => '0']);

    expect($spec->isFormatOnly())->toBeTrue()
        ->and($spec->cacheSuffix())->toBe('jpg');
});

it('builds an adequation spec encoding every parameter in the cache suffix', function () {
    $spec = (new ImageDerivativeSpecResolver())->resolve([
        'size' => '1200',
        'fill' => '0.92',
        'bg' => 'ffffff',
        'square' => '1',
    ]);

    expect($spec->isFormatOnly())->toBeFalse()
        ->and($spec->size)->toBe(1200)
        ->and($spec->cacheSuffix())->toBe('d1200f92q90sbffffff');
});

it('produces distinct cache suffixes for distinct specs', function () {
    $resolver = new ImageDerivativeSpecResolver();

    $a = $resolver->resolve(['size' => '1200', 'fill' => '0.92', 'bg' => 'ffffff', 'square' => '1']);
    $b = $resolver->resolve(['size' => '800', 'fill' => '0.80', 'bg' => '000000', 'square' => '0']);

    expect($a->cacheSuffix())->not->toBe($b->cacheSuffix());
});

it('normalizes the background hex and strips any leading hash', function () {
    $spec = (new ImageDerivativeSpecResolver())->resolve(['size' => '600', 'bg' => '#ABCDEF']);

    expect($spec->background)->toBe('abcdef')
        ->and($spec->cacheSuffix())->toContain('babcdef');
});

it('rejects an unsupported format', function () {
    (new ImageDerivativeSpecResolver())->resolve(['format' => 'tiff']);
})->throws(InvalidArgumentException::class);

it('rejects a non-numeric size', function () {
    (new ImageDerivativeSpecResolver())->resolve(['size' => 'big']);
})->throws(InvalidArgumentException::class);

it('rejects a size beyond the configured maximum', function () {
    (new ImageDerivativeSpecResolver())->resolve(['size' => '999999']);
})->throws(InvalidArgumentException::class);

it('rejects a fill outside the (0, 1] range', function () {
    (new ImageDerivativeSpecResolver())->resolve(['size' => '600', 'fill' => '1.5']);
})->throws(InvalidArgumentException::class);

it('rejects an invalid background hex', function () {
    (new ImageDerivativeSpecResolver())->resolve(['size' => '600', 'bg' => 'zzz']);
})->throws(InvalidArgumentException::class);

it('rejects an invalid square flag', function () {
    (new ImageDerivativeSpecResolver())->resolve(['square' => 'maybe']);
})->throws(InvalidArgumentException::class);
