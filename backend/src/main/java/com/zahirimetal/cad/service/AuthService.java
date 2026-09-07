package com.zahirimetal.cad.service;

import com.zahirimetal.cad.dto.AuthRequestDto;
import com.zahirimetal.cad.dto.AuthResponseDto;
import com.zahirimetal.cad.dto.RegisterRequestDto;
import com.zahirimetal.cad.dto.UserDto;
import com.zahirimetal.cad.entity.User;

import java.util.List;
import java.util.UUID;

public interface AuthService {

    AuthResponseDto register(RegisterRequestDto request);

    AuthResponseDto login(AuthRequestDto request);

    UserDto getCurrentUserProfile(User user);

    User getUserById(UUID id);

    List<UserDto> getAllUsers();

    UserDto approveUser(UUID id);

    void deleteUser(UUID id);
}
