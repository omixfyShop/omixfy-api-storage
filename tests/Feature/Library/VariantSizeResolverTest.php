<?php

use App\Features\Convert\VariantKey;
use App\Features\Convert\VariantSize;
use App\Features\Convert\VariantSizeResolver;

it('returns null when no variant is requested', function () {
    $resolver = new VariantSizeResolver();

    expect($resolver->resolve(null, VariantKey::Small))->toBeNull();
    expect($resolver->resolve('', VariantKey::Small))->toBeNull();
    expect($resolver->resolve('0', VariantKey::Small))->toBeNull();
    expect($resolver->resolve('off', VariantKey::Large))->toBeNull();
});

it('resolves the configured default size for "1"', function () {
    $resolver = new VariantSizeResolver();

    $size = $resolver->resolve('1', VariantKey::Medium);

    expect($size)->toBeInstanceOf(VariantSize::class)
        ->and($size->width)->toBe((int) config('assetsme.variants.medium.width'))
        ->and($size->height)->toBe((int) config('assetsme.variants.medium.height'));
});

it('parses an explicit WIDTHxHEIGHT size', function () {
    $resolver = new VariantSizeResolver();

    $size = $resolver->resolve('320x240', VariantKey::Small);

    expect($size->width)->toBe(320)
        ->and($size->height)->toBe(240);
});

it('rejects malformed sizes', function () {
    (new VariantSizeResolver())->resolve('not-a-size', VariantKey::Small);
})->throws(InvalidArgumentException::class);

it('rejects sizes beyond the configured maximum', function () {
    (new VariantSizeResolver())->resolve('99999x99999', VariantKey::Large);
})->throws(InvalidArgumentException::class);
