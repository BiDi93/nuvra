<?php

namespace App\Notifications;

use App\Models\FootballMatch;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingStatusUpdated extends Notification implements ShouldQueue
{
    use Queueable;

    protected $match;
    protected $status; // 'approved' or 'rejected'

    public function __construct(FootballMatch $match, string $status)
    {
        $this->match = $match;
        $this->status = $status;
    }

    public function via($notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $statusWord = $this->status === 'approved' ? 'CONFIRMED' : 'REJECTED';
        $matchTitle = $this->match->title ?? ($this->match->team_a_name . ' vs ' . $this->match->team_b_name);
        
        $mail = (new MailMessage)
            ->subject("NUVRA: Booking {$statusWord} - {$matchTitle}")
            ->greeting("Hello {$notifiable->name},");

        if ($this->status === 'approved') {
            $mail->line("Great news! Your booking for the upcoming match '{$matchTitle}' has been APPROVED.")
                 ->line("Match Details:")
                 ->line("📅 Date: {$this->match->match_date}")
                 ->line("⏰ Time: {$this->match->match_time}")
                 ->line("📍 Venue: {$this->match->venue}")
                 ->line("You are now officially on the roster. We look forward to seeing you on the pitch!");
        } else {
            $mail->line("We regret to inform you that your booking request for the match '{$matchTitle}' has been REJECTED by the organizer.")
                 ->line("This is usually due to an incorrect or unverified payment receipt. Please log back into the app to check details or upload a new valid receipt.");
        }

        return $mail->action('View Match Details', url("/community/games/{$this->match->id}"))
                    ->line('Thank you for being part of the NUVRA community!');
    }

    public function toArray($notifiable): array
    {
        $matchTitle = $this->match->title ?? ($this->match->team_a_name . ' vs ' . $this->match->team_b_name);
        $statusText = $this->status === 'approved' ? 'approved' : 'rejected';
        $verbText = $this->status === 'approved' ? 'approved' : 'rejected';

        return [
            'match_id' => $this->match->id,
            'match_title' => $matchTitle,
            'status' => $statusText,
            'message' => "Your booking for '{$matchTitle}' has been {$verbText}!",
        ];
    }
}
