<?php

namespace App\Support;

use RuntimeException;

class MasterbaseWorkbook
{
    /**
     * Absolute path of the player workbook. It is not stored in the repository.
     */
    public static function path(): string
    {
        $configured = config('nuvra.masterbase_path');

        if (! is_string($configured) || trim($configured) === '') {
            throw new RuntimeException('Set NUVRA_MASTERBASE_PATH to the masterbase workbook. That file is not stored in the repository.');
        }

        $configured = trim($configured);

        if (! is_file($configured)) {
            throw new RuntimeException('Masterbase workbook was not found at NUVRA_MASTERBASE_PATH. Put the file outside the repository and point the variable at it.');
        }

        $real = realpath($configured);
        $root = realpath(base_path());

        if ($real === false || $root === false || $real === $root || str_starts_with($real, $root.DIRECTORY_SEPARATOR)) {
            throw new RuntimeException('NUVRA_MASTERBASE_PATH must point to a file outside the repository.');
        }

        return $real;
    }
}
