<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Resources\UserResource;

class UserController extends BaseController
{
    /**
     * Return the authenticated user's profile.
     */
    public function profile(Request $request)
    {
        return $this->sendResponse(
            new UserResource($request->user()),
            'Fetched user data'
        );
    }
}
