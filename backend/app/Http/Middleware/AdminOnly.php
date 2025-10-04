<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AdminOnly
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    
    public function handle(Request $request, Closure $next)
    {
        $user = auth()->guard('admin')->user();
        if ($user->id != 1 && $user->id != 3) {
            // return redirect(env('admin').'/schedule')->with('error', 'Something went wrong.');
            return redirect()->back()->with('error', 'You are not allowed to do this action.');
        }
        return $next($request);
    }
}
