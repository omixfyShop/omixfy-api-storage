<?php

declare(strict_types=1);

namespace App\Features\Convert;

final readonly class ThumbnailResult
{
    public function __construct(
        public string $path,
        public int $width,
        public int $height,
        public int $bytes,
    ) {
    }

    /**
     * @return array{path:string,width:int,height:int,bytes:int}
     */
    public function toArray(): array
    {
        return [
            'path' => $this->path,
            'width' => $this->width,
            'height' => $this->height,
            'bytes' => $this->bytes,
        ];
    }
}
