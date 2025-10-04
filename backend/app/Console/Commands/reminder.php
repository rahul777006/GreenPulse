<?php

namespace App\Console\Commands;
use Illuminate\Support\Facades\Http;


use Illuminate\Console\Command;
use App\Models\User;
class reminder extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reminder:send';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'This command will send the pending reminders on the given time';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        // echo "The command is working";

        $time = date('d-m-y h:i a');
        // $user = User::find(1);
        // $user->last_session = date('d-m-y h:i:s a');
        // $user->save();
        // if($user->save())
        // {
        //     echo "data updated successfully";
        // }

        $response = Http::get('http://wacloud.me/api/send.php?number=916239014926&type=text&message=test%20message *'.$time.'* &instance_id=627A843552138&access_token=a020a30eb6f42b8e230955cd91f6b11a');

		if($response['status']=='success')
		{
            \Log::info("The time is ".$time);
			// do something here  delete the reminder
		}

    }   
}
