<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('teams', function (Blueprint $table) {
            $table->id();
            
            // Basic Info
            $table->string('name');
            $table->string('slug')->unique()->nullable(); // Good for SEO/Links
            $table->string('based_location')->nullable();
            $table->string('established_year')->nullable();
            
            // Visuals (Optional but recommended)
            $table->string('logo')->nullable(); // Path to image
            $table->string('primary_color')->default('#000000'); // Default Black
            $table->string('home_venue')->nullable(); 

            // Relationships
            // Assuming you have a 'coaches' or 'users' table. 
            // If your coach is just a User, change this to 'users'.
            $table->foreignId('head_coach_id')->nullable()->constrained('coaches')->onDelete('set null');

            $table->text('bio')->nullable(); // Team description
            $table->string('social_link')->nullable(); // Social Media URL

            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('teams');
    }
};