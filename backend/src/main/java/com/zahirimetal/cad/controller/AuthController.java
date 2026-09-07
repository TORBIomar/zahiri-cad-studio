package com.zahirimetal.cad.controller;

import com.zahirimetal.cad.dto.AuthRequestDto;
import com.zahirimetal.cad.dto.AuthResponseDto;
import com.zahirimetal.cad.dto.RegisterRequestDto;
import com.zahirimetal.cad.dto.UserDto;
import com.zahirimetal.cad.entity.User;
import com.zahirimetal.cad.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/v1/auth/register
     * Register a new user and return JWT bearer token
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponseDto> register(@Valid @RequestBody RegisterRequestDto request) {
        AuthResponseDto response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * POST /api/v1/auth/login
     * Authenticate user credentials and return JWT bearer token
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody AuthRequestDto request) {
        AuthResponseDto response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/v1/auth/me
     * Retrieve the current authenticated user's profile
     */
    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UserDto profile = authService.getCurrentUserProfile(user);
        return ResponseEntity.ok(profile);
    }

    /**
     * GET /api/v1/auth/users
     * List all registered users (for Plant Admin inspection)
     */
    @GetMapping("/users")
    public ResponseEntity<java.util.List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    /**
     * PUT /api/v1/auth/users/{id}/approve
     * Approve user account for workshop access
     */
    @PutMapping("/users/{id}/approve")
    public ResponseEntity<UserDto> approveUser(@PathVariable java.util.UUID id) {
        UserDto approved = authService.approveUser(id);
        return ResponseEntity.ok(approved);
    }

    /**
     * DELETE /api/v1/auth/users/{id}
     * Delete or reject user account
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable java.util.UUID id) {
        authService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
