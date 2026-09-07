package com.zahirimetal.cad.service.impl;

import com.zahirimetal.cad.dto.AuthRequestDto;
import com.zahirimetal.cad.dto.AuthResponseDto;
import com.zahirimetal.cad.dto.RegisterRequestDto;
import com.zahirimetal.cad.dto.UserDto;
import com.zahirimetal.cad.entity.Role;
import com.zahirimetal.cad.entity.User;
import com.zahirimetal.cad.repository.UserRepository;
import com.zahirimetal.cad.security.JwtService;
import com.zahirimetal.cad.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Override
    @Transactional
    public AuthResponseDto register(RegisterRequestDto request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("User with email '" + normalizedEmail + "' already exists.");
        }

        Role assignedRole = request.getRole() != null ? request.getRole() : Role.ROLE_ENGINEER;
        if (assignedRole == Role.ROLE_ADMIN) {
            throw new IllegalArgumentException("L'inscription en tant qu'Administrateur Usine est interdite.");
        }

        // CAD Engineers and CNC Operators require Admin approval before accessing
        boolean isApproved = false;

        User user = User.builder()
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .role(assignedRole)
                .company(request.getCompany() != null ? request.getCompany().trim() : "Zahiri Metal")
                .approved(isApproved)
                .build();

        User savedUser = userRepository.save(user);
        String token = jwtService.generateToken(savedUser);

        log.info("Registered new user in MySQL: {} with role: {} (approved: {})", savedUser.getEmail(), savedUser.getRole(), savedUser.getApproved());

        return AuthResponseDto.builder()
                .token(token)
                .type("Bearer")
                .id(savedUser.getId())
                .email(savedUser.getEmail())
                .fullName(savedUser.getFullName())
                .role(savedUser.getRole())
                .company(savedUser.getCompany())
                .approved(savedUser.getApproved())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponseDto login(AuthRequestDto request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password.");
        }

        if (user.getApproved() != null && !user.getApproved()) {
            throw new IllegalArgumentException("Accès refusé : Votre compte est en attente d'approbation par l'Administrateur Usine.");
        }

        String token = jwtService.generateToken(user);
        log.info("User logged in successfully: {}", user.getEmail());

        return AuthResponseDto.builder()
                .token(token)
                .type("Bearer")
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .company(user.getCompany())
                .approved(user.getApproved())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getCurrentUserProfile(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .company(user.getCompany())
                .approved(user.getApproved())
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public User getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::getCurrentUserProfile)
                .toList();
    }

    @Override
    @Transactional
    public UserDto approveUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + id));
        user.setApproved(true);
        User saved = userRepository.save(user);
        log.info("User approved by Plant Admin: {}", saved.getEmail());
        return getCurrentUserProfile(saved);
    }

    @Override
    @Transactional
    public void deleteUser(UUID id) {
        userRepository.deleteById(id);
        log.info("User deleted from MySQL: {}", id);
    }
}
