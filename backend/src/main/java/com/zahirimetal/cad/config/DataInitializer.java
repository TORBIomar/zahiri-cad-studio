package com.zahirimetal.cad.config;

import com.zahirimetal.cad.entity.Role;
import com.zahirimetal.cad.entity.User;
import com.zahirimetal.cad.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initUser("engineer@cad.com", "123", "Lead CAD Engineer", Role.ROLE_ENGINEER, "Zahiri Metal R&D Lab");
        initUser("cnc@cad.com", "123", "Laser CNC Operator", Role.ROLE_OPERATOR, "Zahiri Metal Laser Bay");
        initUser("admin@cad.com", "123", "Plant Administrator", Role.ROLE_ADMIN, "Zahiri Metal Industrial HQ");
    }

    private void initUser(String email, String rawPassword, String fullName, Role role, String company) {
        String normalizedEmail = email.toLowerCase().trim();
        userRepository.findByEmail(normalizedEmail).ifPresentOrElse(
                existingUser -> {
                    existingUser.setPasswordHash(passwordEncoder.encode(rawPassword));
                    existingUser.setFullName(fullName);
                    existingUser.setRole(role);
                    existingUser.setCompany(company);
                    userRepository.save(existingUser);
                    log.info("Verified seed user credentials: {} ({})", normalizedEmail, role);
                },
                () -> {
                    User newUser = User.builder()
                            .email(normalizedEmail)
                            .passwordHash(passwordEncoder.encode(rawPassword))
                            .fullName(fullName)
                            .role(role)
                            .company(company)
                            .build();
                    userRepository.save(newUser);
                    log.info("Created seed user: {} ({})", normalizedEmail, role);
                }
        );
    }
}
