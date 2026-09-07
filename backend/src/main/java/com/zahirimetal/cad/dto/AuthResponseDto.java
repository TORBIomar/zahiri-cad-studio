package com.zahirimetal.cad.dto;

import com.zahirimetal.cad.entity.Role;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponseDto {

    private String token;

    @Builder.Default
    private String type = "Bearer";

    private UUID id;

    private String email;

    private String fullName;

    private Role role;

    private String company;

    private Boolean approved;
}
