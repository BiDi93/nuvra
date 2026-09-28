<?php

namespace App\Support;

use RuntimeException;

class PlayerEmailSheet
{
    /**
     * Read a CSV file into rows of Vellar ID, email, and an optional collector.
     * Header names are matched loosely. Blank rows are omitted.
     *
     * @return list<array{row: int, vellar_id: string, email: string, collected_by: string}>
     */
    public static function read(string $path): array
    {
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        if (! in_array($extension, ['csv', 'txt'], true)) {
            throw new RuntimeException('The import file must be a CSV file. Nothing was changed.');
        }

        $table = self::readCsv($path);

        if ($table === []) {
            throw new RuntimeException('The import file is empty. Nothing was changed.');
        }

        $header = $table[0]['cells'];
        $vellarColumn = self::vellarColumn($header);
        $emailColumn = self::emailColumn($header);

        if ($vellarColumn === null || $emailColumn === null) {
            throw new RuntimeException('The file needs a Vellar ID column and an email column. Nothing was changed.');
        }

        $collectedColumn = self::collectedColumn($header);
        $rows = [];

        foreach (array_slice($table, 1) as $record) {
            $vellarId = trim((string) ($record['cells'][$vellarColumn] ?? ''));
            $email = trim((string) ($record['cells'][$emailColumn] ?? ''));
            $collectedBy = $collectedColumn === null
                ? ''
                : trim((string) ($record['cells'][$collectedColumn] ?? ''));

            if ($vellarId === '' && $email === '' && $collectedBy === '') {
                continue;
            }

            $rows[] = [
                'row' => $record['row'],
                'vellar_id' => $vellarId,
                'email' => $email,
                'collected_by' => $collectedBy,
            ];
        }

        return $rows;
    }

    /**
     * @return list<array{row: int, cells: array<int, string>}>
     */
    private static function readCsv(string $path): array
    {
        $handle = fopen($path, 'rb');

        if ($handle === false) {
            throw new RuntimeException('The import file could not be read. Nothing was changed.');
        }

        try {
            $sample = fgets($handle);

            if ($sample === false) {
                throw new RuntimeException('The import file is empty. Nothing was changed.');
            }

            $sample = preg_replace('/^\xEF\xBB\xBF/', '', $sample) ?? $sample;
            $delimiter = substr_count($sample, ';') > substr_count($sample, ',') ? ';' : ',';
            rewind($handle);

            $rows = [];
            $number = 0;

            while (($cells = fgetcsv($handle, null, $delimiter, '"', '\\')) !== false) {
                $number++;

                if ($cells === [null]) {
                    $rows[] = ['row' => $number, 'cells' => []];

                    continue;
                }

                $cells = array_map(fn ($cell) => trim((string) $cell), $cells);

                if ($number === 1 && isset($cells[0])) {
                    $cells[0] = preg_replace('/^\xEF\xBB\xBF/', '', $cells[0]) ?? $cells[0];
                }

                $rows[] = ['row' => $number, 'cells' => $cells];
            }

            return $rows;
        } finally {
            fclose($handle);
        }
    }

    /**
     * @param  array<int, string>  $headers
     */
    private static function vellarColumn(array $headers): ?int
    {
        $normalized = self::normalizedHeaders($headers);

        foreach ($normalized as $index => $key) {
            if ($key === 'vellarid') {
                return $index;
            }
        }

        foreach ($normalized as $index => $key) {
            if (str_contains($key, 'vellar')) {
                return $index;
            }
        }

        foreach ($normalized as $index => $key) {
            if (in_array($key, ['vid', 'playerid'], true)) {
                return $index;
            }
        }

        return null;
    }

    /**
     * @param  array<int, string>  $headers
     */
    private static function emailColumn(array $headers): ?int
    {
        $normalized = self::normalizedHeaders($headers);

        foreach ($normalized as $index => $key) {
            if ($key === 'email') {
                return $index;
            }
        }

        foreach ($normalized as $index => $key) {
            if (str_contains($key, 'email') || $key === 'mail') {
                return $index;
            }
        }

        return null;
    }

    /**
     * @param  array<int, string>  $headers
     */
    private static function collectedColumn(array $headers): ?int
    {
        $normalized = self::normalizedHeaders($headers);

        foreach ($normalized as $index => $key) {
            if (in_array($key, ['collectedby', 'collected', 'manager', 'managername', 'managerid'], true)) {
                return $index;
            }
        }

        foreach ($normalized as $index => $key) {
            if (str_contains($key, 'collected') || str_contains($key, 'manager')) {
                return $index;
            }
        }

        return null;
    }

    /**
     * @param  array<int, string>  $headers
     * @return array<int, string>
     */
    private static function normalizedHeaders(array $headers): array
    {
        $normalized = [];

        foreach ($headers as $index => $header) {
            $key = strtolower(trim((string) $header));
            $normalized[$index] = preg_replace('/[^a-z0-9]+/', '', $key) ?? '';
        }

        return $normalized;
    }
}
