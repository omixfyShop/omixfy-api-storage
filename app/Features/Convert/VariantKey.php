<?php

declare(strict_types=1);

namespace App\Features\Convert;

enum VariantKey: string
{
    case Small = 'small';
    case Medium = 'medium';
    case Large = 'large';
}
