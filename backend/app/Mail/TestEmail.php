<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Sichikawa\LaravelSendgridDriver\SendGrid;


class TestEmail extends Mailable
{
    use SendGrid, Queueable, SerializesModels;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct()
    {
        //
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        // $from = 'noreply@bdc.in.net';
        // $address = 'rahul@hispirits.biz';
        // $subject = 'This is a demo!';
        // $name = 'Balaji';

    //     return $this->view('admin.test_mail')
    //                 ->from($from, $name)
    //                 // ->cc($address, $name)
    //                 ->to($address, $name)
    //                 ->replyTo($from, $name)
    //                 ->subject($subject)
    //                 ->attach(Asset('admin_assets/app-assets/images/login.jpg'))
    //                 ->with([ 'test_message' => 'Hellllo' ]);
    // return $this;
    }
}
