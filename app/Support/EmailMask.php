<?php

namespace App\Support;

class EmailMask
{
    /**
     * A short mask for audit storage. The full address is never kept.
     */
    public static function mask(?string $email): string
    {
        $email = strtolower(trim((string) $email));

        if ($email === '' || ! str_contains($email, '@')) {
            return '(none)';
        }

        [$local, $domain] = explode('@', $email, 2);
        $localMask = mb_substr($local, 0, 1).'***';
        $parts = explode('.', $domain);
        $tld = array_pop($parts);
        $host = implode('.', $parts);
        $hostMask = $host === '' ? '*' : mb_substr($host, 0, 1).'***';

        return $localMask.'@'.$hostMask.'.'.$tld;
    }
}
