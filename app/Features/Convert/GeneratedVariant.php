<?php

declare(strict_types=1);

namespace App\Features\Convert;

final readonly class GeneratedVariant
{
    public function __construct(
        public string $url,
        public string $path,
        public int $width,
        public int $height,
        public int $bytes,
        public int $requestedWidth,
        public int $requestedHeight,
    ) {
    }

    /**
     * @return array{url:string,path:string,width:int,height:int,bytes:int,requested_width:int,requested_height:int}
     */
    public function toArray(): array
    {
        return [
            'url' => $this->url,
            'path' => $this->path,
            'width' => $this->width,
            'height' => $this->height,
            'bytes' => $this->bytes,
            'requested_width' => $this->requestedWidth,
            'requested_height' => $this->requestedHeight,
        ];
    }
}
