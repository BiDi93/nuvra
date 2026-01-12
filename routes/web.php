<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// This tells Laravel to hand over any unknown URL to React
Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '.*');