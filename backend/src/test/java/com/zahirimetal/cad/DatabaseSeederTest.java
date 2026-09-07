package com.zahirimetal.cad;

import com.zahirimetal.cad.entity.Role;
import com.zahirimetal.cad.entity.User;
import com.zahirimetal.cad.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class DatabaseSeederTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void testUsersSeededSuccessfully() {
        assertUserValid("engineer@cad.com", "123", Role.ROLE_ENGINEER);
        assertUserValid("cnc@cad.com", "123", Role.ROLE_OPERATOR);
        assertUserValid("admin@cad.com", "123", Role.ROLE_ADMIN);
    }

    private void assertUserValid(String email, String rawPassword, Role expectedRole) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        assertTrue(userOpt.isPresent(), "User " + email + " should exist in database");

        User user = userOpt.get();
        assertTrue(passwordEncoder.matches(rawPassword, user.getPasswordHash()), "Password should match for " + email);
        assertTrue(user.getRole() == expectedRole, "Role should match " + expectedRole);
    }
}
