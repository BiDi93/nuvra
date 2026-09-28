<?php

namespace App\Support;

use RuntimeException;
use SimpleXMLElement;
use ZipArchive;

class PlayerEmailSheet
{
    /**
     * Read a CSV or XLSX file into rows of Vellar ID and email.
     * Header names are matched loosely. Blank rows are omitted.
     *
     * @return list<array{row: int, vellar_id: string, email: string}>
     */
    public static function read(string $path): array
    {
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $table = match ($extension) {
            'csv', 'txt' => self::readCsv($path),
            'xlsx' => self::readXlsx($path),
            default => throw new RuntimeException('The import file must be a CSV or XLSX file. Nothing was changed.'),
        };

        if ($table === []) {
            throw new RuntimeException('The import file is empty. Nothing was changed.');
        }

        $header = $table[0]['cells'];
        $vellarColumn = self::vellarColumn($header);
        $emailColumn = self::emailColumn($header);

        if ($vellarColumn === null || $emailColumn === null) {
            throw new RuntimeException('The file needs a Vellar ID column and an email column. Nothing was changed.');
        }

        $rows = [];

        foreach (array_slice($table, 1) as $record) {
            $vellarId = trim((string) ($record['cells'][$vellarColumn] ?? ''));
            $email = trim((string) ($record['cells'][$emailColumn] ?? ''));

            if ($vellarId === '' && $email === '') {
                continue;
            }

            $rows[] = [
                'row' => $record['row'],
                'vellar_id' => $vellarId,
                'email' => $email,
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

                if ($cells === [null] || $cells === false) {
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
     * @return list<array{row: int, cells: array<int, string>}>
     */
    private static function readXlsx(string $path): array
    {
        $zip = new ZipArchive;

        if ($zip->open($path) !== true) {
            throw new RuntimeException('The workbook could not be read. Nothing was changed.');
        }

        try {
            $strings = self::sharedStrings($zip);
            $sheet = self::loadXml(self::firstSheet($zip));
            $rows = [];

            foreach ($sheet->sheetData->row as $row) {
                $number = (int) $row['r'];
                $cells = [];

                foreach ($row->c as $cell) {
                    $index = self::columnIndex((string) $cell['r']);
                    $cells[$index] = self::cellValue($cell, $strings);
                }

                if ($cells === []) {
                    continue;
                }

                $highest = max(array_keys($cells));
                $ordered = [];

                for ($i = 0; $i <= $highest; $i++) {
                    $ordered[$i] = trim((string) ($cells[$i] ?? ''));
                }

                $rows[] = ['row' => $number > 0 ? $number : count($rows) + 1, 'cells' => $ordered];
            }

            return $rows;
        } finally {
            $zip->close();
        }
    }

    /**
     * @return list<string>
     */
    private static function sharedStrings(ZipArchive $zip): array
    {
        $raw = $zip->getFromName('xl/sharedStrings.xml');

        if ($raw === false) {
            return [];
        }

        $xml = self::loadXml($raw);
        $strings = [];

        foreach ($xml->si as $item) {
            if (isset($item->r)) {
                $text = '';
                foreach ($item->r as $run) {
                    $text .= (string) $run->t;
                }
                $strings[] = $text;

                continue;
            }

            $strings[] = (string) ($item->t ?? '');
        }

        return $strings;
    }

    private static function firstSheet(ZipArchive $zip): string
    {
        $workbook = $zip->getFromName('xl/workbook.xml');
        $rels = $zip->getFromName('xl/_rels/workbook.xml.rels');

        if ($workbook === false || $rels === false) {
            $fallback = $zip->getFromName('xl/worksheets/sheet1.xml');

            if ($fallback === false) {
                throw new RuntimeException('The workbook has no sheet. Nothing was changed.');
            }

            return $fallback;
        }

        $book = self::loadXml($workbook);
        $relationships = self::loadXml($rels);
        $sheet = $book->sheets->sheet[0] ?? null;

        if ($sheet === null) {
            throw new RuntimeException('The workbook has no sheet. Nothing was changed.');
        }

        $id = (string) $sheet->attributes('http://schemas.openxmlformats.org/officeDocument/2006/relationships')['id'];
        $target = null;

        foreach ($relationships->Relationship as $relationship) {
            if ((string) $relationship['Id'] === $id) {
                $target = (string) $relationship['Target'];
                break;
            }
        }

        if ($target === null || $target === '') {
            throw new RuntimeException('The workbook has no sheet. Nothing was changed.');
        }

        $target = str_replace('\\', '/', $target);
        $target = ltrim($target, '/');

        if (! str_starts_with($target, 'xl/')) {
            $target = 'xl/'.ltrim($target, '/');
        }

        $xml = $zip->getFromName($target);

        if ($xml === false) {
            throw new RuntimeException('The workbook has no sheet. Nothing was changed.');
        }

        return $xml;
    }

    /**
     * @param  list<string>  $strings
     */
    private static function cellValue(SimpleXMLElement $cell, array $strings): string
    {
        $type = (string) $cell['t'];

        if ($type === 's') {
            return $strings[(int) $cell->v] ?? '';
        }

        if ($type === 'inlineStr') {
            $text = '';
            if (isset($cell->is->r)) {
                foreach ($cell->is->r as $run) {
                    $text .= (string) $run->t;
                }

                return $text;
            }

            return (string) ($cell->is->t ?? '');
        }

        $value = (string) ($cell->v ?? '');

        if ($value !== '' && is_numeric($value) && (float) $value === floor((float) $value)) {
            return (string) (int) $value;
        }

        return $value;
    }

    private static function loadXml(string $xml): SimpleXMLElement
    {
        $xml = preg_replace('/\sxmlns="[^"]+"/', '', $xml, 1) ?? $xml;
        $parsed = simplexml_load_string($xml);

        if ($parsed === false) {
            throw new RuntimeException('The workbook could not be read. Nothing was changed.');
        }

        return $parsed;
    }

    private static function columnIndex(string $reference): int
    {
        $letters = preg_replace('/[^A-Z]/', '', strtoupper($reference)) ?? '';
        $index = 0;

        foreach (str_split($letters) as $letter) {
            $index = ($index * 26) + (ord($letter) - 64);
        }

        return max(0, $index - 1);
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
