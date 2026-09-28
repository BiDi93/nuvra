<?php

namespace App\Support;

class QaTools
{
    public static function enabled(): bool
    {
        if (app()->environment('production')) {
            return false;
        }

        return (bool) config('nuvra.qa_tools');
    }
}
