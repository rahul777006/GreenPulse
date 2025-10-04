<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckDealerApproval
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle($request, Closure $next)
    {
        $user = auth()->user();
        if ($user && !$user->is_approved) {
            return redirect()->route('dashboard')->with('error', 'Your account is still under approval.');
        }
        return $next($request);
    }
}
