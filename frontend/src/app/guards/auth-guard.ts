import { CanActivateFn, Router } from '@angular/router';

export const AuthGuard: CanActivateFn = (route, state) => {
  const user_id = localStorage.getItem('user_id'); // Check if user user_id exists

  if (user_id) {
    return true; // Allow access
  } else {
    const router = new Router(); // Manually create Router instance
    router.navigate(['/signup']); // Redirect to login page
    return false;
  }
};